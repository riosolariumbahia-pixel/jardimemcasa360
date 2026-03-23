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
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

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
        <Route path="/" element={<HomePage />} />
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/meu-jardim" element={<MyGardenPage />} />
        <Route path="/adubacao" element={<FertilizationPage />} />
        <Route path="/calendario" element={<CalendarPage />} />
        <Route path="/diagnostico" element={<DiagnosisPage />} />
        <Route path="/planejamento" element={<PlanningPage />} />
        <Route path="/dicas" element={<TipsPage />} />
        <Route path="/ebook" element={<EbookPage />} />
        <Route path="*" element={<NotFound />} />
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
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
