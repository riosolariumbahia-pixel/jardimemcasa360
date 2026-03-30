import { useState, useEffect } from "react";
import { Lightbulb, AlertTriangle, TrendingUp, Eye, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGardenPlants } from "@/hooks/useGardenPlants";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Insight {
  tipo: "alerta" | "recomendacao" | "previsao";
  descricao: string;
  prioridade: "baixa" | "media" | "alta";
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const typeConfig = {
  alerta: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", label: "Alerta" },
  recomendacao: { icon: Lightbulb, color: "text-blue-600", bg: "bg-blue-50", label: "Recomendação" },
  previsao: { icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50", label: "Previsão" },
};

const priorityBadge = {
  baixa: "bg-green-100 text-green-700",
  media: "bg-yellow-100 text-yellow-700",
  alta: "bg-red-100 text-red-700",
};

export default function InsightsPage() {
  const { user } = useAuth();
  const { gardenPlants } = useGardenPlants();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    if (!gardenPlants.length) {
      toast.info("Adicione plantas ao seu jardim primeiro!");
      return;
    }
    setLoading(true);
    try {
      const plantSummary = gardenPlants.map((p) =>
        `${p.emoji} ${p.name}: saúde ${p.health}%, água: ${p.needs_water ? "precisa" : "ok"}, adubo: ${p.needs_fertilizer ? "precisa" : "ok"}, poda: ${p.needs_pruning ? "precisa" : "ok"}, luz: ${p.light || "desconhecida"}`
      ).join("\n");

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          mode: "insights",
          messages: [{ role: "user", content: `Minhas plantas:\n${plantSummary}\n\nGere insights personalizados para meu jardim.` }],
        }),
      });

      if (!resp.ok) throw new Error("Erro ao gerar insights");

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, idx);
          textBuffer = textBuffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) full += content;
          } catch {}
        }
      }

      const jsonMatch = full.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        setInsights(JSON.parse(jsonMatch[0]));
      } else {
        toast.error("Não foi possível processar os insights");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar insights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gardenPlants.length > 0 && insights.length === 0) {
      generateInsights();
    }
  }, [gardenPlants.length]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-2">
          <Eye className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-lg font-bold text-foreground">Insights do Jardim</h1>
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Recomendações inteligentes baseadas nas suas plantas</p>
      </div>

      <div className="flex justify-center">
        <Button onClick={generateInsights} disabled={loading} variant="outline" size="sm">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          {loading ? "Gerando insights..." : "Atualizar Insights"}
        </Button>
      </div>

      {loading && insights.length === 0 && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">A IA está analisando seu jardim...</p>
        </div>
      )}

      {insights.length > 0 && (
        <div className="space-y-3">
          {insights.map((insight, i) => {
            const config = typeConfig[insight.tipo] || typeConfig.recomendacao;
            const Icon = config.icon;
            return (
              <Card key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityBadge[insight.prioridade]}`}>
                          {insight.prioridade}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{insight.descricao}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && insights.length === 0 && gardenPlants.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">Adicione plantas ao seu jardim para receber insights personalizados da IA.</p>
        </div>
      )}
    </div>
  );
}
