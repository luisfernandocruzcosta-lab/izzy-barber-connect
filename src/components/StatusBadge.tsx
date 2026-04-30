import { CheckCircle2, Clock3, XCircle, CalendarCheck2, UserX } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "pending" | "confirmed" | "completed" | "cancelled" | "no_show" | string;

const config: Record<string, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  pending: {
    label: "Pendente",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    Icon: Clock3,
  },
  confirmed: {
    label: "Confirmado",
    className: "border-sky-500/40 bg-sky-500/10 text-sky-400",
    Icon: CalendarCheck2,
  },
  completed: {
    label: "Concluído",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    Icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelado",
    className: "border-red-500/40 bg-red-500/10 text-red-400",
    Icon: XCircle,
  },
  no_show: {
    label: "Não compareceu",
    className: "border-zinc-500/40 bg-zinc-500/10 text-zinc-300",
    Icon: UserX,
  },
};

export const StatusBadge = ({ status, className }: { status: Status; className?: string }) => {
  const c = config[status] ?? {
    label: status,
    className: "border-border/70 bg-secondary text-foreground",
    Icon: Clock3,
  };
  const Icon = c.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium uppercase tracking-[0.08em]",
        c.className,
        className
      )}
    >
      <Icon className="size-3.5" />
      {c.label}
    </span>
  );
};
