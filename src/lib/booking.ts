// Utilitários de horário para agendamentos
// Geração de slots a partir de availability_rules + remoção de conflitos

export type AvailabilityRule = {
  weekday: number; // 0 = Domingo, 6 = Sábado
  start_time: string; // "HH:MM:SS"
  end_time: string;
  is_active: boolean;
};

export type AppointmentRange = {
  starts_at: string; // ISO
  ends_at: string; // ISO
};

const SLOT_STEP_MIN = 15;

const parseHHMM = (date: Date, time: string) => {
  const [h, m] = time.split(":").map((n) => parseInt(n, 10));
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
};

export const buildSlots = (
  date: Date,
  durationMin: number,
  rules: AvailabilityRule[],
  existing: AppointmentRange[]
): Date[] => {
  const weekday = date.getDay();
  const todayRules = rules.filter((r) => r.is_active && r.weekday === weekday);
  if (todayRules.length === 0) return [];

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const slots: Date[] = [];
  for (const rule of todayRules) {
    const start = parseHHMM(date, rule.start_time);
    const end = parseHHMM(date, rule.end_time);
    let cursor = new Date(start);

    while (cursor.getTime() + durationMin * 60_000 <= end.getTime()) {
      const slotStart = new Date(cursor);
      const slotEnd = new Date(slotStart.getTime() + durationMin * 60_000);

      // Bloquear horários no passado
      if (isToday && slotStart.getTime() <= now.getTime()) {
        cursor = new Date(cursor.getTime() + SLOT_STEP_MIN * 60_000);
        continue;
      }

      // Conflito com agendamento existente?
      const conflict = existing.some((a) => {
        const aStart = new Date(a.starts_at).getTime();
        const aEnd = new Date(a.ends_at).getTime();
        return slotStart.getTime() < aEnd && slotEnd.getTime() > aStart;
      });

      if (!conflict) slots.push(slotStart);
      cursor = new Date(cursor.getTime() + SLOT_STEP_MIN * 60_000);
    }
  }

  return slots;
};

export const formatTime = (d: Date | string) =>
  new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export const formatDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export const formatPriceCents = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const isoDateOnly = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
