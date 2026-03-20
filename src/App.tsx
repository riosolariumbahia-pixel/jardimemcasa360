import { GardenLayout } from "./components/GardenLayout";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import MyGardenPage from "./pages/MyGardenPage";
import CalendarPage from "./pages/CalendarPage";
import DiagnosisPage from "./pages/DiagnosisPage";
import PlanningPage from "./pages/PlanningPage";
import TipsPage from "./pages/TipsPage";
import EbookPage from "./pages/EbookPage";
import NotFound from "./pages/NotFound";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <GardenLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalogo" element={<CatalogPage />} />
            <Route path="/meu-jardim" element={<MyGardenPage />} />
            <Route path="/calendario" element={<CalendarPage />} />
            <Route path="/diagnostico" element={<DiagnosisPage />} />
            <Route path="/planejamento" element={<PlanningPage />} />
            <Route path="/dicas" element={<TipsPage />} />
            <Route path="/ebook" element={<EbookPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </GardenLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
