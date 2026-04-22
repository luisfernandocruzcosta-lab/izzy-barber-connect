import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, Loader2, Scissors, Store, X } from "lucide-react";

import logo from "@/assets/izzy-barber-logo.png";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatPriceCents, formatTime } from "@/lib/booking";

type Reservation = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  service: { name: string; price_cents: number } | null;
  shop: { name: string; address: string } | null;
  staff: { display_name: string } | null;
};

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

const MinhasReservas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select(
        `id, starts_at, ends_at, status,
         service:services(name, price_cents),
         shop:barber_shops(name, address),
         staff:shop_staff(display_name)`
      )
      .eq("client_user_id", user.id)
      .order("starts_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar reservas", description: error.message, variant: "destructive" });
    }
    setReservations((data ?? []) as unknown as Reservation[]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCancel = async (id: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) {
      toast({ title: "Erro ao cancelar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Reserva cancelada" });
    void load();
  };

  if (authLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="ambient-bg relative isolate min-h-screen">
      <div className="container relative z-10 py-6 sm:py-10">
        <header className="flex items-center justify-between gap-4 border-b border-border/60 pb-5">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Izzy Barber" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Izzy Barber</p>
              <p className="text-sm font-semibold text-foreground">Minhas reservas</p>
            </div>
          </Link>
          <Button asChild variant="hero" size="pill">
            <Link to="/buscar">Novo agendamento</Link>
          </Button>
        </header>

        <div className="mt-6">
          <Link
            to="/buscar"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Voltar
          </Link>
        </div>

        {reservations.length === 0 ? (
          <div className="glass-panel mt-8 rounded-2xl p-10 text-center">
            <CalendarDays className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">Você ainda não tem reservas</h2>
            <p className="mt-2 text-sm text-muted-foreground">Encontre uma barbearia e agende em segundos.</p>
            <Button asChild variant="hero" size="pill" className="mt-5">
              <Link to="/buscar">Buscar barbearias</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {reservations.map((r) => {
              const isUpcoming = new Date(r.starts_at) > new Date() && r.status !== "cancelled";
              return (
                <li key={r.id} className="glass-panel flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm uppercase tracking-[0.14em] text-muted-foreground">
                      {formatDate(r.starts_at)} · {formatTime(r.starts_at)}
                    </p>
                    <p className="text-lg font-semibold text-foreground inline-flex items-center gap-2">
                      <Scissors className="size-4 text-brand" /> {r.service?.name ?? "Serviço"}
                    </p>
                    <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
                      <Store className="size-3.5" /> {r.shop?.name} · {r.staff?.display_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="rounded-full border border-border/70 bg-card px-3 py-1 text-xs uppercase tracking-[0.12em] text-foreground">
                        {statusLabel[r.status] ?? r.status}
                      </span>
                      {r.service && (
                        <p className="mt-2 text-sm font-semibold text-brand">
                          {formatPriceCents(r.service.price_cents)}
                        </p>
                      )}
                    </div>
                    {isUpcoming && (
                      <Button variant="outline" size="sm" onClick={() => handleCancel(r.id)}>
                        <X className="size-4" /> Cancelar
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
};

export default MinhasReservas;
