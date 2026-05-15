import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, LogOut, Shield, Store, Users } from "lucide-react";

import logo from "@/assets/izzy-barber-logo.png";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type ShopRow = { id: string; name: string; address: string; phone: string | null; created_at: string };
type RoleRow = { user_id: string; role: string };

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [appointmentsCount, setAppointmentsCount] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!isAdmin) {
      toast({ title: "Acesso restrito", description: "Esta área é exclusiva para administradores.", variant: "destructive" });
      navigate("/", { replace: true });
    }
  }, [authLoading, user, isAdmin, navigate, toast]);

  useEffect(() => {
    if (!isAdmin) return;
    void (async () => {
      setLoading(true);
      const [shopsRes, rolesRes, apptsRes] = await Promise.all([
        supabase.from("barber_shops").select("id, name, address, phone, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("appointments").select("id", { count: "exact", head: true }),
      ]);
      setShops((shopsRes.data ?? []) as ShopRow[]);
      setRoles((rolesRes.data ?? []) as RoleRow[]);
      setAppointmentsCount(apptsRes.count ?? 0);
      setLoading(false);
    })();
  }, [isAdmin]);

  if (authLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const counts = {
    admin: roles.filter((r) => r.role === "admin").length,
    barber: roles.filter((r) => r.role === "barber").length,
    client: roles.filter((r) => r.role === "client").length,
  };

  return (
    <main className="ambient-bg relative isolate min-h-screen">
      <div className="container relative z-10 py-6 sm:py-10">
        <header className="flex items-center justify-between gap-4 border-b border-border/60 pb-5">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Izzy Barber" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Izzy Barber</p>
              <p className="text-sm font-semibold text-foreground inline-flex items-center gap-2">
                <Shield className="size-3.5 text-brand" /> Painel administrativo
              </p>
            </div>
          </Link>
          <Button variant="ghost" size="pill" onClick={() => signOut()}>
            <LogOut className="size-4" /> Sair
          </Button>
        </header>

        <div className="mt-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Voltar
          </Link>
        </div>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="metric-tile">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground inline-flex items-center gap-1">
              <Store className="size-3 text-brand" /> Barbearias
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">{shops.length}</p>
          </div>
          <div className="metric-tile">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground inline-flex items-center gap-1">
              <Users className="size-3 text-brand" /> Clientes
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">{counts.client}</p>
          </div>
          <div className="metric-tile">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground inline-flex items-center gap-1">
              <Users className="size-3 text-brand" /> Barbeiros
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">{counts.barber}</p>
          </div>
          <div className="metric-tile">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Agendamentos</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{appointmentsCount}</p>
          </div>
        </section>

        <section className="glass-panel mt-6 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground">Barbearias cadastradas</h2>
          {shops.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nenhuma barbearia cadastrada ainda.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {shops.map((s) => (
                <li key={s.id} className="flex flex-col gap-1 rounded-xl border border-border/60 bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{s.name}</p>
                    <p className="text-sm text-muted-foreground">{s.address}</p>
                  </div>
                  {s.phone && <p className="text-sm text-muted-foreground">{s.phone}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass-panel mt-6 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground">Atalhos</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="pill">
              <Link to="/painel">Abrir painel da barbearia</Link>
            </Button>
            <Button asChild variant="outline" size="pill">
              <Link to="/buscar">Ver app do cliente</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Admin;
