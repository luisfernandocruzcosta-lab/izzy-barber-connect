import { useMemo, useState } from "react";
import {
  BellRing,
  CalendarDays,
  ChevronRight,
  Clock3,
  Heart,
  MapPin,
  Medal,
  Scissors,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Users,
} from "lucide-react";

import logo from "@/assets/izzy-barber-logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const shopData = [
  {
    name: "Gold Line Studio",
    area: "Centro",
    rating: 4.9,
    eta: "6 min",
    services: ["Corte premium", "Barba express", "Pigmentação"],
    price: "A partir de R$ 35",
    nextSlot: "Hoje · 14:30",
  },
  {
    name: "Noir Barber Club",
    area: "Jardins",
    rating: 4.8,
    eta: "11 min",
    services: ["Fade", "Sobrancelha", "Combo clássico"],
    price: "A partir de R$ 42",
    nextSlot: "Hoje · 16:00",
  },
  {
    name: "Imperial Cuts",
    area: "Moema",
    rating: 5.0,
    eta: "18 min",
    services: ["Navalhado", "Barboterapia", "Pacote VIP"],
    price: "A partir de R$ 55",
    nextSlot: "Amanhã · 09:15",
  },
];

const barberMetrics = [
  { label: "Agendamentos hoje", value: "18", icon: CalendarDays },
  { label: "Clientes ativos", value: "124", icon: Users },
  { label: "Avaliação média", value: "4.9", icon: Star },
  { label: "Pontos resgatados", value: "320", icon: Medal },
];

const reminderMoments = [
  "Lembrete às 09:00 no dia do corte",
  "Confirmação automática 1 hora antes",
  "Mensagem amigável com nome, serviço e horário",
];

const customerHistory = [
  { service: "Corte + barba", barber: "Ramon", date: "12 abr", points: "+30 pts" },
  { service: "Fade premium", barber: "Kaique", date: "28 mar", points: "+20 pts" },
  { service: "Barba express", barber: "Ramon", date: "11 mar", points: "+15 pts" },
];

const Index = () => {
  const [activeMode, setActiveMode] = useState<"cliente" | "barbeiro">("cliente");
  const [selectedShop, setSelectedShop] = useState(shopData[0].name);

  const selectedShopData = useMemo(
    () => shopData.find((shop) => shop.name === selectedShop) ?? shopData[0],
    [selectedShop],
  );

  return (
    <main className="app-shell overflow-hidden">
      <section className="section-grid relative isolate">
        <div className="absolute inset-x-0 top-0 h-80 bg-aura opacity-80 blur-3xl" aria-hidden="true" />
        <div className="container relative py-6 sm:py-8 lg:py-10">
          <header className="glass-panel flex items-center justify-between rounded-2xl px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo Izzy Barber" className="h-12 w-auto sm:h-14" />
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">barbearias conectadas</p>
                <h1 className="font-display text-3xl leading-none text-foreground sm:text-4xl">Izzy Barber</h1>
              </div>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" size="pill">Entrar</Button>
              <Button variant="hero" size="pill">Criar conta</Button>
            </div>
          </header>

          <div className="grid gap-6 pt-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div className="space-y-6">
              <div className="space-y-4">
                <span className="gold-chip">agendamento online com estilo</span>
                <div className="space-y-3">
                  <h2 className="max-w-2xl font-display text-5xl leading-[0.92] text-foreground sm:text-6xl lg:text-7xl">
                    Delivery de horários para a sua barbearia crescer.
                  </h2>
                  <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                    Descubra barbearias, reserve em segundos, acompanhe lembretes no WhatsApp e organize a operação do barbeiro em uma experiência fluida e pronta para virar app.
                  </p>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      aria-label="Buscar barbearias"
                      placeholder="Buscar barbearias, bairros ou serviços"
                      className="h-12 rounded-xl border-border/70 bg-secondary pl-10"
                    />
                  </div>
                  <Button variant="hero" size="pill" className="h-12">Buscar agenda</Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    "Corte premium",
                    "Barba",
                    "Sobrancelha",
                    "Navalhado",
                    "Atendimento VIP",
                  ].map((item) => (
                    <button
                      key={item}
                      className="rounded-full border border-border/70 bg-secondary/70 px-3 py-2 text-xs font-medium text-secondary-foreground transition hover:border-brand/40 hover:text-foreground"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { icon: BellRing, title: "Lembretes automáticos", text: "No dia e 1 hora antes via fluxo pronto para WhatsApp." },
                  { icon: Heart, title: "Fidelidade viva", text: "Pontos por corte, histórico e reativação baseada em frequência." },
                  { icon: ShieldCheck, title: "Base segura", text: "Perfis completos, papéis separados e estrutura pronta para escalar." },
                ].map((item) => (
                  <Card key={item.title} className="glass-panel rounded-2xl border-border/60">
                    <CardContent className="space-y-3 p-5">
                      <div className="flex size-11 items-center justify-center rounded-full border border-brand/25 bg-brand-soft text-brand">
                        <item.icon className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.text}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <aside className="glass-panel relative overflow-hidden rounded-[1.5rem] p-4 shadow-glow sm:p-5">
              <div className="absolute -right-8 top-6 size-28 rounded-full bg-brand/15 blur-3xl" aria-hidden="true" />
              <div className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">agenda em destaque</span>
                  <span className="gold-chip">MVP</span>
                </div>

                <div className="rounded-2xl border border-border/70 bg-surface p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-full border border-brand/20 bg-brand-soft text-brand">
                      <Scissors className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Próximo horário livre</p>
                      <p className="text-xl font-semibold text-foreground">{selectedShopData.nextSlot}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                    {['13:00', '14:30', '16:00'].map((slot) => (
                      <div key={slot} className="rounded-xl border border-border/70 bg-secondary/60 px-2 py-3 text-foreground">
                        {slot}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Sugestão inteligente</p>
                      <p className="text-lg font-semibold text-foreground">Hora de renovar seu fade</p>
                    </div>
                    <Sparkles className="size-5 text-brand" />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Com base na sua frequência, o melhor momento para reagendar é nos próximos 3 dias.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="container py-8 sm:py-10 lg:py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">experiência central</p>
            <h2 className="font-display text-4xl text-foreground sm:text-5xl">Cliente primeiro, operação redonda.</h2>
          </div>

          <div className="glass-panel inline-flex rounded-full p-1">
            <Button
              variant={activeMode === "cliente" ? "hero" : "tab"}
              size="pill"
              onClick={() => setActiveMode("cliente")}
            >
              Cliente
            </Button>
            <Button
              variant={activeMode === "barbeiro" ? "hero" : "tab"}
              size="pill"
              onClick={() => setActiveMode("barbeiro")}
            >
              Barbeiro
            </Button>
          </div>
        </div>

        {activeMode === "cliente" ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4">
              {shopData.map((shop) => (
                <button
                  key={shop.name}
                  onClick={() => setSelectedShop(shop.name)}
                  className="glass-panel block w-full rounded-2xl p-4 text-left transition hover:-translate-y-1 hover:border-brand/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">{shop.name}</h3>
                        <span className="rounded-full border border-border/70 bg-secondary/70 px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                          {shop.area}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Star className="size-4 text-brand" /> {shop.rating}</span>
                        <span className="inline-flex items-center gap-1"><MapPin className="size-4" /> {shop.eta}</span>
                        <span className="inline-flex items-center gap-1"><Clock3 className="size-4" /> {shop.nextSlot}</span>
                      </div>
                    </div>
                    <Heart className="mt-1 size-5 text-muted-foreground" />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {shop.services.map((service) => (
                      <span key={service} className="rounded-full border border-border/70 bg-secondary/60 px-3 py-1.5 text-xs text-secondary-foreground">
                        {service}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-medium text-brand">{shop.price}</span>
                    <span className="inline-flex items-center gap-1 text-foreground">
                      Reservar agora <ChevronRight className="size-4" />
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <Card className="glass-panel rounded-[1.5rem]">
              <CardContent className="space-y-6 p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Reserva rápida</p>
                    <h3 className="text-2xl font-semibold text-foreground">{selectedShopData.name}</h3>
                  </div>
                  <Store className="size-5 text-brand" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Serviço", value: selectedShopData.services[0] },
                    { label: "Barbeiro", value: "Ramon Costa" },
                    { label: "Horário", value: selectedShopData.nextSlot },
                    { label: "Pagamento", value: "Pix ou cartão" },
                  ].map((item) => (
                    <div key={item.label} className="metric-tile">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Sistema de lembrete</p>
                      <p className="text-lg font-semibold text-foreground">Confirmação automática</p>
                    </div>
                    <BellRing className="size-5 text-brand" />
                  </div>
                  <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                    {reminderMoments.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 size-2 rounded-full bg-brand" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-border/70 bg-brand-soft/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Clube de fidelidade</p>
                      <p className="text-3xl font-semibold text-foreground">240 pontos</p>
                    </div>
                    <Medal className="size-6 text-brand" />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Faltam 60 pontos para liberar um corte cortesia.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="glass-panel rounded-[1.5rem]">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Painel do barbeiro</p>
                    <h3 className="text-2xl font-semibold text-foreground">Barbearia pronta para operar</h3>
                  </div>
                  <CalendarDays className="size-5 text-brand" />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {barberMetrics.map((metric) => (
                    <div key={metric.label} className="metric-tile">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{metric.label}</span>
                        <metric.icon className="size-4 text-brand" />
                      </div>
                      <p className="mt-4 text-3xl font-semibold text-foreground">{metric.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-border/70 bg-secondary/40 p-4">
                  <p className="text-sm text-muted-foreground">Configurações essenciais</p>
                  <div className="mt-4 space-y-3 text-sm text-foreground">
                    {[
                      "Cadastro da barbearia com logo, endereço e telefone",
                      "Serviços com preço, duração e status ativo",
                      "Agenda por dias disponíveis e horários do time",
                      "Visão do dia com clientes, observações e confirmação",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 px-3 py-3">
                        <span className="mt-1 size-2 rounded-full bg-brand" aria-hidden="true" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <Card className="glass-panel rounded-[1.5rem]">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Agenda do dia</p>
                      <h3 className="text-xl font-semibold text-foreground">Quinta-feira · fluxo contínuo</h3>
                    </div>
                    <span className="gold-chip">18 reservas</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      { time: "09:00", client: "Matheus Lima", service: "Corte premium", status: "Confirmado" },
                      { time: "10:30", client: "Igor Santos", service: "Barba + acabamento", status: "Lembrete enviado" },
                      { time: "13:00", client: "Henrique Alves", service: "Fade + sobrancelha", status: "Aguardando" },
                    ].map((entry) => (
                      <div key={entry.time} className="flex items-center justify-between rounded-2xl border border-border/70 bg-secondary/45 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{entry.time} · {entry.client}</p>
                          <p className="text-sm text-muted-foreground">{entry.service}</p>
                        </div>
                        <span className="rounded-full border border-brand/25 bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
                          {entry.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-panel rounded-[1.5rem]">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Histórico do cliente</p>
                      <h3 className="text-xl font-semibold text-foreground">Relacionamento que volta</h3>
                    </div>
                    <Heart className="size-5 text-brand" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {customerHistory.map((item) => (
                      <div key={`${item.service}-${item.date}`} className="flex items-center justify-between rounded-2xl border border-border/70 bg-secondary/45 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item.service}</p>
                          <p className="text-sm text-muted-foreground">{item.barbeiro} · {item.date}</p>
                        </div>
                        <span className="text-sm font-medium text-brand">{item.points}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </section>

      <section className="container pb-10 sm:pb-12">
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { title: "Avaliações reais", text: "Estrelas e comentários ajudam clientes a encontrar o melhor barbeiro em segundos.", icon: Star },
            { title: "Expansão futura", text: "A base já comporta autenticação, banco, favoritos, fidelidade e automações server-side.", icon: ShieldCheck },
            { title: "Navegação rápida", text: "Estrutura pensada para parecer um app de delivery: descoberta, escolha e reserva sem atrito.", icon: ChevronRight },
          ].map((item) => (
            <Card key={item.title} className="glass-panel rounded-2xl">
              <CardContent className="space-y-3 p-5">
                <item.icon className="size-5 text-brand" />
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Index;
