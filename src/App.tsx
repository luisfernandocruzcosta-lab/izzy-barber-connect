import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import FloatingDots from "@/components/FloatingDots";
import Index from "./pages/Index.tsx";

// Code-splitting: rotas secundárias carregam só quando acessadas.
// Isso remove recharts, supabase pesado etc. do bundle inicial.
const Auth = lazy(() => import("./pages/Auth.tsx"));
const Painel = lazy(() => import("./pages/Painel.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const Buscar = lazy(() => import("./pages/Buscar.tsx"));
const MinhasReservas = lazy(() => import("./pages/MinhasReservas.tsx"));
const Perfil = lazy(() => import("./pages/Perfil.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Demo = lazy(() => import("./pages/Demo.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="flex min-h-[40vh] w-full items-center justify-center">
    <div className="size-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <FloatingDots />
        <AuthProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/painel" element={<Painel />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/buscar" element={<Buscar />} />
              <Route path="/minhas-reservas" element={<MinhasReservas />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/demo" element={<Demo />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
