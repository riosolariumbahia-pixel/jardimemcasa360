import { Lightbulb, Droplets, Sun, Leaf, Bug, Recycle } from "lucide-react";

const tips = [
  {
    category: "Rega",
    icon: Droplets,
    color: "text-blue-500",
    items: [
      "Regue pela manhã cedo para melhor absorção e menos evaporação.",
      "Enfie o dedo 2cm na terra: se estiver seco, é hora de regar.",
      "Use água em temperatura ambiente — água gelada choca as raízes.",
      "Vasos com furo no fundo são essenciais para evitar encharcamento.",
    ],
  },
  {
    category: "Iluminação",
    icon: Sun,
    color: "text-amber-500",
    items: [
      "Gire os vasos a cada 15 dias para crescimento uniforme.",
      "Plantas de folhas escuras toleram mais sombra.",
      "Janelas voltadas para o norte recebem menos sol direto.",
      "Use luz artificial (LED grow) para compensar falta de sol.",
    ],
  },
  {
    category: "Adubação",
    icon: Leaf,
    color: "text-garden-green",
    items: [
      "Use cascas de ovos trituradas como fonte de cálcio.",
      "Borra de café é ótima para plantas que gostam de solo ácido.",
      "Adube a cada 15 dias durante primavera e verão.",
      "Húmus de minhoca é o adubo mais completo e seguro.",
    ],
  },
  {
    category: "Pragas",
    icon: Bug,
    color: "text-red-400",
    items: [
      "Óleo de neem é um pesticida natural eficaz.",
      "Calda de fumo combate pulgões e cochonilhas.",
      "Plante tagetes (cravo-de-defunto) para repelir insetos.",
      "Inspecione as plantas semanalmente, incluindo a parte de baixo das folhas.",
    ],
  },
  {
    category: "Sustentabilidade",
    icon: Recycle,
    color: "text-teal-600",
    items: [
      "Reutilize garrafas PET como vasos auto-irrigáveis.",
      "Composte restos de cozinha para produzir seu próprio adubo.",
      "Colete água da chuva para regar suas plantas.",
      "Use palha ou folhas secas como cobertura do solo (mulching).",
    ],
  },
];

export default function TipsPage() {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <h2 className="font-heading text-2xl font-bold text-foreground">Dicas e Sugestões 💡</h2>
        <p className="text-sm text-muted-foreground">Aprenda a cuidar melhor do seu jardim</p>
      </div>

      <div className="space-y-6">
        {tips.map((section, idx) => (
          <div
            key={section.category}
            className={`garden-card p-5 animate-fade-in-up`}
            style={{ animationDelay: `${(idx + 1) * 80}ms` }}
          >
            <h3 className="font-heading text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <section.icon className={`w-5 h-5 ${section.color}`} />
              {section.category}
            </h3>
            <ul className="space-y-2">
              {section.items.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
