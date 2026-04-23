import { useMemo } from "react";
import { Activity, AlertTriangle, CheckCircle, Droplets, Sprout, TrendingUp, Sparkles, Calendar, AlertOctagon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useGardenPlants } from "@/hooks/useGardenPlants";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { computePlantStatus } from "@/lib/plantHealth";

export default function DashboardPage() {
  const { plants: rawPlants, isLoading } = useGardenPlants();
  const navigate = useNavigate();

  const gardenPlants = useMemo(
    () => rawPlants.map((p) => ({ ...p, status: computePlantStatus(p) })),
    [rawPlants]
  );

  const stats = useMemo(() => {
    if (!gardenPlants.length) return null;
    const totalHealth = gardenPlants.reduce((sum, p) => sum + p.status.health, 0);
    const avgHealth = Math.round(totalHealth / gardenPlants.length);
    const needWater = gardenPlants.filter((p) => p.status.needsWater).length;
    const needFertilizer = gardenPlants.filter((p) => p.status.needsFertilizer).length;
    const needPruning = gardenPlants.filter((p) => p.status.needsPruning).length;
    const healthyPlants = gardenPlants.filter((p) => p.status.health >= 70).length;
    const sickPlants = gardenPlants.filter((p) => p.status.health < 50).length;
    const criticalPlants = gardenPlants.filter((p) => p.status.alertLevel === "critico").length;
    return { avgHealth, needWater, needFertilizer, needPruning, healthyPlants, sickPlants, criticalPlants, total: gardenPlants.length };
  }, [gardenPlants]);

  const alerts = useMemo(() => {
    const items: { text: string; priority: "alta" | "media" | "baixa"; icon: any }[] = [];
    gardenPlants.forEach((p) => {
      const s = p.status;
      if (s.waterStatus === "critico") {
        items.push({ text: `${p.emoji} ${p.name}: sem água há ${s.daysSinceWater} dias — risco de morte!`, priority: "alta", icon: AlertOctagon });
      } else if (s.waterStatus === "atrasado") {
        items.push({ text: `${p.emoji} ${p.name}: regar agora (atrasado)`, priority: "media", icon: Droplets });
      }
      if (s.fertilizerStatus === "critico") {
        items.push({ text: `${p.emoji} ${p.name}: sem adubo há ${s.daysSinceFertilizer} dias — desenvolvimento parado`, priority: "alta", icon: AlertOctagon });
      } else if (s.fertilizerStatus === "atrasado") {
        items.push({ text: `${p.emoji} ${p.name}: adubar com Adubei NPK 5-15-5`, priority: "media", icon: Sprout });
      }
    });
    return items.sort((a, b) => (a.priority === "alta" ? -1 : 1)).slice(0, 8);
  }, [gardenPlants]);

  const todayTasks = useMemo(() => {
    const tasks: string[] = [];
    gardenPlants.forEach((p) => {
      if (p.status.needsWater) tasks.push(`Regar ${p.emoji} ${p.name}`);
      if (p.status.needsFertilizer) tasks.push(`Adubar ${p.emoji} ${p.name} com Adubei NPK 5-15-5`);
      if (p.status.needsPruning) tasks.push(`Podar ${p.emoji} ${p.name}`);
    });
    return tasks.slice(0, 6);
  }, [gardenPlants]);

  const healthColor = (v: number) => (v >= 70 ? "text-green-600" : v >= 50 ? "text-yellow-600" : "text-red-600");

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Sprout className="w-8 h-8 animate-bounce text-primary" /></div>;
  }

  if (!stats) {
    return (
      <div className="text-center py-16 space-y-4">
        <Sparkles className="w-12 h-12 mx-auto text-muted-foreground" />
        <h2 className="font-heading text-xl font-bold text-foreground">Dashboard Inteligente</h2>
        <p className="text-muted-foreground">Adicione plantas ao seu jardim para ver insights personalizados.</p>
        <Button onClick={() => navigate("/meu-jardim")}>Ir para Meu Jardim</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-2">
          <Activity className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-lg font-bold text-foreground">Dashboard Inteligente</h1>
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
      </div>

      {/* Health Score */}
      <Card className="border-2 border-primary/20">
        <CardContent className="p-6 text-center">
          <p className="text-xs text-muted-foreground mb-2">Saúde Geral do Jardim</p>
          <div className={`text-5xl font-heading font-bold ${healthColor(stats.avgHealth)}`}>{stats.avgHealth}</div>
          <p className="text-xs text-muted-foreground mt-1">de 100 pontos</p>
          <Progress value={stats.avgHealth} className="mt-3 max-w-xs mx-auto" />
          <div className="flex justify-center gap-6 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> {stats.healthyPlants} saudáveis</span>
            <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-500" /> {stats.sickPlants} atenção</span>
            <span className="flex items-center gap-1"><Sprout className="w-3 h-3 text-primary" /> {stats.total} total</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Droplets className="w-6 h-6 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold text-foreground">{stats.needWater}</p>
            <p className="text-xs text-muted-foreground">Precisam de água</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Sprout className="w-6 h-6 mx-auto text-green-600 mb-1" />
            <p className="text-2xl font-bold text-foreground">{stats.needFertilizer}</p>
            <p className="text-xs text-muted-foreground">Precisam de adubo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto text-orange-500 mb-1" />
            <p className="text-2xl font-bold text-foreground">{stats.needPruning}</p>
            <p className="text-xs text-muted-foreground">Precisam de poda</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-yellow-500" /> Alertas IA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className={`flex items-center gap-3 p-2 rounded-lg text-sm ${a.priority === "alta" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{a.text}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Today Tasks */}
      {todayTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Tarefas do Dia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayTasks.map((t, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-accent/50 text-sm text-foreground">
                <CheckCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{t}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => navigate("/assistente")} className="h-auto py-3">
          <Sparkles className="w-4 h-4 mr-2" /> Perguntar à IA
        </Button>
        <Button variant="outline" onClick={() => navigate("/insights")} className="h-auto py-3">
          <TrendingUp className="w-4 h-4 mr-2" /> Ver Insights
        </Button>
      </div>
    </div>
  );
}
