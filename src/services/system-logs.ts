import API from "@/utils/api";
import { isAxiosError } from "axios";

export type LogEntry = {
  name: string;
  path: string;
  kind: "directory" | "file";
  size: number | null;
  modifiedAt: string;
};
export type LogFolder = { path: string; entries: LogEntry[] };
export type LogPreview = {
  path: string;
  size: number;
  modifiedAt: string;
  text: string;
  lines: number;
  truncated: boolean;
};

export const systemLogs = {
  folder: async (path: string) =>
    (await API.get<LogFolder>("/logs/browser", { params: { path } })).data,
  preview: async (path: string, lines: number) =>
    (await API.get<LogPreview>("/logs/preview", { params: { path, lines } }))
      .data,
  download: async (path: string) => {
    let response;
    try {
      response = await API.get<Blob>("/logs/download", {
        params: { path },
        responseType: "blob",
        suppressErrorToast: true,
      });
    } catch (error) {
      if (isAxiosError(error) && error.response?.data instanceof Blob) {
        const details = await error.response.data.text();
        let message = "Could not download this log. Refresh and try again.";
        try {
          const body = JSON.parse(details);
          if (typeof body.detail === "string") message = body.detail;
        } catch {
          /* A proxy may return an HTML error instead of JSON. */
        }
        throw new Error(message);
      }
      throw error;
    }
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = path.split("/").pop() || "system.log";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
