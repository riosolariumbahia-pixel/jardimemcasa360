import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Camera, Crown, ImagePlus, Leaf, Loader2, MessageCircle, RefreshCw, ShoppingBag, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useAnuncios, useRegistrarClique } from "@/hooks/useAnuncios";
import { supabase } from "@/integrations/supabase/client";
import { encodeDiagnosisImageToBase64, optimizeImageForDiagnosis, revokePreviewUrl } from "@/lib/imageProcessing";
import { toast } from "sonner";

const WHATSAPP_NUMBER = "5571996091236";
const DIAGNOSIS_FUNCTION_NAME = "diagnostico";

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
  diagnostico: string;
  recomendacao: string;
  meta?: { plano: string; usado: number; limite: number };
}

// ── Helpers ──

type DiagnosisRequestError = Error & { status?: number };

function createRequestError(message: string, status?: number): DiagnosisRequestError {
  const error = new Error(message) as DiagnosisRequestError;
  error.status = status;
  return error;
}

function parseDiagnosisPayload(payload: unknown): Record<string, unknown> | null {
  if (payload && typeof payload === "object") {
    return payload as Record<string, unknown>;
  }

  if (typeof payload !== "string" || !payload.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(payload);
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function normalizeDiagnosisResponse(payload: unknown): DiagnosisResult {
  const basePayload = parseDiagnosisPayload(payload);
  const nestedPayload = typeof basePayload?.content === "string"
    ? parseDiagnosisPayload(basePayload.content)
    : null;
  const data = nestedPayload ?? basePayload;
  const diagnostico = typeof data?.diagnostico === "string" ? data.diagnostico.trim() : "";
  const recomendacao = typeof data?.recomendacao === "string" ? data.recomendacao.trim() : "";

  if (!diagnostico || !recomendacao) {
    throw createRequestError("Resposta inválida do diagnóstico.", 502);
  }

  return {
    diagnostico,
    recomendacao,
  };
}

async function postDiagnosisRequest(imagem: string): Promise<DiagnosisResult> {
  const { data, error } = await supabase.functions.invoke(DIAGNOSIS_FUNCTION_NAME, {
    body: { imagem },
  });

  // Edge Function returns FunctionsHttpError on non-2xx; data may still hold body via context
  if (error) {
    console.error("Diagnosis invoke error:", error);
    // Try to read error context body for limit/auth messages
    const ctxBody: any = (error as any)?.context?.body || (error as any)?.context;
    let parsed: any = null;
    try {
      if (typeof ctxBody === "string") parsed = JSON.parse(ctxBody);
      else if (ctxBody) parsed = ctxBody;
    } catch { /* noop */ }

    if (parsed?.error === "limit_reached") {
      throw createRequestError(parsed.message || "Limite diário atingido.", 402);
    }
    if (parsed?.error === "auth_required") {
      throw createRequestError(parsed.message || "Faça login para continuar.", 401);
    }
    throw createRequestError("Erro ao enviar imagem, tente novamente", 500);
  }

  // Some success responses may still carry app errors
  if ((data as any)?.error === "limit_reached") {
    throw createRequestError((data as any).message || "Limite diário atingido.", 402);
  }

  const normalized = normalizeDiagnosisResponse(data);
  if ((data as any)?.meta) normalized.meta = (data as any).meta;
  return normalized;
}

// ── Main Component ──

function DiagnosisAIPageInner() {
  const { user } = useAuth();
  const sub = useSubscription();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [queuedBase64, setQueuedBase64] = useState<string | null>(null);
  const imageBase64Ref = useRef<string | null>(null);

  const planLimit = sub.isPremium ? 5 : 1;

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) { setHasCamera(false); return; }
    navigator.mediaDevices.enumerateDevices()
      .then(d => setHasCamera(d.some(d => d.kind === "videoinput")))
      .catch(() => setHasCamera(false));
  }, []);

  useEffect(() => { return () => revokePreviewUrl(imagePreview); }, [imagePreview]);

  const resetFlow = () => {
    revokePreviewUrl(imagePreview);
    imageBase64Ref.current = null;
    setImagePreview(null);
    setIsAnalyzing(false);
    setResult(null);
    setAnalysisError(null);
    setLimitReached(false);
    setQueuedBase64(null);
  };

  const analyze = async (base64Image = imageBase64Ref.current) => {
    if (!base64Image || isAnalyzing) return;

    setIsAnalyzing(true);
    setResult(null);
    setAnalysisError(null);

    try {
      await new Promise<void>(r => requestAnimationFrame(() => r()));
      const diagnosis = await postDiagnosisRequest(base64Image);

      console.info("Diagnosis completed:", diagnosis);
      setResult(diagnosis);

      if (user) {
        void supabase.from("analises_imagem").insert({
          user_id: user.id,
          image_url: "inline://diagnostico",
          ai_result: diagnosis as any,
          confidence: 0.9,
        }).then(
          () => undefined,
          (error) => console.warn("Failed to save diagnosis history:", error),
        );
      }
    } catch (e: any) {
      console.error("Diagnosis failed:", e);
      if (e?.status === 402) {
        setLimitReached(true);
        setAnalysisError(e.message);
        toast.error(e.message);
      } else {
        const msg = e?.status === 401 ? (e.message || "Faça login para usar o diagnóstico.") : "Erro ao enviar imagem, tente novamente";
        setAnalysisError(msg);
        toast.error(msg);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!queuedBase64 || isProcessingImage || isAnalyzing) return;

    setQueuedBase64(null);
    void analyze(queuedBase64);
  }, [queuedBase64, isProcessingImage, isAnalyzing]);

  const handleFile = async (file: File) => {
    setIsProcessingImage(true);
    setResult(null);
    setAnalysisError(null);
    setQueuedBase64(null);

    try {
      await new Promise<void>(r => requestAnimationFrame(() => r()));
      revokePreviewUrl(imagePreview);
      const { blob, previewUrl } = await optimizeImageForDiagnosis(file);
      const base64 = await encodeDiagnosisImageToBase64(blob);
      console.info("Diagnosis image prepared:", { bytes: blob.size, base64Length: base64.length });
      imageBase64Ref.current = base64;
      setImagePreview(previewUrl);
      setQueuedBase64(base64);
    } catch (e: any) {
      console.error("Image processing error:", e);
      imageBase64Ref.current = null;
      setImagePreview(null);
      const msg = e?.message || "Erro ao carregar imagem.";
      setAnalysisError(msg);
      toast.error(msg);
    } finally {
      setIsProcessingImage(false);
    }
  };

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
      </div>

      {/* Image capture */}
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
                  <span className="text-sm font-semibold text-foreground">Selecionar Imagem</span>
                  <span className="text-xs text-muted-foreground">Da galeria do dispositivo</span>
                </label>
              </div>
              <p className="text-center text-xs text-muted-foreground">A análise começa automaticamente após escolher a imagem.</p>
            </div>
          )}

          {imagePreview && !result && isAnalyzing && (
            <div className="flex flex-col items-center justify-center gap-3 py-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analisando planta...</p>
            </div>
          )}

          {analysisError && <p className="text-sm text-destructive text-center">{analysisError}</p>}
        </CardContent>
      </Card>

      {/* Result */}
      {result && <DiagnosisResultCard result={result} onReset={resetFlow} />}

      {/* Post-diagnostic ad */}
      {result && <PostDiagnosticAd />}
    </div>
  );
}

// ── Result Card ──

function DiagnosisResultCard({ result, onReset }: { result: DiagnosisResult; onReset: () => void }) {
  const whatsappMsg = encodeURIComponent("Olá, fiz o diagnóstico da minha planta no app e quero comprar o produto recomendado");
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`;

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-bold text-foreground">Resultado do diagnóstico</h2>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="mb-1 text-xs font-medium text-foreground">Diagnóstico</p>
            <p className="text-sm text-foreground">{result.diagnostico}</p>
          </div>
          <div className="rounded-lg border border-primary/10 bg-primary/5 p-4">
            <p className="mb-1 text-xs font-medium text-primary">Recomendação</p>
            <p className="text-sm text-foreground">{result.recomendacao}</p>
          </div>
        </div>

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
