import React, { Component } from "react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught component error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="panel error-boundary">
          <div className="panel-header">
            <div>
              <h1>Something went wrong.</h1>
              <p>The application encountered an unexpected React error.</p>
            </div>
          </div>
          <div className="error-text prompt-card-error" style={{ margin: "20px", padding: "16px", borderRadius: "12px" }}>
            <p style={{ margin: 0 }}><strong>Error:</strong> {this.state.errorMsg}</p>
          </div>
          <button
            className="run-button"
            style={{ margin: "0 20px 20px", width: "auto" }}
            onClick={() => this.setState({ hasError: false, errorMsg: "" })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
