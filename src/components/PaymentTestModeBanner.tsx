const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

/**
 * Banner de aviso de modo de teste.
 *
 * - Aparece SOMENTE quando o token Stripe carregado é de teste (pk_test_…),
 *   o que só acontece no ambiente de preview do Lovable.
 * - Em produção (jardimemcasa360.lovable.app e domínios publicados) o token
 *   é pk_live_… e este componente NÃO renderiza nada.
 * - Cliente final nunca vê esse banner.
 */
export function PaymentTestModeBanner() {
  if (!clientToken?.startsWith("pk_test_")) return null;

  return (
    <div className="w-full bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium shadow-md">
      ⚠️ Ambiente de TESTE — pagamentos não são reais. Use cartão 4242 4242 4242 4242.
    </div>
  );
}
