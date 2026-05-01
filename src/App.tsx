import { useRef } from "react";
import { GardenLayout } from "./components/GardenLayout";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import MyGardenPage from "./pages/MyGardenPage";
import CalendarPage from "./pages/CalendarPage";
import DiagnosisPage from "./pages/DiagnosisPage";
import PlanningPage from "./pages/PlanningPage";
import TipsPage from "./pages/TipsPage";
import EbookPage from "./pages/EbookPage";
import FertilizationPage from "./pages/FertilizationPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import AssistantPage from "./pages/AssistantPage";
import DiagnosisAIPage from "./pages/DiagnosisAIPage";
import DashboardPage from "./pages/DashboardPage";
import PercepcionsPage from "./pages/PercepcionsPage";
import PricingPage from "./pages/PricingPage";
import CheckoutReturnPage from "./pages/CheckoutReturnPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminAnunciantesPage from "./pages/admin/AdminAnunciantesPage";
import AdminAnunciosPage from "./pages/admin/AdminAnunciosPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PremiumGate } from "@/components/PremiumGate";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const checkedInitialRouteRef = useRef(false);

  if (user && !loading && !checkedInitialRouteRef.current) {
    checkedInitialRouteRef.current = true;
    if (location.pathname === "/ebook") {
      return <Navigate to="/meu-jardim" replace />;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <span className="text-4xl block mb-3 animate-bounce">🌱</span>
          <p className="text-sm text-muted-foreground">Carregando seu jardim...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <GardenLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/meu-jardim" replace />} />
        {/* Free (limitado): visualização do jardim e catálogo, e 1 diagnóstico/dia */}
        <Route path="/meu-jardim" element={<MyGardenPage />} />
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/diagnostico-ia" element={<DiagnosisAIPage />} />
        {/* Acesso livre */}
        <Route path="/planos" element={<PricingPage />} />
        <Route path="/checkout/return" element={<CheckoutReturnPage />} />
        {/* Premium: bloqueado para Free */}
        <Route path="/adubacao" element={<PremiumGate title="Adubação Inteligente 🌱" description="Receba recomendações personalizadas de adubação para cada planta do seu jardim."><FertilizationPage /></PremiumGate>} />
        <Route path="/calendario" element={<PremiumGate title="Calendário do Jardim 📅" description="Programe regas, adubação e podas com lembretes automáticos."><CalendarPage /></PremiumGate>} />
        <Route path="/diagnostico" element={<PremiumGate title="Diagnóstico Manual 🔍" description="Use o guia passo a passo para identificar problemas das suas plantas."><DiagnosisPage /></PremiumGate>} />
        <Route path="/planejamento" element={<PremiumGate title="Planejamento do Jardim 📐" description="Calcule capacidade de vasos, jardineiras verticais e organize seu espaço."><PlanningPage /></PremiumGate>} />
        <Route path="/dicas" element={<PremiumGate title="Dicas e Sugestões 💡" description="Conteúdo exclusivo de cuidados e curiosidades do jardim em casa."><TipsPage /></PremiumGate>} />
        <Route path="/ebook" element={<PremiumGate title="E-book Jardim 360º 📖" description="Acesso completo ao guia digital para criar e cuidar do seu jardim."><EbookPage /></PremiumGate>} />
        <Route path="/assistente" element={<PremiumGate title="Assistente IA 🤖" description="Converse com a IA para tirar dúvidas e cuidar das suas plantas em tempo real."><AssistantPage /></PremiumGate>} />
        <Route path="/dashboard" element={<PremiumGate title="Dashboard Inteligente 📊" description="Visão geral do Health Score do seu jardim com insights de IA."><DashboardPage /></PremiumGate>} />
        <Route path="/percepcoes" element={<PremiumGate title="Percepções IA 🧠" description="Recomendações inteligentes e análises personalizadas do seu jardim."><PercepcionsPage /></PremiumGate>} />
        <Route path="*" element={<Navigate to="/meu-jardim" replace />} />
      </Routes>
    </GardenLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/anunciantes" element={<AdminAnunciantesPage />} />
            <Route path="/admin/anuncios" element={<AdminAnunciosPage />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
