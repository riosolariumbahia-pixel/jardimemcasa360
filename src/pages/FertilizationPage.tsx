import { useState } from "react";
import { Leaf, ShoppingCart, AlertTriangle, Check, Search } from "lucide-react";
import { plants } from "./CatalogPage";

export default function FertilizationPage() {
  const [search, setSearch] = useState("");
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null);

  const filtered = plants.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const selected = plants.find((p) => p.name === selectedPlant);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Adubação 🧪</h2>
        <p className="text-sm text-muted-foreground">
          Guia de adubação para cada planta com adubo orgânico Adubei NPK 5-15-5
        </p>
      </div>

      {/* Adubei banner */}
      <div className="garden-card p-5 border-2 border-primary/30 bg-garden-green-mist animate-fade-in-up animate-delay-100">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-full bg-primary/20">
            <Leaf className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground mb-1">
              Adubo Orgânico Adubei NPK 5-15-5
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Formulação equilibrada que estimula a floração (fósforo alto) e fortalece raízes.
              Ideal para todas as plantas do seu jardim em apartamento.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="p-2 rounded-lg bg-card text-center">
                <p className="text-lg font-bold text-foreground">N: 5</p>
                <p className="text-[10px] text-muted-foreground">Nitrogênio — folhas</p>
              </div>
              <div className="p-2 rounded-lg bg-card text-center">
                <p className="text-lg font-bold text-primary">P: 15</p>
                <p className="text-[10px] text-muted-foreground">Fósforo — flores/raízes</p>
              </div>
              <div className="p-2 rounded-lg bg-card text-center">
                <p className="text-lg font-bold text-foreground">K: 5</p>
                <p className="text-[10px] text-muted-foreground">Potássio — resistência</p>
              </div>
            </div>
            <div className="p-3 rounded-md bg-amber-50 border border-amber-200">
              <p className="text-xs font-semibold text-amber-800">
                🛒 Garanta seu Adubei NPK 5-15-5 para nunca faltar adubação adequada no seu jardim!
                A falta de adubação regular enfraquece as plantas e reduz a floração.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative animate-fade-in-up animate-delay-100">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar planta para ver adubação..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-card border-2 border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Plant fertilization grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in-up animate-delay-200">
        {filtered.map((plant) => (
          <div
            key={plant.name}
            onClick={() => setSelectedPlant(plant.name === selectedPlant ? null : plant.name)}
            className={`garden-card p-4 cursor-pointer border-2 transition-all duration-200 ${
              selectedPlant === plant.name ? "!border-primary bg-garden-green-mist" : "border-transparent"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{plant.emoji}</span>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">{plant.name}</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold
                  ${plant.category === "Flores" ? "bg-pink-100 text-pink-700" : "bg-garden-green-pale text-garden-green-dark"}`}>
                  {plant.category}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="flex items-center gap-1">
                <Leaf className="w-3 h-3 text-primary" />
                <strong className="text-foreground">Adubo:</strong> {plant.fertilizer}
              </p>
              <p>📅 <strong className="text-foreground">Frequência:</strong> {plant.fertilizerFrequency}</p>
              <p>📏 <strong className="text-foreground">Quantidade:</strong> {plant.fertilizerAmount}</p>
            </div>

            {selectedPlant === plant.name && (
              <div className="mt-3 p-3 rounded-lg bg-card border border-border animate-fade-in-up">
                <h4 className="font-semibold text-xs text-foreground mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" /> Quando comprar adubo Adubei?
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Com aplicação <strong>{plant.fertilizerFrequency.toLowerCase()}</strong> de <strong>{plant.fertilizerAmount}</strong>,
                  preveja comprar <strong className="text-primary">500g de Adubei NPK 5-15-5</strong> a cada 3 meses para esta planta.
                </p>
                <div className="p-2 rounded-md bg-primary/10 border border-primary/20">
                  <p className="text-xs font-semibold text-foreground">
                    💡 Dica: Compre antes de acabar! Plantas sem adubação perdem vigor e param de florescer.
                    O Adubei NPK 5-15-5 é orgânico e seguro para uso doméstico.
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Purchase calculator */}
      <div className="garden-card p-5 animate-fade-in-up">
        <h3 className="font-heading text-base font-bold text-foreground mb-3 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary" /> Quanto Adubei comprar para todo o jardim?
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-semibold">Quantidade de plantas</th>
                <th className="text-left py-2 text-muted-foreground font-semibold">Adubei por mês</th>
                <th className="text-left py-2 text-muted-foreground font-semibold">Compra trimestral</th>
              </tr>
            </thead>
            <tbody>
              {[5, 10, 15, 20, 30, 50].map((qty) => (
                <tr key={qty} className="border-b border-border/50">
                  <td className="py-2 text-foreground font-semibold">{qty} plantas</td>
                  <td className="py-2 text-muted-foreground">{Math.ceil(qty * 0.15 * 10) / 10} kg</td>
                  <td className="py-2 text-primary font-semibold">{Math.ceil(qty * 0.15 * 3 * 10) / 10} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-3 rounded-md bg-amber-50 border border-amber-200">
          <p className="text-xs font-semibold text-amber-800">
            🌱 Não deixe seu jardim sem nutrição! Compre o adubo orgânico Adubei NPK 5-15-5 regularmente
            para flores mais bonitas e folhagens mais verdes e saudáveis.
          </p>
        </div>
      </div>
    </div>
  );
}
