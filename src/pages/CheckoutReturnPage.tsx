import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

export default function CheckoutReturnPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get("session_id");
  const sub = useSubscription();
  const [elapsed, setElapsed] = useState(0);

  // Poll subscription until premium is detected (webhook activation)
  useEffect(() => {
    if (sub.isPremium) return;
    const id = setInterval(() => {
      setElapsed((s) => s + 2);
      sub.refetch();
    }, 2000);
    return () => clearInterval(id);
  }, [sub]);

  useEffect(() => {
    if (sub.isPremium) {
      toast.success("Premium ativado!");
    }
  }, [sub.isPremium]);

  const stillWaiting = !sub.isPremium && elapsed < 30;

  return (
    <div className="max-w-md mx-auto p-4 pt-14">
      <Card>
        <CardContent className="p-6 text-center space-y-4">
          {sub.isPremium ? (
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
          ) : (
            <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
          )}
          <h1 className="font-heading text-xl font-bold">
            {sub.isPremium ? "Premium ativado!" : "Confirmando pagamento..."}
          </h1>
          <p className="text-sm text-muted-foreground">
            {sub.isPremium
              ? "Aproveite seus 5 diagnósticos por dia e percepções avançadas."
              : stillWaiting
                ? "Estamos confirmando seu pagamento. Isso leva alguns segundos."
                : sessionId
                  ? "Seu pagamento foi recebido. Se o Premium não ativar em instantes, recarregue a página ou contate o suporte."
                  : "Não encontramos informações da sessão."}
          </p>
          <Button className="w-full" onClick={() => navigate("/diagnostico-ia")} disabled={!sub.isPremium}>
            Ir para diagnóstico
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => navigate("/planos")}>
            Ver minha assinatura
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
