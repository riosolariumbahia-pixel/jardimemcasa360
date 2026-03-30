import { useState, useRef } from "react";
import { Camera, Upload, Loader2, AlertTriangle, CheckCircle, HelpCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DiagnosisResult {
  problema: string;
  causa: string;
  acao: string;
  confianca: number;
  gravidade: "baixa" | "media" | "alta";
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

export default function DiagnosisAIPage() {
  const { user } = useAuth();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl.split(",")[1]);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!imageBase64) return;
    setIsAnalyzing(true);
    setResult(null);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          mode: "diagnosis",
          imageBase64,
          messages: [{ role: "user", content: "Analise esta planta e identifique possíveis problemas de saúde." }],
        }),
      });

      if (!resp.ok) throw new Error("Erro no diagnóstico");

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

      // Try to parse JSON from response
      const jsonMatch = full.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as DiagnosisResult;
        setResult(parsed);

        // Save to DB
        if (user) {
          supabase.from("analises_imagem" as any).insert({
            user_id: user.id,
            image_url: "local-upload",
            ai_result: parsed,
            confidence: parsed.confianca,
          }).then(() => {});
        }
      } else {
        // AI returned text, not JSON - show as generic result
        setResult({
          problema: full.slice(0, 200),
          causa: "Análise baseada na imagem enviada",
          acao: full.slice(200) || "Consulte um especialista para confirmação",
          confianca: 0.5,
          gravidade: "media",
        });
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao analisar imagem");
    } finally {
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
        <p className="text-sm text-muted-foreground">Tire uma foto da sua planta e a IA vai identificar possíveis problemas</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="Planta" className="w-full max-h-80 object-contain rounded-xl border border-border" />
              <button
                onClick={() => { setImagePreview(null); setImageBase64(null); setResult(null); }}
                className="absolute top-2 right-2 bg-background/80 backdrop-blur rounded-full px-3 py-1 text-xs"
              >
                Trocar foto
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">Toque para tirar foto ou selecionar imagem</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WEBP</p>
            </div>
          )}

          {imagePreview && !result && (
            <Button onClick={analyze} disabled={isAnalyzing} className="w-full" size="lg">
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analisando com IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> Analisar Planta
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card className="animate-fade-in-up">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-foreground">Resultado do Diagnóstico</h2>
              {(() => {
                const g = gravityConfig[result.gravidade] || gravityConfig.media;
                const Icon = g.icon;
                return (
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${g.bg} ${g.color}`}>
                    <Icon className="w-3 h-3" /> {g.label}
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

            <Button variant="outline" onClick={() => { setResult(null); setImagePreview(null); setImageBase64(null); }} className="w-full">
              Analisar outra planta
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
