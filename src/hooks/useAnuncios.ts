import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Anunciante {
  id: string;
  nome: string;
  tipo: "fornecedor" | "prestador";
  cidade: string;
  descricao: string;
  whatsapp: string;
  plano: "free" | "premium";
}

export interface Anuncio {
  id: string;
  anunciante_id: string;
  titulo: string;
  descricao: string;
  imagem_url: string | null;
  link_whatsapp: string;
  anunciantes: Anunciante;
}

export function useAnuncios(tipoFilter?: "fornecedor" | "prestador") {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["anuncios", tipoFilter],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("anuncios")
        .select("*, anunciantes!inner(*)")
        .eq("ativo", true)
        .eq("anunciantes.ativo", true)
        .order("criado_em", { ascending: false });

      if (tipoFilter) {
        query = query.eq("anunciantes.tipo", tipoFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Sort premium first
      const sorted = (data || []).sort((a: any, b: any) => {
        const aP = a.anunciantes?.plano === "premium" ? 0 : 1;
        const bP = b.anunciantes?.plano === "premium" ? 0 : 1;
        return aP - bP;
      });

      return sorted as unknown as Anuncio[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRegistrarClique() {
  const { user } = useAuth();

  const registrar = async (anuncioId: string) => {
    if (!user) return;
    await supabase.from("cliques_anuncios").insert({
      anuncio_id: anuncioId,
      usuario_id: user.id,
    });
  };

  return registrar;
}
