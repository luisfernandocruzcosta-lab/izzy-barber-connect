import { Link } from "react-router-dom";
import {
  ArrowRight,
  BellRing,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  Clock3,
  LineChart,
  Scissors,
  ShieldCheck,
  Star,
  TrendingUp,
  UserRound,
  Wallet,
} from "lucide-react";

import logo from "@/assets/izzy-barber-logo.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const services = [
  { name: "Corte premium", time: "45 min", description: "Acabamento preciso e visual limpo, com agendamento em poucos toques." },
  { name: "Barba desenhada", time: "30 min", description: "Linha definida com navalha e finalização suave para presença forte." },
  { name: "Sobrancelha", time: "15 min", description: "Detalhe rápido que mantém o rosto equilibrado sem pesar no visual." },
  { name: "Combo completo", time: "70 min", description: "Corte, barba e acabamento em uma experiência direta e premium." },
];

const bookingSteps = [
  { title: "Cliente escolhe o serviço", text: "Catálogo claro com duração e preço para o cliente reservar sem dúvidas.", icon: Scissors },
  { title: "Horário em tempo real", text: "Agenda sincronizada que mostra apenas os horários realmente disponíveis.", icon: CalendarDays },
  { title: "Confirmação automática", text: "Reserva confirmada na hora e registrada no controle financeiro do barbeiro.", icon: ShieldCheck },
];

const financeHighlights = [
  { title: "Caixa em tempo real", text: "Cada atendimento concluído entra automaticamente no caixa do dia.", icon: Wallet },
  { title: "Relatórios claros", text: "Acompanhe faturamento, ticket médio e serviços mais procurados.", icon: LineChart },
  { title: "Crescimento previsível", text: "Veja a evolução por semana e mês para tomar decisões com dados.", icon: TrendingUp },
];

const Index = () => {
  const { session, isBarber } = useAuth();

  const primaryHref = session ? (isBarber ? "/painel" : "/") : "/auth";
  const primaryLabel = session ? (isBarber ? "Abrir meu painel" : "Minha conta") : "Criar conta gratuita";

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
                ["Como funciona", "agendamento"],
                ["Para barbearias", "financeiro"],
              ].map(([label, target]) => (
                <a key={target} href={`#${target}`} className="urban-link text-sm">
                  {label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {session ? (
                <Button asChild variant="hero" size="pill">
                  <Link to={isBarber ? "/painel" : "/"}>{isBarber ? "Painel" : "Conta"}</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" size="pill" className="hidden sm:inline-flex">
                    <Link to="/auth">Entrar</Link>
                  </Button>
                  <Button asChild variant="hero" size="pill">
                    <Link to="/auth">Começar</Link>
                  </Button>
                </>
              )}
            </div>
          </header>

          <div id="home" className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:gap-12 lg:py-20 xl:py-24">
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
                <Button asChild variant="hero" size="pill" className="sm:min-w-44">
                  <Link to={primaryHref}>
                    {primaryLabel}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="pill" className="sm:min-w-44">
                  <a href="#servicos">Ver serviços</a>
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="glass-panel space-y-5 rounded-2xl p-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">para barbearias</p>
                  <h2 className="mt-2 text-2xl font-semibold text-foreground">Tenha sua agenda online</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Cadastre sua barbearia, sua equipe e seus serviços. Nada de planilhas.
                  </p>
                </div>
                <ul className="space-y-3 border-t border-border/60 pt-4 text-sm">
                  {[
                    "Cadastro rápido e isolado por barbearia",
                    "Equipe e serviços organizados em um só lugar",
                    "Caixa do dia atualizado a cada atendimento",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-2 size-2 rounded-full bg-brand" aria-hidden="true" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant="hero" size="pill" className="w-full">
                  <Link to="/auth">Criar minha barbearia</Link>
                </Button>
              </div>

              <div className="glass-panel rounded-2xl p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">para clientes</p>
                <h3 className="mt-2 text-lg font-semibold text-foreground">Agende em poucos toques</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Encontre sua barbearia favorita e reserve o horário direto pelo app.
                </p>
                <Button asChild variant="outline" size="pill" className="mt-4 w-full">
                  <Link to="/auth">Quero agendar</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="servicos" className="container py-12 sm:py-16">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10">
          <span className="gold-chip w-fit">tipos de serviço</span>
          <h2 className="max-w-2xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            Cada barbearia define seu próprio catálogo e seus preços.
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Os exemplos abaixo são só inspiração. Os valores reais aparecem dentro da barbearia escolhida pelo cliente.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => (
            <article key={service.name} className="glass-panel flex min-h-[14rem] flex-col justify-between rounded-xl p-5 transition-transform duration-300 hover:-translate-y-1 hover:border-foreground/20">
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
                <span className="inline-flex items-center gap-2 text-sm text-foreground">
                  Saber mais
                  <ChevronRight className="size-4" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="agendamento" className="container py-4 pb-12 sm:pb-16">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <div className="space-y-4">
            <span className="gold-chip">como funciona</span>
            <h2 className="max-w-xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              Do clique do cliente ao caixa do barbeiro, sem retrabalho.
            </h2>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              Cada reserva confirmada já entra na agenda e no controle financeiro automaticamente.
            </p>
          </div>

          <div className="space-y-3">
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
      </section>

      <section id="financeiro" className="container pb-12 sm:pb-16">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-panel rounded-xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="gold-chip">painel da barbearia</span>
                <h2 className="mt-4 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                  Tudo o que você precisa para gerir seu negócio.
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                  Cadastre sua equipe, defina seus serviços e acompanhe a agenda do dia. Cada barbearia vê apenas os próprios dados.
                </p>
              </div>
              <CalendarCheck className="mt-1 size-5 text-brand" />
            </div>
            <Button asChild variant="hero" size="pill" className="mt-6">
              <Link to="/auth">Criar minha barbearia</Link>
            </Button>
          </div>

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
        </div>
      </section>

      <section className="container pb-14 sm:pb-20">
        <div className="glass-panel rounded-xl px-5 py-6 text-center sm:px-8 sm:py-8">
          <span className="gold-chip mx-auto">izzy barber</span>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            A plataforma que organiza sua agenda, seus clientes e o caixa da barbearia.
          </h2>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="hero" size="pill">
              <Link to="/auth">Começar agora</Link>
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2"><Clock3 className="size-4" /> Agendamento em tempo real</span>
            <span className="inline-flex items-center gap-2"><UserRound className="size-4" /> Login para cliente e barbeiro</span>
            <span className="inline-flex items-center gap-2"><BellRing className="size-4" /> Lembretes automáticos</span>
            <span className="inline-flex items-center gap-2"><Star className="size-4" /> Controle financeiro integrado</span>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
