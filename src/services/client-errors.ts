import API from "@/utils/api";

declare const __APP_VERSION__: string;

// A broken screen can throw in a loop. Report each distinct error once per page load, and cap the total.
const seen = new Set<string>();
const MAX_REPORTS = 20;

export async function reportClientError(
  error: unknown,
  source: "window" | "promise" | "react" | "report" = "report",
) {
  try {
    const err = error instanceof Error ? error : new Error(String(error ?? "Unknown error"));
    const key = `${err.message}|${(err.stack ?? "").split("\n")[1] ?? ""}`;
    if (seen.has(key) || seen.size >= MAX_REPORTS) return;
    seen.add(key);
    await API.post(
      "/client-errors",
      {
        message: err.message.slice(0, 2000) || "Unknown error",
        stack: err.stack?.slice(0, 8000),
        source,
        route: window.location.pathname,
        appVersion: typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : undefined,
      },
      { suppressErrorToast: true },
    );
  } catch {
    /* Reporting must never cause another error. */
  }
}

let installed = false;

/** Sends uncaught errors and unhandled promise rejections to the backend log. Call once at start-up. */
export function installClientErrorReporting() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (event) => {
    // Resource load failures (images, scripts) have no error object and are noise.
    if (event.error) void reportClientError(event.error, "window");
  });
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    // Failed API calls are already logged by the server that answered them.
    if (reason && typeof reason === "object" && "isAxiosError" in reason) return;
    void reportClientError(reason, "promise");
  });
}
