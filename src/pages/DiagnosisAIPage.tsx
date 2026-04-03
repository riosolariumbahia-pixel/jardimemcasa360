import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Camera, CheckCircle, HelpCircle, ImagePlus, Loader2, MessageCircle, RefreshCw, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useAnuncios, useRegistrarClique } from "@/hooks/useAnuncios";
import { supabase } from "@/integrations/supabase/client";
import { encodeDiagnosisImageToBase64, optimizeImageForDiagnosis, revokePreviewUrl } from "@/lib/imageProcessing";
import { toast } from "sonner";

class DiagnosisErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.error("DiagnosisAIPage crash:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto p-6 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="font-heading font-bold text-foreground">Algo deu errado</h2>
          <p className="text-sm text-muted-foreground">
            Ocorreu um erro inesperado no diagnóstico. Tente novamente.
          </p>
          <Button onClick={() => this.setState({ hasError: false })} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" /> Tentar novamente
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

class DiagnosisSectionBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.error("Diagnosis section crash:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

interface DiagnosisResult {
  problema: string;
  causa: string;
  acao: string;
  confianca: number;
  gravidade: "baixa" | "media" | "alta";
}

function extractDiagnosisResult(rawResponse: string): DiagnosisResult | null {
  try {
    const cleanedResponse = rawResponse.replace(/```json/gi, "```").replace(/```/g, "").trim();
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as Partial<DiagnosisResult> & { confidence?: number };
    const gravidade = parsed.gravidade === "baixa" || parsed.gravidade === "media" || parsed.gravidade === "alta"
      ? parsed.gravidade
      : "media";
    const confianca = Number(parsed.confianca ?? parsed.confidence ?? 0.5);

    return {
      problema: String(parsed.problema ?? "Diagnóstico inconclusivo"),
      causa: String(parsed.causa ?? "Não foi possível identificar a causa com segurança."),
      acao: String(parsed.acao ?? "Tente novamente com uma foto mais nítida e próxima."),
      confianca: Number.isFinite(confianca) ? Math.min(Math.max(confianca, 0), 1) : 0.5,
      gravidade,
    };
  } catch {
    return null;
  }
}

function buildFallbackResult(rawResponse: string): DiagnosisResult {
  const cleanedResponse = rawResponse.trim();

  return {
    problema: cleanedResponse.slice(0, 200) || "Não consegui concluir o diagnóstico com segurança.",
    causa: "A resposta da IA veio em formato parcial ou diferente do esperado.",
    acao: cleanedResponse.slice(200) || "Tente novamente com uma foto mais nítida e próxima.",
    confianca: 0.5,
    gravidade: "media",
  };
}

function sanitizeDiagnosisText(value: unknown, fallback: string) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}

function normalizeDiagnosisResult(result: DiagnosisResult): DiagnosisResult {
  return {
    problema: sanitizeDiagnosisText(result.problema, "Não consegui identificar o problema com segurança."),
    causa: sanitizeDiagnosisText(result.causa, "Não foi possível identificar a causa com segurança."),
    acao: sanitizeDiagnosisText(result.acao, "Tente novamente com uma foto mais nítida e próxima."),
    confianca: Number.isFinite(result.confianca) ? Math.min(Math.max(result.confianca, 0), 1) : 0.5,
    gravidade: result.gravidade === "baixa" || result.gravidade === "media" || result.gravidade === "alta"
      ? result.gravidade
      : "media",
  };
}

function getDiagnosisContent(payload: unknown) {
  if (typeof payload === "string") {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const responsePayload = payload as { content?: unknown; response?: unknown; error?: unknown; message?: unknown };

    if (typeof responsePayload.error === "string" && responsePayload.error.trim()) {
      throw new Error(responsePayload.error);
    }

    if (typeof responsePayload.message === "string" && responsePayload.message.trim()) {
      throw new Error(responsePayload.message);
    }

    if (typeof responsePayload.content === "string") {
      return responsePayload.content;
    }

    if (typeof responsePayload.response === "string") {
      return responsePayload.response;
    }
  }

  return "";
}

function getDiagnosisErrorMessage(error: unknown) {
  const message = typeof error === "object" && error !== null
    ? [
        "message" in error ? error.message : null,
        "context" in error && error.context && typeof error.context === "object" && "error" in error.context ? error.context.error : null,
        "context" in error && error.context && typeof error.context === "object" && "message" in error.context ? error.context.message : null,
      ].find((value) => typeof value === "string" && value.trim())
    : null;

  if (typeof message !== "string") {
    return null;
  }

  if (message.includes("Créditos de IA esgotados")) {
    return "Créditos de IA esgotados.";
  }

  if (message.includes("Limite de requisições excedido")) {
    return "Muitas requisições. Aguarde alguns segundos.";
  }

  return message;
}

function DiagnosisAIPageInner() {
  const { user } = useAuth();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const imageBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setHasCamera(false);
      return;
    }

    navigator.mediaDevices.enumerateDevices()
      .then((devices) => setHasCamera(devices.some((device) => device.kind === "videoinput")))
      .catch(() => setHasCamera(false));
  }, []);

  useEffect(() => {
    return () => revokePreviewUrl(imagePreview);
  }, [imagePreview]);

  const clearSelection = () => {
    revokePreviewUrl(imagePreview);
    imageBlobRef.current = null;
    setImagePreview(null);
    setResult(null);
  };

  const resetFlow = () => {
    clearSelection();
    setAnalysisError(null);
  };

  const handleFile = async (file: File) => {
    setIsProcessingImage(true);
    setResult(null);
    setAnalysisError(null);

    try {
      revokePreviewUrl(imagePreview);
      const { blob, previewUrl } = await optimizeImageForDiagnosis(file);
      console.info("Diagnosis image prepared", { size: blob.size, type: blob.type });
      imageBlobRef.current = blob;
      setImagePreview(previewUrl);
    } catch (error: any) {
      const message = error?.message || "Erro ao carregar imagem. Tente novamente.";
      console.error("Diagnosis image processing error:", error);
      imageBlobRef.current = null;
      clearSelection();
      setAnalysisError(message);
      toast.error(message);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const analyze = async () => {
    if (!imageBlobRef.current || isAnalyzing) return;

    setIsAnalyzing(true);
    setResult(null);
    setAnalysisError(null);

    try {
      const imageBase64 = await encodeDiagnosisImageToBase64(imageBlobRef.current);
      console.info("Sending diagnosis request", { bytes: imageBlobRef.current.size, base64Length: imageBase64.length });

      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          mode: "diagnosis",
          imageBase64,
          messages: [{ role: "user", content: "Analise esta planta e identifique possíveis problemas de saúde." }],
        },
      });

      if (error) {
        console.error("Diagnosis AI invoke error:", error);
        throw new Error(getDiagnosisErrorMessage(error) || "Não consegui analisar sua planta agora. Tente novamente com uma foto mais nítida e próxima.");
      }

      const fullResponse = getDiagnosisContent(data);
      if (!fullResponse.trim()) {
        throw new Error("Não consegui analisar sua planta agora. Tente novamente com uma foto mais nítida e próxima.");
      }

      const parsedResult = normalizeDiagnosisResult(extractDiagnosisResult(fullResponse) || buildFallbackResult(fullResponse));
      setResult(parsedResult);

      if (user) {
        void supabase.from("analises_imagem" as any).insert({
          user_id: user.id,
          image_url: "local-upload",
          ai_result: parsedResult,
          confidence: parsedResult.confianca,
        }).then(() => undefined, () => undefined);
      }
    } catch (error: any) {
      console.error("Diagnosis AI request failed:", error);

      const message = error instanceof TypeError
          ? "Falha de conexão ao enviar a foto. Tente novamente."
          : error?.message || "Não consegui analisar sua planta agora. Tente novamente com uma foto mais nítida e próxima.";

      setAnalysisError(message);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-2">
          <Camera className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-lg font-bold text-foreground">Diagnóstico por Foto</h1>
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Tire uma foto ou selecione uma imagem da sua planta para diagnóstico</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <input
            id="diagnosis-camera-input"
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(event) => {
              if (event.target.files?.[0]) void handleFile(event.target.files[0]);
              event.target.value = "";
            }}
          />

          <input
            id="diagnosis-gallery-input"
            type="file"
            accept="image/*,.heic,.heif"
            className="sr-only"
            onChange={(event) => {
              if (event.target.files?.[0]) void handleFile(event.target.files[0]);
              event.target.value = "";
            }}
          />

          {isProcessingImage ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Preparando imagem...</p>
            </div>
          ) : imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="Pré-visualização da planta para diagnóstico" className="w-full max-h-80 object-contain rounded-xl border border-border" />
              <button
                onClick={resetFlow}
                className="absolute top-2 right-2 bg-background/80 backdrop-blur rounded-full p-1.5 shadow-md hover:bg-background transition-colors"
                title="Remover imagem"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-xl p-8 space-y-4">
              <p className="text-center text-sm font-medium text-foreground mb-2">Como deseja enviar a imagem?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {hasCamera && (
                  <label
                    htmlFor="diagnosis-camera-input"
                    className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    <Camera className="w-10 h-10 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Tirar Foto</span>
                    <span className="text-xs text-muted-foreground">Usar câmera do dispositivo</span>
                  </label>
                )}

                <label
                  htmlFor="diagnosis-gallery-input"
                  className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                >
                  <ImagePlus className="w-10 h-10 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Selecionar da Galeria</span>
                  <span className="text-xs text-muted-foreground">JPG, PNG, WEBP ou HEIC (máx 10MB)</span>
                </label>
              </div>
            </div>
          )}

          {imagePreview && !result && (
            <Button onClick={analyze} disabled={isAnalyzing || isProcessingImage || !imagePreview} className="w-full" size="lg">
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analisando sua planta...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> Analisar imagem
                </>
              )}
            </Button>
          )}

          {analysisError && (
            <p className="text-sm text-destructive">{analysisError}</p>
          )}
        </CardContent>
      </Card>

      {result && (
        <>
          <DiagnosisSectionBoundary fallback={<DiagnosisResultFallback onReset={resetFlow} />}>
            <DiagnosisResultCard result={result} onReset={resetFlow} />
          </DiagnosisSectionBoundary>

          <DiagnosisSectionBoundary fallback={null}>
            <PostDiagnosticAd />
          </DiagnosisSectionBoundary>
        </>
      )}
    </div>
  );
}

function DiagnosisResultFallback({ onReset }: { onReset: () => void }) {
  return (
    <Card className="animate-fade-in-up">
      <CardContent className="p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="font-heading font-bold text-foreground">Diagnóstico concluído</h2>
          <p className="text-sm text-muted-foreground">A análise foi gerada, mas houve uma falha ao exibir os detalhes nesta tela.</p>
        </div>

        <Button variant="outline" onClick={onReset} className="w-full">
          Tentar outra foto
        </Button>
      </CardContent>
    </Card>
  );
}

function DiagnosisResultCard({ result, onReset }: { result: DiagnosisResult; onReset: () => void }) {
  const gravityConfig = {
    baixa: { icon: CheckCircle, label: "Baixa gravidade", badgeClassName: "bg-primary/10 text-primary" },
    media: { icon: AlertTriangle, label: "Gravidade média", badgeClassName: "bg-secondary text-secondary-foreground" },
    alta: { icon: AlertTriangle, label: "Alta gravidade", badgeClassName: "bg-destructive/10 text-destructive" },
  } as const;

  const gravity = gravityConfig[result.gravidade] || gravityConfig.media;
  const Icon = gravity.icon;
  const confidencePercent = Math.round(result.confianca * 100);

  return (
    <Card className="animate-fade-in-up">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading font-bold text-foreground">Resultado do Diagnóstico</h2>
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${gravity.badgeClassName}`}>
            <Icon className="h-3 w-3" />
            {gravity.label}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <p className="text-xs text-muted-foreground">Confiança da IA</p>
            <span className="font-medium text-foreground">{confidencePercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${confidencePercent}%` }} />
          </div>
          {result.confianca < 0.6 && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <HelpCircle className="h-3 w-3" /> Não tenho certeza absoluta — considere consultar um especialista.
            </p>
          )}
        </div>

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
            <p className="mb-1 text-xs font-medium text-primary">✅ Ação recomendada</p>
            <p className="text-sm text-foreground">{result.acao}</p>
          </div>
        </div>

        <Button variant="outline" onClick={onReset} className="w-full">
          Analisar outra planta
        </Button>
      </CardContent>
    </Card>
  );
}

function PostDiagnosticAd() {
  const { data: anuncios } = useAnuncios("prestador");
  const registrarClique = useRegistrarClique();

  if (!anuncios || anuncios.length === 0) return null;

  const ad = anuncios[0];
  if (!ad?.anunciantes?.nome) return null;

  const handleClick = () => {
    registrarClique(ad.id);
    window.open(ad.link_whatsapp, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="border-dashed border-primary/20 bg-primary/5">
      <CardContent className="p-4 text-center space-y-3">
        <p className="text-sm font-semibold text-foreground">Precisa de ajuda profissional? 🌿</p>
        <p className="text-xs text-muted-foreground">{ad.anunciantes.nome} · {ad.anunciantes.cidade}</p>
        <Button size="sm" className="gap-1.5" onClick={handleClick}>
          <MessageCircle className="w-3.5 h-3.5" />
          Falar no WhatsApp
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
