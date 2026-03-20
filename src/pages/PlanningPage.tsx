import { useState } from "react";
import { Sun, Droplets, Ruler, MapPin, Check } from "lucide-react";

const spaceOptions = [
  { label: "Varanda pequena", value: "varanda", icon: "🏠" },
  { label: "Janela", value: "janela", icon: "🪟" },
  { label: "Cozinha", value: "cozinha", icon: "🍳" },
  { label: "Sala", value: "sala", icon: "🛋️" },
];

const lightOptions = [
  { label: "Sol pleno (6h+)", value: "full" },
  { label: "Meia-sombra (3-6h)", value: "partial" },
  { label: "Sombra (< 3h)", value: "shade" },
];

interface Recommendation {
  name: string;
  emoji: string;
  reason: string;
}

const recommendations: Record<string, Recommendation[]> = {
  "varanda-full": [
    { name: "Tomate Cereja", emoji: "🍅", reason: "Produz bem em varandas com sol" },
    { name: "Manjericão", emoji: "🌿", reason: "Aromático e compacto" },
    { name: "Pimenta", emoji: "🌶️", reason: "Ideal para vasos pequenos" },
  ],
  "varanda-partial": [
    { name: "Hortelã", emoji: "🌱", reason: "Cresce bem em meia-sombra" },
    { name: "Cebolinha", emoji: "🌿", reason: "Fácil e produtiva" },
    { name: "Morango", emoji: "🍓", reason: "Adapta-se a luz parcial" },
  ],
  "janela-full": [
    { name: "Suculenta", emoji: "🪴", reason: "Perfeita para peitoris" },
    { name: "Alecrim", emoji: "🌿", reason: "Adora sol e pouca água" },
    { name: "Lavanda", emoji: "💜", reason: "Compacta e perfumada" },
  ],
  "cozinha-partial": [
    { name: "Manjericão", emoji: "🌿", reason: "Na mão para cozinhar" },
    { name: "Cebolinha", emoji: "🌿", reason: "Tempero fresco sempre" },
    { name: "Hortelã", emoji: "🌱", reason: "Cresce até na sombra" },
  ],
};

export default function PlanningPage() {
  const [space, setSpace] = useState("");
  const [light, setLight] = useState("");

  const key = `${space}-${light === "full" ? "full" : light === "partial" ? "partial" : "partial"}`;
  const recs = recommendations[key] || recommendations["varanda-full"];
  const showResults = space && light;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <h2 className="font-heading text-2xl font-bold text-foreground">Planejamento 📐</h2>
        <p className="text-sm text-muted-foreground">Monte seu jardim ideal para o seu espaço</p>
      </div>

      {/* Step 1 */}
      <div className="garden-card p-5 animate-fade-in-up animate-delay-100">
        <h3 className="font-heading text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" /> Onde será o jardim?
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {spaceOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSpace(opt.value)}
              className={`garden-card p-4 text-center border-2 transition-all duration-200 active:scale-95
                ${space === opt.value ? "!border-primary bg-garden-green-mist" : "border-transparent"}`}
            >
              <span className="text-2xl block mb-1">{opt.icon}</span>
              <span className="text-xs font-semibold text-foreground">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 */}
      <div className="garden-card p-5 animate-fade-in-up animate-delay-200">
        <h3 className="font-heading text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-500" /> Quanta luz solar o espaço recebe?
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          {lightOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setLight(opt.value)}
              className={`flex-1 garden-card p-3 text-center border-2 transition-all duration-200 active:scale-95
                ${light === opt.value ? "!border-primary bg-garden-green-mist" : "border-transparent"}`}
            >
              <span className="text-sm font-semibold text-foreground">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {showResults && (
        <div className="garden-card p-5 animate-fade-in-up">
          <h3 className="font-heading text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" /> Plantas recomendadas
          </h3>
          <div className="space-y-3">
            {recs.map((rec) => (
              <div key={rec.name} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <span className="text-3xl">{rec.emoji}</span>
                <div>
                  <p className="font-semibold text-sm text-foreground">{rec.name}</p>
                  <p className="text-xs text-muted-foreground">{rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
