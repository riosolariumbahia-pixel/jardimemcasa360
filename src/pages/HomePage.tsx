import { Droplets, Sun, Leaf, TrendingUp, Plus, Sprout } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGardenPlants } from "@/hooks/useGardenPlants";
import heroImage from "@/assets/hero-garden.jpg";

const quickStats = [
  { label: "Flores no catálogo", value: "30", icon: Leaf, color: "bg-pink-100 text-pink-700" },
  { label: "Folhagens", value: "20", icon: Droplets, color: "bg-garden-green-pale text-garden-green-dark" },
  { label: "Horas de sol", value: "6h", icon: Sun, color: "bg-amber-100 text-amber-700" },
  { label: "Saúde geral", value: "87%", icon: TrendingUp, color: "bg-garden-green-pale text-garden-green-dark" },
];

const tips = [
  "Regue suas plantas pela manhã para melhor absorção.",
  "Use cascas de ovos trituradas como adubo natural.",
  "Gire os vasos a cada 2 semanas para crescimento uniforme.",
];

export default function HomePage() {
  const navigate = useNavigate();
  const { plants: gardenPlants } = useGardenPlants();

  const dynamicStats = gardenPlants.length > 0
    ? [
        { label: "Plantas no jardim", value: String(gardenPlants.length), icon: Leaf, color: "bg-pink-100 text-pink-700" },
        { label: "Precisam de água", value: String(gardenPlants.filter(p => p.needs_water).length), icon: Droplets, color: "bg-blue-100 text-blue-700" },
        { label: "Precisam de adubo", value: String(gardenPlants.filter(p => p.needs_fertilizer).length), icon: Sun, color: "bg-amber-100 text-amber-700" },
        { label: "Saúde geral", value: `${Math.round(gardenPlants.reduce((a, p) => a + (p.health ?? 80), 0) / gardenPlants.length)}%`, icon: TrendingUp, color: "bg-garden-green-pale text-garden-green-dark" },
      ]
    : quickStats;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <section className="animate-fade-in-up relative rounded-2xl overflow-hidden">
        <img src={heroImage} alt="Jardim em varanda" className="w-full h-56 md:h-72 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 to-transparent flex items-center">
          <div className="p-8 max-w-md">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-card mb-2">Bem-vindo ao seu Jardim! 🌿</h2>
            <p className="text-card/80 text-sm md:text-base mb-4">Cuide do seu jardim urbano com facilidade.</p>
            <button onClick={() => navigate("/meu-jardim")} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all duration-200 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Adicionar Planta
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up animate-delay-100">
        {dynamicStats.map((stat) => (
          <div key={stat.label} className="garden-card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="animate-fade-in-up animate-delay-200">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Suas Plantas Recentes</h3>
        {gardenPlants.length === 0 ? (
          <div className="garden-card p-8 text-center">
            <span className="text-4xl block mb-3">🌱</span>
            <p className="text-sm text-muted-foreground mb-3">Nenhuma planta no seu jardim ainda.</p>
            <button onClick={() => navigate("/meu-jardim")} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Ir para Meu Jardim
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {gardenPlants.slice(0, 8).map((plant) => (
              <div key={plant.id} className="garden-card p-4 cursor-pointer" onClick={() => navigate("/meu-jardim")}>
                <div className="text-3xl mb-2">{plant.emoji}</div>
                <p className="font-semibold text-foreground">{plant.name}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  {plant.needs_fertilizer ? "⚠️ Precisa de adubo" : (plant.health ?? 80) >= 80 ? "Saudável" : "Precisa de água"}
                </p>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{
                    width: `${plant.health ?? 80}%`,
                    backgroundColor: (plant.health ?? 80) > 80 ? "hsl(var(--garden-green))" : (plant.health ?? 80) > 50 ? "hsl(40, 80%, 50%)" : "hsl(0, 70%, 55%)",
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="animate-fade-in-up animate-delay-300">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Dicas do Dia 💡</h3>
        <div className="space-y-3">
          {tips.map((tip, i) => (
            <div key={i} className="garden-card p-4 flex items-start gap-3">
              <Sprout className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">{tip}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
