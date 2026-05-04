import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, CalendarSync, Loader2, MessageCircle, Scissors, Sparkles, Star, Store, X } from "lucide-react";

import logo from "@/assets/izzy-barber-logo.png";
import { Button } from "@/components/ui/button";
import { RescheduleDialog } from "@/components/RescheduleDialog";
import { ReviewDialog } from "@/components/ReviewDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatPriceCents, formatTime } from "@/lib/booking";
import { openWhatsApp } from "@/lib/whatsapp";

type Reservation = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  staff_id: string;
  service_id: string;
  shop_id: string;
  service: { name: string; price_cents: number; duration_minutes: number } | null;
  shop: { name: string; address: string; phone: string | null } | null;
  staff: { display_name: string } | null;
};

type LoyaltyRow = {
  shop_id: string;
  points_balance: number;
  total_visits: number;
  shop: { name: string } | null;
};

const MinhasReservas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyRow[]>([]);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [rescheduling, setRescheduling] = useState<Reservation | null>(null);
  const [reviewing, setReviewing] = useState<Reservation | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [resv, loy, rev] = await Promise.all([
      supabase
        .from("appointments")
        .select(
          `id, starts_at, ends_at, status, staff_id, service_id, shop_id,
           service:services(name, price_cents, duration_minutes),
           shop:barber_shops(name, address, phone),
           staff:shop_staff(display_name)`
        )
        .eq("client_user_id", user.id)
        .order("starts_at", { ascending: false }),
      supabase
        .from("loyalty_accounts")
        .select("shop_id, points_balance, total_visits, shop:barber_shops(name)")
        .eq("client_user_id", user.id),
      supabase.from("reviews").select("appointment_id").eq("client_user_id", user.id),
    ]);

    if (resv.error) toast({ title: "Erro", description: "Não foi possível concluir a operação. Tente novamente.", variant: "destructive" });

    setReservations((resv.data ?? []) as unknown as Reservation[]);
    setLoyalty((loy.data ?? []) as unknown as LoyaltyRow[]);
    setReviewedIds(new Set((rev.data ?? []).map((r) => r.appointment_id)));
    setLoading(false);
  };

  useEffect(() => {
    if (user) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCancel = async (id: string) => {
    const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast({ title: "Erro ao cancelar", description: "Não foi possível concluir a operação. Tente novamente.", variant: "destructive" });
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
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Voltar
          </Link>
        </div>

        {loyalty.length > 0 && (
          <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {loyalty.map((l) => (
              <div key={l.shop_id} className="metric-tile">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground inline-flex items-center gap-1">
                  <Sparkles className="size-3 text-brand" /> Fidelidade
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">{l.shop?.name ?? "Barbearia"}</p>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-brand">{l.points_balance}</span>
                  <span className="text-xs text-muted-foreground">pontos · {l.total_visits} visitas</span>
                </div>
              </div>
            ))}
          </section>
        )}

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
              const canReview = r.status === "completed" && !reviewedIds.has(r.id);
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
                  <div className="flex flex-col items-end gap-3 sm:items-end">
                    <div className="text-right">
                      <StatusBadge status={r.status} />
                      {r.service && (
                        <p className="mt-2 text-sm font-semibold text-brand">{formatPriceCents(r.service.price_cents)}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {r.shop?.phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openWhatsApp(
                              r.shop!.phone as string,
                              `Olá! Quero falar sobre meu agendamento (${formatDate(r.starts_at)} ${formatTime(r.starts_at)}).`
                            )
                          }
                        >
                          <MessageCircle className="size-4" />
                        </Button>
                      )}
                      {canReview && (
                        <Button variant="hero" size="sm" onClick={() => setReviewing(r)}>
                          <Star className="size-4" /> Avaliar
                        </Button>
                      )}
                      {isUpcoming && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setRescheduling(r)}>
                            <CalendarSync className="size-4" /> Reagendar
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleCancel(r.id)}>
                            <X className="size-4" /> Cancelar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <RescheduleDialog
        open={!!rescheduling}
        onOpenChange={(o) => !o && setRescheduling(null)}
        appointment={
          rescheduling
            ? {
                id: rescheduling.id,
                staff_id: rescheduling.staff_id,
                service_id: rescheduling.service_id,
                duration_minutes: rescheduling.service?.duration_minutes ?? 30,
                starts_at: rescheduling.starts_at,
              }
            : null
        }
        onRescheduled={() => void load()}
      />

      <ReviewDialog
        open={!!reviewing}
        onOpenChange={(o) => !o && setReviewing(null)}
        appointment={
          reviewing
            ? {
                id: reviewing.id,
                shop_id: reviewing.shop_id,
                staff_id: reviewing.staff_id,
                shop_name: reviewing.shop?.name,
              }
            : null
        }
        onSubmitted={() => void load()}
      />
    </main>
  );
};

export default MinhasReservas;
