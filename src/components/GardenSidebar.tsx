import { Leaf, TreeDeciduous, Calendar, Stethoscope, ClipboardList, Lightbulb, BookOpen, Menu, X, Sprout, Beaker, LogOut, Bot, Camera, Activity, Eye, Crown, Lock } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

// `tier` define o que cada item exige:
// - "free": acessível para todos
// - "free-limited": acessível mas com restrições internas (ex.: 1 diag/dia, ver sem adicionar)
// - "premium": bloqueado para Free (mostra cadeado)
const NAV_ITEMS = [
  { label: "Meu Jardim", path: "/meu-jardim", Icon: TreeDeciduous, tier: "free-limited" },
  { label: "Dashboard IA", path: "/dashboard", Icon: Activity, tier: "premium" },
  { label: "Percepções", path: "/percepcoes", Icon: Eye, tier: "premium" },
  { label: "Assistente IA", path: "/assistente", Icon: Bot, tier: "premium" },
  { label: "Diagnóstico IA", path: "/diagnostico-ia", Icon: Camera, tier: "free-limited" },
  { label: "Catálogo de Plantas", path: "/catalogo", Icon: Leaf, tier: "free-limited" },
  { label: "Adubação", path: "/adubacao", Icon: Beaker, tier: "premium" },
  { label: "Calendário", path: "/calendario", Icon: Calendar, tier: "premium" },
  { label: "Diagnóstico Manual", path: "/diagnostico", Icon: Stethoscope, tier: "premium" },
  { label: "Planejamento", path: "/planejamento", Icon: ClipboardList, tier: "premium" },
  { label: "Dicas e Sugestões", path: "/dicas", Icon: Lightbulb, tier: "premium" },
  { label: "E-book", path: "/ebook", Icon: BookOpen, tier: "premium" },
  { label: "Planos Premium", path: "/planos", Icon: Crown, tier: "free" },
] as const;

export function GardenSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { isPremium } = useSubscription();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };
  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-2 left-2 z-50 p-1.5 rounded-md garden-sidebar-gradient text-primary-foreground shadow-md active:scale-95 transition-transform opacity-90"
        aria-label="Abrir menu"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-foreground/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          garden-sidebar-gradient flex flex-col h-full
          w-64 min-w-[256px] shrink-0
          fixed md:sticky top-0 left-0 z-50 md:z-auto
          transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Close button mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden absolute top-4 right-4 text-sidebar-foreground/70 hover:text-sidebar-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sidebar-accent/20 flex items-center justify-center">
            <Sprout className="w-6 h-6 text-garden-green-pale" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold text-sidebar-foreground">
              Jardim 360º
            </h1>
            <p className="text-xs text-sidebar-foreground/60">
              Seu jardim em casa
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-2 space-y-1 scroll-thin overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isLocked = item.tier === "premium" && !isPremium;
            const isLimited = item.tier === "free-limited" && !isPremium;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/meu-jardim"}
                className="flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/15 hover:text-sidebar-foreground transition-all duration-200 border-l-[3px] border-transparent"
                activeClassName="bg-sidebar-accent/15 text-sidebar-foreground border-l-[3px] !border-garden-green-pale font-semibold"
                onClick={() => setMobileOpen(false)}
              >
                <item.Icon className="w-[18px] h-[18px] shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {isLocked && (
                  <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-400/20 text-amber-200 px-1.5 py-0.5 rounded-full border border-amber-300/30">
                    <Lock className="w-2.5 h-2.5" />
                    PRO
                  </span>
                )}
                {isLimited && (
                  <span className="text-[10px] font-semibold text-sidebar-foreground/50">
                    Grátis
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-sidebar-border/30 space-y-3">
          {user && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-sidebar-foreground/60 truncate max-w-[160px]">{user.email}</p>
              <button onClick={handleLogout} className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors" title="Sair">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
          <p className="text-xs text-sidebar-foreground/40 flex items-center gap-1.5">
            <Sprout className="w-3 h-3" />
            Jardim 360º v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
