export const WHATSAPP_NUMBER = "5571996091236";

export type WhatsAppContext = "default" | "nutrientes" | "alerta" | "home";

const MESSAGES: Record<WhatsAppContext, string> = {
  default:
    "Olá! Quero melhorar minhas plantas com o composto orgânico que vi no app MeuJardim360 🌱",
  nutrientes:
    "Olá! O app MeuJardim360 identificou que minhas plantas precisam de nutrientes. Quero conhecer o composto orgânico 🌿",
  alerta:
    "Olá! Recebi um alerta no MeuJardim360 sobre a saúde das minhas plantas. Quero saber mais sobre o composto orgânico 🌱",
  home:
    "Olá! Vi no app MeuJardim360 sobre o composto orgânico. Quero melhorar o meu jardim 🌿",
};

export function whatsappLink(context: WhatsAppContext = "default"): string {
  const text = encodeURIComponent(MESSAGES[context]);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export function openWhatsApp(context: WhatsAppContext = "default") {
  window.open(whatsappLink(context), "_blank", "noopener,noreferrer");
}
