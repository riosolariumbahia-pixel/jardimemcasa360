import { useState } from "react";
import { Droplets, Sun, Trash2, Plus, Heart, Leaf, X, Search, ShoppingCart, AlertTriangle, Scissors } from "lucide-react";
import { plants as catalogPlants, Plant as CatalogPlant } from "./CatalogPage";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface GardenPlant {
  id: number;
  name: string;
  emoji: string;
  health: number;
  lastWatered: string;
  lastFertilized: string;
  lastPruned: string;
  location: string;
  fertilizerFrequency: string;
  fertilizerAmount: string;
  needsFertilizer: boolean;
  needsWater: boolean;
  needsPruning: boolean;
}

export type { GardenPlant };

export default function MyGardenPage() {
  const [plants, setPlants] = useLocalStorage<GardenPlant[]>("garden-plants", []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [showFertilizerInfo, setShowFertilizerInfo] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const addPlant = (catalogPlant: CatalogPlant) => {
    const newPlant: GardenPlant = {
      id: Date.now(),
      name: catalogPlant.name,
      emoji: catalogPlant.emoji,
      health: 80,
      lastWatered: "Nunca",
      lastFertilized: "Nunca",
      lastPruned: "Nunca",
      location: "Não definido",
      fertilizerFrequency: catalogPlant.fertilizerFrequency,
      fertilizerAmount: catalogPlant.fertilizerAmount,
      needsFertilizer: true,
      needsWater: true,
      needsPruning: false,
    };
    setPlants((prev) => [...prev, newPlant]);
    setShowAddModal(false);
    setAddSearch("");
  };

  const waterPlant = (id: number) => {
    setPlants((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, health: Math.min(100, p.health + 10), lastWatered: "Agora", needsWater: false } : p
      )
    );
  };

  const fertilizePlant = (id: number) => {
    setPlants((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, health: Math.min(100, p.health + 5), lastFertilized: "Hoje", needsFertilizer: false } : p
      )
    );
  };

  const prunePlant = (id: number) => {
    setPlants((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, health: Math.min(100, p.health + 3), lastPruned: "Hoje", needsPruning: false } : p
      )
    );
  };

  const removePlant = (id: number) => {
    setPlants((prev) => prev.filter((p) => p.id !== id));
  };

  const healthColor = (h: number) =>
    h > 80 ? "hsl(var(--garden-green))" : h > 50 ? "hsl(40, 80%, 50%)" : "hsl(0, 70%, 55%)";

  const plantsNeedingFertilizer = plants.filter((p) => p.needsFertilizer).length;

  const totalFertilizerKg = plants.length > 0
    ? Math.max(0.5, Math.ceil(plants.length * 0.15 * 10) / 10)
    : 0;

  const filteredCatalog = catalogPlants.filter((p) =>
    p.name.toLowerCase().includes(addSearch.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Meu Jardim 🌳</h2>
          <p className="text-sm text-muted-foreground">{plants.length} plantas no seu jardim</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Adicionar</span>
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in-up animate-delay-100">
        <div className="garden-card p-4 text-center">
          <Heart className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">
            {plants.length > 0 ? Math.round(plants.reduce((a, p) => a + p.health, 0) / plants.length) : 0}%
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
          <Leaf className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{plantsNeedingFertilizer}</p>
          <p className="text-xs text-muted-foreground">Precisam de adubo</p>
        </div>
        <div className="garden-card p-4 text-center">
          <Sun className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">
            {new Set(plants.map((p) => p.location)).size}
          </p>
          <p className="text-xs text-muted-foreground">Locais</p>
        </div>
      </div>

      {/* Adubei recommendation banner */}
      {plants.length > 0 && (
        <div className="garden-card p-4 border-2 border-primary/30 bg-garden-green-mist animate-fade-in-up animate-delay-100">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <Leaf className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-foreground mb-1">
                🌱 Adubação com Adubei NPK 5-15-5
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                {plantsNeedingFertilizer > 0
                  ? `⚠️ ${plantsNeedingFertilizer} planta(s) precisam de adubação! Não deixe seu jardim sem nutrientes.`
                  : "✅ Todas as plantas estão adubadas! Continue o cuidado regular."}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowFertilizerInfo(!showFertilizerInfo)}
                  className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-semibold hover:opacity-90 transition-all flex items-center gap-1"
                >
                  <ShoppingCart className="w-3 h-3" />
                  Calcular adubo necessário
                </button>
              </div>
              {showFertilizerInfo && (
                <div className="mt-3 p-3 rounded-lg bg-card border border-border space-y-2">
                  <h4 className="font-semibold text-sm text-foreground">📦 Quanto Adubei comprar?</h4>
                  <p className="text-xs text-muted-foreground">
                    Para <strong>{plants.length} plantas</strong>, você precisa de aproximadamente
                    <strong className="text-primary"> {totalFertilizerKg} kg de Adubei NPK 5-15-5</strong> por mês.
                  </p>
                  <div className="space-y-1">
                    {plants.map((p) => (
                      <div key={p.id} className="flex justify-between text-xs">
                        <span>{p.emoji} {p.name}</span>
                        <span className="text-muted-foreground">{p.fertilizerAmount} — {p.fertilizerFrequency}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 rounded-md bg-amber-50 border border-amber-200 mt-2">
                    <p className="text-xs font-semibold text-amber-800">
                      🛒 Compre agora o adubo orgânico Adubei NPK 5-15-5 para manter seu jardim saudável e florido!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {plants.length === 0 && (
        <div className="garden-card p-12 text-center animate-fade-in-up animate-delay-200">
          <span className="text-5xl block mb-4">🌱</span>
          <h3 className="font-heading text-lg font-bold text-foreground mb-2">Seu jardim está vazio</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione plantas do catálogo para começar a cuidar do seu jardim!
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all duration-200 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Adicionar primeira planta
          </button>
        </div>
      )}

      {/* Plant list */}
      <div className="space-y-3 animate-fade-in-up animate-delay-200">
        {plants.map((plant) => (
          <div key={plant.id} className="garden-card p-4">
            <div className="flex items-center gap-4">
              <span className="text-3xl">{plant.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-semibold text-foreground">{plant.name}</p>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    {plant.location}
                  </span>
                  {plant.needsFertilizer && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Precisa adubar
                    </span>
                  )}
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
                <div className="flex gap-4 mt-1">
                  <p className="text-xs text-muted-foreground">💧 Rega: {plant.lastWatered}</p>
                  <p className="text-xs text-muted-foreground">🌱 Adubo: {plant.lastFertilized}</p>
                </div>
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
                  onClick={() => fertilizePlant(plant.id)}
                  className="p-2 rounded-lg bg-garden-green-pale text-primary hover:bg-garden-green-mist active:scale-95 transition-all duration-200"
                  title="Adubar com Adubei"
                >
                  <Leaf className="w-4 h-4" />
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
          </div>
        ))}
      </div>

      {/* Add plant modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div
            className="bg-card rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-foreground">Adicionar Planta 🌱</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar planta..."
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-background border-2 border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto max-h-[50vh] space-y-2">
                {filteredCatalog.map((plant) => {
                  const alreadyAdded = plants.some((p) => p.name === plant.name);
                  return (
                    <div
                      key={plant.name}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                        alreadyAdded ? "opacity-50 bg-muted" : "hover:bg-muted cursor-pointer active:scale-[0.98]"
                      }`}
                      onClick={() => !alreadyAdded && addPlant(plant)}
                    >
                      <span className="text-2xl">{plant.emoji}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-foreground">{plant.name}</p>
                        <p className="text-xs text-muted-foreground">{plant.category} · {plant.light}</p>
                      </div>
                      {alreadyAdded ? (
                        <span className="text-xs text-muted-foreground font-semibold">Já adicionada</span>
                      ) : (
                        <Plus className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
