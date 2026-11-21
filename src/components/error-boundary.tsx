import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportClientError } from "@/services/client-errors";

type State = { failed: boolean };

/** Catches render errors, sends them to the backend log and shows a recoverable message. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const withStack = new Error(error.message);
    withStack.stack = `${error.stack ?? ""}\n${info.componentStack ?? ""}`;
    void reportClientError(withStack, "react");
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="mx-auto max-w-md p-10 text-center">
        <h1 className="text-lg font-semibold text-navy">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The problem has been reported. Reload the page to continue.
        </p>
        <button
          type="button"
          className="gp-button mt-4 border"
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      </div>
    );
  }
}
