import { useState } from "react";
import { Droplets, Sun, Trash2, Plus, Heart } from "lucide-react";

interface GardenPlant {
  id: number;
  name: string;
  emoji: string;
  health: number;
  lastWatered: string;
  location: string;
}

const initialPlants: GardenPlant[] = [
  { id: 1, name: "Manjericão", emoji: "🌿", health: 92, lastWatered: "Hoje", location: "Varanda" },
  { id: 2, name: "Tomate Cereja", emoji: "🍅", health: 65, lastWatered: "Há 2 dias", location: "Janela" },
  { id: 3, name: "Hortelã", emoji: "🌱", health: 88, lastWatered: "Ontem", location: "Cozinha" },
  { id: 4, name: "Alecrim", emoji: "🌿", health: 95, lastWatered: "Hoje", location: "Varanda" },
  { id: 5, name: "Suculenta", emoji: "🪴", health: 97, lastWatered: "Há 5 dias", location: "Sala" },
  { id: 6, name: "Morango", emoji: "🍓", health: 72, lastWatered: "Há 1 dia", location: "Varanda" },
];

export default function MyGardenPage() {
  const [plants, setPlants] = useState(initialPlants);

  const waterPlant = (id: number) => {
    setPlants((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, health: Math.min(100, p.health + 10), lastWatered: "Agora" } : p
      )
    );
  };

  const removePlant = (id: number) => {
    setPlants((prev) => prev.filter((p) => p.id !== id));
  };

  const healthColor = (h: number) =>
    h > 80 ? "hsl(var(--garden-green))" : h > 50 ? "hsl(40, 80%, 50%)" : "hsl(0, 70%, 55%)";

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Meu Jardim 🌳</h2>
          <p className="text-sm text-muted-foreground">{plants.length} plantas no seu jardim</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all duration-200 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Adicionar</span>
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 animate-fade-in-up animate-delay-100">
        <div className="garden-card p-4 text-center">
          <Heart className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">
            {Math.round(plants.reduce((a, p) => a + p.health, 0) / plants.length)}%
          </p>
          <p className="text-xs text-muted-foreground">Saúde média</p>
        </div>
        <div className="garden-card p-4 text-center">
          <Droplets className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">
            {plants.filter((p) => p.health < 80).length}
          </p>
          <p className="text-xs text-muted-foreground">Precisam de água</p>
        </div>
        <div className="garden-card p-4 text-center">
          <Sun className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">
            {new Set(plants.map((p) => p.location)).size}
          </p>
          <p className="text-xs text-muted-foreground">Locais</p>
        </div>
      </div>

      {/* Plant list */}
      <div className="space-y-3 animate-fade-in-up animate-delay-200">
        {plants.map((plant) => (
          <div key={plant.id} className="garden-card p-4 flex items-center gap-4">
            <span className="text-3xl">{plant.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-foreground">{plant.name}</p>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                  {plant.location}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${plant.health}%`, backgroundColor: healthColor(plant.health) }}
                  />
                </div>
                <span className="text-xs font-bold text-muted-foreground w-10 text-right tabular-nums">
                  {plant.health}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">💧 {plant.lastWatered}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => waterPlant(plant.id)}
                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95 transition-all duration-200"
                title="Regar"
              >
                <Droplets className="w-4 h-4" />
              </button>
              <button
                onClick={() => removePlant(plant.id)}
                className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 active:scale-95 transition-all duration-200"
                title="Remover"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
