import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  priceId: string;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
}

/**
 * Hosts que devem usar EXCLUSIVAMENTE Stripe LIVE.
 * Qualquer domínio que não seja preview do Lovable é considerado produção.
 */
function isProductionHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  // Preview do Lovable contém "id-preview--" no subdomínio.
  if (host.includes("id-preview--")) return false;
  if (host === "localhost" || host === "127.0.0.1") return false;
  return true;
}

export function StripeEmbeddedCheckout({ priceId, customerEmail, userId, returnUrl }: Props) {
  const env = getStripeEnvironment();

  // Trava de segurança: em domínio de produção, NUNCA aceitar checkout em sandbox.
  // Isso evita que um pagamento real seja gravado no ambiente errado.
  if (isProductionHost() && env !== "live") {
    return (
      <div className="p-6 rounded-lg border border-destructive bg-destructive/10 text-destructive text-sm">
        ⚠️ Configuração de pagamento inválida para este ambiente. Por favor, atualize o app
        ou entre em contato com o suporte.
      </div>
    );
  }

  const fetchClientSecret = async (): Promise<string> => {
    const finalReturn = returnUrl || `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        priceId,
        customerEmail,
        userId,
        returnUrl: finalReturn,
        environment: env,
      },
    });
    if (error || !data?.clientSecret) {
      throw new Error(error?.message || "Falha ao iniciar pagamento");
    }
    return data.clientSecret;
  };

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
