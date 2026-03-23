import { useState } from "react";
import { Sun, MapPin, Check, Plus, Trash2, ArrowUpDown, Flower2, Calculator } from "lucide-react";
import { useGardens } from "@/hooks/useGardens";

interface GardenLocation {
  id: number;
  name: string;
  type: "varanda" | "janela" | "cozinha" | "sala" | "sacada" | "corredor" | "banheiro" | "quarto";
  light: "full" | "partial" | "shade";
  gardenType: "chao" | "vertical" | "suspenso";
  containers: ContainerItem[];
  wallHeight?: number;
  wallWidth?: number;
}

interface ContainerItem {
  id: number;
  type: "vaso-p" | "vaso-m" | "vaso-g" | "jardineira-p" | "jardineira-m" | "jardineira-g";
  quantity: number;
}

const spaceOptions = [
  { label: "Varanda", value: "varanda" as const, icon: "🏠" },
  { label: "Janela", value: "janela" as const, icon: "🪟" },
  { label: "Cozinha", value: "cozinha" as const, icon: "🍳" },
  { label: "Sala", value: "sala" as const, icon: "🛋️" },
  { label: "Sacada", value: "sacada" as const, icon: "🌤️" },
  { label: "Corredor", value: "corredor" as const, icon: "🚪" },
  { label: "Banheiro", value: "banheiro" as const, icon: "🚿" },
  { label: "Quarto", value: "quarto" as const, icon: "🛏️" },
];

const lightOptions = [
  { label: "Sol pleno (6h+)", value: "full" as const },
  { label: "Meia-sombra (3-6h)", value: "partial" as const },
  { label: "Sombra (< 3h)", value: "shade" as const },
];

const gardenTypeOptions = [
  { label: "No chão / Mesa", value: "chao" as const, icon: "🪴", desc: "Vasos e jardineiras no chão ou sobre móveis" },
  { label: "Jardim vertical", value: "vertical" as const, icon: "🧱", desc: "Vasos fixados na parede em prateleiras" },
  { label: "Suspenso", value: "suspenso" as const, icon: "🪝", desc: "Vasos suspensos no teto ou suporte" },
];

const containerOptions = [
  { label: "Vaso pequeno (15cm)", value: "vaso-p" as const, icon: "🪴" },
  { label: "Vaso médio (25cm)", value: "vaso-m" as const, icon: "🪴" },
  { label: "Vaso grande (40cm)", value: "vaso-g" as const, icon: "🪴" },
  { label: "Jardineira pequena (40cm)", value: "jardineira-p" as const, icon: "🌸" },
  { label: "Jardineira média (60cm)", value: "jardineira-m" as const, icon: "🌸" },
  { label: "Jardineira grande (80cm)", value: "jardineira-g" as const, icon: "🌸" },
];

const lightRecommendations: Record<string, { name: string; emoji: string; reason: string }[]> = {
  full: [
    { name: "Petúnia", emoji: "🌸", reason: "Flores abundantes com sol pleno" },
    { name: "Lavanda", emoji: "💜", reason: "Perfumada e resistente" },
    { name: "Kalanchoe", emoji: "🌼", reason: "Suculenta com flores vibrantes" },
    { name: "Rosa Miniatura", emoji: "🌹", reason: "Floração contínua em vasos" },
  ],
  partial: [
    { name: "Begônia", emoji: "🌸", reason: "Ideal para meia-sombra" },
    { name: "Antúrio", emoji: "❤️", reason: "Flores tropicais elegantes" },
    { name: "Samambaia Boston", emoji: "🌿", reason: "Folhagem exuberante" },
    { name: "Orquídea", emoji: "🌸", reason: "Rainha das flores de interior" },
  ],
  shade: [
    { name: "Lírio-da-paz", emoji: "🤍", reason: "Floresce na sombra" },
    { name: "Jiboia", emoji: "🌿", reason: "Indestrutível e decorativa" },
    { name: "Zamioculca", emoji: "🌿", reason: "Sobrevive semanas sem luz" },
    { name: "Espada-de-são-jorge", emoji: "🌿", reason: "Purifica o ar na sombra" },
  ],
};

export default function PlanningPage() {
  const { gardens: locations, isLoading, addGarden, updateGarden, removeGarden } = useGardens();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formSpace, setFormSpace] = useState<GardenLocation["type"]>("varanda");
  const [formLight, setFormLight] = useState<GardenLocation["light"]>("full");
  const [formGardenType, setFormGardenType] = useState<GardenLocation["gardenType"]>("chao");
  const [formContainers, setFormContainers] = useState<ContainerItem[]>([]);
  const [formWallHeight, setFormWallHeight] = useState("");
  const [formWallWidth, setFormWallWidth] = useState("");
  const [showForm, setShowForm] = useState(false);

  const resetForm = () => {
    setFormName("");
    setFormSpace("varanda");
    setFormLight("full");
    setFormGardenType("chao");
    setFormContainers([]);
    setFormWallHeight("");
    setFormWallWidth("");
    setEditingId(null);
  };

  const addContainer = (type: ContainerItem["type"]) => {
    const existing = formContainers.find((c) => c.type === type);
    if (existing) {
      setFormContainers(formContainers.map((c) => c.type === type ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setFormContainers([...formContainers, { id: Date.now(), type, quantity: 1 }]);
    }
  };

  const removeContainer = (type: ContainerItem["type"]) => {
    setFormContainers(formContainers.filter((c) => c.type !== type));
  };

  const updateContainerQty = (type: ContainerItem["type"], qty: number) => {
    if (qty <= 0) return removeContainer(type);
    setFormContainers(formContainers.map((c) => c.type === type ? { ...c, quantity: qty } : c));
  };

  const calculateVerticalPots = () => {
    const h = parseFloat(formWallHeight);
    const w = parseFloat(formWallWidth);
    if (!h || !w || h <= 0 || w <= 0) return 0;
    const rows = Math.floor(h / 0.3);
    const cols = Math.floor(w / 0.25);
    return Math.max(rows * cols, 1);
  };

  const saveLocation = () => {
    const spaceName = spaceOptions.find((s) => s.value === formSpace)?.label || formSpace;
    const loc: GardenLocation = {
      id: editingId || Date.now(),
      name: formName || spaceName,
      type: formSpace,
      light: formLight,
      gardenType: formGardenType,
      containers: formContainers,
      wallHeight: formGardenType === "vertical" ? parseFloat(formWallHeight) || undefined : undefined,
      wallWidth: formGardenType === "vertical" ? parseFloat(formWallWidth) || undefined : undefined,
    };

    if (editingId) {
      setLocations((prev) => prev.map((l) => l.id === editingId ? loc : l));
    } else {
      setLocations((prev) => [...prev, loc]);
    }
    resetForm();
    setShowForm(false);
  };

  const editLocation = (loc: GardenLocation) => {
    setFormName(loc.name);
    setFormSpace(loc.type);
    setFormLight(loc.light);
    setFormGardenType(loc.gardenType);
    setFormContainers(loc.containers);
    setFormWallHeight(loc.wallHeight?.toString() || "");
    setFormWallWidth(loc.wallWidth?.toString() || "");
    setEditingId(loc.id);
    setShowForm(true);
  };

  const deleteLocation = (id: number) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
    setConfirmDeleteId(null);
  };

  const totalContainers = locations.reduce(
    (sum, loc) => sum + loc.containers.reduce((s, c) => s + c.quantity, 0),
    0
  );

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Planejamento 📐</h2>
          <p className="text-sm text-muted-foreground">Monte seu jardim ideal — adicione vários locais</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Local</span>
        </button>
      </div>

      {/* Summary */}
      {locations.length > 0 && (
        <div className="grid grid-cols-3 gap-3 animate-fade-in-up animate-delay-100">
          <div className="garden-card p-4 text-center">
            <MapPin className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{locations.length}</p>
            <p className="text-xs text-muted-foreground">Locais</p>
          </div>
          <div className="garden-card p-4 text-center">
            <Flower2 className="w-5 h-5 text-pink-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{totalContainers}</p>
            <p className="text-xs text-muted-foreground">Vasos/Jardineiras</p>
          </div>
          <div className="garden-card p-4 text-center">
            <ArrowUpDown className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{locations.filter((l) => l.gardenType === "vertical").length}</p>
            <p className="text-xs text-muted-foreground">Jardins verticais</p>
          </div>
        </div>
      )}

      {/* Saved locations */}
      {locations.map((loc) => {
        const spaceIcon = spaceOptions.find((s) => s.value === loc.type)?.icon || "📍";
        const lightLabel = lightOptions.find((l) => l.value === loc.light)?.label || loc.light;
        const gardenLabel = gardenTypeOptions.find((g) => g.value === loc.gardenType)?.label || loc.gardenType;
        const recs = lightRecommendations[loc.light] || [];

        return (
          <div key={loc.id} className="garden-card p-5 animate-fade-in-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
                <span className="text-xl">{spaceIcon}</span> {loc.name}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => editLocation(loc)} className="text-xs text-primary hover:underline">Editar</button>
                {confirmDeleteId === loc.id ? (
                  <div className="flex items-center gap-2 p-1 bg-red-50 rounded-lg">
                    <span className="text-xs text-red-600 font-semibold">Excluir?</span>
                    <button onClick={() => deleteLocation(loc.id)} className="text-xs bg-red-500 text-white px-2 py-0.5 rounded font-semibold">Sim</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="text-xs bg-muted px-2 py-0.5 rounded font-semibold">Não</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(loc.id)} className="text-xs text-red-500 hover:underline">Excluir</button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs bg-muted px-2 py-1 rounded-full">{lightLabel}</span>
              <span className="text-xs bg-muted px-2 py-1 rounded-full">{gardenLabel}</span>
              {loc.gardenType === "vertical" && loc.wallHeight && loc.wallWidth && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-semibold">
                  Parede {loc.wallHeight}m × {loc.wallWidth}m ≈ {Math.floor((loc.wallHeight / 0.3) * (loc.wallWidth / 0.25))} vasos
                </span>
              )}
            </div>

            {/* Containers */}
            {loc.containers.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Recipientes:</p>
                <div className="flex flex-wrap gap-2">
                  {loc.containers.map((c) => {
                    const cLabel = containerOptions.find((o) => o.value === c.type)?.label || c.type;
                    return (
                      <span key={c.type} className="text-xs bg-garden-green-pale text-garden-green-dark px-2 py-1 rounded-full font-semibold">
                        {c.quantity}× {cLabel}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Check className="w-3 h-3 text-primary" /> Plantas recomendadas:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {recs.map((rec) => (
                  <div key={rec.name} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <span className="text-xl">{rec.emoji}</span>
                    <div>
                      <p className="font-semibold text-xs text-foreground">{rec.name}</p>
                      <p className="text-[10px] text-muted-foreground">{rec.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {locations.length === 0 && !showForm && (
        <div className="garden-card p-12 text-center animate-fade-in-up animate-delay-100">
          <span className="text-5xl block mb-4">📐</span>
          <h3 className="font-heading text-lg font-bold text-foreground mb-2">Planeje seu jardim</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione os locais onde deseja ter plantas e configure os vasos e jardineiras.
          </p>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Adicionar primeiro local
          </button>
        </div>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <div className="garden-card p-5 animate-fade-in-up space-y-5 border-2 border-primary/30">
          <h3 className="font-heading text-base font-bold text-foreground">
            {editingId ? "Editar Local" : "Novo Local do Jardim"}
          </h3>

          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nome (opcional)</label>
            <input
              type="text"
              placeholder="Ex: Varanda da sala, Janela do quarto..."
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border-2 border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Space type */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Onde será o jardim?
            </label>
            <div className="grid grid-cols-4 gap-2">
              {spaceOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormSpace(opt.value)}
                  className={`garden-card p-3 text-center border-2 transition-all duration-200 active:scale-95
                    ${formSpace === opt.value ? "!border-primary bg-garden-green-mist" : "border-transparent"}`}
                >
                  <span className="text-xl block mb-0.5">{opt.icon}</span>
                  <span className="text-[10px] font-semibold text-foreground">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Light */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-500" /> Quanta luz solar?
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              {lightOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormLight(opt.value)}
                  className={`flex-1 garden-card p-3 text-center border-2 transition-all duration-200 active:scale-95
                    ${formLight === opt.value ? "!border-primary bg-garden-green-mist" : "border-transparent"}`}
                >
                  <span className="text-xs font-semibold text-foreground">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Garden type */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" /> Tipo de jardim
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              {gardenTypeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormGardenType(opt.value)}
                  className={`flex-1 garden-card p-3 text-center border-2 transition-all duration-200 active:scale-95
                    ${formGardenType === opt.value ? "!border-primary bg-garden-green-mist" : "border-transparent"}`}
                >
                  <span className="text-xl block mb-0.5">{opt.icon}</span>
                  <span className="text-xs font-semibold text-foreground">{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground block">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Vertical garden calculator */}
          {formGardenType === "vertical" && (
            <div className="p-4 rounded-lg bg-garden-green-mist border border-garden-green-light space-y-3">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" /> Calculadora de Jardim Vertical
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Altura da parede (metros)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.3"
                    placeholder="Ex: 2.5"
                    value={formWallHeight}
                    onChange={(e) => setFormWallHeight(e.target.value)}
                    className="w-full px-3 py-2 bg-background border-2 border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Largura da parede (metros)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.25"
                    placeholder="Ex: 1.5"
                    value={formWallWidth}
                    onChange={(e) => setFormWallWidth(e.target.value)}
                    className="w-full px-3 py-2 bg-background border-2 border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              {formWallHeight && formWallWidth && calculateVerticalPots() > 0 && (
                <div className="p-3 rounded-md bg-primary/10 border border-primary/20">
                  <p className="text-sm font-bold text-foreground">
                    🧱 Seu jardim vertical comporta aproximadamente <strong className="text-primary">{calculateVerticalPots()} vasos</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Calculado com espaçamento de 30cm entre linhas e 25cm entre colunas.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Containers */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block flex items-center gap-1">
              <Flower2 className="w-3 h-3" /> Vasos e jardineiras
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {containerOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => addContainer(opt.value)}
                  className="garden-card p-2 text-center border-2 border-transparent hover:border-primary/50 transition-all active:scale-95"
                >
                  <span className="text-lg">{opt.icon}</span>
                  <span className="text-[10px] font-semibold text-foreground block">{opt.label}</span>
                  <span className="text-[10px] text-primary">+ Adicionar</span>
                </button>
              ))}
            </div>
            {formContainers.length > 0 && (
              <div className="space-y-2">
                {formContainers.map((c) => {
                  const cLabel = containerOptions.find((o) => o.value === c.type)?.label || c.type;
                  return (
                    <div key={c.type} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <span className="text-sm flex-1 font-semibold text-foreground">{cLabel}</span>
                      <button
                        onClick={() => updateContainerQty(c.type, c.quantity - 1)}
                        className="w-7 h-7 rounded-md bg-muted text-foreground text-sm font-bold hover:bg-border transition-colors"
                      >
                        −
                      </button>
                      <span className="text-sm font-bold w-6 text-center tabular-nums">{c.quantity}</span>
                      <button
                        onClick={() => updateContainerQty(c.type, c.quantity + 1)}
                        className="w-7 h-7 rounded-md bg-muted text-foreground text-sm font-bold hover:bg-border transition-colors"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeContainer(c.type)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={saveLocation}
              className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {editingId ? "Salvar alterações" : "Adicionar local"}
            </button>
            <button
              onClick={() => { resetForm(); setShowForm(false); }}
              className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-muted text-muted-foreground hover:bg-border transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
