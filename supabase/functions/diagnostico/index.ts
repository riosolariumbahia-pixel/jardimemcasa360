import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `Você é um especialista em plantas domésticas.

Analise a imagem enviada e responda de forma simples e direta.

Retorne SOMENTE um JSON válido com esta estrutura:
{
  "diagnostico": "problema identificado e causa provável em uma frase curta",
  "recomendacao": "o que fazer em linguagem simples, incluindo condicionador de solo"
}

Regras:
- Linguagem simples (iniciante)
- Resposta curta
- Evitar termos técnicos
- Sempre incluir sugestão com condicionador de solo`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const body = await req.json().catch(() => null);
    const imagem = typeof body?.imagem === "string" ? body.imagem.trim() : "";

    if (!imagem) {
      return jsonResponse({ error: "Campo imagem é obrigatório." }, 400);
    }

    const imageUrl = normalizeImageInput(imagem);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: false,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analise esta planta e responda com diagnóstico e recomendação." },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("diagnostico gateway error:", response.status, errorText);

      if (response.status === 429) {
        return jsonResponse({ error: "Limite de requisições excedido. Tente novamente." }, 429);
      }

      return jsonResponse({ error: "Erro ao analisar a imagem." }, 500);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;

    if (typeof content !== "string" || !content.trim()) {
      console.error("diagnostico empty response:", payload);
      return jsonResponse({ error: "Resposta vazia da IA." }, 502);
    }

    return jsonResponse(parseDiagnosisResponse(content));
  } catch (error) {
    console.error("diagnostico error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Erro desconhecido" }, 500);
  }
});

function normalizeImageInput(imagem: string) {
  const trimmed = imagem.trim();

  if (trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  const cleaned = trimmed.replace(/\s/g, "");

  if (!cleaned || !/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
    throw new Error("Formato da imagem inválido.");
  }

  return `data:image/jpeg;base64,${cleaned}`;
}

function parseDiagnosisResponse(content: string) {
  try {
    const cleaned = content.replace(/```json/gi, "").replace(/```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match?.[0] ?? cleaned);

    return {
      diagnostico: String(parsed.diagnostico || parsed.problema || "Não foi possível identificar o problema.").trim(),
      recomendacao: String(parsed.recomendacao || parsed.acao || parsed.melhoria_solo || "Tente novamente com uma foto mais nítida e use condicionador de solo.").trim(),
    };
  } catch (error) {
    console.error("diagnostico parse error:", error, content);

    return {
      diagnostico: content.trim().slice(0, 220) || "Não foi possível identificar o problema.",
      recomendacao: "Tente novamente com uma foto mais nítida e use condicionador de solo.",
    };
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}