import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAuthedUser, hasFullAccess, type AccessEnv } from "../_shared/access.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Modos que exigem acesso Premium (assinatura ativa real OU trial vigente).
const PREMIUM_MODES = new Set(["assistant", "insights", "percepcoes"]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json();
    const { messages, mode, imageBase64, imageUrl } = body;
    const envInput = body?.environment;
    const env: AccessEnv = envInput === "live" ? "live" : "sandbox";

    // ==== Validação server-side de acesso ====
    // Auth obrigatória para qualquer chamada.
    const user = await getAuthedUser(req);
    if (!user) {
      return new Response(
        JSON.stringify({ error: "auth_required", message: "Faça login para continuar." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Modos Premium: bloquear no servidor mesmo se o frontend deixar passar.
    if (PREMIUM_MODES.has(mode)) {
      const ok = await hasFullAccess(user.id, env);
      if (!ok) {
        return new Response(
          JSON.stringify({
            error: "premium_required",
            message: "Este recurso é exclusivo do plano Premium. Assine para continuar.",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }
    // ==== Fim da validação ====


    let systemPrompt = `Você é um especialista em plantas domésticas.

Regras:
- Responda SEMPRE em português do Brasil
- Linguagem simples (iniciante)
- Resposta curta e direta
- Evite termos técnicos
- Sempre inclua sugestão de melhoria com condicionador de solo
- Quando recomendar adubo, sugira "Adubei NPK 5-15-5"
- Se não tiver certeza, diga "Não tenho certeza absoluta, mas pode ser..."`;

    if (mode === "diagnosis") {
      systemPrompt += `

Você está no modo DIAGNÓSTICO POR IMAGEM. Analise a imagem enviada e responda de forma simples e direta.

Retorne um JSON com esta estrutura EXATA:
{
  "problema": "descrição simples do problema identificado",
  "causa": "causa provável em linguagem simples",
  "gravidade": "baixa" | "media" | "alta",
  "acao": "passo a passo simples do que fazer",
  "melhoria_solo": "sugestão de melhoria do solo ou adubação",
  "confianca": 0.0 a 1.0
}

Se a imagem não for de uma planta, retorne confiança 0.3 e explique.`;
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

    // Support both imageUrl (new, mobile-friendly) and imageBase64 (legacy)
    const imageSource = imageUrl || (imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null);

    if (imageSource && mode === "diagnosis") {
      aiMessages.push({
        role: "user",
        content: [
          { type: "text", text: messages[messages.length - 1]?.content || "Analise esta planta e identifique possíveis problemas." },
          { type: "image_url", image_url: { url: imageSource } },
        ],
      });
    } else {
      aiMessages.push(...messages);
    }

    const model = (imageSource && mode === "diagnosis") ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview";
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
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!shouldStream) {
      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) {
        console.error("AI diagnosis empty response:", payload);
        return new Response(JSON.stringify({ error: "Resposta vazia da IA." }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
