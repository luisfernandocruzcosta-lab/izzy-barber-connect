import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, eachDayOfInterval, startOfDay, endOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Plus, Trash2, TrendingDown, TrendingUp, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatPriceCents } from "@/lib/booking";

type FinancePeriod = "today" | "week" | "month";

type Appt = {
  id: string;
  starts_at: string;
  status: string;
  service: { name: string; price_cents: number } | null;
};

type Expense = {
  id: string;
  category: ExpenseCategory;
  description: string | null;
  amount_cents: number;
  expense_date: string;
};

type ExpenseCategory =
  | "produtos"
  | "aluguel"
  | "energia"
  | "salarios"
  | "marketing"
  | "equipamentos"
  | "outros";

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  produtos: "Produtos",
  aluguel: "Aluguel",
  energia: "Energia",
  salarios: "Salários",
  marketing: "Marketing",
  equipamentos: "Equipamentos",
  outros: "Outros",
};

const CHART_COLORS = [
  "hsl(var(--brand))",
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "#d4af37",
  "#9b8364",
  "#c0a062",
  "#6b5b3a",
];

interface Props {
  shopId: string;
  userId: string;
  appointments: Appt[];
  period: FinancePeriod;
  onPeriodChange: (p: FinancePeriod) => void;
}

export const FinanceTab = ({ shopId, userId, appointments, period, onPeriodChange }: Props) => {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    category: "produtos" as ExpenseCategory,
    description: "",
    amount: "",
    expense_date: new Date().toISOString().slice(0, 10),
  });

  const periodRange = useMemo(() => {
    const now = new Date();
    const to = endOfDay(now);
    const from =
      period === "today"
        ? startOfDay(now)
        : period === "week"
        ? startOfDay(subDays(now, 6))
        : startOfDay(subDays(now, 29));
    return { from, to };
  }, [period]);

  const loadExpenses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("shop_expenses")
      .select("id, category, description, amount_cents, expense_date")
      .eq("shop_id", shopId)
      .gte("expense_date", periodRange.from.toISOString().slice(0, 10))
      .lte("expense_date", periodRange.to.toISOString().slice(0, 10))
      .order("expense_date", { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar despesas", description: "Não foi possível concluir a operação. Tente novamente.", variant: "destructive" });
    }
    setExpenses((data ?? []) as Expense[]);
    setLoading(false);
  };

  useEffect(() => {
    void loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId, period]);

  const handleAdd = async () => {
    const value = parseFloat(form.amount.replace(",", "."));
    if (!value || value <= 0) {
      toast({ title: "Informe um valor válido", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("shop_expenses").insert({
      shop_id: shopId,
      created_by: userId,
      category: form.category,
      description: form.description || null,
      amount_cents: Math.round(value * 100),
      expense_date: form.expense_date,
    });
    if (error) {
      toast({ title: "Erro ao salvar", description: "Não foi possível concluir a operação. Tente novamente.", variant: "destructive" });
      return;
    }
    toast({ title: "Despesa registrada" });
    setForm({ ...form, description: "", amount: "" });
    void loadExpenses();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("shop_expenses").delete().eq("id", id);
    if (error) return toast({ title: "Erro", description: "Não foi possível concluir a operação. Tente novamente.", variant: "destructive" });
    void loadExpenses();
  };

  // ---- Métricas ----
  const completed = appointments.filter((a) => a.status === "completed");
  const revenue = completed.reduce((s, a) => s + (a.service?.price_cents ?? 0), 0);
  const expensesTotal = expenses.reduce((s, e) => s + e.amount_cents, 0);
  const profit = revenue - expensesTotal;
  const ticket = completed.length > 0 ? Math.round(revenue / completed.length) : 0;

  // ---- Dados dos gráficos ----
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({ start: periodRange.from, end: periodRange.to });
    return days.map((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      const dayRev = completed
        .filter((a) => a.starts_at.slice(0, 10) === dayKey)
        .reduce((s, a) => s + (a.service?.price_cents ?? 0), 0);
      const dayExp = expenses
        .filter((e) => e.expense_date === dayKey)
        .reduce((s, e) => s + e.amount_cents, 0);
      return {
        date: format(day, period === "today" ? "HH'h'" : "dd/MM", { locale: ptBR }),
        Faturamento: dayRev / 100,
        Despesas: dayExp / 100,
        Lucro: (dayRev - dayExp) / 100,
      };
    });
  }, [completed, expenses, periodRange, period]);

  const topServices = useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>();
    for (const a of completed) {
      const key = a.service?.name ?? "—";
      const cur = map.get(key) ?? { name: key, count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += a.service?.price_cents ?? 0;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [completed]);

  const expensesByCategory = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    for (const e of expenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount_cents);
    }
    return Array.from(map.entries()).map(([category, amount]) => ({
      name: CATEGORY_LABELS[category],
      value: amount / 100,
    }));
  }, [expenses]);

  return (
    <div className="space-y-5">
      {/* Filtro de período */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="size-5 text-brand" />
          <h2 className="text-xl font-semibold text-foreground">Controle financeiro</h2>
        </div>
        <Select value={period} onValueChange={(v) => onPeriodChange(v as FinancePeriod)}>
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

      {/* Métricas */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="metric-tile">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Faturamento</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{formatPriceCents(revenue)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{completed.length} atendimentos</p>
        </div>
        <div className="metric-tile">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Despesas</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{formatPriceCents(expensesTotal)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{expenses.length} lançamentos</p>
        </div>
        <div className="metric-tile">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Lucro</p>
          <p className={`mt-2 text-2xl font-semibold ${profit >= 0 ? "text-brand" : "text-destructive"}`}>
            {formatPriceCents(profit)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {profit >= 0 ? <TrendingUp className="inline size-3" /> : <TrendingDown className="inline size-3" />}{" "}
            margem {revenue > 0 ? Math.round((profit / revenue) * 100) : 0}%
          </p>
        </div>
        <div className="metric-tile">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Ticket médio</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{formatPriceCents(ticket)}</p>
        </div>
      </div>

      {/* Gráfico principal: receita vs despesas vs lucro */}
      <div className="rounded-xl border border-border/60 bg-card/40 p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Faturamento × Despesas × Lucro
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v}`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                formatter={(v: number) => `R$ ${v.toFixed(2)}`}
              />
              <Legend />
              <Line type="monotone" dataKey="Faturamento" stroke="hsl(var(--brand))" strokeWidth={2} />
              <Line type="monotone" dataKey="Despesas" stroke="#e11d48" strokeWidth={2} />
              <Line type="monotone" dataKey="Lucro" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top serviços + Despesas por categoria */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card/40 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Serviços mais realizados
          </h3>
          {topServices.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados no período.</p>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServices} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={90} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                    formatter={(v: number, name: string) =>
                      name === "revenue" ? `R$ ${(v / 100).toFixed(2)}` : v
                    }
                  />
                  <Bar dataKey="count" fill="hsl(var(--brand))" name="Atendimentos" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border/60 bg-card/40 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Despesas por categoria
          </h3>
          {expensesByCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem despesas no período.</p>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={(e) => `${e.name}`}
                  >
                    {expensesByCategory.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Cadastro de despesas */}
      <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/40 p-4">
        <div className="flex items-center gap-2">
          <Wallet className="size-4 text-brand" />
          <h3 className="text-sm font-semibold text-foreground">Registrar despesa</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory })}>
              <SelectTrigger className="rounded-xl bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((c) => (
                  <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <Input
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="120,00"
              className="rounded-xl bg-card"
            />
          </div>
          <div className="space-y-2">
            <Label>Data</Label>
            <Input
              type="date"
              value={form.expense_date}
              onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
              className="rounded-xl bg-card"
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Opcional"
              className="rounded-xl bg-card"
            />
          </div>
        </div>
        <Button variant="hero" size="pill" className="w-full" onClick={handleAdd}>
          <Plus className="size-4" /> Adicionar despesa
        </Button>
      </div>

      {/* Lista de despesas */}
      <div>
        <h3 className="mb-2 text-sm uppercase tracking-[0.14em] text-muted-foreground">
          Despesas no período
        </h3>
        {loading ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ) : expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma despesa registrada.</p>
        ) : (
          <ul className="space-y-2">
            {expenses.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/60 p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {CATEGORY_LABELS[e.category]}
                    {e.description && <span className="ml-2 font-normal text-muted-foreground">· {e.description}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(e.expense_date + "T00:00:00"), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-destructive">
                    -{formatPriceCents(e.amount_cents)}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
