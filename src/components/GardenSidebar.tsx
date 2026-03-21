import { Home, Leaf, TreeDeciduous, Calendar, Stethoscope, ClipboardList, Lightbulb, BookOpen, Menu, X, Sprout, Beaker } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState } from "react";

const navItems = [
  { title: "Início", url: "/", icon: Home },
  { title: "Catálogo de Plantas", url: "/catalogo", icon: Leaf },
  { title: "Meu Jardim", url: "/meu-jardim", icon: TreeDeciduous },
  { title: "Adubação", url: "/adubacao", icon: Beaker },
  { title: "Calendário", url: "/calendario", icon: Calendar },
  { title: "Diagnóstico", url: "/diagnostico", icon: Stethoscope },
  { title: "Planejamento", url: "/planejamento", icon: ClipboardList },
  { title: "Dicas e Sugestões", url: "/dicas", icon: Lightbulb },
  { title: "E-book", url: "/ebook", icon: BookOpen },
];

export function GardenSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg garden-sidebar-gradient text-primary-foreground shadow-lg active:scale-95 transition-transform"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" />
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
        <nav className="flex-1 px-3 py-2 space-y-1 scroll-thin overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/"}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/15 hover:text-sidebar-foreground transition-all duration-200 border-l-[3px] border-transparent"
              activeClassName="bg-sidebar-accent/15 text-sidebar-foreground border-l-[3px] !border-garden-green-pale font-semibold"
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="w-4.5 h-4.5 shrink-0" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-sidebar-border/30">
          <p className="text-xs text-sidebar-foreground/40 flex items-center gap-1.5">
            <Sprout className="w-3 h-3" />
            Jardim 360º v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
