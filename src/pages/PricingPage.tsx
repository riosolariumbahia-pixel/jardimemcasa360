import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Check, Crown, Loader2, ExternalLink, Sparkles, Infinity as InfIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";

type CheckoutPrice = "plus_vitalicio" | "premium_monthly";

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const plan = usePlan();
  const [checkoutPrice, setCheckoutPrice] = useState<CheckoutPrice | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  const startCheckout = (priceId: CheckoutPrice) => {
    if (!user) {
      navigate("/login?redirect=/planos");
      return;
    }
    setCheckoutPrice(priceId);
  };

  const handlePortal = async () => {
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: { returnUrl: `${window.location.origin}/planos`, environment: getStripeEnvironment() },
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
      <div className="max-w-5xl mx-auto p-4 pt-14 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            Suas plantas merecem mais 🌱
          </h1>
          <p className="text-sm text-muted-foreground">
            Desbloqueie todo o potencial do seu jardim
          </p>
        </div>

        {checkoutPrice ? (
          <Card>
            <CardContent className="p-2 md:p-4">
              <StripeEmbeddedCheckout
                priceId={checkoutPrice}
                customerEmail={user?.email}
                userId={user?.id}
              />
              <Button variant="ghost" className="w-full mt-2" onClick={() => setCheckoutPrice(null)}>
                Cancelar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {/* GRÁTIS */}
            <Card className={plan.isFree ? "border-2" : "opacity-70"}>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h2 className="font-heading text-lg font-bold">Grátis</h2>
                  <p className="text-3xl font-bold mt-2">
                    R$ 0<span className="text-sm font-normal text-muted-foreground">/sempre</span>
                  </p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5" /> Até 3 plantas</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5" /> 1 jardim</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5" /> Lembretes básicos</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5" /> Catálogo de plantas</li>
                </ul>
                <Button variant="outline" className="w-full" disabled>
                  {plan.isFree ? "Plano atual" : "Continuar no gratuito"}
                </Button>
              </CardContent>
            </Card>

            {/* PLUS Vitalício */}
            <Card className={plan.isPlus ? "border-2 border-primary" : "border-2 border-primary/40"}>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <InfIcon className="w-5 h-5 text-primary" />
                  <h2 className="font-heading text-lg font-bold">PLUS</h2>
                </div>
                <div>
                  <p className="text-3xl font-bold">R$ 19,90</p>
                  <p className="text-xs text-muted-foreground">Acesso vitalício • pagamento único</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5" /> Plantas ilimitadas</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5" /> Jardins ilimitados</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5" /> Histórico completo</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5" /> Backup na nuvem</li>
                </ul>
                {plan.isPlus || plan.isPro ? (
                  <Button className="w-full" disabled>
                    <Check className="w-4 h-4 mr-2" /> {plan.isPro ? "Incluso no PRO" : "Você é PLUS"}
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => startCheckout("plus_vitalicio")} disabled={plan.loading}>
                    Desbloquear acesso vitalício
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* PRO */}
            <Card className={plan.isPro ? "border-2 border-primary" : "border-2 border-primary shadow-xl relative"}>
              {!plan.isPro && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-bold">
                  Mais completo
                </span>
              )}
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary" />
                  <h2 className="font-heading text-lg font-bold">PRO</h2>
                </div>
                <p className="text-3xl font-bold">
                  R$ 19,90<span className="text-sm font-normal text-muted-foreground">/mês</span>
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2"><Sparkles className="w-4 h-4 text-primary mt-0.5" /> <strong>Tudo do PLUS</strong></li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5" /> Diagnóstico com IA</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5" /> Recomendações automáticas</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5" /> Alertas inteligentes</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5" /> Assistente IA 24/7</li>
                </ul>
                {plan.isPro ? (
                  <div className="space-y-2">
                    <Button className="w-full" disabled>
                      <Crown className="w-4 h-4 mr-2" /> Você é PRO
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handlePortal} disabled={openingPortal}>
                      {openingPortal ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
                      Gerenciar assinatura
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full" onClick={() => startCheckout("premium_monthly")} disabled={plan.loading}>
                    Quero meu jardineiro inteligente 🌿
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
