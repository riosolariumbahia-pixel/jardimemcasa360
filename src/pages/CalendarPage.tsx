import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Droplets, Scissors, Leaf } from "lucide-react";
import { useGardenPlants } from "@/hooks/useGardenPlants";
import { plants as catalogPlants } from "./CatalogPage";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface Activity {
  day: number;
  type: "water" | "prune" | "fertilize";
  plant: string;
  emoji: string;
}

const activityIcon = {
  water: <Droplets className="w-3.5 h-3.5 text-blue-500" />,
  prune: <Scissors className="w-3.5 h-3.5 text-amber-600" />,
  fertilize: <Leaf className="w-3.5 h-3.5 text-primary" />,
};

const activityLabel = { water: "Regar", prune: "Podar", fertilize: "Adubar com Adubei" };

function parseFrequencyDays(freq: string | null): number {
  if (!freq) return 30;
  const match = freq.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 30;
}

function wateringDays(water: string | null): number {
  if (water === "Pouca") return 7;
  if (water === "Moderada") return 4;
  return 3;
}

export default function CalendarPage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const minYear = currentYear;
  const maxYear = currentYear + 10;

  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(currentYear);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { plants: gardenPlants, isLoading } = useGardenPlants();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();
  const isCurrentMonth = now.getMonth() === month && now.getFullYear() === year;

  const canGoPrev = year > minYear || (year === minYear && month > 0);
  const canGoNext = year < maxYear || (year === maxYear && month < 11);

  const prevMonth = () => {
    if (!canGoPrev) return;
    if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (!canGoNext) return;
    if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1);
    setSelectedDay(null);
  };

  const activities = useMemo(() => {
    const acts: Activity[] = [];
    gardenPlants.forEach((gp, idx) => {
      const catalogInfo = catalogPlants.find((cp) => cp.name === gp.name);
      const wDays = wateringDays(gp.water_frequency || catalogInfo?.water || null);
      const fDays = parseFrequencyDays(gp.fertilizer_frequency || catalogInfo?.fertilizerFrequency || null);

      for (let d = wDays; d <= daysInMonth; d += wDays) {
        acts.push({ day: d, type: "water", plant: gp.name, emoji: gp.emoji || "🌱" });
      }
      for (let d = fDays > daysInMonth ? daysInMonth : fDays; d <= daysInMonth; d += fDays) {
        acts.push({ day: d, type: "fertilize", plant: gp.name, emoji: gp.emoji || "🌱" });
      }
      const pruneDay = Math.min(((idx * 7 + 10) % daysInMonth) + 1, daysInMonth);
      acts.push({ day: pruneDay, type: "prune", plant: gp.name, emoji: gp.emoji || "🌱" });
    });
    return acts;
  }, [gardenPlants, daysInMonth]);

  const dayActivities = (day: number) => activities.filter((a) => a.day === day);
  const selectedActivities = selectedDay ? dayActivities(selectedDay) : [];

  const yearOptions: number[] = [];
  for (let y = minYear; y <= maxYear; y++) yearOptions.push(y);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <h2 className="font-heading text-2xl font-bold text-foreground">Calendário 📅</h2>
        <p className="text-sm text-muted-foreground">
          {gardenPlants.length > 0
            ? `Cuidados para ${gardenPlants.length} planta(s) — ${minYear} a ${maxYear}`
            : `Adicione plantas no Meu Jardim para ver tarefas — ${minYear} a ${maxYear}`}
        </p>
      </div>

      <div className="garden-card p-6 animate-fade-in-up animate-delay-100">
        <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
          {yearOptions.map((y) => (
            <button
              key={y}
              onClick={() => { setYear(y); setSelectedDay(null); }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                y === year ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-border"
              }`}
            >
              {y}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} disabled={!canGoPrev} className="p-2 rounded-lg hover:bg-muted active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h3 className="font-heading text-lg font-semibold text-foreground">{months[month]} {year}</h3>
          <button onClick={nextMonth} disabled={!canGoNext} className="p-2 rounded-lg hover:bg-muted active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-xs font-bold text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const isToday = isCurrentMonth && day === today;
            const acts = dayActivities(day);
            const hasAct = acts.length > 0;
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all duration-150 relative
                  ${isToday ? "bg-primary text-primary-foreground font-bold" : "hover:bg-garden-green-mist"}
                  ${isSelected && !isToday ? "bg-garden-green-pale font-bold ring-2 ring-primary" : ""}
                `}
              >
                {day}
                {hasAct && (
                  <div className="absolute bottom-0.5 flex gap-0.5">
                    {acts.some(a => a.type === "water") && <span className={`w-1.5 h-1.5 rounded-full ${isToday ? "bg-primary-foreground" : "bg-blue-500"}`} />}
                    {acts.some(a => a.type === "fertilize") && <span className={`w-1.5 h-1.5 rounded-full ${isToday ? "bg-primary-foreground" : "bg-primary"}`} />}
                    {acts.some(a => a.type === "prune") && <span className={`w-1.5 h-1.5 rounded-full ${isToday ? "bg-primary-foreground" : "bg-amber-500"}`} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="garden-card p-5 animate-fade-in-up">
          <h4 className="font-heading text-base font-semibold text-foreground mb-3">
            Atividades — Dia {selectedDay}
          </h4>
          {selectedActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma atividade programada.</p>
          ) : (
            <div className="space-y-2">
              {selectedActivities.map((act, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <span className="text-lg">{act.emoji}</span>
                  {activityIcon[act.type]}
                  <span className="text-sm font-semibold text-foreground">{activityLabel[act.type]}</span>
                  <span className="text-sm text-muted-foreground">— {act.plant}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {gardenPlants.length === 0 && !isLoading && (
        <div className="garden-card p-8 text-center animate-fade-in-up animate-delay-200">
          <span className="text-4xl block mb-3">🌱</span>
          <p className="text-sm text-muted-foreground">
            Adicione plantas no <strong>Meu Jardim</strong> para ver o calendário de cuidados.
          </p>
        </div>
      )}

      <div className="flex gap-4 text-xs text-muted-foreground animate-fade-in-up animate-delay-200">
        <span className="flex items-center gap-1.5">{activityIcon.water} Regar</span>
        <span className="flex items-center gap-1.5">{activityIcon.prune} Podar</span>
        <span className="flex items-center gap-1.5">{activityIcon.fertilize} Adubar</span>
      </div>
    </div>
  );
}
