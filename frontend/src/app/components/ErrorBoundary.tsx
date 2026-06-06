"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const err = this.state.error;
      const stack = err?.stack ?? "";
      // Extract first file reference from stack for debugging
      const stackLines = stack.split("\n").slice(0, 5);
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center gap-2 py-16 text-center px-4">
            <p className="text-sm text-destructive font-medium">
              {err?.message ?? "Something went wrong"}
            </p>
            <pre className="text-xs text-muted-foreground text-left max-w-2xl overflow-x-auto whitespace-pre-wrap bg-muted/30 rounded-lg p-3 mt-2">
              {stackLines.join("\n")}
            </pre>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
