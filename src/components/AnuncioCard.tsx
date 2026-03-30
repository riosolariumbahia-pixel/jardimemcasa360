import { ExternalLink, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Anuncio } from "@/hooks/useAnuncios";
import { useRegistrarClique } from "@/hooks/useAnuncios";

interface Props {
  anuncio: Anuncio;
  label?: string;
}

export default function AnuncioCard({ anuncio, label = "Recomendado para você" }: Props) {
  const registrarClique = useRegistrarClique();
  const anunciante = anuncio.anunciantes;

  const handleClick = () => {
    registrarClique(anuncio.id);
    window.open(anuncio.link_whatsapp, "_blank");
  };

  return (
    <Card className="border-dashed border-primary/20 bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
          <Badge variant="outline" className="text-[10px]">
            {anunciante.tipo === "fornecedor" ? "Fornecedor" : "Prestador"}
          </Badge>
        </div>

        <div>
          <p className="font-semibold text-sm text-foreground">{anuncio.titulo}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {anuncio.descricao.slice(0, 120)}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{anunciante.nome} · {anunciante.cidade}</span>
          <Button size="sm" variant="default" className="gap-1.5 text-xs" onClick={handleClick}>
            <MessageCircle className="w-3.5 h-3.5" />
            Entrar em contato
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
