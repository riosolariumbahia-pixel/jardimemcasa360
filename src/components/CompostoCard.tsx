import { Leaf, MessageCircle } from "lucide-react";
import { openWhatsApp, type WhatsAppContext } from "@/lib/whatsapp";

interface Props {
  context?: WhatsAppContext;
  title?: string;
  description?: string;
}

export function CompostoCard({
  context = "default",
  title = "Melhore suas plantas com nosso composto orgânico 🌿",
  description = "Composto natural que devolve a vida do solo e fortalece suas plantas.",
}: Props) {
  return (
    <div className="garden-card p-4 border-2 border-primary/20 bg-garden-green-mist flex items-start gap-3">
      <div className="p-2 rounded-full bg-primary/20 shrink-0">
        <Leaf className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-foreground mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground mb-2">{description}</p>
        <button
          onClick={() => openWhatsApp(context)}
          className="text-xs bg-[#25D366] text-white px-3 py-1.5 rounded-md font-semibold hover:opacity-90 transition-all flex items-center gap-1.5"
        >
          <MessageCircle className="w-3.5 h-3.5" /> Falar no WhatsApp
        </button>
      </div>
    </div>
  );
}
