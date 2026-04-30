import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CheckoutReturnPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get("session_id");

  useEffect(() => {
    const t = setTimeout(() => navigate("/planos"), 5000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="max-w-md mx-auto p-4 pt-14">
      <Card>
        <CardContent className="p-6 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
          <h1 className="font-heading text-xl font-bold">Pagamento processado!</h1>
          <p className="text-sm text-muted-foreground">
            {sessionId
              ? "Seu acesso Premium será ativado em instantes."
              : "Aguarde alguns segundos enquanto confirmamos seu pagamento."}
          </p>
          <Button className="w-full" onClick={() => navigate("/diagnostico-ia")}>
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
