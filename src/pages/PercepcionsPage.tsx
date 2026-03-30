import { useState, useEffect, useMemo } from "react";
import { Eye, AlertTriangle, CheckCircle, AlertCircle, Lightbulb, TrendingUp, RefreshCw, Loader2, Sparkles, Droplets, Leaf, Scissors } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGardenPlants } from "@/hooks/useGardenPlants";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type StatusGeral = "bom" | "atencao" | "critico";

interface DiagnosticResult {
  status: StatusGeral;
  resumo: string;
  recomendacoes: string[];
  detalhes: {
    totalPlantas: number;
    saudaveis: number;
    atencao: number;
    criticas: number;
    precisamAgua: number;
    precisamAdubo: number;
    precisamPoda: number;
  };
}

const statusConfig: Record<StatusGeral, { icon: typeof CheckCircle; color: string; bg: string; border: string; label: string; emoji: string }> = {
  bom: { icon: CheckCircle, color: "text-green-700", bg: "bg-green-50", border: "border-green-200", label: "Saudável", emoji: "🌱" },
  atencao: { icon: AlertCircle, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", label: "Atenção", emoji: "⚠️" },
  critico: { icon: AlertTriangle, color: "text-red-700", bg: "bg-red-50", border: "border-red-200", label: "Crítico", emoji: "🚨" },
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

export default function PercepcionsPage() {
  const { user } = useAuth();
  const { plants: gardenPlants } = useGardenPlants();
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);

  const diagnostic = useMemo<DiagnosticResult | null>(() => {
    if (!gardenPlants.length) return null;

    const saudaveis = gardenPlants.filter(p => (p.health ?? 80) >= 80).length;
    const criticas = gardenPlants.filter(p => (p.health ?? 80) < 50).length;
    const atencao = gardenPlants.length - saudaveis - criticas;
    const precisamAgua = gardenPlants.filter(p => p.needs_water).length;
    const precisamAdubo = gardenPlants.filter(p => p.needs_fertilizer).length;
    const precisamPoda = gardenPlants.filter(p => p.needs_pruning).length;

    let status: StatusGeral = "bom";
    if (criticas > 0) status = "critico";
    else if (atencao > 0 || precisamAgua > gardenPlants.length / 2) status = "atencao";

    const recomendacoes: string[] = [];
    if (precisamAgua > 0) recomendacoes.push(`${precisamAgua} planta(s) precisam de água urgentemente.`);
    if (precisamAdubo > 0) recomendacoes.push(`${precisamAdubo} planta(s) precisam de adubação. Use o adubo Adubei NPK 5-15-5.`);
    if (precisamPoda > 0) recomendacoes.push(`${precisamPoda} planta(s) precisam de poda.`);
    if (criticas > 0) recomendacoes.push(`${criticas} planta(s) em estado crítico — verifique imediatamente.`);
    if (status === "bom") recomendacoes.push("Continue com os cuidados regulares de rega e adubação.");

    const resumos: Record<StatusGeral, string> = {
      bom: "Seu jardim está saudável! Continue assim 🌿",
      atencao: "Algumas plantas precisam de atenção. Verifique as recomendações abaixo.",
      critico: "Há plantas em estado crítico no seu jardim. Ação imediata necessária!",
    };

    return {
      status,
      resumo: resumos[status],
      recomendacoes,
      detalhes: { totalPlantas: gardenPlants.length, saudaveis, atencao, criticas, precisamAgua, precisamAdubo, precisamPoda },
    };
  }, [gardenPlants]);

  const generateAiInsights = async () => {
    if (!gardenPlants.length) return;
    setLoadingAi(true);
    try {
      const plantSummary = gardenPlants.map(p =>
        `${p.emoji} ${p.name}: saúde ${p.health ?? 80}%, água: ${p.needs_water ? "precisa" : "ok"}, adubo: ${p.needs_fertilizer ? "precisa" : "ok"}, poda: ${p.needs_pruning ? "precisa" : "ok"}, luz: ${p.light || "desconhecida"}`
      ).join("\n");

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          mode: "insights",
          messages: [{ role: "user", content: `Minhas plantas:\n${plantSummary}\n\nGere 5 recomendações práticas e curtas em português para melhorar meu jardim. Retorne um array JSON de strings.` }],
        }),
      });

      if (!resp.ok) throw new Error("Erro ao gerar insights");
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try { const p = JSON.parse(jsonStr); const c = p.choices?.[0]?.delta?.content; if (c) full += c; } catch {}
        }
      }
      const match = full.match(/\[[\s\S]*\]/);
      if (match) setAiInsights(JSON.parse(match[0]));
    } catch {
      toast.error("Erro ao gerar insights da IA");
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    if (gardenPlants.length > 0 && aiInsights.length === 0) generateAiInsights();
  }, [gardenPlants.length]);

  const cfg = diagnostic ? statusConfig[diagnostic.status] : null;
  const StatusIcon = cfg?.icon ?? CheckCircle;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-2">
          <Eye className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-xl font-bold text-foreground">Diagnóstico do seu Jardim</h1>
        </div>
        <p className="text-sm text-muted-foreground">Análise automatizada baseada nas suas plantas</p>
      </div>

      {!diagnostic ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-foreground font-semibold mb-1">Ainda não há dados suficientes para gerar percepções</p>
            <p className="text-sm text-muted-foreground">Adicione plantas ao seu jardim para começar o diagnóstico.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Status geral */}
          <Card className={`${cfg!.border} border-2`}>
            <CardContent className={`p-6 ${cfg!.bg}`}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center">
                  <StatusIcon className={`w-7 h-7 ${cfg!.color}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status Geral</p>
                  <p className={`text-2xl font-bold ${cfg!.color}`}>{cfg!.emoji} {cfg!.label}</p>
                  <p className="text-sm text-foreground mt-1">{diagnostic.resumo}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo numérico */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total", value: diagnostic.detalhes.totalPlantas, icon: Leaf, color: "text-primary" },
              { label: "Precisam de água", value: diagnostic.detalhes.precisamAgua, icon: Droplets, color: "text-blue-600" },
              { label: "Precisam de adubo", value: diagnostic.detalhes.precisamAdubo, icon: Sparkles, color: "text-amber-600" },
              { label: "Precisam de poda", value: diagnostic.detalhes.precisamPoda, icon: Scissors, color: "text-green-700" },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <s.icon className={`w-5 h-5 ${s.color} shrink-0`} />
                  <div>
                    <p className="text-xl font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recomendações automáticas */}
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" /> Recomendações
            </h2>
            <div className="space-y-2">
              {diagnostic.recomendacoes.map((rec, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground">{rec}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Insights da IA
              </h2>
              <Button onClick={generateAiInsights} disabled={loadingAi} variant="outline" size="sm">
                {loadingAi ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                Atualizar
              </Button>
            </div>
            {loadingAi && aiInsights.length === 0 ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">A IA está analisando seu jardim...</p>
              </div>
            ) : aiInsights.length > 0 ? (
              <div className="space-y-2">
                {aiInsights.map((insight, i) => (
                  <Card key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                    <CardContent className="p-4 flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm text-foreground">{typeof insight === "string" ? insight : JSON.stringify(insight)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : null}
          </div>

          {/* Detalhes por planta */}
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">Detalhes por Planta</h2>
            <div className="space-y-2">
              {gardenPlants.map(plant => {
                const h = plant.health ?? 80;
                const plantStatus = h >= 80 ? "bom" : h >= 50 ? "atencao" : "critico";
                const pCfg = statusConfig[plantStatus];
                return (
                  <Card key={plant.id} className={`${pCfg.border} border`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <span className="text-2xl">{plant.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{plant.name}</p>
                        <div className="flex gap-3 mt-1 flex-wrap">
                          {plant.needs_water && <span className="text-xs text-blue-600 flex items-center gap-1"><Droplets className="w-3 h-3" /> Precisa água</span>}
                          {plant.needs_fertilizer && <span className="text-xs text-amber-600 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Precisa adubo</span>}
                          {plant.needs_pruning && <span className="text-xs text-green-700 flex items-center gap-1"><Scissors className="w-3 h-3" /> Precisa poda</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${pCfg.color}`}>{h}%</span>
                        <div className="w-16 h-2 rounded-full bg-muted overflow-hidden mt-1">
                          <div className="h-full rounded-full transition-all" style={{ width: `${h}%`, backgroundColor: h > 80 ? "hsl(var(--garden-green))" : h > 50 ? "hsl(40,80%,50%)" : "hsl(0,70%,55%)" }} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
