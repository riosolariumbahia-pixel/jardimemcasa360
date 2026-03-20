import { useState } from "react";
import { BookOpen, ChevronRight } from "lucide-react";

const chapters = [
  {
    title: "Capítulo 1: Começando seu Jardim",
    content: `Começar um jardim em espaço pequeno é mais fácil do que você imagina. O segredo está em escolher as plantas certas para o seu ambiente.

Primeiro, avalie seu espaço: quanto sol ele recebe? Qual a temperatura média? Há vento? Essas respostas guiarão suas escolhas.

Comece com 3-4 plantas fáceis como manjericão, hortelã e suculentas. Elas são resistentes e perdoam erros de iniciantes. Invista em vasos com furos de drenagem — esse é o erro #1 de quem começa.`,
  },
  {
    title: "Capítulo 2: Escolhendo os Vasos Certos",
    content: `O vaso é a casa da sua planta. Tamanho, material e drenagem fazem toda a diferença.

Vasos de barro são ótimos para plantas que gostam de solo mais seco (suculentas, alecrim). Vasos plásticos retêm mais umidade e são melhores para hortelã e manjericão.

Regra de ouro: o vaso deve ter pelo menos 2-3cm a mais de diâmetro que o torrão da planta. Vasos muito grandes acumulam água em excesso nas raízes.`,
  },
  {
    title: "Capítulo 3: Solo e Substrato",
    content: `Nunca use terra do quintal direto nos vasos. Ela compacta, drena mal e pode trazer pragas.

A receita básica: 1 parte de terra vegetal + 1 parte de húmus de minhoca + 1 parte de areia ou perlita. Isso garante nutrientes e boa drenagem.

Para suculentas, aumente a proporção de areia. Para samambaias, aumente o húmus. Adapte a receita à necessidade de cada planta.`,
  },
  {
    title: "Capítulo 4: Rega Inteligente",
    content: `A rega é a habilidade mais importante do jardineiro. Mais plantas morrem por excesso de água do que por falta.

Teste do dedo: enfie o dedo 2cm na terra. Se estiver úmido, não regue. Se estiver seco, regue até a água sair pelo furo de drenagem.

Regue pela manhã para reduzir evaporação. No inverno, diminua a frequência. No verão, aumente. Observe suas plantas — elas avisam quando precisam de água.`,
  },
  {
    title: "Capítulo 5: Pragas e Doenças",
    content: `Prevenção é o melhor remédio. Plantas bem cuidadas resistem melhor a pragas.

Inspecione suas plantas semanalmente. Procure por folhas amareladas, manchas, insetos na parte de baixo das folhas e teias finas.

Receitas naturais: Calda de alho (repelente geral), óleo de neem (inseticida), canela em pó (antifúngico). Sempre isole plantas doentes para evitar contaminação.`,
  },
  {
    title: "Capítulo 6: Jardim Vertical",
    content: `Sem espaço horizontal? Vá para o vertical! Jardins verticais multiplicam seu espaço de cultivo.

Opções simples: treliças com vasos pendurados, suportes de chão escalonados, pallets reciclados ou bolsas de feltro para parede.

Plantas ideais para vertical: temperos (manjericão, cebolinha), morangos, suculentas e samambaias. Lembre-se que a rega é mais frequente em jardins verticais.`,
  },
];

export default function EbookPage() {
  const [activeChapter, setActiveChapter] = useState(0);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <h2 className="font-heading text-2xl font-bold text-foreground">E-book: Jardim em Casa 📖</h2>
        <p className="text-sm text-muted-foreground">Guia completo para criar seu jardim urbano</p>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-6">
        {/* Chapter list */}
        <nav className="space-y-2 animate-fade-in-up animate-delay-100">
          {chapters.map((ch, i) => (
            <button
              key={i}
              onClick={() => setActiveChapter(i)}
              className={`w-full text-left p-3 rounded-r-lg border-l-[3px] transition-all duration-200 text-sm active:scale-[0.98]
                ${activeChapter === i
                  ? "border-l-primary bg-garden-green-mist/50 text-foreground font-semibold"
                  : "border-l-transparent text-muted-foreground hover:bg-muted/50"
                }`}
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span className="line-clamp-2">{ch.title}</span>
              </span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="garden-card p-6 animate-fade-in-up animate-delay-200">
          <h3 className="font-heading text-lg font-bold text-foreground mb-4">
            {chapters[activeChapter].title}
          </h3>
          <div className="prose prose-sm max-w-none">
            {chapters[activeChapter].content.split("\n\n").map((paragraph, i) => (
              <p key={i} className="text-sm text-foreground leading-relaxed mb-3">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="flex justify-between mt-6 pt-4 border-t border-border">
            <button
              onClick={() => setActiveChapter(Math.max(0, activeChapter - 1))}
              disabled={activeChapter === 0}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setActiveChapter(Math.min(chapters.length - 1, activeChapter + 1))}
              disabled={activeChapter === chapters.length - 1}
              className="text-sm font-semibold text-primary hover:opacity-80 disabled:opacity-30 transition-colors flex items-center gap-1"
            >
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
