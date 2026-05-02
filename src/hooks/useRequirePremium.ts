import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAccessControl } from "@/hooks/useAccessControl";

/**
 * Retorna uma função `guard` que intercepta uma ação:
 * - Se o usuário for Premium, executa o callback normalmente.
 * - Se for Free, mostra um toast e redireciona para /planos.
 *
 * Uso:
 * const guard = useRequirePremium();
 * <button onClick={guard(() => addPlant.mutate(p), "Adicionar plantas")}>...</button>
 */
export function useRequirePremium() {
  const { hasFullAccess, loading } = useAccessControl();
  const navigate = useNavigate();

  return function guard<T extends (...args: any[]) => any>(
    callback: T,
    featureName = "Esta funcionalidade",
  ) {
    return ((...args: Parameters<T>) => {
      if (loading) return;
      if (hasFullAccess) return callback(...args);
      toast.info(`${featureName} é exclusivo do plano Premium 🌟`, {
        description: "Assine por R$ 19,90/mês e desbloqueie tudo.",
        action: {
          label: "Ver planos",
          onClick: () => navigate("/planos"),
        },
      });
      navigate("/planos");
    }) as T;
  };
}
