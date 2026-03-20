import { useState } from "react";
import { Search, AlertTriangle, CheckCircle, HelpCircle, Leaf } from "lucide-react";

interface Diagnosis {
  symptom: string;
  causes: string[];
  solution: string;
  severity: "low" | "medium" | "high";
}

const diagnoses: Diagnosis[] = [
  { symptom: "Folhas amareladas", causes: ["Excesso de água", "Falta de nutrientes"], solution: "Reduza a rega e aplique adubo rico em nitrogênio.", severity: "medium" },
  { symptom: "Folhas murchas", causes: ["Falta de água", "Sol excessivo"], solution: "Regue imediatamente e mova para meia-sombra por 24h.", severity: "high" },
  { symptom: "Manchas marrons", causes: ["Fungo", "Queimadura solar"], solution: "Remova folhas afetadas e aplique fungicida natural.", severity: "high" },
  { symptom: "Crescimento lento", causes: ["Vaso pequeno", "Pouca luz"], solution: "Transplante para um vaso maior e mova para local mais iluminado.", severity: "low" },
  { symptom: "Pragas visíveis", causes: ["Pulgões", "Cochonilhas"], solution: "Use calda de fumo ou óleo de neem. Isole a planta.", severity: "high" },
  { symptom: "Folhas com bordas secas", causes: ["Ar seco", "Falta de umidade"], solution: "Borrife água nas folhas e use um pratinho com pedras e água.", severity: "low" },
  { symptom: "Caule mole", causes: ["Excesso de água", "Apodrecimento"], solution: "Pare de regar. Verifique drenagem. Pode ser necessário replantar.", severity: "high" },
];

const severityConfig = {
  low: { color: "bg-garden-green-pale text-garden-green-dark", icon: CheckCircle, label: "Leve" },
  medium: { color: "bg-amber-100 text-amber-700", icon: HelpCircle, label: "Moderado" },
  high: { color: "bg-red-100 text-red-700", icon: AlertTriangle, label: "Sério" },
};

export default function DiagnosisPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  const filtered = diagnoses.filter((d) =>
    d.symptom.toLowerCase().includes(search.toLowerCase()) ||
    d.causes.some((c) => c.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <h2 className="font-heading text-2xl font-bold text-foreground">Diagnóstico 🩺</h2>
        <p className="text-sm text-muted-foreground">Identifique e resolva problemas das suas plantas</p>
      </div>

      <div className="relative animate-fade-in-up animate-delay-100">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Descreva o sintoma..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-3 bg-card border-2 border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className="space-y-3 animate-fade-in-up animate-delay-200">
        {filtered.map((d, i) => {
          const sev = severityConfig[d.severity];
          const isOpen = open === i;
          return (
            <div key={i} className="garden-card overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full p-4 flex items-center gap-3 text-left"
              >
                <sev.icon className="w-5 h-5 shrink-0" />
                <span className="flex-1 font-semibold text-sm text-foreground">{d.symptom}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sev.color}`}>
                  {sev.label}
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3 animate-fade-in-up">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Causas possíveis</p>
                    <div className="flex flex-wrap gap-2">
                      {d.causes.map((c) => (
                        <span key={c} className="bg-muted px-2.5 py-1 rounded-full text-xs text-foreground">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Solução</p>
                    <p className="text-sm text-foreground flex items-start gap-2">
                      <Leaf className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {d.solution}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
