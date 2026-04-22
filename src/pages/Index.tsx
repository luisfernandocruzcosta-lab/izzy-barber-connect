import { useMemo, useState } from "react";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  CalendarCheck,
  ChevronRight,
  Clock3,
  DollarSign,
  LineChart,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  UserRound,
  Wallet,
} from "lucide-react";

import logo from "@/assets/izzy-barber-logo.png";
import { GlobalAuthPanel } from "@/components/GlobalAuthPanel";
import { Button } from "@/components/ui/button";

const services = [
  {
    name: "Corte premium",
    time: "45 min",
    price: "R$ 45",
    description: "Acabamento preciso e visual limpo, com agendamento em poucos toques.",
  },
  {
    name: "Barba desenhada",
    time: "30 min",
    price: "R$ 30",
    description: "Linha definida com navalha e finalização suave para presença forte.",
  },
  {
    name: "Sobrancelha",
    time: "15 min",
    price: "R$ 18",
    description: "Detalhe rápido que mantém o rosto equilibrado sem pesar no visual.",
  },
  {
    name: "Combo completo",
    time: "70 min",
    price: "R$ 68",
    description: "Corte, barba e acabamento em uma experiência direta e premium.",
  },
];

const heroStats = [
  { label: "Agendamentos hoje", value: "18" },
  { label: "Faturamento do dia", value: "R$ 1.240" },
  { label: "Taxa de ocupação", value: "92%" },
];

const bookingSteps = [
  {
    title: "Cliente escolhe o serviço",
    text: "Catálogo claro com duração e preço para o cliente reservar sem dúvidas.",
    icon: Scissors,
  },
  {
    title: "Horário em tempo real",
    text: "Agenda sincronizada que mostra apenas os horários realmente disponíveis.",
    icon: CalendarDays,
  },
  {
    title: "Confirmação automática",
    text: "Reserva confirmada na hora e registrada no controle financeiro do barbeiro.",
    icon: ShieldCheck,
  },
];

const modeViews = {
  cliente: {
    eyebrow: "Para você",
    title: "Agende em poucos toques",
    description:
      "Encontre o serviço, escolha o horário e confirme sua reserva de forma rápida e simples.",
    bullets: [
      "Busca direta por serviço e horário",
      "Histórico de cortes e barbeiros favoritos",
      "Lembretes automáticos por WhatsApp",
    ],
    cta: "Agendar agora",
  },
  barbeiro: {
    eyebrow: "Para profissionais",
    title: "Controle a agenda e o caixa",
    description:
      "Gestão completa de horários, clientes e receitas em um só lugar, sem planilhas.",
    bullets: [
      "Agenda do dia com confirmações e bloqueios",
      "Registro automático de cada atendimento no caixa",
      "Relatórios de faturamento por dia, semana e mês",
    ],
    cta: "Acessar painel",
  },
} as const;

const schedulePreview = [
  { time: "09:00", client: "Matheus Lima", service: "Corte premium", value: "R$ 45", status: "Confirmado" },
  { time: "11:30", client: "Igor Santos", service: "Barba desenhada", value: "R$ 30", status: "Lembrete enviado" },
  { time: "15:00", client: "Rafael Cruz", service: "Combo completo", value: "R$ 68", status: "Aguardando" },
];

const financeHighlights = [
  {
    title: "Caixa em tempo real",
    text: "Cada atendimento concluído entra automaticamente no caixa do dia.",
    icon: Wallet,
  },
  {
    title: "Relatórios claros",
    text: "Acompanhe faturamento, ticket médio e serviços mais procurados.",
    icon: LineChart,
  },
  {
    title: "Crescimento previsível",
    text: "Veja a evolução por semana e mês para tomar decisões com dados.",
    icon: TrendingUp,
  },
];

const Index = () => {
  const [activeMode, setActiveMode] = useState<"cliente" | "barbeiro">("cliente");

  const currentView = useMemo(() => modeViews[activeMode], [activeMode]);

  return (
    <main className="app-shell overflow-hidden">
      <section className="ambient-bg relative isolate border-b border-border/60">
        <div className="container relative z-10 py-5 sm:py-6 lg:py-8">
          <header className="flex items-center justify-between gap-4 border-b border-border/60 pb-4 sm:pb-5">
            <a href="#home" className="flex items-center gap-3">
              <img src={logo} alt="Logo Izzy Barber" className="h-10 w-auto sm:h-12" />
              <div className="hidden sm:block">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Izzy Barber</p>
                <p className="text-sm font-semibold text-foreground">Agenda &amp; gestão</p>
              </div>
            </a>

            <nav className="hidden items-center gap-6 md:flex">
              {[
                ["Início", "home"],
                ["Serviços", "servicos"],
                ["Agendamento", "agendamento"],
                ["Financeiro", "financeiro"],
                ["Entrar", "login"],
              ].map(([label, target]) => (
                <a key={target} href={`#${target}`} className="urban-link text-sm">
                  {label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="pill" className="hidden sm:inline-flex">
                Entrar
              </Button>
              <Button variant="hero" size="pill">
                Agendar
              </Button>
            </div>
          </header>

          <div id="home" className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center lg:gap-12 lg:py-20 xl:py-24">
            <div className="space-y-10">
              <div className="flex justify-center lg:justify-start">
                <div className="logo-stage w-full max-w-[44rem]">
                  <img
                    src={logo}
                    alt="Logo principal Izzy Barber"
                    className="logo-mark mx-auto w-full max-w-[44rem]"
                  />
                </div>
              </div>

              <div className="mx-auto max-w-2xl space-y-5 text-center lg:mx-0 lg:text-left">
                <h1 className="text-balance text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                  A agenda e o caixa da sua barbearia em um só lugar.
                </h1>
                <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg lg:mx-0">
                  Receba reservas online, controle horários, acompanhe o faturamento e mantenha seus clientes próximos com lembretes automáticos.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Button variant="hero" size="pill" className="sm:min-w-44">
                  Agendar horário
                  <ArrowRight className="size-4" />
                </Button>
                <Button variant="outline" size="pill" className="sm:min-w-44">
                  Sou barbeiro
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {heroStats.map((item) => (
                  <div key={item.label} className="metric-tile min-h-24">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                    <p className="mt-3 text-lg font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div id="login" className="space-y-4">
              <GlobalAuthPanel />

              <div className="glass-panel space-y-4 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">próximos horários</p>
                    <h2 className="mt-2 text-2xl font-semibold text-foreground">Reserve em segundos</h2>
                  </div>
                  <Sparkles className="size-5 text-brand" />
                </div>

                <div className="space-y-3 border-t border-border/60 pt-4">
                  {[
                    ["Corte premium", "Hoje · 19:30"],
                    ["Barba desenhada", "Amanhã · 10:00"],
                    ["Combo completo", "Amanhã · 13:20"],
                  ].map(([service, slot]) => (
                    <div key={service} className="flex items-center justify-between gap-3 border-b border-border/40 pb-3 last:border-b-0 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{service}</p>
                        <p className="text-sm text-muted-foreground">Horário disponível</p>
                      </div>
                      <span className="text-sm font-medium text-brand">{slot}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="servicos" className="container py-12 sm:py-16">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10">
          <span className="gold-chip w-fit">serviços</span>
          <h2 className="max-w-2xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            Catálogo claro, preços transparentes, agendamento direto.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => (
            <article key={service.name} className="glass-panel flex min-h-[16rem] flex-col justify-between rounded-xl p-5 transition-transform duration-300 hover:-translate-y-1 hover:border-foreground/20">
              <div className="space-y-4">
                <div className="flex size-11 items-center justify-center rounded-full border border-border/70 bg-secondary/70 text-foreground">
                  <Scissors className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{service.time}</p>
                  <h3 className="mt-2 text-2xl font-semibold text-foreground">{service.name}</h3>
                </div>
                <p className="text-sm leading-7 text-muted-foreground">{service.description}</p>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
                <span className="text-base font-semibold text-brand">{service.price}</span>
                <span className="inline-flex items-center gap-2 text-sm text-foreground">
                  Reservar
                  <ChevronRight className="size-4" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="agendamento" className="container py-4 pb-12 sm:pb-16">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
          <div className="space-y-4">
            <span className="gold-chip">como funciona o agendamento</span>
            <h2 className="max-w-xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              Do clique do cliente ao caixa do barbeiro, sem retrabalho.
            </h2>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              Cada reserva confirmada já entra na agenda e no controle financeiro automaticamente.
            </p>

            <div className="space-y-3 pt-2">
              {bookingSteps.map((step) => (
                <div key={step.title} className="glass-panel rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-secondary/70 text-foreground">
                      <step.icon className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{step.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="inline-flex rounded-full border border-border/70 bg-card/70 p-1">
              <Button variant={activeMode === "cliente" ? "hero" : "tab"} size="pill" onClick={() => setActiveMode("cliente")}>
                Cliente
              </Button>
              <Button variant={activeMode === "barbeiro" ? "hero" : "tab"} size="pill" onClick={() => setActiveMode("barbeiro")}>
                Barbeiro
              </Button>
            </div>

            <div className="glass-panel rounded-xl p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{currentView.eyebrow}</p>
              <h3 className="mt-3 text-2xl font-semibold text-foreground">{currentView.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{currentView.description}</p>

              <div className="mt-5 space-y-3">
                {currentView.bullets.map((item) => (
                  <div key={item} className="flex items-start gap-3 border-b border-border/40 pb-3 last:border-b-0 last:pb-0">
                    <span className="mt-2 size-2 rounded-full bg-brand" aria-hidden="true" />
                    <p className="text-sm leading-7 text-foreground">{item}</p>
                  </div>
                ))}
              </div>

              <Button variant="hero" size="pill" className="mt-6 w-full sm:w-auto">
                {currentView.cta}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="financeiro" className="container pb-12 sm:pb-16">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="glass-panel rounded-xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="gold-chip">painel do barbeiro</span>
                <h2 className="mt-4 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                  Agenda e caixa do dia em uma única tela.
                </h2>
              </div>
              <CalendarCheck className="mt-1 size-5 text-brand" />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Atendimentos", "18"],
                ["Faturado hoje", "R$ 1.240"],
                ["Ticket médio", "R$ 69"],
              ].map(([label, value]) => (
                <div key={label} className="metric-tile min-h-24">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                  <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              {schedulePreview.map((item) => (
                <div key={`${item.time}-${item.client}`} className="flex flex-col gap-3 rounded-xl border border-border/60 bg-secondary/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{item.time} · {item.client}</p>
                    <p className="text-sm text-muted-foreground">{item.service}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                      <DollarSign className="size-4" />
                      {item.value}
                    </span>
                    <span className="w-fit rounded-full border border-border/70 bg-card px-3 py-1 text-xs uppercase tracking-[0.12em] text-foreground">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-panel rounded-xl p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="gold-chip">controle financeiro</span>
                  <h3 className="mt-4 text-2xl font-semibold text-foreground">Cada corte vira receita registrada.</h3>
                </div>
                <Wallet className="mt-1 size-5 text-brand" />
              </div>
              <div className="mt-5 grid gap-3">
                {financeHighlights.map((item) => (
                  <div key={item.title} className="flex items-start gap-3 border-b border-border/40 pb-3 last:border-b-0 last:pb-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-secondary/70 text-foreground">
                      <item.icon className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1 text-sm leading-7 text-muted-foreground">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-xl p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="gold-chip">lembretes automáticos</span>
                  <h3 className="mt-4 text-2xl font-semibold text-foreground">Menos faltas, mais faturamento.</h3>
                </div>
                <BellRing className="mt-1 size-5 text-brand" />
              </div>
              <div className="mt-5 space-y-3">
                {[
                  "Confirmação no dia do atendimento",
                  "Aviso 1 hora antes com nome, serviço e horário",
                  "Pronto para integrar com WhatsApp e pagamentos",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-2 size-2 rounded-full bg-brand" aria-hidden="true" />
                    <p className="text-sm leading-7 text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-14 sm:pb-20">
        <div className="glass-panel rounded-xl px-5 py-6 text-center sm:px-8 sm:py-8">
          <span className="gold-chip mx-auto">izzy barber</span>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            A plataforma que organiza sua agenda, seus clientes e o caixa da barbearia.
          </h2>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="hero" size="pill">
              Começar agora
            </Button>
            <Button variant="outline" size="pill">
              Ver painel do barbeiro
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2"><Clock3 className="size-4" /> Agendamento em tempo real</span>
            <span className="inline-flex items-center gap-2"><UserRound className="size-4" /> Login para cliente e barbeiro</span>
            <span className="inline-flex items-center gap-2"><Star className="size-4" /> Controle financeiro integrado</span>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
