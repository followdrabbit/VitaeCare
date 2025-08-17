import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Receitas from "./pages/Receitas";
import Oleos from "./pages/Oleos";
import Instrucoes from "./pages/Instrucoes";
import Sobre from "./pages/Sobre";
import PagueMeUmCafe from "./pages/PagueMeUmCafe";
import NotFound from "./pages/NotFound";
import Catalogo from "./pages/admin/Catalogo";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/receitas" element={<Receitas />} />
            <Route path="/oleos" element={<Oleos />} />
            <Route path="/instrucoes" element={<Instrucoes />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/pague-me-um-cafe" element={<PagueMeUmCafe />} />
            <Route path="/buy-me-a-coffee" element={<PagueMeUmCafe />} />
            <Route path="/invita-me-un-cafe" element={<PagueMeUmCafe />} />
            <Route path="/admin/catalogo" element={<Catalogo />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
