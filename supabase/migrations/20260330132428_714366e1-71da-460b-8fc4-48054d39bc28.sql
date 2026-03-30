
-- Enum types
CREATE TYPE public.tipo_anunciante AS ENUM ('fornecedor', 'prestador');
CREATE TYPE public.plano_anunciante AS ENUM ('free', 'premium');

-- Tabela anunciantes
CREATE TABLE public.anunciantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL CHECK (char_length(nome) <= 150),
  tipo tipo_anunciante NOT NULL,
  cidade TEXT NOT NULL CHECK (char_length(cidade) <= 100),
  descricao TEXT NOT NULL,
  whatsapp TEXT NOT NULL CHECK (char_length(whatsapp) <= 20),
  plano plano_anunciante NOT NULL DEFAULT 'free',
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.anunciantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active advertisers"
  ON public.anunciantes FOR SELECT TO authenticated
  USING (ativo = true);

-- Tabela anuncios
CREATE TABLE public.anuncios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anunciante_id UUID NOT NULL REFERENCES public.anunciantes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL CHECK (char_length(titulo) <= 150),
  descricao TEXT NOT NULL,
  imagem_url TEXT,
  link_whatsapp TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.anuncios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active ads"
  ON public.anuncios FOR SELECT TO authenticated
  USING (ativo = true);

-- Tabela cliques_anuncios
CREATE TABLE public.cliques_anuncios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anuncio_id UUID NOT NULL REFERENCES public.anuncios(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cliques_anuncios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own clicks"
  ON public.cliques_anuncios FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can view own clicks"
  ON public.cliques_anuncios FOR SELECT TO authenticated
  USING (auth.uid() = usuario_id);

-- Indexes
CREATE INDEX idx_anuncios_anunciante ON public.anuncios(anunciante_id);
CREATE INDEX idx_anuncios_ativo ON public.anuncios(ativo);
CREATE INDEX idx_anunciantes_cidade ON public.anunciantes(cidade);
CREATE INDEX idx_anunciantes_plano ON public.anunciantes(plano);
CREATE INDEX idx_cliques_anuncio ON public.cliques_anuncios(anuncio_id);
