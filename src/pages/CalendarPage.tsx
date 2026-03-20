import { useState } from "react";
import { ChevronLeft, ChevronRight, Droplets, Scissors, Pill } from "lucide-react";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface Activity {
  day: number;
  type: "water" | "prune" | "fertilize";
  plant: string;
}

const sampleActivities: Activity[] = [
  { day: 3, type: "water", plant: "Manjericão" },
  { day: 5, type: "prune", plant: "Hortelã" },
  { day: 8, type: "fertilize", plant: "Tomate Cereja" },
  { day: 10, type: "water", plant: "Alecrim" },
  { day: 12, type: "water", plant: "Morango" },
  { day: 15, type: "prune", plant: "Manjericão" },
  { day: 18, type: "water", plant: "Hortelã" },
  { day: 20, type: "fertilize", plant: "Suculenta" },
  { day: 22, type: "water", plant: "Tomate Cereja" },
  { day: 25, type: "water", plant: "Alecrim" },
  { day: 28, type: "prune", plant: "Morango" },
];

const activityIcon = {
  water: <Droplets className="w-3.5 h-3.5 text-blue-500" />,
  prune: <Scissors className="w-3.5 h-3.5 text-amber-600" />,
  fertilize: <Pill className="w-3.5 h-3.5 text-garden-green" />,
};

const activityLabel = { water: "Regar", prune: "Podar", fertilize: "Adubar" };

export default function CalendarPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();
  const isCurrentMonth = now.getMonth() === month && now.getFullYear() === year;

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const dayActivities = (day: number) => sampleActivities.filter((a) => a.day === day);
  const selectedActivities = selectedDay ? dayActivities(selectedDay) : [];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <h2 className="font-heading text-2xl font-bold text-foreground">Calendário 📅</h2>
        <p className="text-sm text-muted-foreground">Planeje os cuidados com suas plantas</p>
      </div>

      <div className="garden-card p-6 animate-fade-in-up animate-delay-100">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted active:scale-95 transition-all">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            {months[month]} {year}
          </h3>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted active:scale-95 transition-all">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Week days */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-xs font-bold text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const isToday = isCurrentMonth && day === today;
            const hasAct = dayActivities(day).length > 0;
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
                  <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isToday ? "bg-primary-foreground" : "bg-garden-brown-dark"}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day activities */}
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
                  {activityIcon[act.type]}
                  <span className="text-sm font-semibold text-foreground">{activityLabel[act.type]}</span>
                  <span className="text-sm text-muted-foreground">— {act.plant}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground animate-fade-in-up animate-delay-200">
        <span className="flex items-center gap-1.5">{activityIcon.water} Regar</span>
        <span className="flex items-center gap-1.5">{activityIcon.prune} Podar</span>
        <span className="flex items-center gap-1.5">{activityIcon.fertilize} Adubar</span>
      </div>
    </div>
  );
}
