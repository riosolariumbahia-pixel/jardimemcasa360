import { Droplets, Sun, Leaf, TrendingUp, Plus, Sprout } from "lucide-react";
import heroImage from "@/assets/hero-garden.jpg";

const quickStats = [
  { label: "Flores no catálogo", value: "30", icon: Leaf, color: "bg-pink-100 text-pink-700" },
  { label: "Folhagens", value: "20", icon: Droplets, color: "bg-garden-green-pale text-garden-green-dark" },
  { label: "Horas de sol", value: "6h", icon: Sun, color: "bg-amber-100 text-amber-700" },
  { label: "Saúde geral", value: "87%", icon: TrendingUp, color: "bg-garden-green-pale text-garden-green-dark" },
];

const recentPlants = [
  { name: "Petúnia", status: "Florescendo", emoji: "🌸", health: 95 },
  { name: "Samambaia Boston", status: "Saudável", emoji: "🌿", health: 88 },
  { name: "Orquídea", status: "Precisa de água", emoji: "🌸", health: 62 },
  { name: "Jiboia", status: "Saudável", emoji: "🌿", health: 93 },
  { name: "Violeta", status: "Florescendo", emoji: "💜", health: 90 },
  { name: "Costela-de-adão", status: "Saudável", emoji: "🌿", health: 85 },
];

const tips = [
  "Regue suas plantas pela manhã para melhor absorção.",
  "Use cascas de ovos trituradas como adubo natural.",
  "Gire os vasos a cada 2 semanas para crescimento uniforme.",
];

export default function HomePage() {
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Hero */}
      <section className="animate-fade-in-up relative rounded-2xl overflow-hidden">
        <img
          src={heroImage}
          alt="Jardim em varanda com vasos de plantas"
          className="w-full h-56 md:h-72 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 to-transparent flex items-center">
          <div className="p-8 max-w-md">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-card mb-2">
              Bem-vindo ao seu Jardim! 🌿
            </h2>
            <p className="text-card/80 text-sm md:text-base mb-4">
              Cuide do seu jardim urbano com facilidade, mesmo em pequenos espaços.
            </p>
            <button className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all duration-200 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Planta
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up animate-delay-100">
        {quickStats.map((stat) => (
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

      {/* Recent plants */}
      <section className="animate-fade-in-up animate-delay-200">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">
          Suas Plantas Recentes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentPlants.map((plant) => (
            <div key={plant.name} className="garden-card p-4 cursor-pointer">
              <div className="text-3xl mb-2">{plant.emoji}</div>
              <p className="font-semibold text-foreground">{plant.name}</p>
              <p className="text-xs text-muted-foreground mb-3">{plant.status}</p>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${plant.health}%`,
                    backgroundColor: plant.health > 80
                      ? "hsl(var(--garden-green))"
                      : plant.health > 50
                        ? "hsl(40, 80%, 50%)"
                        : "hsl(0, 70%, 55%)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tips */}
      <section className="animate-fade-in-up animate-delay-300">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">
          Dicas do Dia 💡
        </h3>
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
