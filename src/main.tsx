import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/nunito/300.css";
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/700.css";
import "./index.css";

// Logs globais para diagnosticar falhas em produção (Vercel/Android)
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    console.error("[window.error]", e.message, e.error);
  });
  window.addEventListener("unhandledrejection", (e) => {
    console.error("[unhandledrejection]", e.reason);
  });

  // Patch defensivo contra o bug do Google Translate / extensões de tradução
  // que removem/inserem nós de texto e fazem React quebrar com
  // "Failed to execute 'removeChild' on 'Node'". Mantém o comportamento
  // padrão e apenas evita o throw quando o nó já não pertence ao pai.
  // Ref: facebook/react#11538
  if (typeof Node !== "undefined") {
    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function <T extends Node>(child: T): T {
      if (child.parentNode !== this) {
        console.warn("[DOM patch] removeChild: nó não é filho — ignorado");
        return child;
      }
      return originalRemoveChild.call(this, child) as T;
    } as typeof Node.prototype.removeChild;

    const originalInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function <T extends Node>(newNode: T, refNode: Node | null): T {
      if (refNode && refNode.parentNode !== this) {
        console.warn("[DOM patch] insertBefore: ref não é filho — anexando ao final");
        return this.appendChild(newNode) as T;
      }
      return originalInsertBefore.call(this, newNode, refNode) as T;
    } as typeof Node.prototype.insertBefore;
  }
}

// Validação de variáveis de ambiente VITE_ — evita tela branca silenciosa
const requiredEnv = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"] as const;
const missingEnv = requiredEnv.filter((k) => !import.meta.env[k]);

const rootEl = document.getElementById("root");
if (!rootEl) {
  document.body.innerHTML =
    '<div style="padding:24px;font-family:system-ui">Erro: elemento #root não encontrado.</div>';
} else if (missingEnv.length > 0) {
  console.error("[ENV] Variáveis ausentes:", missingEnv);
  rootEl.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui;background:#f6f7f3;color:#1a3c2a">
      <div style="max-width:480px;text-align:center">
        <div style="font-size:56px;margin-bottom:16px">⚙️</div>
        <h1 style="font-size:20px;margin-bottom:8px">Configuração ausente</h1>
        <p style="font-size:14px;opacity:.8;margin-bottom:16px">
          As variáveis de ambiente abaixo precisam estar configuradas no painel do seu provedor de hospedagem (Vercel → Settings → Environment Variables):
        </p>
        <pre style="background:#fff;padding:12px;border-radius:8px;font-size:12px;text-align:left;border:1px solid #e5e7eb">${missingEnv.join("\n")}</pre>
      </div>
    </div>`;
} else {
  createRoot(rootEl).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>,
  );
}
