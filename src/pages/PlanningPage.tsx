import { useState } from "react";
import { Sun, MapPin, Check, Plus, Trash2, ArrowUpDown, Flower2, Calculator } from "lucide-react";
import { useGardens, type GardenDB } from "@/hooks/useGardens";
import type { TablesUpdate } from "@/integrations/supabase/types";

interface ContainerItem {
  id: number;
  type: "vaso-p" | "vaso-m" | "vaso-g" | "jardineira-p" | "jardineira-m" | "jardineira-g";
  quantity: number;
}

const spaceOptions = [
  { label: "Varanda", value: "varanda", icon: "🏠" },
  { label: "Janela", value: "janela", icon: "🪟" },
  { label: "Cozinha", value: "cozinha", icon: "🍳" },
  { label: "Sala", value: "sala", icon: "🛋️" },
  { label: "Sacada", value: "sacada", icon: "🌤️" },
  { label: "Corredor", value: "corredor", icon: "🚪" },
  { label: "Banheiro", value: "banheiro", icon: "🚿" },
  { label: "Quarto", value: "quarto", icon: "🛏️" },
];

const lightOptions = [
  { label: "Sol pleno (6h+)", value: "full" },
  { label: "Meia-sombra (3-6h)", value: "partial" },
  { label: "Sombra (< 3h)", value: "shade" },
];

const gardenTypeOptions = [
  { label: "No chão / Mesa", value: "chao", icon: "🪴", desc: "Vasos e jardineiras no chão ou sobre móveis" },
  { label: "Jardim vertical", value: "vertical", icon: "🧱", desc: "Vasos fixados na parede em prateleiras" },
  { label: "Suspenso", value: "suspenso", icon: "🪝", desc: "Vasos suspensos no teto ou suporte" },
];

const containerOptions = [
  { label: "Vaso pequeno (15cm)", value: "vaso-p", icon: "🪴" },
  { label: "Vaso médio (25cm)", value: "vaso-m", icon: "🪴" },
  { label: "Vaso grande (40cm)", value: "vaso-g", icon: "🪴" },
  { label: "Jardineira pequena (40cm)", value: "jardineira-p", icon: "🌸" },
  { label: "Jardineira média (60cm)", value: "jardineira-m", icon: "🌸" },
  { label: "Jardineira grande (80cm)", value: "jardineira-g", icon: "🌸" },
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

  const [formName, setFormName] = useState("");
  const [formSpace, setFormSpace] = useState("varanda");
  const [formLight, setFormLight] = useState("full");
  const [formGardenType, setFormGardenType] = useState("chao");
  const [formContainers, setFormContainers] = useState<ContainerItem[]>([]);
  const [formWallHeight, setFormWallHeight] = useState("");
  const [formWallWidth, setFormWallWidth] = useState("");
  const [showForm, setShowForm] = useState(false);

  const resetForm = () => {
    setFormName(""); setFormSpace("varanda"); setFormLight("full");
    setFormGardenType("chao"); setFormContainers([]); setFormWallHeight(""); setFormWallWidth("");
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
    return Math.max(Math.floor(h / 0.3) * Math.floor(w / 0.25), 1);
  };

  const saveLocation = () => {
    const spaceName = spaceOptions.find((s) => s.value === formSpace)?.label || formSpace;
    const data: Omit<GardenDB, "id" | "created_at"> = {
      name: formName || spaceName,
      location: formSpace,
      garden_type: formGardenType,
      light: formLight,
      containers: formContainers,
      wall_height: formGardenType === "vertical" ? parseFloat(formWallHeight) || null : null,
      wall_width: formGardenType === "vertical" ? parseFloat(formWallWidth) || null : null,
    };

    if (editingId) {
      updateGarden.mutate({ id: editingId, updates: data as TablesUpdate<"gardens"> });
    } else {
      addGarden.mutate(data);
    }
    resetForm();
    setShowForm(false);
  };

  const editLocation = (loc: GardenDB) => {
    setFormName(loc.name);
    setFormSpace(loc.location || "varanda");
    setFormLight(loc.light || "full");
    setFormGardenType(loc.garden_type || "chao");
    setFormContainers(Array.isArray(loc.containers) ? loc.containers as ContainerItem[] : []);
    setFormWallHeight(loc.wall_height?.toString() || "");
    setFormWallWidth(loc.wall_width?.toString() || "");
    setEditingId(loc.id);
    setShowForm(true);
  };

  const deleteLocation = (id: string) => {
    removeGarden.mutate(id);
    setConfirmDeleteId(null);
  };

  const totalContainers = locations.reduce(
    (sum, loc) => {
      const containers = Array.isArray(loc.containers) ? loc.containers as ContainerItem[] : [];
      return sum + containers.reduce((s: number, c: ContainerItem) => s + c.quantity, 0);
    }, 0
  );

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto text-center py-12">
        <span className="text-4xl block mb-3 animate-bounce">📐</span>
        <p className="text-sm text-muted-foreground">Carregando planejamentos...</p>
      </div>
    );
  }

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
            <p className="text-lg font-bold text-foreground">{locations.filter((l) => l.garden_type === "vertical").length}</p>
            <p className="text-xs text-muted-foreground">Jardins verticais</p>
          </div>
        </div>
      )}

      {/* Saved locations */}
      {locations.map((loc) => {
        const spaceIcon = spaceOptions.find((s) => s.value === loc.location)?.icon || "📍";
        const lightLabel = lightOptions.find((l) => l.value === loc.light)?.label || loc.light;
        const gardenLabel = gardenTypeOptions.find((g) => g.value === loc.garden_type)?.label || loc.garden_type;
        const recs = lightRecommendations[loc.light || "partial"] || [];
        const containers = Array.isArray(loc.containers) ? loc.containers as ContainerItem[] : [];

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
              {loc.garden_type === "vertical" && loc.wall_height && loc.wall_width && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-semibold">
                  Parede {loc.wall_height}m × {loc.wall_width}m ≈ {Math.floor((loc.wall_height / 0.3) * (loc.wall_width / 0.25))} vasos
                </span>
              )}
            </div>

            {containers.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Recipientes:</p>
                <div className="flex flex-wrap gap-2">
                  {containers.map((c) => {
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
          <p className="text-sm text-muted-foreground mb-4">Adicione os locais onde deseja ter plantas.</p>
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

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nome (opcional)</label>
            <input type="text" placeholder="Ex: Varanda da sala..." value={formName} onChange={(e) => setFormName(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border-2 border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors" />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Onde será o jardim?
            </label>
            <div className="grid grid-cols-4 gap-2">
              {spaceOptions.map((opt) => (
                <button key={opt.value} onClick={() => setFormSpace(opt.value)}
                  className={`garden-card p-3 text-center border-2 transition-all active:scale-95 ${formSpace === opt.value ? "!border-primary bg-garden-green-mist" : "border-transparent"}`}>
                  <span className="text-xl block mb-0.5">{opt.icon}</span>
                  <span className="text-[10px] font-semibold text-foreground">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-500" /> Quanta luz solar?
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              {lightOptions.map((opt) => (
                <button key={opt.value} onClick={() => setFormLight(opt.value)}
                  className={`flex-1 garden-card p-3 text-center border-2 transition-all active:scale-95 ${formLight === opt.value ? "!border-primary bg-garden-green-mist" : "border-transparent"}`}>
                  <span className="text-xs font-semibold text-foreground">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" /> Tipo de jardim
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              {gardenTypeOptions.map((opt) => (
                <button key={opt.value} onClick={() => setFormGardenType(opt.value)}
                  className={`flex-1 garden-card p-3 text-center border-2 transition-all active:scale-95 ${formGardenType === opt.value ? "!border-primary bg-garden-green-mist" : "border-transparent"}`}>
                  <span className="text-xl block mb-0.5">{opt.icon}</span>
                  <span className="text-xs font-semibold text-foreground">{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground block">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {formGardenType === "vertical" && (
            <div className="p-4 rounded-lg bg-garden-green-mist border border-garden-green-light space-y-3">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" /> Calculadora de Jardim Vertical
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Altura (metros)</label>
                  <input type="number" step="0.1" min="0.3" placeholder="Ex: 2.5" value={formWallHeight} onChange={(e) => setFormWallHeight(e.target.value)}
                    className="w-full px-3 py-2 bg-background border-2 border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Largura (metros)</label>
                  <input type="number" step="0.1" min="0.25" placeholder="Ex: 1.5" value={formWallWidth} onChange={(e) => setFormWallWidth(e.target.value)}
                    className="w-full px-3 py-2 bg-background border-2 border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              {formWallHeight && formWallWidth && calculateVerticalPots() > 0 && (
                <div className="p-3 rounded-md bg-primary/10 border border-primary/20">
                  <p className="text-sm font-bold text-foreground">
                    🧱 Aproximadamente <strong className="text-primary">{calculateVerticalPots()} vasos</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Espaçamento: 30cm entre linhas e 25cm entre colunas.</p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block flex items-center gap-1">
              <Flower2 className="w-3 h-3" /> Vasos e jardineiras
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {containerOptions.map((opt) => (
                <button key={opt.value} onClick={() => addContainer(opt.value as ContainerItem["type"])}
                  className="garden-card p-2 text-center border-2 border-transparent hover:border-primary/50 transition-all active:scale-95">
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
                      <button onClick={() => updateContainerQty(c.type, c.quantity - 1)} className="w-7 h-7 rounded-md bg-muted text-foreground text-sm font-bold hover:bg-border transition-colors">−</button>
                      <span className="text-sm font-bold w-6 text-center tabular-nums">{c.quantity}</span>
                      <button onClick={() => updateContainerQty(c.type, c.quantity + 1)} className="w-7 h-7 rounded-md bg-muted text-foreground text-sm font-bold hover:bg-border transition-colors">+</button>
                      <button onClick={() => removeContainer(c.type)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={saveLocation} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all flex items-center gap-2">
              <Check className="w-4 h-4" /> {editingId ? "Salvar alterações" : "Adicionar local"}
            </button>
            <button onClick={() => { resetForm(); setShowForm(false); }} className="px-5 py-2.5 rounded-lg font-semibold text-sm bg-muted text-muted-foreground hover:bg-border transition-all">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
