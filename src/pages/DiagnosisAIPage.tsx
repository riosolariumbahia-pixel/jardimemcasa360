import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle, HelpCircle, ImagePlus, Loader2, MessageCircle, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useAnuncios, useRegistrarClique } from "@/hooks/useAnuncios";
import { supabase } from "@/integrations/supabase/client";
import { optimizeImageForDiagnosis, revokePreviewUrl } from "@/lib/imageProcessing";
import { toast } from "sonner";

interface DiagnosisResult {
  problema: string;
  causa: string;
  acao: string;
  confianca: number;
  gravidade: "baixa" | "media" | "alta";
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

function extractDiagnosisResult(rawResponse: string): DiagnosisResult | null {
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

async function readDiagnosisStream(response: Response) {
  if (!response.body) {
    throw new Error("Resposta inválida da IA.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = "";
  let textBuffer = "";

  const processLine = (line: string) => {
    if (line.startsWith(":") || line.trim() === "") return false;
    if (!line.startsWith("data: ")) return false;

    const jsonStr = line.slice(6).trim();
    if (jsonStr === "[DONE]") return true;

    const parsed = JSON.parse(jsonStr);
    const errorMessage = parsed?.error?.message || parsed?.error;
    if (typeof errorMessage === "string" && errorMessage.trim()) {
      throw new Error(errorMessage);
    }

    const content = parsed?.choices?.[0]?.delta?.content;
    if (content) {
      fullResponse += content;
    }

    return false;
  };

  while (true) {
    const { done, value } = await reader.read();
    textBuffer += decoder.decode(value || new Uint8Array(), { stream: !done });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);

      try {
        if (processLine(line)) {
          return fullResponse;
        }
      } catch (error) {
        if (error instanceof SyntaxError) {
          textBuffer = `${line}\n${textBuffer}`;
          break;
        }

        throw error;
      }
    }

    if (done) break;
  }

  const remainingLine = textBuffer.trim();
  if (remainingLine) {
    try {
      processLine(remainingLine);
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        throw error;
      }
    }
  }

  return fullResponse;
}

export default function DiagnosisAIPage() {
  const { user } = useAuth();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

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
    setImagePreview(null);
    setImageBase64(null);
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
      const { base64, previewUrl } = await optimizeImageForDiagnosis(file);
      setImagePreview(previewUrl);
      setImageBase64(base64);
    } catch (error: any) {
      const message = error?.message || "Erro ao carregar imagem. Tente novamente.";
      clearSelection();
      setAnalysisError(message);
      toast.error(message);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const analyze = async () => {
    if (!imageBase64 || isAnalyzing) return;

    setIsAnalyzing(true);
    setResult(null);
    setAnalysisError(null);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 60000);

    try {
      let authToken = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (user) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          authToken = data.session.access_token;
        }
      }

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        signal: controller.signal,
        body: JSON.stringify({
          mode: "diagnosis",
          imageBase64,
          messages: [{ role: "user", content: "Analise esta planta e identifique possíveis problemas de saúde." }],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error("Muitas requisições. Aguarde alguns segundos.");
        if (response.status === 402) throw new Error("Créditos de IA esgotados.");
        throw new Error("Não consegui analisar sua planta agora. Tente novamente com uma foto mais nítida e próxima.");
      }

      const fullResponse = await readDiagnosisStream(response);
      if (!fullResponse.trim()) {
        throw new Error("Não consegui analisar sua planta agora. Tente novamente com uma foto mais nítida e próxima.");
      }

      const parsedResult = extractDiagnosisResult(fullResponse) || buildFallbackResult(fullResponse);
      setResult(parsedResult);

      if (user) {
        void supabase.from("analises_imagem" as any).insert({
          user_id: user.id,
          image_url: "local-upload",
          ai_result: parsedResult,
          confidence: parsedResult.confianca,
        });
      }
    } catch (error: any) {
      const message = error?.name === "AbortError"
        ? "Não consegui analisar sua planta agora. Tente novamente com uma foto mais nítida e próxima."
        : error instanceof TypeError
          ? "Falha de conexão ao enviar a foto. Tente novamente."
          : error?.message || "Não consegui analisar sua planta agora. Tente novamente com uma foto mais nítida e próxima.";

      setAnalysisError(message);
      toast.error(message);
    } finally {
      window.clearTimeout(timeoutId);
      setIsAnalyzing(false);
    }
  };

  const gravityConfig = {
    baixa: { color: "text-green-600", bg: "bg-green-50", icon: CheckCircle, label: "Baixa gravidade" },
    media: { color: "text-yellow-600", bg: "bg-yellow-50", icon: AlertTriangle, label: "Gravidade média" },
    alta: { color: "text-red-600", bg: "bg-red-50", icon: AlertTriangle, label: "Alta gravidade" },
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
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => {
              if (event.target.files?.[0]) handleFile(event.target.files[0]);
              event.target.value = "";
            }}
          />

          <input
            ref={galleryRef}
            type="file"
            accept="image/*,.heic,.heif"
            className="hidden"
            onChange={(event) => {
              if (event.target.files?.[0]) handleFile(event.target.files[0]);
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
                  <button
                    onClick={() => cameraRef.current?.click()}
                    className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    <Camera className="w-10 h-10 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Tirar Foto</span>
                    <span className="text-xs text-muted-foreground">Usar câmera do dispositivo</span>
                  </button>
                )}

                <button
                  onClick={() => galleryRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                >
                  <ImagePlus className="w-10 h-10 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Selecionar da Galeria</span>
                  <span className="text-xs text-muted-foreground">JPG, PNG, WEBP ou HEIC (máx 10MB)</span>
                </button>
              </div>
            </div>
          )}

          {imagePreview && !result && (
            <Button onClick={analyze} disabled={isAnalyzing || isProcessingImage || !imageBase64} className="w-full" size="lg">
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
          <Card className="animate-fade-in-up">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-foreground">Resultado do Diagnóstico</h2>
                {(() => {
                  const gravity = gravityConfig[result.gravidade] || gravityConfig.media;
                  const Icon = gravity.icon;

                  return (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${gravity.bg} ${gravity.color}`}>
                      <Icon className="w-3 h-3" /> {gravity.label}
                    </span>
                  );
                })()}
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Confiança da IA</p>
                <div className="flex items-center gap-3">
                  <Progress value={result.confianca * 100} className="flex-1" />
                  <span className="text-sm font-medium">{Math.round(result.confianca * 100)}%</span>
                </div>
                {result.confianca < 0.6 && (
                  <p className="text-xs text-yellow-600 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" /> Não tenho certeza absoluta — considere consultar um especialista
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                  <p className="text-xs font-medium text-destructive mb-1">🔍 Problema identificado</p>
                  <p className="text-sm text-foreground">{result.problema}</p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                  <p className="text-xs font-medium text-yellow-700 mb-1">⚠️ Causa provável</p>
                  <p className="text-sm text-foreground">{result.causa}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                  <p className="text-xs font-medium text-green-700 mb-1">✅ Ação recomendada</p>
                  <p className="text-sm text-foreground">{result.acao}</p>
                </div>
              </div>

              <Button variant="outline" onClick={resetFlow} className="w-full">
                Analisar outra planta
              </Button>
            </CardContent>
          </Card>

          <PostDiagnosticAd />
        </>
      )}
    </div>
  );
}

function PostDiagnosticAd() {
  const { data: anuncios } = useAnuncios("prestador");
  const registrarClique = useRegistrarClique();

  if (!anuncios || anuncios.length === 0) return null;

  const ad = anuncios[0];
  const handleClick = () => {
    registrarClique(ad.id);
    window.open(ad.link_whatsapp, "_blank");
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
