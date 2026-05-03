import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Clock, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatTime } from "@/lib/booking";
import { openWhatsApp } from "@/lib/whatsapp";

type Notif = {
  id: string;
  starts_at: string;
  status: string;
  shop_id: string;
  service: { name: string; price_cents: number } | null;
  staff: { display_name: string } | null;
  shop: { name: string; phone: string | null } | null;
  client_phone?: string | null;
  client_name?: string | null;
};

export const NotificationsBell = () => {
  const { user, isBarber } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    const now = new Date();
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 7);

    if (isBarber) {
      // Próximos agendamentos das barbearias do usuário
      const { data: shops } = await supabase
        .from("barber_shops")
        .select("id")
        .eq("owner_user_id", user.id);
      const shopIds = (shops ?? []).map((s) => s.id);
      if (shopIds.length === 0) return setItems([]);

      const { data } = await supabase
        .from("appointments")
        .select(
          `id, starts_at, status, shop_id, client_user_id,
           service:services(name, price_cents),
           staff:shop_staff(display_name),
           shop:barber_shops(name, phone)`
        )
        .in("shop_id", shopIds)
        .gte("starts_at", now.toISOString())
        .lte("starts_at", horizon.toISOString())
        .in("status", ["pending", "confirmed"])
        .order("starts_at")
        .limit(10);

      const raw = (data ?? []) as (Notif & { client_user_id: string })[];
      const ids = Array.from(new Set(raw.map((r) => r.client_user_id)));
      let map: Record<string, { full_name: string | null; phone: string | null }> = {};
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .in("id", ids);
        map = Object.fromEntries((profs ?? []).map((p) => [p.id, { full_name: p.full_name, phone: p.phone }]));
      }
      setItems(
        raw.map((r) => ({
          ...r,
          client_phone: map[r.client_user_id]?.phone ?? null,
          client_name: map[r.client_user_id]?.full_name ?? null,
        }))
      );
    } else {
      const { data } = await supabase
        .from("appointments")
        .select(
          `id, starts_at, status, shop_id,
           service:services(name, price_cents),
           staff:shop_staff(display_name),
           shop:barber_shops(name, phone)`
        )
        .eq("client_user_id", user.id)
        .gte("starts_at", now.toISOString())
        .lte("starts_at", horizon.toISOString())
        .in("status", ["pending", "confirmed"])
        .order("starts_at")
        .limit(10);
      setItems((data ?? []) as Notif[]);
    }
  };

  useEffect(() => {
    void load();
    if (!user) return;
    const channel = supabase
      .channel("notif-appointments")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isBarber]);

  if (!user) return null;

  const count = items.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-full bg-card">
          <Bell className="size-4" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-background">
              {count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border/60 p-3">
          <p className="text-sm font-semibold text-foreground">Notificações</p>
          <p className="text-xs text-muted-foreground">Próximos 7 dias</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Sem novidades por aqui.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map((a) => (
                <li key={a.id} className="space-y-1 p-3">
                  <p className="text-sm font-semibold text-foreground">
                    {isBarber
                      ? `${a.client_name ?? "Cliente"} · ${a.service?.name ?? "Serviço"}`
                      : `${a.shop?.name ?? "Barbearia"} · ${a.service?.name ?? "Serviço"}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <Clock className="mr-1 inline size-3" />
                    {formatDate(a.starts_at)} às {formatTime(a.starts_at)}
                    {a.staff?.display_name ? ` · ${a.staff.display_name}` : ""}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(isBarber ? a.client_phone : a.shop?.phone) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          openWhatsApp(
                            (isBarber ? a.client_phone : a.shop?.phone) as string,
                            isBarber
                              ? `Olá ${a.client_name ?? ""}! Lembrando do seu horário ${formatDate(a.starts_at)} às ${formatTime(a.starts_at)}.`
                              : `Olá! Estou confirmando meu horário em ${a.shop?.name} no dia ${formatDate(a.starts_at)} às ${formatTime(a.starts_at)}.`
                          )
                        }
                      >
                        <MessageCircle className="size-3" /> WhatsApp
                      </Button>
                    )}
                    <Button asChild size="sm" variant="ghost" onClick={() => setOpen(false)}>
                      <Link to={isBarber ? "/painel" : "/minhas-reservas"}>Abrir</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
