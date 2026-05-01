import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Eye, AlertTriangle, CheckCircle, AlertCircle, Lightbulb, Send, Loader2, Sparkles, Droplets, Leaf, Scissors, MessageCircle, Bot, Crown, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGardenPlants } from "@/hooks/useGardenPlants";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useAnuncios } from "@/hooks/useAnuncios";
import AnuncioCard from "@/components/AnuncioCard";
import { computePlantStatus } from "@/lib/plantHealth";

type StatusGeral = "bom" | "atencao" | "critico";
type ChatMsg = { role: "user" | "assistant"; content: string };

const statusConfig: Record<StatusGeral, { icon: typeof CheckCircle; color: string; bg: string; border: string; label: string; emoji: string }> = {
  bom: { icon: CheckCircle, color: "text-green-700", bg: "bg-green-50", border: "border-green-200", label: "Saudável", emoji: "🌱" },
  atencao: { icon: AlertCircle, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", label: "Precisa de atenção", emoji: "⚠️" },
  critico: { icon: AlertTriangle, color: "text-red-700", bg: "bg-red-50", border: "border-red-200", label: "Situação crítica", emoji: "🚨" },
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

function buildPlantContext(plants: any[]): string {
  if (!plants.length) return "O usuário ainda não possui plantas no jardim.";
  return plants.map(p => {
    const s = computePlantStatus(p);
    return `- ${p.emoji} ${p.name}: saúde REAL ${s.health}% (${s.alertLevel}), ${s.alertMessage}. Última rega: ${p.last_watered ? new Date(p.last_watered).toLocaleDateString("pt-BR") : "nunca"} (há ${s.daysSinceWater} dias). Último adubo: ${p.last_fertilized ? new Date(p.last_fertilized).toLocaleDateString("pt-BR") : "nunca"} (há ${s.daysSinceFertilizer} dias). Luz: ${p.light || "?"}.`;
  }).join("\n");
}

export default function PercepcionsPage() {
  const { user } = useAuth();
  const { plants: gardenPlants } = useGardenPlants();
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  // Calcula status dinâmico de cada planta uma única vez
  const plantStatuses = useMemo(
    () => gardenPlants.map(p => ({ plant: p, status: computePlantStatus(p) })),
    [gardenPlants]
  );

  // ─── Bloco A: Resumo do Jardim (baseado em status DINÂMICO) ───
  const summary = useMemo(() => {
    if (!plantStatuses.length) return null;

    const criticas = plantStatuses.filter(x => x.status.alertLevel === "critico").length;
    const atencao = plantStatuses.filter(x => x.status.alertLevel === "atencao").length;
    const saudaveis = plantStatuses.filter(x => x.status.alertLevel === "saudavel").length;
    const precisamAgua = plantStatuses.filter(x => x.status.needsWater).length;
    const precisamAdubo = plantStatuses.filter(x => x.status.needsFertilizer).length;
    const precisamPoda = plantStatuses.filter(x => x.status.needsPruning).length;

    let status: StatusGeral = "bom";
    if (criticas > 0) status = "critico";
    else if (atencao > 0) status = "atencao";

    return { status, total: plantStatuses.length, saudaveis, atencao, criticas, precisamAgua, precisamAdubo, precisamPoda };
  }, [plantStatuses]);

  // ─── Bloco B: Diagnóstico e Recomendações (baseado em status DINÂMICO) ───
  const diagnostico = useMemo(() => {
    if (!plantStatuses.length) return null;

    const s = summary!;
    let texto = "";
    if (s.criticas > 0) {
      texto = `🚨 ${s.criticas} planta(s) em estado CRÍTICO. Risco de morte por falta de água ou adubo. Aja agora!`;
    } else if (s.atencao > 0) {
      texto = `⚠️ ${s.atencao} planta(s) precisam de atenção (rega ou adubação atrasada). Cuide hoje para evitar agravamento.`;
    } else {
      texto = "Seu jardim está saudável e bem cuidado.";
    }

    const recs: string[] = [];
    // Ordena: críticas primeiro
    const ordered = [...plantStatuses].sort((a, b) => {
      const order = { critico: 0, atencao: 1, saudavel: 2 };
      return order[a.status.alertLevel] - order[b.status.alertLevel];
    });

    ordered.forEach(({ plant, status }) => {
      if (status.waterStatus === "critico") {
        recs.push(`🚨 REGAR URGENTE ${plant.name} — sem água há ${status.daysSinceWater} dias`);
      } else if (status.waterStatus === "atrasado") {
        recs.push(`💧 Regar ${plant.name} — atrasada há ${status.daysSinceWater - (status.daysSinceWater - status.waterDueInDays * -1)} dia(s)`);
      } else if (status.needsWater) {
        recs.push(`💧 Hora de regar ${plant.name}`);
      }

      if (status.fertilizerStatus === "critico") {
        recs.push(`🌿 Adubar URGENTE ${plant.name} — sem adubo há ${status.daysSinceFertilizer} dias`);
      } else if (status.fertilizerStatus === "atrasado") {
        recs.push(`🌿 Aplicar adubo Adubei NPK 5-15-5 em ${plant.name} — adubação atrasada`);
      } else if (status.needsFertilizer) {
        recs.push(`🌿 Aplicar adubo em ${plant.name}`);
      }

      if (status.needsPruning) recs.push(`✂️ Realizar poda em ${plant.name}`);
    });

    return { texto, recomendacoes: recs.slice(0, 12) };
  }, [plantStatuses, summary]);

  // ─── Bloco C: Chat ───
  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || streaming) return;
    setInput("");

    const userMsg: ChatMsg = { role: "user", content: msg };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setStreaming(true);

    const plantContext = buildPlantContext(gardenPlants);
    const contextMsg: ChatMsg = {
      role: "user",
      content: `[CONTEXTO DO JARDIM DO USUÁRIO]\n${plantContext}\n\n[PERGUNTA DO USUÁRIO]\n${msg}`,
    };

    // Send full history but inject context into the last user message
    const apiMessages = [
      ...newMessages.slice(0, -1),
      contextMsg,
    ];

    let assistantText = "";
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ mode: "percepcoes", messages: apiMessages }),
      });

      if (!resp.ok) {
        if (resp.status === 429) { toast.error("Limite de requisições. Tente novamente em instantes."); setStreaming(false); return; }
        if (resp.status === 402) { toast.error("Créditos de IA esgotados."); setStreaming(false); return; }
        throw new Error();
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
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
          try {
            const parsed = JSON.parse(jsonStr);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              assistantText += c;
              setChatMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
                return [...prev, { role: "assistant", content: assistantText }];
              });
            }
          } catch {}
        }
      }
    } catch {
      toast.error("Não consegui analisar seu jardim agora. Tente novamente.");
    } finally {
      setStreaming(false);
    }
  };

  const cfg = summary ? statusConfig[summary.status] : null;
  const StatusIcon = cfg?.icon ?? CheckCircle;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-2">
          <Eye className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-xl font-bold text-foreground">Percepções do Jardim</h1>
        </div>
        <p className="text-sm text-muted-foreground">Diagnóstico inteligente e assistente conversacional</p>
      </div>

      {!gardenPlants.length ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-foreground font-semibold mb-1">Ainda não há dados suficientes</p>
            <p className="text-sm text-muted-foreground">Adicione plantas ao seu jardim para receber recomendações personalizadas.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ─── Bloco A: Resumo ─── */}
          <Card className={`${cfg!.border} border-2`}>
            <CardContent className={`p-5 ${cfg!.bg}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
                  <StatusIcon className={`w-6 h-6 ${cfg!.color}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status Geral</p>
                  <p className={`text-xl font-bold ${cfg!.color}`}>{cfg!.emoji} {cfg!.label}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center">
                {[
                  { label: "Total", value: summary!.total, icon: Leaf },
                  { label: "Saudáveis", value: summary!.saudaveis, icon: CheckCircle },
                  { label: "Atenção", value: summary!.atencao, icon: AlertCircle },
                  { label: "Críticas", value: summary!.criticas, icon: AlertTriangle },
                  { label: "Água", value: summary!.precisamAgua, icon: Droplets },
                  { label: "Poda", value: summary!.precisamPoda, icon: Scissors },
                ].map(s => (
                  <div key={s.label} className="bg-white/60 rounded-lg p-2">
                    <s.icon className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-bold text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ─── Bloco B: Diagnóstico ─── */}
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" /> Diagnóstico Inteligente
            </h2>
            <Card className="mb-3">
              <CardContent className="p-4">
                <p className="text-sm text-foreground font-medium">{diagnostico!.texto}</p>
              </CardContent>
            </Card>
            {diagnostico!.recomendacoes.length > 0 && (
              <div className="space-y-2">
                {diagnostico!.recomendacoes.map((rec, i) => (
                  <Card key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <CardContent className="p-3 flex items-start gap-3">
                      <span className="text-primary mt-0.5 font-bold text-sm">→</span>
                      <p className="text-sm text-foreground">{rec}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── Bloco C: Assistente Conversacional ─── */}
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" /> Assistente do Jardim
        </h2>

        {/* Quick suggestions */}
        <div className="flex flex-wrap gap-2 mb-3">
          {["Como está meu jardim?", "O que preciso fazer hoje?", "Quais plantas precisam de água?", "Alguma planta está morrendo?"].map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={streaming}
              className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat area */}
        <Card>
          <CardContent className="p-0">
            <div className="h-72 overflow-y-auto scroll-thin p-4 space-y-3">
              {chatMessages.length === 0 && (
                <div className="h-full flex items-center justify-center text-center">
                  <div>
                    <Bot className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Pergunte algo sobre seu jardim e receba respostas baseadas nos seus dados reais.</p>
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none [&>p]:m-0">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : msg.content}
                  </div>
                </div>
              ))}
              {streaming && chatMessages[chatMessages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Pergunte sobre seu jardim..."
                disabled={streaming}
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
              />
              <Button onClick={() => sendMessage()} disabled={streaming || !input.trim()} size="sm" className="shrink-0">
                {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Anúncio contextual */}
        <AnuncioContextual />
      </div>
    </div>
  );
}

function AnuncioContextual() {
  const { plants: gardenPlants } = useGardenPlants();
  const needsFertilizer = gardenPlants.some(p => p.needs_fertilizer);
  const tipo = needsFertilizer ? "fornecedor" as const : "prestador" as const;
  const { data: anuncios } = useAnuncios(tipo);

  if (!anuncios || anuncios.length === 0) return null;

  return (
    <AnuncioCard
      anuncio={anuncios[0]}
      label={needsFertilizer ? "Sugestão: Fornecedor de insumos" : "Sugestão: Prestador de serviços"}
    />
  );
}
