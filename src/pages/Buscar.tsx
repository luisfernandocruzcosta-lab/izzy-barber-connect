import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, Loader2, MapPin, Scissors, Search, Store } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import logo from "@/assets/izzy-barber-logo.png";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { buildSlots, formatPriceCents, formatTime, type AvailabilityRule } from "@/lib/booking";
import { openWhatsApp } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

type Shop = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  description: string | null;
  rating?: number;
  reviewCount?: number;
};

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
};

type Staff = {
  id: string;
  display_name: string;
  bio: string | null;
};

const Buscar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, user } = useAuth();

  const [search, setSearch] = useState("");
  const [shops, setShops] = useState<Shop[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);

  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loadingShopData, setLoadingShopData] = useState(false);

  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [busy, setBusy] = useState<{ starts_at: string; ends_at: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<Date | null>(null);

  // Carrega lista de barbearias
  useEffect(() => {
    const load = async () => {
      setLoadingShops(true);
      const { data, error } = await supabase
        .from("barber_shops")
        .select("id, name, address, phone, description")
        .order("name");
      if (error) {
        toast({ title: "Erro ao carregar barbearias", description: error.message, variant: "destructive" });
      }
      const list = (data ?? []) as Shop[];
      // Buscar ratings agregados
      if (list.length > 0) {
        const { data: revs } = await supabase
          .from("reviews")
          .select("shop_id, rating")
          .in("shop_id", list.map((s) => s.id));
        const agg: Record<string, { sum: number; count: number }> = {};
        for (const r of revs ?? []) {
          const cur = agg[r.shop_id] ?? { sum: 0, count: 0 };
          cur.sum += r.rating;
          cur.count += 1;
          agg[r.shop_id] = cur;
        }
        for (const s of list) {
          const a = agg[s.id];
          if (a) {
            s.rating = Math.round((a.sum / a.count) * 10) / 10;
            s.reviewCount = a.count;
          }
        }
      }
      setShops(list);
      setLoadingShops(false);
    };
    void load();
  }, [toast]);

  const filteredShops = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return shops;
    return shops.filter(
      (s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
    );
  }, [shops, search]);

  // Ao selecionar uma barbearia, carrega serviços e equipe
  useEffect(() => {
    if (!selectedShop) return;
    const load = async () => {
      setLoadingShopData(true);
      const [servicesRes, staffRes] = await Promise.all([
        supabase
          .from("services")
          .select("id, name, duration_minutes, price_cents")
          .eq("shop_id", selectedShop.id)
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("shop_staff")
          .select("id, display_name, bio")
          .eq("shop_id", selectedShop.id)
          .eq("is_bookable", true)
          .order("display_name"),
      ]);
      setServices(servicesRes.data ?? []);
      setStaff(staffRes.data ?? []);
      setSelectedServiceId(servicesRes.data?.[0]?.id ?? "");
      setSelectedStaffId(staffRes.data?.[0]?.id ?? "");
      setLoadingShopData(false);
    };
    void load();
  }, [selectedShop]);

  // Carrega disponibilidade do barbeiro + agendamentos do dia
  useEffect(() => {
    if (!selectedStaffId || !selectedShop) {
      setRules([]);
      setBusy([]);
      return;
    }
    const load = async () => {
      setLoadingSlots(true);
      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(23, 59, 59, 999);

      const [rulesRes, apptsRes] = await Promise.all([
        supabase
          .from("availability_rules")
          .select("weekday, start_time, end_time, is_active")
          .eq("staff_id", selectedStaffId),
        supabase
          .from("appointments")
          .select("starts_at, ends_at, status")
          .eq("staff_id", selectedStaffId)
          .gte("starts_at", dayStart.toISOString())
          .lte("starts_at", dayEnd.toISOString()),
      ]);

      setRules((rulesRes.data ?? []) as AvailabilityRule[]);
      setBusy(
        (apptsRes.data ?? [])
          .filter((a) => a.status !== "cancelled" && a.status !== "no_show")
          .map((a) => ({ starts_at: a.starts_at, ends_at: a.ends_at }))
      );
      setLoadingSlots(false);
    };
    void load();
  }, [selectedStaffId, selectedShop, selectedDate]);

  const selectedService = services.find((s) => s.id === selectedServiceId);

  const slots = useMemo(() => {
    if (!selectedService) return [];
    return buildSlots(selectedDate, selectedService.duration_minutes, rules, busy);
  }, [selectedDate, selectedService, rules, busy]);

  const handleBook = (slot: Date) => {
    if (!session || !user) {
      toast({ title: "Faça login para agendar" });
      navigate("/auth");
      return;
    }
    if (!selectedShop || !selectedService || !selectedStaffId) return;
    setPendingSlot(slot);
  };

  const confirmBooking = async () => {
    if (!pendingSlot || !user || !selectedShop || !selectedService || !selectedStaffId) return;

    setBooking(true);
    const ends = new Date(pendingSlot.getTime() + selectedService.duration_minutes * 60_000);

    const { error } = await supabase.from("appointments").insert({
      client_user_id: user.id,
      shop_id: selectedShop.id,
      staff_id: selectedStaffId,
      service_id: selectedService.id,
      starts_at: pendingSlot.toISOString(),
      ends_at: ends.toISOString(),
      status: "confirmed",
    });
    setBooking(false);

    if (error) {
      toast({ title: "Não foi possível agendar", description: error.message, variant: "destructive" });
      return;
    }
    const startedAt = pendingSlot;
    const shopPhone = selectedShop.phone;
    const shopName = selectedShop.name;
    const serviceName = selectedService.name;
    toast({
      title: "Agendamento confirmado!",
      description: `${serviceName} em ${format(startedAt, "dd/MM 'às' HH:mm")}`,
      action: shopPhone ? (
        <button
          onClick={() =>
            openWhatsApp(
              shopPhone,
              `Olá! Acabei de agendar ${serviceName} em ${shopName} para ${format(startedAt, "dd/MM 'às' HH:mm")}. Confirmando!`
            )
          }
          className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-background"
        >
          Avisar no WhatsApp
        </button>
      ) : undefined,
    });
    setPendingSlot(null);

    // Reload busy slots para refletir o novo agendamento
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);
    const refresh = await supabase
      .from("appointments")
      .select("starts_at, ends_at, status")
      .eq("staff_id", selectedStaffId)
      .gte("starts_at", dayStart.toISOString())
      .lte("starts_at", dayEnd.toISOString());
    setBusy(
      (refresh.data ?? [])
        .filter((a) => a.status !== "cancelled" && a.status !== "no_show")
        .map((a) => ({ starts_at: a.starts_at, ends_at: a.ends_at }))
    );
  };

  return (
    <main className="ambient-bg relative isolate min-h-screen">
      <div className="container relative z-10 py-6 sm:py-10">
        <header className="flex items-center justify-between gap-4 border-b border-border/60 pb-5">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Izzy Barber" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Izzy Barber</p>
              <p className="text-sm font-semibold text-foreground">Agendar</p>
            </div>
          </Link>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="pill">
              <Link to="/minhas-reservas">Minhas reservas</Link>
            </Button>
            {!session && (
              <Button asChild variant="hero" size="pill">
                <Link to="/auth">Entrar</Link>
              </Button>
            )}
          </div>
        </header>

        {!selectedShop ? (
          <section className="mt-8 space-y-6">
            <div className="space-y-3">
              <span className="gold-chip">encontre sua barbearia</span>
              <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
                Escolha onde quer agendar
              </h1>
              <div className="relative max-w-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome ou endereço"
                  className="rounded-xl bg-card pl-11"
                />
              </div>
            </div>

            {loadingShops ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredShops.length === 0 ? (
              <div className="glass-panel rounded-2xl p-8 text-center">
                <Store className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  {shops.length === 0
                    ? "Ainda não há barbearias cadastradas. Volte em breve."
                    : "Nenhuma barbearia encontrada com esse termo."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredShops.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedShop(s)}
                    className="glass-panel flex flex-col gap-3 rounded-2xl p-5 text-left transition-transform hover:-translate-y-1 hover:border-foreground/20"
                  >
                    <div className="flex size-11 items-center justify-center rounded-full border border-border/70 bg-secondary/70">
                      <Store className="size-5 text-foreground" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xl font-semibold text-foreground">{s.name}</h3>
                      {s.rating && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/70 px-2 py-0.5 text-xs font-semibold text-foreground">
                          ★ {s.rating.toFixed(1)}
                          <span className="text-muted-foreground">({s.reviewCount})</span>
                        </span>
                      )}
                    </div>
                    <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="size-4" /> {s.address}
                    </p>
                    {s.description && (
                      <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{s.description}</p>
                    )}
                    <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand">
                      Ver horários <CalendarDays className="size-4" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="mt-8 space-y-6">
            <button
              onClick={() => setSelectedShop(null)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> Voltar para a busca
            </button>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="space-y-5">
                <div>
                  <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{selectedShop.name}</h1>
                  <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4" /> {selectedShop.address}
                  </p>
                </div>

                {loadingShopData ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : services.length === 0 || staff.length === 0 ? (
                  <div className="glass-panel rounded-2xl p-6 text-sm text-muted-foreground">
                    Esta barbearia ainda não cadastrou {services.length === 0 ? "serviços" : "barbeiros"} para
                    agendamento.
                  </div>
                ) : (
                  <div className="glass-panel space-y-4 rounded-2xl p-5 sm:p-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Serviço
                        </label>
                        <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                          <SelectTrigger className="rounded-xl bg-card">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name} — {formatPriceCents(s.price_cents)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Barbeiro
                        </label>
                        <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                          <SelectTrigger className="rounded-xl bg-card">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {staff.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.display_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Data</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn("w-full justify-start rounded-xl bg-card text-left font-normal")}
                          >
                            <CalendarDays className="mr-2 size-4" />
                            {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(d) => d && setSelectedDate(d)}
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return date < today;
                            }}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Horários disponíveis
                      </label>
                      {loadingSlots ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="size-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : rules.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Este barbeiro ainda não definiu horários de atendimento.
                        </p>
                      ) : slots.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Sem horários para esta data. Tente outro dia.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                          {slots.map((slot) => (
                            <Button
                              key={slot.toISOString()}
                              variant="outline"
                              size="sm"
                              disabled={booking}
                              onClick={() => handleBook(slot)}
                              className="rounded-lg bg-card"
                            >
                              {formatTime(slot)}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <aside className="space-y-4">
                <div className="glass-panel rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">resumo</p>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">Confirmação imediata</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Ao tocar em um horário, sua reserva é registrada na hora. Você pode cancelar em "Minhas reservas".
                  </p>
                  {selectedService && (
                    <div className="mt-4 space-y-2 border-t border-border/60 pt-4 text-sm">
                      <p className="flex items-center justify-between gap-2 text-foreground">
                        <span className="inline-flex items-center gap-2">
                          <Scissors className="size-4 text-brand" /> {selectedService.name}
                        </span>
                        <span className="font-semibold">{formatPriceCents(selectedService.price_cents)}</span>
                      </p>
                      <p className="text-muted-foreground">{selectedService.duration_minutes} min</p>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </section>
        )}
      </div>

      <Dialog open={!!pendingSlot} onOpenChange={(o) => !o && !booking && setPendingSlot(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar agendamento</DialogTitle>
            <DialogDescription>Revise os detalhes antes de confirmar.</DialogDescription>
          </DialogHeader>

          {pendingSlot && selectedService && selectedShop && (
            <div className="space-y-3 rounded-xl border border-border/60 bg-card/60 p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Barbearia</span>
                <span className="text-right font-medium text-foreground">{selectedShop.name}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Serviço</span>
                <span className="text-right font-medium text-foreground">
                  {selectedService.name} · {selectedService.duration_minutes} min
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Barbeiro</span>
                <span className="text-right font-medium text-foreground">
                  {staff.find((s) => s.id === selectedStaffId)?.display_name ?? "—"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Data e hora</span>
                <span className="text-right font-medium text-foreground">
                  {format(pendingSlot, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3 border-t border-border/60 pt-3">
                <span className="text-muted-foreground">Total</span>
                <span className="text-right text-base font-semibold text-brand">
                  {formatPriceCents(selectedService.price_cents)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setPendingSlot(null)} disabled={booking}>
              Voltar
            </Button>
            <Button variant="hero" onClick={confirmBooking} disabled={booking}>
              {booking && <Loader2 className="size-4 animate-spin" />}
              Confirmar agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Buscar;
