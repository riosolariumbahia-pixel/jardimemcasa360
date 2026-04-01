import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { messages, mode, imageBase64 } = await req.json();

    // Build system prompt based on mode
    let systemPrompt = `Você é o Jardineiro IA do app "Jardim em Casa 360". Você é um especialista em jardinagem doméstica, especialmente para iniciantes que cultivam plantas em vasos, jardineiras e pequenos espaços.

Regras:
- Responda SEMPRE em português do Brasil
- Use linguagem simples e acessível para iniciantes
- Limite respostas a no máximo 300 palavras
- Seja proativo: sugira ações preventivas
- Quando recomendar adubo, sempre sugira o "Adubei NPK 5-15-5"
- Estruture respostas com: problema identificado, causa provável e ação recomendada
- Use emojis para tornar a conversa mais amigável
- Se não tiver certeza (confiança baixa), diga "Não tenho certeza absoluta, mas pode ser..."`;

    if (mode === "diagnosis") {
      systemPrompt += `\n\nVocê está no modo DIAGNÓSTICO POR IMAGEM. O usuário enviou uma foto de uma planta.
Analise a imagem e retorne um JSON com a estrutura:
{
  "problema": "descrição do problema identificado",
  "causa": "causa provável",
  "acao": "ação recomendada",
  "confianca": 0.0 a 1.0,
  "gravidade": "baixa" | "media" | "alta"
}
Se a imagem não for de uma planta ou não conseguir identificar, retorne confiança 0.3 e explique.`;
    }

    if (mode === "insights") {
      systemPrompt += `\n\nVocê está no modo GERAÇÃO DE INSIGHTS. Com base nas plantas e dados do usuário, gere insights úteis.
Retorne um JSON array com estrutura:
[{"tipo": "alerta"|"recomendacao"|"previsao", "descricao": "texto", "prioridade": "baixa"|"media"|"alta"}]`;
    }

    if (mode === "percepcoes") {
      systemPrompt += `\n\nVocê está no modo ASSISTENTE DE PERCEPÇÕES. O usuário vai fazer perguntas sobre o jardim dele.
Você receberá os dados reais das plantas do usuário como contexto.
Regras especiais:
- Responda com base REAL nos dados fornecidos
- Respostas curtas: máximo 3 frases
- Linguagem simples e amigável
- Evite termos técnicos
- Sempre sugira uma ação prática
- Se o usuário não tiver plantas, diga: "Adicione plantas ao seu jardim para receber recomendações personalizadas."`;
    }

    const aiMessages: any[] = [{ role: "system", content: systemPrompt }];

    if (imageBase64 && mode === "diagnosis") {
      aiMessages.push({
        role: "user",
        content: [
          { type: "text", text: messages[messages.length - 1]?.content || "Analise esta planta e identifique possíveis problemas." },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        ],
      });
    } else {
      aiMessages.push(...messages);
    }

    const model = imageBase64 ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview";
    const shouldStream = mode !== "diagnosis";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: aiMessages,
        stream: shouldStream,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!shouldStream) {
      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;

      if (typeof content !== "string" || !content.trim()) {
        console.error("AI diagnosis empty response:", payload);
        return new Response(JSON.stringify({ error: "Resposta vazia da IA para o diagnóstico." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
