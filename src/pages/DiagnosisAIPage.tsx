import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Camera, CheckCircle, HelpCircle, ImagePlus, Leaf, Loader2, MessageCircle, RefreshCw, ShoppingBag, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useAnuncios, useRegistrarClique } from "@/hooks/useAnuncios";
import { supabase } from "@/integrations/supabase/client";
import { optimizeImageForDiagnosis, revokePreviewUrl } from "@/lib/imageProcessing";
import { toast } from "sonner";

const WHATSAPP_NUMBER = "5500000000000"; // placeholder — será atualizado
const FREE_DAILY_LIMIT = 3;

// ── Error Boundaries ──

class DiagnosisErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e: any) { console.error("DiagnosisAIPage crash:", e); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto p-6 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="font-heading font-bold text-foreground">Algo deu errado</h2>
          <p className="text-sm text-muted-foreground">Ocorreu um erro inesperado. Tente novamente.</p>
          <Button onClick={() => this.setState({ hasError: false })} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" /> Tentar novamente
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Types ──

interface DiagnosisResult {
  problema: string;
  causa: string;
  gravidade: "baixa" | "media" | "alta";
  acao: string;
  melhoria_solo: string;
  confianca: number;
}

// ── Helpers ──

function extractResult(raw: string): DiagnosisResult | null {
  try {
    const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    const g = parsed.gravidade;
    return {
      problema: String(parsed.problema || "Diagnóstico inconclusivo"),
      causa: String(parsed.causa || "Não identificada"),
      gravidade: g === "baixa" || g === "media" || g === "alta" ? g : "media",
      acao: String(parsed.acao || "Tente novamente com foto mais nítida."),
      melhoria_solo: String(parsed.melhoria_solo || parsed.sugestao_solo || "Use um condicionador de solo para melhorar a nutrição."),
      confianca: Math.min(Math.max(Number(parsed.confianca ?? parsed.confidence ?? 0.5), 0), 1),
    };
  } catch { return null; }
}

function buildFallback(raw: string): DiagnosisResult {
  return {
    problema: raw.slice(0, 200) || "Não consegui concluir o diagnóstico.",
    causa: "Resposta da IA em formato inesperado.",
    gravidade: "media",
    acao: "Tente novamente com uma foto mais nítida.",
    melhoria_solo: "Considere o uso de um condicionador de solo para melhorar a saúde geral.",
    confianca: 0.5,
  };
}

async function getTodayDiagnosisCount(userId: string): Promise<number> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("analises_imagem")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", todayStart.toISOString());
  return count ?? 0;
}

async function uploadImageToStorage(blob: Blob, userId: string): Promise<string> {
  const fileName = `diagnosis/${userId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from("plant-images").upload(fileName, blob, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error("Falha ao enviar a foto. Tente novamente.");
  const { data: urlData } = supabase.storage.from("plant-images").getPublicUrl(fileName);
  return urlData.publicUrl;
}

// ── Main Component ──

function DiagnosisAIPageInner() {
  const { user } = useAuth();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [dailyCount, setDailyCount] = useState(0);
  const [limitChecked, setLimitChecked] = useState(false);
  const imageBlobRef = useRef<Blob | null>(null);
  const [step, setStep] = useState<"idle" | "uploading" | "analyzing">("idle");

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) { setHasCamera(false); return; }
    navigator.mediaDevices.enumerateDevices()
      .then(d => setHasCamera(d.some(d => d.kind === "videoinput")))
      .catch(() => setHasCamera(false));
  }, []);

  useEffect(() => {
    if (user) {
      getTodayDiagnosisCount(user.id).then(c => { setDailyCount(c); setLimitChecked(true); });
    }
  }, [user]);

  useEffect(() => { return () => revokePreviewUrl(imagePreview); }, [imagePreview]);

  const resetFlow = () => {
    revokePreviewUrl(imagePreview);
    imageBlobRef.current = null;
    setImagePreview(null);
    setResult(null);
    setAnalysisError(null);
    setStep("idle");
  };

  const handleFile = async (file: File) => {
    setIsProcessingImage(true);
    setResult(null);
    setAnalysisError(null);
    try {
      // Yield to render loading UI
      await new Promise<void>(r => requestAnimationFrame(() => r()));
      revokePreviewUrl(imagePreview);
      const { blob, previewUrl } = await optimizeImageForDiagnosis(file);
      console.info("Image optimized:", blob.size, "bytes");
      imageBlobRef.current = blob;
      setImagePreview(previewUrl);
    } catch (e: any) {
      console.error("Image processing error:", e);
      imageBlobRef.current = null;
      setImagePreview(null);
      const msg = e?.message || "Erro ao carregar imagem.";
      setAnalysisError(msg);
      toast.error(msg);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const analyze = async () => {
    if (!imageBlobRef.current || !user || isAnalyzing) return;

    if (dailyCount >= FREE_DAILY_LIMIT) {
      setAnalysisError(`Você atingiu o limite de ${FREE_DAILY_LIMIT} diagnósticos gratuitos hoje.`);
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setAnalysisError(null);

    try {
      // Step 1: Upload image to storage (avoids sending huge base64 in body)
      setStep("uploading");
      await new Promise<void>(r => requestAnimationFrame(() => r()));
      const imageUrl = await uploadImageToStorage(imageBlobRef.current, user.id);
      console.info("Image uploaded to storage:", imageUrl);

      // Step 2: Call AI with URL
      setStep("analyzing");
      await new Promise<void>(r => requestAnimationFrame(() => r()));

      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          mode: "diagnosis",
          imageUrl,
          messages: [{ role: "user", content: "Analise esta planta e identifique possíveis problemas de saúde." }],
        },
      });

      if (error) {
        console.error("AI invoke error:", error);
        const errMsg = typeof error === "object" && "message" in error ? (error as any).message : "";
        if (errMsg.includes("Créditos")) throw new Error("Créditos de IA esgotados.");
        if (errMsg.includes("Limite")) throw new Error("Muitas requisições. Aguarde.");
        throw new Error("Não consegui analisar sua planta agora. Tente novamente.");
      }

      const content = typeof data === "string" ? data : data?.content || data?.response || "";
      if (!content.trim()) throw new Error("Resposta vazia da IA. Tente novamente.");

      const parsed = extractResult(content) || buildFallback(content);
      setResult(parsed);
      setDailyCount(c => c + 1);

      // Save to DB
      void supabase.from("analises_imagem").insert({
        user_id: user.id,
        image_url: imageUrl,
        ai_result: parsed as any,
        confidence: parsed.confianca,
      }).then(() => {}, () => {});

    } catch (e: any) {
      console.error("Diagnosis failed:", e);
      const msg = e instanceof TypeError
        ? "Falha de conexão. Verifique sua internet."
        : e?.message || "Erro ao analisar. Tente novamente.";
      setAnalysisError(msg);
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
      setStep("idle");
    }
  };

  const remainingToday = Math.max(0, FREE_DAILY_LIMIT - dailyCount);
  const atLimit = limitChecked && remainingToday <= 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10">
          <Leaf className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-lg font-bold text-foreground">Diagnosticar minha planta</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Envie uma foto e descubra o que sua planta precisa
        </p>
        {limitChecked && (
          <p className="text-xs text-muted-foreground">
            {remainingToday > 0
              ? `${remainingToday} diagnóstico${remainingToday > 1 ? "s" : ""} grátis restante${remainingToday > 1 ? "s" : ""} hoje`
              : "Limite diário atingido"}
          </p>
        )}
      </div>

      {/* Upgrade banner */}
      {atLimit && !result && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-primary mx-auto" />
            <h2 className="font-heading font-bold text-foreground">Limite diário atingido</h2>
            <p className="text-sm text-muted-foreground">
              Você usou seus {FREE_DAILY_LIMIT} diagnósticos gratuitos hoje. Volte amanhã ou faça upgrade para diagnósticos ilimitados!
            </p>
            <Button className="w-full" size="lg" disabled>
              <Sparkles className="w-4 h-4 mr-2" /> Upgrade Premium — Em breve
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Image capture */}
      {!atLimit && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <input id="dx-camera" type="file" accept="image/*" capture="environment" className="sr-only"
              onChange={e => { if (e.target.files?.[0]) void handleFile(e.target.files[0]); e.target.value = ""; }} />
            <input id="dx-gallery" type="file" accept="image/*,.heic,.heif" className="sr-only"
              onChange={e => { if (e.target.files?.[0]) void handleFile(e.target.files[0]); e.target.value = ""; }} />

            {isProcessingImage ? (
              <div className="flex flex-col items-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Preparando imagem...</p>
              </div>
            ) : imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Planta para diagnóstico" className="w-full max-h-72 object-contain rounded-xl border border-border" />
                <button onClick={resetFlow}
                  className="absolute top-2 right-2 bg-background/80 backdrop-blur rounded-full p-1.5 shadow-md"
                  title="Remover imagem">
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-xl p-6 space-y-3">
                <p className="text-center text-sm font-medium text-foreground">Como deseja enviar a imagem?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hasCamera && (
                    <label htmlFor="dx-camera"
                      className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer active:scale-95">
                      <Camera className="w-10 h-10 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Tirar Foto</span>
                      <span className="text-xs text-muted-foreground">Câmera do celular</span>
                    </label>
                  )}
                  <label htmlFor="dx-gallery"
                    className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer active:scale-95">
                    <ImagePlus className="w-10 h-10 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Selecionar Foto</span>
                    <span className="text-xs text-muted-foreground">Da galeria do dispositivo</span>
                  </label>
                </div>
              </div>
            )}

            {imagePreview && !result && (
              <Button onClick={analyze} disabled={isAnalyzing || isProcessingImage} className="w-full" size="lg">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {step === "uploading" ? "Enviando foto..." : "Analisando sua planta..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Diagnosticar minha planta
                  </>
                )}
              </Button>
            )}

            {analysisError && <p className="text-sm text-destructive text-center">{analysisError}</p>}
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && <DiagnosisResultCard result={result} onReset={resetFlow} />}

      {/* Post-diagnostic ad */}
      {result && <PostDiagnosticAd />}
    </div>
  );
}

// ── Result Card ──

function DiagnosisResultCard({ result, onReset }: { result: DiagnosisResult; onReset: () => void }) {
  const gravityConfig = {
    baixa: { icon: CheckCircle, label: "Leve", cls: "bg-primary/10 text-primary" },
    media: { icon: AlertTriangle, label: "Médio", cls: "bg-secondary text-secondary-foreground" },
    alta: { icon: AlertTriangle, label: "Grave", cls: "bg-destructive/10 text-destructive" },
  } as const;

  const g = gravityConfig[result.gravidade] || gravityConfig.media;
  const Icon = g.icon;
  const pct = Math.round(result.confianca * 100);

  const whatsappMsg = encodeURIComponent("Olá, fiz o diagnóstico da minha planta no app e quero comprar o produto recomendado");
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`;

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading font-bold text-foreground flex items-center gap-2">
            <Leaf className="w-5 h-5 text-primary" />
            🌿 Diagnóstico da sua planta
          </h2>
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${g.cls}`}>
            <Icon className="h-3 w-3" /> {g.label}
          </span>
        </div>

        {/* Confidence */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Confiança</span><span className="font-medium text-foreground">{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          {result.confianca < 0.6 && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <HelpCircle className="h-3 w-3" /> Considere consultar um especialista.
            </p>
          )}
        </div>

        {/* Diagnosis details */}
        <div className="space-y-3">
          <div className="rounded-lg border border-destructive/10 bg-destructive/5 p-3">
            <p className="mb-1 text-xs font-medium text-destructive">🔍 Problema identificado</p>
            <p className="text-sm text-foreground">{result.problema}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="mb-1 text-xs font-medium text-foreground">⚠️ Causa provável</p>
            <p className="text-sm text-foreground">{result.causa}</p>
          </div>
          <div className="rounded-lg border border-primary/10 bg-primary/5 p-3">
            <p className="mb-1 text-xs font-medium text-primary">✅ O que fazer</p>
            <p className="text-sm text-foreground">{result.acao}</p>
          </div>
          <div className="rounded-lg border border-primary/10 bg-primary/5 p-3">
            <p className="mb-1 text-xs font-medium text-primary">💚 Sugestão de melhoria</p>
            <p className="text-sm text-foreground">{result.melhoria_solo}</p>
          </div>
        </div>

        {/* CTA - WhatsApp */}
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center space-y-2">
          <p className="text-sm font-semibold text-foreground">Quer recuperar sua planta rapidamente?</p>
          <p className="text-xs text-muted-foreground">Recomendamos um condicionador de solo para melhorar a saúde da sua planta</p>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="block">
            <Button className="w-full gap-2" size="lg">
              <ShoppingBag className="w-4 h-4" /> Quero recuperar minha planta
            </Button>
          </a>
        </div>

        <Button variant="outline" onClick={onReset} className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" /> Analisar outra planta
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Post-diagnostic Ad ──

function PostDiagnosticAd() {
  const { data: anuncios } = useAnuncios("prestador");
  const registrarClique = useRegistrarClique();
  if (!anuncios?.length) return null;
  const ad = anuncios[0];
  if (!ad?.anunciantes?.nome) return null;

  return (
    <Card className="border-dashed border-primary/20 bg-primary/5">
      <CardContent className="p-4 text-center space-y-3">
        <p className="text-sm font-semibold text-foreground">Precisa de ajuda profissional? 🌿</p>
        <p className="text-xs text-muted-foreground">{ad.anunciantes.nome} · {ad.anunciantes.cidade}</p>
        <Button size="sm" className="gap-1.5" onClick={() => { registrarClique(ad.id); window.open(ad.link_whatsapp, "_blank", "noopener,noreferrer"); }}>
          <MessageCircle className="w-3.5 h-3.5" /> Falar no WhatsApp
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DiagnosisAIPage() {
  return (
    <DiagnosisErrorBoundary>
      <DiagnosisAIPageInner />
    </DiagnosisErrorBoundary>
  );
}
