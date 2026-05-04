import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { buildSlots, formatTime, type AvailabilityRule } from "@/lib/booking";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    staff_id: string;
    service_id: string;
    duration_minutes: number;
    starts_at: string;
  } | null;
  onRescheduled?: () => void;
};

export const RescheduleDialog = ({ open, onOpenChange, appointment, onRescheduled }: Props) => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [busy, setBusy] = useState<{ starts_at: string; ends_at: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !appointment) return;
    setDate(new Date(appointment.starts_at));
  }, [open, appointment]);

  useEffect(() => {
    if (!open || !appointment) return;
    const load = async () => {
      setLoading(true);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      const [rulesRes, apptsRes] = await Promise.all([
        supabase
          .from("availability_rules")
          .select("weekday, start_time, end_time, is_active")
          .eq("staff_id", appointment.staff_id),
        supabase
          .from("appointments")
          .select("id, starts_at, ends_at, status")
          .eq("staff_id", appointment.staff_id)
          .gte("starts_at", dayStart.toISOString())
          .lte("starts_at", dayEnd.toISOString()),
      ]);
      setRules((rulesRes.data ?? []) as AvailabilityRule[]);
      setBusy(
        (apptsRes.data ?? [])
          .filter((a) => a.status !== "cancelled" && a.status !== "no_show" && a.id !== appointment.id)
          .map((a) => ({ starts_at: a.starts_at, ends_at: a.ends_at }))
      );
      setLoading(false);
    };
    void load();
  }, [open, appointment, date]);

  const slots = useMemo(() => {
    if (!appointment) return [];
    return buildSlots(date, appointment.duration_minutes, rules, busy);
  }, [date, appointment, rules, busy]);

  const handlePick = async (slot: Date) => {
    if (!appointment) return;
    setSaving(true);
    const ends = new Date(slot.getTime() + appointment.duration_minutes * 60_000);
    const { error } = await supabase
      .from("appointments")
      .update({
        starts_at: slot.toISOString(),
        ends_at: ends.toISOString(),
        status: "confirmed",
      })
      .eq("id", appointment.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao reagendar", description: "Não foi possível concluir a operação. Tente novamente.", variant: "destructive" });
      return;
    }
    toast({ title: "Reagendado!", description: format(slot, "dd/MM 'às' HH:mm") });
    onOpenChange(false);
    onRescheduled?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reagendar</DialogTitle>
          <DialogDescription>Escolha uma nova data e horário disponível.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start rounded-xl bg-card text-left font-normal")}>
                <CalendarDays className="mr-2 size-4" />
                {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                disabled={(d) => {
                  const t = new Date();
                  t.setHours(0, 0, 0, 0);
                  return d < t;
                }}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">Este barbeiro não atende neste dia.</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem horários disponíveis para esta data.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot) => (
                <Button
                  key={slot.toISOString()}
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={() => handlePick(slot)}
                  className="rounded-lg bg-card"
                >
                  {formatTime(slot)}
                </Button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
