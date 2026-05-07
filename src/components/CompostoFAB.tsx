import { MessageCircle } from "lucide-react";
import { openWhatsApp } from "@/lib/whatsapp";

/** Botão flutuante discreto para venda do composto orgânico via WhatsApp. */
export function CompostoFAB() {
  return (
    <button
      onClick={() => openWhatsApp("default")}
      aria-label="Falar no WhatsApp sobre composto orgânico"
      className="fixed bottom-4 right-4 z-40 h-12 w-12 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center"
      title="Composto orgânico — WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
}
