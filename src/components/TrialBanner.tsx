import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAccessControl } from "@/hooks/useAccessControl";

/**
 * Banner global mostrando o tempo restante do trial gratuito (24h).
 * Aparece apenas quando o usuário está em trial e ainda não é Premium.
 */
export function TrialBanner() {
  const { isOnTrial, isPremium, trialMsRemaining, loading } = useAccessControl();
  const navigate = useNavigate();

  if (loading || isPremium || !isOnTrial) return null;

  const totalMinutes = Math.floor(trialMsRemaining / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const tempo = hours > 0 ? `${hours}h${minutes.toString().padStart(2, "0")}` : `${minutes} min`;

  return (
    <div className="w-full bg-gradient-to-r from-primary/10 to-garden-green-mist border-b border-primary/20 px-4 py-2 flex items-center justify-between gap-3 text-xs md:text-sm">
      <div className="flex items-center gap-2 text-foreground">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <span>
          Teste grátis ativo — restam <strong>{tempo}</strong> de acesso completo 🌿
        </span>
      </div>
      <button
        onClick={() => navigate("/planos")}
        className="bg-primary text-primary-foreground px-3 py-1 rounded-md font-semibold hover:opacity-90 shrink-0"
      >
        Assinar
      </button>
    </div>
  );
}
