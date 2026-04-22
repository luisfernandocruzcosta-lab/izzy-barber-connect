import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, LogOut, Plus, Scissors, Store, Trash2, Users } from "lucide-react";

import logo from "@/assets/izzy-barber-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Shop = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  description: string | null;
};

type Staff = {
  id: string;
  display_name: string;
  bio: string | null;
  is_bookable: boolean;
};

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  is_active: boolean;
};

const Painel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isBarber, loading: authLoading, signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<Shop | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Forms
  const [shopForm, setShopForm] = useState({ name: "", address: "", phone: "", description: "" });
  const [staffForm, setStaffForm] = useState({ display_name: "", bio: "" });
  const [serviceForm, setServiceForm] = useState({ name: "", duration: "30", price: "" });
  const [savingShop, setSavingShop] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!isBarber) {
      toast({
        title: "Acesso restrito",
        description: "Esta área é exclusiva para barbearias.",
        variant: "destructive",
      });
      navigate("/", { replace: true });
    }
  }, [authLoading, user, isBarber, navigate, toast]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    // Carrega APENAS a barbearia deste dono — RLS garante isolamento
    const { data: shopData } = await supabase
      .from("barber_shops")
      .select("id, name, address, phone, description")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (shopData) {
      setShop(shopData);

      const [{ data: staffData }, { data: servicesData }] = await Promise.all([
        supabase
          .from("shop_staff")
          .select("id, display_name, bio, is_bookable")
          .eq("shop_id", shopData.id)
          .order("created_at"),
        supabase
          .from("services")
          .select("id, name, duration_minutes, price_cents, is_active")
          .eq("shop_id", shopData.id)
          .order("created_at"),
      ]);

      setStaff(staffData ?? []);
      setServices(servicesData ?? []);
    } else {
      setShop(null);
      setStaff([]);
      setServices([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user && isBarber) void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isBarber]);

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
      toast({ title: "Erro ao cadastrar barbearia", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Barbearia cadastrada" });
    setShopForm({ name: "", address: "", phone: "", description: "" });
    void loadData();
  };

  const handleAddStaff = async () => {
    if (!shop || !user) return;
    if (!staffForm.display_name) {
      toast({ title: "Informe o nome do barbeiro", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("shop_staff").insert({
      shop_id: shop.id,
      user_id: user.id, // dono é referência inicial; pode ser editado depois
      display_name: staffForm.display_name,
      bio: staffForm.bio || null,
    });
    if (error) {
      toast({ title: "Erro ao adicionar barbeiro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Barbeiro adicionado" });
    setStaffForm({ display_name: "", bio: "" });
    void loadData();
  };

  const handleDeleteStaff = async (id: string) => {
    const { error } = await supabase.from("shop_staff").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Barbeiro removido" });
    void loadData();
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
    if (error) {
      toast({ title: "Erro ao adicionar serviço", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Serviço adicionado" });
    setServiceForm({ name: "", duration: "30", price: "" });
    void loadData();
  };

  const handleDeleteService = async (id: string) => {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Serviço removido" });
    void loadData();
  };

  const formatPrice = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const stats = useMemo(
    () => [
      { label: "Barbeiros", value: staff.length },
      { label: "Serviços", value: services.length },
      { label: "Status", value: shop ? "Ativo" : "—" },
    ],
    [staff, services, shop]
  );

  if (authLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

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
              <p className="mt-2 text-sm text-muted-foreground">
                Em poucos minutos sua agenda e seu caixa estarão prontos.
              </p>
            </div>

            <div className="glass-panel space-y-4 rounded-2xl p-6">
              <div className="space-y-2">
                <Label>Nome da barbearia *</Label>
                <Input
                  value={shopForm.name}
                  onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                  placeholder="Izzy Barber Centro"
                  className="rounded-xl bg-card"
                />
              </div>
              <div className="space-y-2">
                <Label>Endereço *</Label>
                <Input
                  value={shopForm.address}
                  onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                  placeholder="Rua, número, bairro"
                  className="rounded-xl bg-card"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={shopForm.phone}
                  onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                  placeholder="(00) 90000-0000"
                  className="rounded-xl bg-card"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={shopForm.description}
                  onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
                  placeholder="Conte sobre o estilo da sua barbearia"
                  className="rounded-xl bg-card"
                />
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
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-semibold text-foreground">Olá, {shop.name}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">{shop.address}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {stats.map((s) => (
                  <div key={s.label} className="metric-tile">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{s.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{s.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              {/* Barbeiros */}
              <div className="glass-panel space-y-5 rounded-2xl p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <Users className="size-5 text-brand" />
                  <h2 className="text-xl font-semibold text-foreground">Barbeiros</h2>
                </div>

                <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/40 p-4">
                  <div className="space-y-2">
                    <Label>Nome do barbeiro</Label>
                    <Input
                      value={staffForm.display_name}
                      onChange={(e) => setStaffForm({ ...staffForm, display_name: e.target.value })}
                      placeholder="João Silva"
                      className="rounded-xl bg-card"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bio (opcional)</Label>
                    <Input
                      value={staffForm.bio}
                      onChange={(e) => setStaffForm({ ...staffForm, bio: e.target.value })}
                      placeholder="Especialista em degradê"
                      className="rounded-xl bg-card"
                    />
                  </div>
                  <Button variant="hero" size="pill" className="w-full" onClick={handleAddStaff}>
                    <Plus className="size-4" /> Adicionar barbeiro
                  </Button>
                </div>

                <div className="space-y-2">
                  {staff.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum barbeiro cadastrado ainda.</p>
                  ) : (
                    staff.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/60 p-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">{s.display_name}</p>
                          {s.bio && <p className="text-xs text-muted-foreground">{s.bio}</p>}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteStaff(s.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Serviços */}
              <div className="glass-panel space-y-5 rounded-2xl p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <Scissors className="size-5 text-brand" />
                  <h2 className="text-xl font-semibold text-foreground">Serviços</h2>
                </div>

                <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/40 p-4">
                  <div className="space-y-2">
                    <Label>Nome do serviço</Label>
                    <Input
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                      placeholder="Corte premium"
                      className="rounded-xl bg-card"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Duração (min)</Label>
                      <Input
                        type="number"
                        value={serviceForm.duration}
                        onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
                        className="rounded-xl bg-card"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Preço (R$)</Label>
                      <Input
                        value={serviceForm.price}
                        onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                        placeholder="45,00"
                        className="rounded-xl bg-card"
                      />
                    </div>
                  </div>
                  <Button variant="hero" size="pill" className="w-full" onClick={handleAddService}>
                    <Plus className="size-4" /> Adicionar serviço
                  </Button>
                </div>

                <div className="space-y-2">
                  {services.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado ainda.</p>
                  ) : (
                    services.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/60 p-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">{s.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.duration_minutes} min · {formatPrice(s.price_cents)}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteService(s.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
};

export default Painel;
