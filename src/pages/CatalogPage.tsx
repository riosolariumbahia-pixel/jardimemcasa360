import { useState } from "react";
import { Search, Sun, Droplets, Thermometer, Filter } from "lucide-react";

interface Plant {
  name: string;
  emoji: string;
  category: string;
  light: string;
  water: string;
  difficulty: string;
  description: string;
}

const plants: Plant[] = [
  { name: "Manjericão", emoji: "🌿", category: "Ervas", light: "Sol pleno", water: "Regular", difficulty: "Fácil", description: "Erva aromática essencial para a cozinha." },
  { name: "Hortelã", emoji: "🌱", category: "Ervas", light: "Meia-sombra", water: "Frequente", difficulty: "Fácil", description: "Cresce rápido e é ótima para chás e sucos." },
  { name: "Alecrim", emoji: "🌿", category: "Ervas", light: "Sol pleno", water: "Pouca", difficulty: "Fácil", description: "Resistente e aromático, ideal para iniciantes." },
  { name: "Tomate Cereja", emoji: "🍅", category: "Hortaliças", light: "Sol pleno", water: "Regular", difficulty: "Médio", description: "Produz frutos doces e abundantes em vasos." },
  { name: "Pimenta", emoji: "🌶️", category: "Hortaliças", light: "Sol pleno", water: "Regular", difficulty: "Médio", description: "Ideal para vasos e jardins verticais." },
  { name: "Alface", emoji: "🥬", category: "Hortaliças", light: "Meia-sombra", water: "Frequente", difficulty: "Fácil", description: "Cresce rápido e ocupa pouco espaço." },
  { name: "Suculenta", emoji: "🪴", category: "Ornamentais", light: "Sol pleno", water: "Pouca", difficulty: "Fácil", description: "Quase não precisa de cuidados." },
  { name: "Samambaia", emoji: "🌿", category: "Ornamentais", light: "Sombra", water: "Frequente", difficulty: "Médio", description: "Perfeita para ambientes internos úmidos." },
  { name: "Orquídea", emoji: "🌸", category: "Ornamentais", light: "Meia-sombra", water: "Pouca", difficulty: "Difícil", description: "Elegante e de floração longa." },
  { name: "Cebolinha", emoji: "🌿", category: "Ervas", light: "Sol pleno", water: "Regular", difficulty: "Fácil", description: "Fácil de cultivar e ótima para temperar." },
  { name: "Morango", emoji: "🍓", category: "Frutíferas", light: "Sol pleno", water: "Regular", difficulty: "Médio", description: "Produz frutos em vasos e jardineiras." },
  { name: "Lavanda", emoji: "💜", category: "Ornamentais", light: "Sol pleno", water: "Pouca", difficulty: "Fácil", description: "Perfumada e repele insetos naturalmente." },
];

const categories = ["Todas", "Ervas", "Hortaliças", "Ornamentais", "Frutíferas"];

export default function CatalogPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [selected, setSelected] = useState<Plant | null>(null);

  const filtered = plants.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "Todas" || p.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <h2 className="font-heading text-2xl font-bold text-foreground mb-1">
          Catálogo de Plantas 🌱
        </h2>
        <p className="text-sm text-muted-foreground">
          Descubra plantas ideais para espaços pequenos
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up animate-delay-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar planta..."
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
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95
                ${category === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-fade-in-up animate-delay-200">
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
            <p className="font-semibold text-sm text-foreground">{plant.name}</p>
            <p className="text-xs text-muted-foreground">{plant.category}</p>
            <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold
              ${plant.difficulty === "Fácil" ? "bg-garden-green-pale text-garden-green-dark"
                : plant.difficulty === "Médio" ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"}`}
            >
              {plant.difficulty}
            </span>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="garden-card p-6 animate-fade-in-up">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{selected.emoji}</span>
              <div>
                <h3 className="font-heading text-xl font-bold text-foreground">{selected.name}</h3>
                <p className="text-xs text-muted-foreground">{selected.category}</p>
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-foreground mb-4">{selected.description}</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="text-muted-foreground">{selected.light}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="text-muted-foreground">{selected.water}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Thermometer className="w-4 h-4 text-red-400" />
              <span className="text-muted-foreground">{selected.difficulty}</span>
            </div>
          </div>
          <button className="mt-4 bg-primary text-primary-foreground px-5 py-2 rounded-lg font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all duration-200">
            Adicionar ao Meu Jardim
          </button>
        </div>
      )}
    </div>
  );
}
