import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log detalhado para identificar falhas em produção (Vercel/Android/etc)
    console.error("[ErrorBoundary] Uncaught error:", error);
    console.error("[ErrorBoundary] Component stack:", info.componentStack);
    this.setState({ info });
  }

  handleReload = () => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        // Limpa cache de auth corrompido
        Object.keys(window.localStorage)
          .filter((k) => k.startsWith("sb-") || k.includes("supabase"))
          .forEach((k) => window.localStorage.removeItem(k));
      }
    } catch {
      /* noop */
    }
    if (typeof window !== "undefined") window.location.href = "/";
  };

  render() {
    if (this.state.error) {
      const msg = this.state.error.message || String(this.state.error);
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            background: "#f6f7f3",
            color: "#1a3c2a",
          }}
        >
          <div style={{ maxWidth: 480, textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🌱</div>
            <h1 style={{ fontSize: 22, marginBottom: 8 }}>Algo deu errado</h1>
            <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 16 }}>
              O app encontrou um erro inesperado. Tente recarregar.
            </p>
            <pre
              style={{
                fontSize: 11,
                background: "#fff",
                padding: 12,
                borderRadius: 8,
                textAlign: "left",
                overflow: "auto",
                maxHeight: 160,
                marginBottom: 16,
                border: "1px solid #e5e7eb",
              }}
            >
              {msg}
            </pre>
            <button
              onClick={this.handleReload}
              style={{
                background: "#1a3c2a",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: 8,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Recarregar app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
