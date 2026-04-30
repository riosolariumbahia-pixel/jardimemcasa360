import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Check, Crown, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const sub = useSubscription();
  const [showCheckout, setShowCheckout] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  const handleSubscribe = () => {
    if (!user) {
      navigate("/login?redirect=/planos");
      return;
    }
    setShowCheckout(true);
  };

  const handlePortal = async () => {
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: {
          returnUrl: `${window.location.origin}/planos`,
          environment: getStripeEnvironment(),
        },
      });
      if (error || !data?.url) throw new Error(error?.message || "Falha ao abrir portal");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao abrir portal");
    } finally {
      setOpeningPortal(false);
    }
  };

  return (
    <>
      <PaymentTestModeBanner />
      <div className="max-w-4xl mx-auto p-4 pt-14 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-2xl font-bold text-foreground">Escolha seu plano</h1>
          <p className="text-sm text-muted-foreground">
            Cuide do seu jardim com o poder da inteligência artificial
          </p>
        </div>

        {showCheckout ? (
          <Card>
            <CardContent className="p-2 md:p-4">
              <StripeEmbeddedCheckout
                priceId="premium_monthly"
                customerEmail={user?.email}
                userId={user?.id}
              />
              <Button variant="ghost" className="w-full mt-2" onClick={() => setShowCheckout(false)}>
                Cancelar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <Card className={sub.isPremium ? "opacity-60" : "border-2"}>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h2 className="font-heading text-lg font-bold">Gratuito</h2>
                  <p className="text-3xl font-bold mt-2">R$ 0<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5" /> 1 diagnóstico com IA por dia</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5" /> Catálogo de plantas</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5" /> Calendário de cuidados</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5" /> Meu Jardim</li>
                </ul>
                <Button variant="outline" className="w-full" disabled>
                  {sub.isPremium ? "Plano atual indisponível" : "Plano atual"}
                </Button>
              </CardContent>
            </Card>

            <Card className={sub.isPremium ? "border-2 border-primary" : "border-2 border-primary shadow-lg"}>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary" />
                  <h2 className="font-heading text-lg font-bold">Premium</h2>
                </div>
                <p className="text-3xl font-bold">R$ 19,90<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5" /> <strong>5 diagnósticos com IA por dia</strong></li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5" /> Percepções avançadas do jardim</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5" /> Assistente IA prioritário</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5" /> Tudo do plano gratuito</li>
                </ul>
                {sub.isPremium ? (
                  <div className="space-y-2">
                    <Button className="w-full" disabled>
                      <Crown className="w-4 h-4 mr-2" /> Você é Premium
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handlePortal} disabled={openingPortal}>
                      {openingPortal ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
                      Gerenciar assinatura
                    </Button>
                    {sub.cancelAtPeriodEnd && sub.currentPeriodEnd && (
                      <p className="text-xs text-muted-foreground text-center">
                        Acesso até {new Date(sub.currentPeriodEnd).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                ) : (
                  <Button className="w-full" onClick={handleSubscribe} disabled={sub.loading}>
                    Assinar Premium
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
