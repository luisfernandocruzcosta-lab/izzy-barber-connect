import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarCheck,
  CalendarDays,
  CalendarSync,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  LogOut,
  MessageCircle,
  Plus,
  Scissors,
  Store,
  Trash2,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

import logo from "@/assets/izzy-barber-logo.png";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RescheduleDialog } from "@/components/RescheduleDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatPriceCents, formatTime } from "@/lib/booking";
import { openWhatsApp } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

type Shop = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  description: string | null;
};

type Staff = { id: string; display_name: string; bio: string | null; is_bookable: boolean };
type Service = { id: string; name: string; duration_minutes: number; price_cents: number; is_active: boolean };
type Rule = { id: string; staff_id: string; weekday: number; start_time: string; end_time: string; is_active: boolean };
type Appt = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  staff_id: string;
  service_id: string;
  service: { name: string; price_cents: number; duration_minutes: number } | null;
  staff: { display_name: string } | null;
  client: { full_name: string | null; phone: string | null } | null;
};

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

type FinancePeriod = "today" | "week" | "month";

const Painel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isBarber, loading: authLoading, signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<Shop | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [agendaAppts, setAgendaAppts] = useState<Appt[]>([]);
  const [financeAppts, setFinanceAppts] = useState<Appt[]>([]);

  const [agendaDate, setAgendaDate] = useState<Date>(new Date());
  const [financePeriod, setFinancePeriod] = useState<FinancePeriod>("today");
  const [rescheduling, setRescheduling] = useState<Appt | null>(null);

  const [shopForm, setShopForm] = useState({ name: "", address: "", phone: "", description: "" });
  const [staffForm, setStaffForm] = useState({ display_name: "", bio: "" });
  const [serviceForm, setServiceForm] = useState({ name: "", duration: "30", price: "" });
  const [ruleForm, setRuleForm] = useState({ staff_id: "", weekday: "1", start: "09:00", end: "18:00" });
  const [savingShop, setSavingShop] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!isBarber) {
      toast({ title: "Acesso restrito", description: "Esta área é exclusiva para barbearias.", variant: "destructive" });
      navigate("/", { replace: true });
    }
  }, [authLoading, user, isBarber, navigate, toast]);

  const fetchAppts = async (shopId: string, from: Date, to: Date): Promise<Appt[]> => {
    const { data } = await supabase
      .from("appointments")
      .select(
        `id, starts_at, ends_at, status, staff_id, service_id, client_user_id,
         service:services(name, price_cents, duration_minutes),
         staff:shop_staff(display_name)`
      )
      .eq("shop_id", shopId)
      .gte("starts_at", from.toISOString())
      .lte("starts_at", to.toISOString())
      .order("starts_at");

    const raw = (data ?? []) as Array<Omit<Appt, "client"> & { client_user_id: string }>;
    const clientIds = Array.from(new Set(raw.map((a) => a.client_user_id)));
    let profilesMap: Record<string, { full_name: string | null; phone: string | null }> = {};
    if (clientIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .in("id", clientIds);
      profilesMap = Object.fromEntries(
        (profilesData ?? []).map((p) => [p.id, { full_name: p.full_name, phone: p.phone }])
      );
    }
    return raw.map((a) => ({
      ...a,
      client: profilesMap[a.client_user_id] ?? { full_name: null, phone: null },
    }));
  };

  const reloadAgenda = async (shopId: string, date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    setAgendaAppts(await fetchAppts(shopId, dayStart, dayEnd));
  };

  const reloadFinance = async (shopId: string, period: FinancePeriod) => {
    const now = new Date();
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    if (period === "week") from.setDate(from.getDate() - 6);
    if (period === "month") from.setDate(from.getDate() - 29);
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);
    setFinanceAppts(await fetchAppts(shopId, from, to));
  };

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);

    const { data: shopData } = await supabase
      .from("barber_shops")
      .select("id, name, address, phone, description")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (!shopData) {
      setShop(null);
      setStaff([]);
      setServices([]);
      setRules([]);
      setAgendaAppts([]);
      setFinanceAppts([]);
      setLoading(false);
      return;
    }

    setShop(shopData);

    const [staffRes, servicesRes] = await Promise.all([
      supabase.from("shop_staff").select("id, display_name, bio, is_bookable").eq("shop_id", shopData.id).order("created_at"),
      supabase.from("services").select("id, name, duration_minutes, price_cents, is_active").eq("shop_id", shopData.id).order("created_at"),
    ]);

    setStaff(staffRes.data ?? []);
    setServices(servicesRes.data ?? []);

    await Promise.all([
      reloadAgenda(shopData.id, agendaDate),
      reloadFinance(shopData.id, financePeriod),
    ]);

    const staffIds = (staffRes.data ?? []).map((s) => s.id);
    if (staffIds.length > 0) {
      const { data: r } = await supabase
        .from("availability_rules")
        .select("id, staff_id, weekday, start_time, end_time, is_active")
        .in("staff_id", staffIds);
      setRules((r ?? []) as Rule[]);
    } else {
      setRules([]);
    }

    setRuleForm((prev) => ({ ...prev, staff_id: staffIds[0] ?? "" }));
    setLoading(false);
  };

  useEffect(() => {
    if (user && isBarber) void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isBarber]);

  // Recarregar agenda ao mudar a data
  useEffect(() => {
    if (shop) void reloadAgenda(shop.id, agendaDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agendaDate]);

  // Recarregar financeiro ao mudar o período
  useEffect(() => {
    if (shop) void reloadFinance(shop.id, financePeriod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [financePeriod]);

  // ----- Handlers -----
  const handleCreateShop = async () => {
    if (!user) return;
    if (!shopForm.name || !shopForm.address) {
      toast({ title: "Preencha nome e endereço", variant: "destructive" });
      return;
    }
    setSavingShop(true);
    const { error } = await supabase.from("barber_shops").insert({
      owner_user_id: user.id,
      name: shopForm.name,
      address: shopForm.address,
      phone: shopForm.phone || null,
      description: shopForm.description || null,
    });
    setSavingShop(false);
    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Barbearia cadastrada" });
    setShopForm({ name: "", address: "", phone: "", description: "" });
    void loadAll();
  };

  const handleAddStaff = async () => {
    if (!shop || !user || !staffForm.display_name) return;
    const { error } = await supabase.from("shop_staff").insert({
      shop_id: shop.id,
      user_id: user.id,
      display_name: staffForm.display_name,
      bio: staffForm.bio || null,
    });
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Barbeiro adicionado" });
    setStaffForm({ display_name: "", bio: "" });
    void loadAll();
  };

  const handleDeleteStaff = async (id: string) => {
    const { error } = await supabase.from("shop_staff").delete().eq("id", id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Barbeiro removido" });
    void loadAll();
  };

  const handleAddService = async () => {
    if (!shop) return;
    const duration = parseInt(serviceForm.duration, 10);
    const priceReais = parseFloat(serviceForm.price.replace(",", "."));
    if (!serviceForm.name || !duration || isNaN(priceReais)) {
      toast({ title: "Preencha nome, duração e preço", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("services").insert({
      shop_id: shop.id,
      name: serviceForm.name,
      duration_minutes: duration,
      price_cents: Math.round(priceReais * 100),
    });
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Serviço adicionado" });
    setServiceForm({ name: "", duration: "30", price: "" });
    void loadAll();
  };

  const handleDeleteService = async (id: string) => {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Serviço removido" });
    void loadAll();
  };

  const handleAddRule = async () => {
    if (!ruleForm.staff_id) {
      toast({ title: "Cadastre primeiro um barbeiro", variant: "destructive" });
      return;
    }
    if (ruleForm.start >= ruleForm.end) {
      toast({ title: "Horário inválido", description: "Início deve ser antes do fim.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("availability_rules").insert({
      staff_id: ruleForm.staff_id,
      weekday: parseInt(ruleForm.weekday, 10),
      start_time: ruleForm.start,
      end_time: ruleForm.end,
    });
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Horário adicionado" });
    void loadAll();
  };

  const handleDeleteRule = async (id: string) => {
    const { error } = await supabase.from("availability_rules").delete().eq("id", id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    void loadAll();
  };

  const handleApptStatus = async (id: string, status: "completed" | "cancelled") => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: status === "completed" ? "Atendimento concluído" : "Reserva cancelada" });
    if (shop) {
      await Promise.all([reloadAgenda(shop.id, agendaDate), reloadFinance(shop.id, financePeriod)]);
    }
  };

  const sendWhatsAppReminder = (a: Appt) => {
    if (!a.client?.phone) {
      toast({
        title: "Cliente sem telefone",
        description: "Este cliente não tem telefone cadastrado no perfil.",
        variant: "destructive",
      });
      return;
    }
    const msg =
      `Olá ${a.client.full_name ?? "cliente"}! Confirmando seu agendamento na ${shop?.name ?? "barbearia"}: ` +
      `${a.service?.name ?? "serviço"} com ${a.staff?.display_name ?? ""} no dia ` +
      `${formatDate(a.starts_at)} às ${formatTime(a.starts_at)}. Até lá! ✂️`;
    openWhatsApp(a.client.phone, msg);
  };

  // ----- Métricas da agenda do dia selecionado -----
  const stats = useMemo(() => {
    const completed = agendaAppts.filter((a) => a.status === "completed");
    const revenue = completed.reduce((sum, a) => sum + (a.service?.price_cents ?? 0), 0);
    return {
      total: agendaAppts.filter((a) => a.status !== "cancelled").length,
      completed: completed.length,
      revenue,
    };
  }, [agendaAppts]);

  // ----- Métricas do financeiro (período) -----
  const finance = useMemo(() => {
    const completed = financeAppts.filter((a) => a.status === "completed");
    const revenue = completed.reduce((sum, a) => sum + (a.service?.price_cents ?? 0), 0);
    const ticket = completed.length > 0 ? Math.round(revenue / completed.length) : 0;
    return { completed, revenue, ticket, count: completed.length };
  }, [financeAppts]);

  const periodLabel: Record<FinancePeriod, string> = {
    today: "Hoje",
    week: "Últimos 7 dias",
    month: "Últimos 30 dias",
  };

  if (authLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const staffById = (id: string) => staff.find((s) => s.id === id)?.display_name ?? "—";

  return (
    <main className="ambient-bg relative isolate min-h-screen">
      <div className="container relative z-10 py-6 sm:py-10">
        <header className="flex items-center justify-between gap-4 border-b border-border/60 pb-5">
          <button onClick={() => navigate("/")} className="flex items-center gap-3">
            <img src={logo} alt="Izzy Barber" className="h-10 w-auto" />
            <div className="hidden sm:block text-left">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Painel</p>
              <p className="text-sm font-semibold text-foreground">{shop?.name ?? "Sua barbearia"}</p>
            </div>
          </button>
          <Button variant="outline" size="pill" onClick={() => signOut().then(() => navigate("/"))}>
            <LogOut className="size-4" /> Sair
          </Button>
        </header>

        {!shop ? (
          <section className="mx-auto mt-10 max-w-xl space-y-5">
            <div className="text-center">
              <Store className="mx-auto size-10 text-brand" />
              <h1 className="mt-4 text-3xl font-semibold text-foreground">Cadastre sua barbearia</h1>
              <p className="mt-2 text-sm text-muted-foreground">Em poucos minutos sua agenda estará pronta.</p>
            </div>

            <div className="glass-panel space-y-4 rounded-2xl p-6">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={shopForm.name} onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })} className="rounded-xl bg-card" />
              </div>
              <div className="space-y-2">
                <Label>Endereço *</Label>
                <Input value={shopForm.address} onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })} className="rounded-xl bg-card" />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={shopForm.phone} onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })} className="rounded-xl bg-card" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={shopForm.description} onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })} className="rounded-xl bg-card" />
              </div>
              <Button variant="hero" size="pill" className="w-full" onClick={handleCreateShop} disabled={savingShop}>
                {savingShop && <Loader2 className="size-4 animate-spin" />}
                Cadastrar barbearia
              </Button>
            </div>
          </section>
        ) : (
          <div className="mt-8 space-y-6">
            <section>
              <h1 className="text-3xl font-semibold text-foreground">{shop.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{shop.address}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="metric-tile">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Agendamentos no dia</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{stats.total}</p>
                </div>
                <div className="metric-tile">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Concluídos</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{stats.completed}</p>
                </div>
                <div className="metric-tile">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Faturado no dia</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{formatPriceCents(stats.revenue)}</p>
                </div>
              </div>
            </section>

            <Tabs defaultValue="agenda" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
                <TabsTrigger value="agenda">Agenda</TabsTrigger>
                <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
                <TabsTrigger value="equipe">Equipe</TabsTrigger>
                <TabsTrigger value="servicos">Serviços</TabsTrigger>
                <TabsTrigger value="horarios">Horários</TabsTrigger>
              </TabsList>

              {/* AGENDA */}
              <TabsContent value="agenda">
                <div className="glass-panel rounded-2xl p-5 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <CalendarCheck className="size-5 text-brand" />
                      <h2 className="text-xl font-semibold text-foreground">Agenda</h2>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="pill" className="bg-card">
                          <CalendarDays className="size-4" />
                          {format(agendaDate, "EEEE, dd 'de' MMM", { locale: ptBR })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={agendaDate}
                          onSelect={(d) => d && setAgendaDate(d)}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {agendaAppts.length === 0 ? (
                    <p className="mt-4 text-sm text-muted-foreground">Nenhum agendamento para esta data.</p>
                  ) : (
                    <ul className="mt-4 space-y-2">
                      {agendaAppts.map((a) => (
                        <li
                          key={a.id}
                          className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm uppercase tracking-[0.12em] text-muted-foreground">
                              <Clock className="mr-1 inline size-3.5" /> {formatTime(a.starts_at)} – {formatTime(a.ends_at)}
                            </p>
                            <p className="mt-1 text-base font-semibold text-foreground">
                              {a.client?.full_name ?? "Cliente"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {a.service?.name ?? "Serviço"} · {a.staff?.display_name}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                              <DollarSign className="size-4" />
                              {formatPriceCents(a.service?.price_cents ?? 0)}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendWhatsAppReminder(a)}
                              title="Enviar mensagem no WhatsApp"
                            >
                              <MessageCircle className="size-4" />
                            </Button>
                            {(a.status === "confirmed" || a.status === "pending") && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => setRescheduling(a)}>
                                  <CalendarSync className="size-4" />
                                </Button>
                                <Button size="sm" variant="hero" onClick={() => handleApptStatus(a.id, "completed")}>
                                  <CheckCircle2 className="size-4" /> Concluir
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleApptStatus(a.id, "cancelled")}>
                                  <XCircle className="size-4" />
                                </Button>
                              </>
                            )}
                            {a.status !== "confirmed" && a.status !== "pending" && (
                              <span className="rounded-full border border-border/70 bg-secondary px-3 py-1 text-xs uppercase tracking-[0.12em] text-foreground">
                                {a.status}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </TabsContent>

              {/* FINANCEIRO */}
              <TabsContent value="financeiro">
                <div className="glass-panel space-y-5 rounded-2xl p-5 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="size-5 text-brand" />
                      <h2 className="text-xl font-semibold text-foreground">Controle financeiro</h2>
                    </div>
                    <Select value={financePeriod} onValueChange={(v) => setFinancePeriod(v as FinancePeriod)}>
                      <SelectTrigger className="w-full rounded-xl bg-card sm:w-56">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Hoje</SelectItem>
                        <SelectItem value="week">Últimos 7 dias</SelectItem>
                        <SelectItem value="month">Últimos 30 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="metric-tile">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        Faturamento · {periodLabel[financePeriod]}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        {formatPriceCents(finance.revenue)}
                      </p>
                    </div>
                    <div className="metric-tile">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Atendimentos</p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">{finance.count}</p>
                    </div>
                    <div className="metric-tile">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Ticket médio</p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        {formatPriceCents(finance.ticket)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm uppercase tracking-[0.14em] text-muted-foreground">
                      Atendimentos concluídos
                    </h3>
                    {finance.completed.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Sem atendimentos concluídos no período.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {finance.completed.map((a) => (
                          <li
                            key={a.id}
                            className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {a.client?.full_name ?? "Cliente"} · {a.service?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(a.starts_at)} {formatTime(a.starts_at)} · {a.staff?.display_name}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-brand">
                              {formatPriceCents(a.service?.price_cents ?? 0)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* EQUIPE */}
              <TabsContent value="equipe">
                <div className="glass-panel space-y-5 rounded-2xl p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <Users className="size-5 text-brand" />
                    <h2 className="text-xl font-semibold text-foreground">Barbeiros</h2>
                  </div>

                  <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/40 p-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input value={staffForm.display_name} onChange={(e) => setStaffForm({ ...staffForm, display_name: e.target.value })} className="rounded-xl bg-card" />
                    </div>
                    <div className="space-y-2">
                      <Label>Bio (opcional)</Label>
                      <Input value={staffForm.bio} onChange={(e) => setStaffForm({ ...staffForm, bio: e.target.value })} className="rounded-xl bg-card" />
                    </div>
                    <Button variant="hero" size="pill" className="w-full" onClick={handleAddStaff}>
                      <Plus className="size-4" /> Adicionar barbeiro
                    </Button>
                  </div>

                  {staff.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum barbeiro cadastrado.</p>
                  ) : (
                    <ul className="space-y-2">
                      {staff.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/60 p-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{s.display_name}</p>
                            {s.bio && <p className="text-xs text-muted-foreground">{s.bio}</p>}
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteStaff(s.id)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </TabsContent>

              {/* SERVIÇOS */}
              <TabsContent value="servicos">
                <div className="glass-panel space-y-5 rounded-2xl p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <Scissors className="size-5 text-brand" />
                    <h2 className="text-xl font-semibold text-foreground">Serviços</h2>
                  </div>

                  <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/40 p-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} className="rounded-xl bg-card" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Duração (min)</Label>
                        <Input type="number" value={serviceForm.duration} onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })} className="rounded-xl bg-card" />
                      </div>
                      <div className="space-y-2">
                        <Label>Preço (R$)</Label>
                        <Input value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })} placeholder="45,00" className="rounded-xl bg-card" />
                      </div>
                    </div>
                    <Button variant="hero" size="pill" className="w-full" onClick={handleAddService}>
                      <Plus className="size-4" /> Adicionar serviço
                    </Button>
                  </div>

                  {services.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado.</p>
                  ) : (
                    <ul className="space-y-2">
                      {services.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/60 p-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{s.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.duration_minutes} min · {formatPriceCents(s.price_cents)}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteService(s.id)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </TabsContent>

              {/* HORÁRIOS DE ATENDIMENTO */}
              <TabsContent value="horarios">
                <div className="glass-panel space-y-5 rounded-2xl p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <Clock className="size-5 text-brand" />
                    <h2 className="text-xl font-semibold text-foreground">Horários de atendimento</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Defina os dias e horários em que cada barbeiro atende. Os clientes só verão slots dentro dessas faixas.
                  </p>

                  {staff.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Cadastre primeiro um barbeiro na aba Equipe.</p>
                  ) : (
                    <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/40 p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Barbeiro</Label>
                          <Select value={ruleForm.staff_id} onValueChange={(v) => setRuleForm({ ...ruleForm, staff_id: v })}>
                            <SelectTrigger className="rounded-xl bg-card"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {staff.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.display_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Dia da semana</Label>
                          <Select value={ruleForm.weekday} onValueChange={(v) => setRuleForm({ ...ruleForm, weekday: v })}>
                            <SelectTrigger className="rounded-xl bg-card"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {WEEKDAYS.map((d, i) => (
                                <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Início</Label>
                          <Input type="time" value={ruleForm.start} onChange={(e) => setRuleForm({ ...ruleForm, start: e.target.value })} className="rounded-xl bg-card" />
                        </div>
                        <div className="space-y-2">
                          <Label>Fim</Label>
                          <Input type="time" value={ruleForm.end} onChange={(e) => setRuleForm({ ...ruleForm, end: e.target.value })} className="rounded-xl bg-card" />
                        </div>
                      </div>
                      <Button variant="hero" size="pill" className="w-full" onClick={handleAddRule}>
                        <Plus className="size-4" /> Adicionar horário
                      </Button>
                    </div>
                  )}

                  {rules.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum horário definido ainda.</p>
                  ) : (
                    <ul className="space-y-2">
                      {rules
                        .slice()
                        .sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time))
                        .map((r) => (
                          <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/60 p-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {staffById(r.staff_id)} · {WEEKDAYS[r.weekday]}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {r.start_time.slice(0, 5)} – {r.end_time.slice(0, 5)}
                              </p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteRule(r.id)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </main>
  );
};

export default Painel;
