import { useState, useMemo } from "react";
import { Droplets, Scissors, Leaf, Plus, Heart, Trash2, X, Search, ShoppingCart, AlertTriangle, AlertOctagon } from "lucide-react";
import { plants as catalogPlants, type Plant as CatalogPlant } from "./CatalogPage";
import { useGardenPlants, type GardenPlantDB } from "@/hooks/useGardenPlants";
import { useAnuncios } from "@/hooks/useAnuncios";
import AnuncioCard from "@/components/AnuncioCard";
import { computePlantStatus } from "@/lib/plantHealth";

export type { GardenPlantDB as GardenPlant };

export default function MyGardenPage() {
  const { plants: rawPlants, isLoading, addPlant, updatePlant, removePlant } = useGardenPlants();

  // Calcula status real (saúde, necessidades) com base no tempo decorrido
  const plants = useMemo(
    () => rawPlants.map((p) => ({ ...p, status: computePlantStatus(p) })),
    [rawPlants]
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [showFertilizerInfo, setShowFertilizerInfo] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { data: anuncios } = useAnuncios();

  const handleAddPlant = (catalogPlant: CatalogPlant) => {
    addPlant.mutate(catalogPlant);
    setShowAddModal(false);
    setAddSearch("");
  };

  const waterPlant = (id: string) => {
    updatePlant.mutate({
      id,
      updates: { health: 100, last_watered: new Date().toISOString(), needs_water: false },
    });
  };

  const fertilizePlant = (id: string) => {
    updatePlant.mutate({
      id,
      updates: { last_fertilized: new Date().toISOString(), needs_fertilizer: false },
    });
  };

  const prunePlant = (id: string) => {
    updatePlant.mutate({
      id,
      updates: { last_pruned: new Date().toISOString(), needs_pruning: false },
    });
  };

  const handleRemovePlant = (id: string) => {
    removePlant.mutate(id);
    setConfirmDeleteId(null);
  };

  const healthColor = (h: number) =>
    h > 80 ? "hsl(var(--garden-green))" : h > 50 ? "hsl(40, 80%, 50%)" : "hsl(0, 70%, 55%)";

  const plantsNeedingFertilizer = plants.filter((p) => p.needs_fertilizer).length;
  const totalFertilizerKg = plants.length > 0 ? Math.max(0.5, Math.ceil(plants.length * 0.15 * 10) / 10) : 0;

  const filteredCatalog = catalogPlants.filter((p) =>
    p.name.toLowerCase().includes(addSearch.toLowerCase())
  );

  const formatDate = (d: string | null) => {
    if (!d) return "Nunca";
    const date = new Date(d);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return "Agora";
    if (diffH < 24) return `${diffH}h atrás`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return "Ontem";
    return `${diffD} dias atrás`;
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <span className="text-4xl block mb-3 animate-bounce">🌱</span>
          <p className="text-sm text-muted-foreground">Carregando seu jardim...</p>
        </div>
      </div>
    );
  }

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
            {plants.length > 0 ? Math.round(plants.reduce((a, p) => a + (p.health ?? 80), 0) / plants.length) : 0}%
          </p>
          <p className="text-xs text-muted-foreground">Saúde média</p>
        </div>
        <div className="garden-card p-4 text-center">
          <Droplets className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{plants.filter((p) => p.needs_water).length}</p>
          <p className="text-xs text-muted-foreground">Precisam de água</p>
        </div>
        <div className="garden-card p-4 text-center">
          <Leaf className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{plantsNeedingFertilizer}</p>
          <p className="text-xs text-muted-foreground">Precisam de adubo</p>
        </div>
        <div className="garden-card p-4 text-center">
          <Scissors className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{plants.filter((p) => p.needs_pruning).length}</p>
          <p className="text-xs text-muted-foreground">Precisam de poda</p>
        </div>
      </div>

      {/* Adubei banner */}
      {plants.length > 0 && (
        <div className="garden-card p-4 border-2 border-primary/30 bg-garden-green-mist animate-fade-in-up animate-delay-100">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <Leaf className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-foreground mb-1">🌱 Adubação com Adubei NPK 5-15-5</h3>
              <p className="text-xs text-muted-foreground mb-2">
                {plantsNeedingFertilizer > 0
                  ? `⚠️ ${plantsNeedingFertilizer} planta(s) precisam de adubação!`
                  : "✅ Todas as plantas estão adubadas!"}
              </p>
              <button
                onClick={() => setShowFertilizerInfo(!showFertilizerInfo)}
                className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-semibold hover:opacity-90 transition-all flex items-center gap-1"
              >
                <ShoppingCart className="w-3 h-3" /> Calcular adubo necessário
              </button>
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
                        <span className="text-muted-foreground">{p.fertilizer_amount} — {p.fertilizer_frequency}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 rounded-md bg-amber-50 border border-amber-200 mt-2">
                    <p className="text-xs font-semibold text-amber-800">
                      🛒 Compre agora o adubo orgânico Adubei NPK 5-15-5!
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
          <p className="text-sm text-muted-foreground mb-4">Adicione plantas do catálogo para começar!</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 inline-flex items-center gap-2"
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
                  {plant.needs_fertilizer && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Adubar
                    </span>
                  )}
                  {plant.needs_water && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <Droplets className="w-3 h-3" /> Regar
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${plant.health ?? 80}%`, backgroundColor: healthColor(plant.health ?? 80) }}
                    />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground w-10 text-right tabular-nums">
                    {plant.health ?? 80}%
                  </span>
                </div>
                <div className="flex gap-3 mt-1 flex-wrap">
                  <p className="text-xs text-muted-foreground">💧 {formatDate(plant.last_watered)}</p>
                  <p className="text-xs text-muted-foreground">🌱 {formatDate(plant.last_fertilized)}</p>
                  <p className="text-xs text-muted-foreground">✂️ {formatDate(plant.last_pruned)}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <div className="flex gap-2">
                  <button onClick={() => waterPlant(plant.id)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95 transition-all" title="Regar">
                    <Droplets className="w-4 h-4" />
                  </button>
                  <button onClick={() => fertilizePlant(plant.id)} className="p-2 rounded-lg bg-garden-green-pale text-primary hover:bg-garden-green-mist active:scale-95 transition-all" title="Adubar">
                    <Leaf className="w-4 h-4" />
                  </button>
                  <button onClick={() => prunePlant(plant.id)} className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 active:scale-95 transition-all" title="Podar">
                    <Scissors className="w-4 h-4" />
                  </button>
                </div>
                {confirmDeleteId === plant.id ? (
                  <div className="flex items-center gap-1 p-1 bg-red-50 rounded-lg">
                    <span className="text-[10px] text-red-600 font-semibold">Excluir?</span>
                    <button onClick={() => handleRemovePlant(plant.id)} className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded font-semibold">Sim</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] bg-muted px-2 py-0.5 rounded font-semibold">Não</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(plant.id)} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 active:scale-95 transition-all self-end" title="Remover">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Anúncio */}
      {anuncios && anuncios.length > 0 && (
        <AnuncioCard anuncio={anuncios[0]} />
      )}

      {/* Add plant modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-card rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-xl animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
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
                      onClick={() => !alreadyAdded && handleAddPlant(plant)}
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
