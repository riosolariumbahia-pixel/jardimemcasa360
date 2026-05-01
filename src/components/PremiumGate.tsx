import { ReactNode } from "react";
import { Crown, Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

interface PremiumGateProps {
  children: ReactNode;
  /** Título mostrado no card de upgrade */
  title?: string;
  /** Descrição curta do recurso bloqueado */
  description?: string;
}

/**
 * Envolve uma página/recurso premium. Se o usuário for Free, mostra
 * o conteúdo borrado ao fundo e um card de upgrade sobreposto.
 * Se for Premium, renderiza normalmente.
 */
export function PremiumGate({
  children,
  title = "Recurso Premium 🌟",
  description = "Assine o plano Premium para desbloquear todas as funcionalidades inteligentes do Jardim 360º.",
}: PremiumGateProps) {
  const { isPremium, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <span className="text-3xl block mb-2 animate-bounce">🌱</span>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (isPremium) return <>{children}</>;

  return (
    <div className="relative min-h-[80vh]">
      {/* Conteúdo borrado ao fundo (não interativo) */}
      <div
        className="pointer-events-none select-none blur-md opacity-40 max-h-[80vh] overflow-hidden"
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Card de upgrade sobreposto */}
      <div className="absolute inset-0 flex items-start justify-center pt-16 px-4">
        <div className="bg-card border-2 border-primary/30 rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-garden-green-dark flex items-center justify-center">
            <Crown className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground mb-2">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            {description}
          </p>

          <div className="bg-garden-green-mist border border-garden-green-light rounded-lg p-3 mb-5 text-left">
            <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" /> Com o Premium você tem:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✅ Adicionar plantas ilimitadas ao seu jardim</li>
              <li>✅ Diagnóstico IA com até 5 análises por dia</li>
              <li>✅ Dashboard inteligente e Percepções IA</li>
              <li>✅ Assistente IA personalizado 24/7</li>
              <li>✅ Calendário, Adubação e Planejamento</li>
            </ul>
          </div>

          <button
            onClick={() => navigate("/planos")}
            className="w-full bg-gradient-to-r from-primary to-garden-green-dark text-primary-foreground px-6 py-3 rounded-lg font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Crown className="w-4 h-4" />
            Assinar Premium — R$ 19,90/mês
          </button>

          <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> Cancele quando quiser
          </p>
        </div>
      </div>
    </div>
  );
}
