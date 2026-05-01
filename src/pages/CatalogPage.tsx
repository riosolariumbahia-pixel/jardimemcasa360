import { useState } from "react";
import { Search, Sun, Droplets, Thermometer, Flower2, TreePine, Leaf, Crown, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

export interface Plant {
  name: string;
  emoji: string;
  category: string;
  light: string;
  water: string;
  difficulty: string;
  description: string;
  fertilizer: string;
  fertilizerFrequency: string;
  fertilizerAmount: string;
}

export const plants: Plant[] = [
  // 🌸 FLORES (33)
  { name: "Petúnia", emoji: "🌸", category: "Flores", light: "Sol pleno", water: "Regular", difficulty: "Fácil", description: "Flores abundantes em cascata, perfeita para jardineiras suspensas. Floresce o ano todo em cores vibrantes.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 15 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Gerânio", emoji: "🌺", category: "Flores", light: "Sol pleno", water: "Regular", difficulty: "Fácil", description: "Clássica planta de janela europeia. Flores vermelhas, rosas ou brancas que duram meses.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 15 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Begônia", emoji: "🌸", category: "Flores", light: "Meia-sombra", water: "Regular", difficulty: "Fácil", description: "Flores delicadas e folhagem decorativa. Ideal para varandas com luz filtrada.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 20 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Violeta", emoji: "💜", category: "Flores", light: "Meia-sombra", water: "Moderada", difficulty: "Fácil", description: "Pequena e encantadora, floresce continuamente em vasinhos compactos na janela.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 30 dias", fertilizerAmount: "½ colher de sopa por vaso" },
  { name: "Orquídea Phalaenopsis", emoji: "🌸", category: "Flores", light: "Meia-sombra", water: "Pouca", difficulty: "Médio", description: "A rainha das flores de interior. Floração elegante que dura até 3 meses.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 15 dias", fertilizerAmount: "½ colher de sopa diluída em 1L de água" },
  { name: "Kalanchoe", emoji: "🌼", category: "Flores", light: "Sol pleno", water: "Pouca", difficulty: "Fácil", description: "Suculenta com flores vibrantes em tons de vermelho, amarelo, laranja e rosa.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 30 dias", fertilizerAmount: "½ colher de sopa por vaso" },
  { name: "Lírio-da-paz", emoji: "🤍", category: "Flores", light: "Sombra", water: "Regular", difficulty: "Fácil", description: "Flores brancas elegantes e purifica o ar. Perfeita para ambientes internos com pouca luz.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 20 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Antúrio", emoji: "❤️", category: "Flores", light: "Meia-sombra", water: "Regular", difficulty: "Médio", description: "Flores cerosas em vermelho intenso. Planta tropical que adora umidade.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 15 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Crisântemo", emoji: "🌼", category: "Flores", light: "Sol pleno", water: "Regular", difficulty: "Fácil", description: "Flores pompom em diversas cores. Floração generosa no outono.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 15 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Lavanda", emoji: "💜", category: "Flores", light: "Sol pleno", water: "Pouca", difficulty: "Fácil", description: "Flores lilases perfumadas que acalmam e repelem insetos naturalmente.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 30 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Rosa Miniatura", emoji: "🌹", category: "Flores", light: "Sol pleno", water: "Regular", difficulty: "Médio", description: "Rosas em miniatura perfeitas para vasos. Floração contínua com poda adequada.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 15 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Rosa", emoji: "🌹", category: "Flores", light: "Sol pleno", water: "Regular", difficulty: "Médio", description: "Flor clássica e perfumada, ideal para vasos grandes e jardins ensolarados com podas frequentes.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 15 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Lírio", emoji: "🌷", category: "Flores", light: "Meia-sombra", water: "Regular", difficulty: "Médio", description: "Flores elegantes e perfumadas que gostam de boa luminosidade e solo levemente úmido.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 20 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Rosa do Deserto", emoji: "🌺", category: "Flores", light: "Sol pleno", water: "Pouca", difficulty: "Médio", description: "Suculenta de tronco engrossado com flores exuberantes, perfeita para locais quentes e muito iluminados.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 30 dias", fertilizerAmount: "½ colher de sopa por vaso" },
  { name: "Margarida", emoji: "🌼", category: "Flores", light: "Sol pleno", water: "Regular", difficulty: "Fácil", description: "Alegre e descomplicada. Flores brancas com centro amarelo que iluminam qualquer espaço.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 20 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Prímula", emoji: "🌸", category: "Flores", light: "Meia-sombra", water: "Regular", difficulty: "Fácil", description: "Flores multicoloridas que florescem no fim do inverno, trazendo cor precoce.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 20 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Azaleia Anã", emoji: "🌺", category: "Flores", light: "Meia-sombra", water: "Regular", difficulty: "Médio", description: "Variedade compacta com flores exuberantes em tons de rosa e vermelho.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 20 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Calanchoê Dobrado", emoji: "🌺", category: "Flores", light: "Sol pleno", water: "Pouca", difficulty: "Fácil", description: "Versão com flores dobradas tipo mini-rosa. Duradoura e de pouca manutenção.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 30 dias", fertilizerAmount: "½ colher de sopa por vaso" },
  { name: "Impatiens", emoji: "🌸", category: "Flores", light: "Sombra", water: "Frequente", difficulty: "Fácil", description: "Conhecida como maria-sem-vergonha. Flores coloridas abundantes mesmo na sombra.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 15 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Boca-de-leão", emoji: "🌷", category: "Flores", light: "Sol pleno", water: "Regular", difficulty: "Fácil", description: "Flores verticais em formato divertido. Ótima para jardineiras de janela.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 15 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Amor-perfeito", emoji: "💜", category: "Flores", light: "Sol pleno", water: "Regular", difficulty: "Fácil", description: "Flores com 'rostinhos' únicos em combinações de cores surpreendentes.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 15 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Gazânia", emoji: "🌼", category: "Flores", light: "Sol pleno", water: "Pouca", difficulty: "Fácil", description: "Flores que abrem ao sol como pequenos sóis. Resistente à seca.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 30 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Hibisco Compacto", emoji: "🌺", category: "Flores", light: "Sol pleno", water: "Regular", difficulty: "Médio", description: "Flores tropicais grandes e vistosas. Variedade anã ideal para vasos.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 15 dias", fertilizerAmount: "2 colheres de sopa por vaso" },
  { name: "Ciclâmen", emoji: "🌸", category: "Flores", light: "Meia-sombra", water: "Moderada", difficulty: "Médio", description: "Flores elegantes que parecem borboletas. Floresce no inverno quando tudo está cinza.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 20 dias", fertilizerAmount: "½ colher de sopa por vaso" },
  { name: "Gerbera", emoji: "🌼", category: "Flores", light: "Sol pleno", water: "Regular", difficulty: "Médio", description: "Margaridas gigantes em cores vibrantes. Uma das flores mais alegres para vasos.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 15 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Torênia", emoji: "💙", category: "Flores", light: "Meia-sombra", water: "Regular", difficulty: "Fácil", description: "Flores bicolores em tons de azul e roxo. Excelente para locais sombreados.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 20 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Cravo-de-defunto", emoji: "🧡", category: "Flores", light: "Sol pleno", water: "Regular", difficulty: "Fácil", description: "Flores alaranjadas aromáticas que repelem pragas da horta naturalmente.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 15 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Ixora Anã", emoji: "🌺", category: "Flores", light: "Sol pleno", water: "Regular", difficulty: "Médio", description: "Buquês naturais de flores vermelhas ou amarelas que atraem beija-flores.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 15 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Manacá-de-cheiro", emoji: "🤍", category: "Flores", light: "Sol pleno", water: "Regular", difficulty: "Médio", description: "Flores que mudam de cor: branco, lilás e roxo na mesma planta. Perfumadíssima.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 15 dias", fertilizerAmount: "2 colheres de sopa por vaso" },
  { name: "Jasmim-do-cabo", emoji: "🤍", category: "Flores", light: "Meia-sombra", water: "Regular", difficulty: "Médio", description: "Flores brancas com perfume intenso e inebriante. Folhas verde-escuras brilhantes.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 15 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Flor-de-maio", emoji: "🌺", category: "Flores", light: "Meia-sombra", water: "Pouca", difficulty: "Fácil", description: "Cacto pendente com flores espetaculares no final do outono. Zero complicação.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 30 dias", fertilizerAmount: "½ colher de sopa diluída em água" },
  { name: "Cravina", emoji: "🌸", category: "Flores", light: "Sol pleno", water: "Moderada", difficulty: "Fácil", description: "Flores pequenas e perfumadas com pétalas recortadas em tons de rosa e branco.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 20 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Dália Anã", emoji: "🌸", category: "Flores", light: "Sol pleno", water: "Regular", difficulty: "Médio", description: "Flores pompom impressionantes em tamanho compacto para vasos e jardineiras.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 15 dias", fertilizerAmount: "1 colher de sopa por vaso" },

  // 🌿 FOLHAGENS (20)
  { name: "Samambaia Boston", emoji: "🌿", category: "Folhagens", light: "Sombra", water: "Frequente", difficulty: "Médio", description: "A rainha das samambaias de interior. Folhas arqueadas e exuberantes que purificam o ar.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 30 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Jiboia", emoji: "🌿", category: "Folhagens", light: "Sombra", water: "Pouca", difficulty: "Fácil", description: "Trepadeira indestrutível com folhas variegadas. Cresce em qualquer canto, até no banheiro.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 30 dias", fertilizerAmount: "½ colher de sopa por vaso" },
  { name: "Costela-de-adão", emoji: "🌿", category: "Folhagens", light: "Meia-sombra", water: "Regular", difficulty: "Fácil", description: "Folhas recortadas icônicas que transformam qualquer ambiente em selva urbana.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 20 dias", fertilizerAmount: "2 colheres de sopa por vaso" },
  { name: "Espada-de-são-jorge", emoji: "🌿", category: "Folhagens", light: "Sombra", water: "Pouca", difficulty: "Fácil", description: "Praticamente imortal. Folhas verticais que purificam o ar e sobrevivem ao esquecimento.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 60 dias", fertilizerAmount: "½ colher de sopa por vaso" },
  { name: "Peperômia", emoji: "🌿", category: "Folhagens", light: "Meia-sombra", water: "Moderada", difficulty: "Fácil", description: "Folhas carnudas e compactas em formatos variados. Perfeita para mesas e estantes.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 30 dias", fertilizerAmount: "½ colher de sopa por vaso" },
  { name: "Filodendro", emoji: "🌿", category: "Folhagens", light: "Meia-sombra", water: "Regular", difficulty: "Fácil", description: "Folhas grandes e brilhantes em formato de coração. Cresce generosamente em vasos.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 20 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Zamioculca", emoji: "🌿", category: "Folhagens", light: "Sombra", water: "Pouca", difficulty: "Fácil", description: "Folhas brilhantes como cera. Sobrevive semanas sem água — perfeita para quem viaja.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 60 dias", fertilizerAmount: "½ colher de sopa por vaso" },
  { name: "Avenca", emoji: "🌿", category: "Folhagens", light: "Sombra", water: "Frequente", difficulty: "Difícil", description: "Folhas delicadíssimas e etéreas. Exigente mas recompensa com beleza incomparável.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 20 dias", fertilizerAmount: "½ colher de sopa diluída em 1L de água" },
  { name: "Maranta", emoji: "🌿", category: "Folhagens", light: "Meia-sombra", water: "Regular", difficulty: "Médio", description: "Folhas pintadas com padrões geométricos fascinantes. Fecha as folhas à noite como se rezasse.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 20 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Calathea", emoji: "🌿", category: "Folhagens", light: "Sombra", water: "Regular", difficulty: "Médio", description: "Folhas com desenhos que parecem pintados à mão. Cada espécie é uma obra de arte.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 20 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Aspargo-pluma", emoji: "🌿", category: "Folhagens", light: "Meia-sombra", water: "Regular", difficulty: "Fácil", description: "Folhagem fina e plumosa que cai em cascata. Linda em vasos suspensos.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 20 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Hera Inglesa", emoji: "🌿", category: "Folhagens", light: "Meia-sombra", water: "Regular", difficulty: "Fácil", description: "Trepadeira clássica com folhas elegantes. Perfeita para prateleiras e macramês.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 20 dias", fertilizerAmount: "½ colher de sopa por vaso" },
  { name: "Singônio", emoji: "🌿", category: "Folhagens", light: "Meia-sombra", water: "Regular", difficulty: "Fácil", description: "Folhas em forma de flecha em tons de verde, rosa ou branco. Versátil e fácil.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 20 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Clorofito", emoji: "🌿", category: "Folhagens", light: "Meia-sombra", water: "Regular", difficulty: "Fácil", description: "Planta-aranha com folhas listradas. Produz mudas pendentes que parecem filhotes.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 20 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Dracena Marginata", emoji: "🌿", category: "Folhagens", light: "Meia-sombra", water: "Pouca", difficulty: "Fácil", description: "Tronco esguio com tufo de folhas no topo. Visual escultural e pouca manutenção.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 30 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Ficus Lyrata", emoji: "🌿", category: "Folhagens", light: "Meia-sombra", water: "Regular", difficulty: "Médio", description: "Folhas gigantes em forma de violino. A planta mais desejada para decoração.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 15 dias", fertilizerAmount: "2 colheres de sopa por vaso" },
  { name: "Renda Portuguesa", emoji: "🌿", category: "Folhagens", light: "Sombra", water: "Frequente", difficulty: "Médio", description: "Samambaia com folhas finamente recortadas como renda. Elegância pura.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 30 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Calateia Orbifolia", emoji: "🌿", category: "Folhagens", light: "Sombra", water: "Regular", difficulty: "Médio", description: "Folhas redondas enormes com listras prateadas. Impacto visual impressionante.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 20 dias", fertilizerAmount: "1 colher de sopa por vaso" },
  { name: "Pilea Peperomioides", emoji: "🌿", category: "Folhagens", light: "Meia-sombra", water: "Moderada", difficulty: "Fácil", description: "Planta-moeda-chinesa com folhas redondas adoráveis. Produz muitos filhotes para presentear.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 30 dias", fertilizerAmount: "½ colher de sopa por vaso" },
  { name: "Chifre-de-veado", emoji: "🌿", category: "Folhagens", light: "Meia-sombra", water: "Moderada", difficulty: "Médio", description: "Samambaia epífita com folhas que parecem chifres. Fixada na parede vira obra de arte viva.", fertilizer: "Adubei NPK 5-15-5", fertilizerFrequency: "A cada 30 dias", fertilizerAmount: "½ colher de sopa diluída em 1L de água" },
];

const categories = ["Todas", "Flores", "Folhagens"];

export default function CatalogPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [selected, setSelected] = useState<Plant | null>(null);
  const { isPremium } = useSubscription();
  const navigate = useNavigate();

  const filtered = plants.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "Todas" || p.category === category;
    return matchSearch && matchCat;
  });

  const flowerCount = plants.filter((p) => p.category === "Flores").length;
  const foliageCount = plants.filter((p) => p.category === "Folhagens").length;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <h2 className="font-heading text-2xl font-bold text-foreground mb-1">
          Catálogo de Plantas 🌱
        </h2>
        <p className="text-sm text-muted-foreground">
          {flowerCount} flores para jarros e jardineiras · {foliageCount} folhagens para adornar seu lar
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up animate-delay-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-card border-2 border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95 flex items-center gap-1.5
                ${category === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
                }`}
            >
              {cat === "Flores" && <Flower2 className="w-3.5 h-3.5" />}
              {cat === "Folhagens" && <TreePine className="w-3.5 h-3.5" />}
              {cat}
              <span className="ml-1 opacity-70">
                ({cat === "Todas" ? plants.length : cat === "Flores" ? flowerCount : foliageCount})
              </span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground animate-fade-in-up animate-delay-100">
        {filtered.length} {filtered.length === 1 ? "planta encontrada" : "plantas encontradas"}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 animate-fade-in-up animate-delay-200">
        {filtered.map((plant) => (
          <div
            key={plant.name}
            onClick={() => setSelected(plant)}
            className={`garden-card p-4 text-center cursor-pointer border-2 transition-all duration-200
              ${selected?.name === plant.name
                ? "!border-primary bg-garden-green-mist"
                : "border-transparent hover:border-garden-green-light"
              }`}
          >
            <div className="text-3xl mb-2">{plant.emoji}</div>
            <p className="font-semibold text-sm text-foreground leading-tight">{plant.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{plant.category}</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold
                ${plant.difficulty === "Fácil" ? "bg-garden-green-pale text-garden-green-dark"
                  : plant.difficulty === "Médio" ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"}`}
              >
                {plant.difficulty}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="garden-card p-6 animate-fade-in-up sticky bottom-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{selected.emoji}</span>
              <div>
                <h3 className="font-heading text-xl font-bold text-foreground">{selected.name}</h3>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1
                  ${selected.category === "Flores" ? "bg-pink-100 text-pink-700" : "bg-garden-green-pale text-garden-green-dark"}`}>
                  {selected.category}
                </span>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setSelected(null); }}
              className="text-muted-foreground hover:text-foreground text-sm p-1"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-foreground mb-4 leading-relaxed">{selected.description}</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Sun className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-muted-foreground text-xs">{selected.light}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Droplets className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-muted-foreground text-xs">{selected.water}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Thermometer className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-muted-foreground text-xs">{selected.difficulty}</span>
            </div>
          </div>

          {/* Fertilization info */}
          <div className="p-4 rounded-lg bg-garden-green-mist border border-garden-green-light mb-4">
            <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-primary" /> Adubação Recomendada
            </h4>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p>🧪 <strong className="text-foreground">Adubo:</strong> {selected.fertilizer} (orgânico)</p>
              <p>📅 <strong className="text-foreground">Frequência:</strong> {selected.fertilizerFrequency}</p>
              <p>📏 <strong className="text-foreground">Quantidade:</strong> {selected.fertilizerAmount}</p>
            </div>
            <div className="mt-3 p-2 rounded-md bg-primary/10 border border-primary/20">
              <p className="text-xs text-foreground font-semibold">
                💡 Dica: Use o adubo orgânico <strong>Adubei NPK 5-15-5</strong> para melhor floração e crescimento saudável!
              </p>
            </div>
          </div>

          <button className="bg-primary text-primary-foreground px-5 py-2 rounded-lg font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all duration-200">
            Adicionar ao Meu Jardim
          </button>
        </div>
      )}
    </div>
  );
}
