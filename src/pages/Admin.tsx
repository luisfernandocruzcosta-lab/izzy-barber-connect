import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  LogOut,
  Pencil,
  Search,
  Shield,
  Store,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";

import logo from "@/assets/izzy-barber-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type ShopRow = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  description: string | null;
  logo_url: string | null;
  created_at: string;
};
type RoleRow = { user_id: string; role: string };
type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
};

type ShopForm = {
  name: string;
  address: string;
  phone: string;
  description: string;
  logo_url: string;
};
type UserForm = { full_name: string; phone: string };

const emptyShopForm: ShopForm = { name: "", address: "", phone: "", description: "", logo_url: "" };
const emptyUserForm: UserForm = { full_name: "", phone: "" };

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [appointmentsCount, setAppointmentsCount] = useState(0);

  const [editingShop, setEditingShop] = useState<ShopRow | null>(null);
  const [shopForm, setShopForm] = useState<ShopForm>(emptyShopForm);
  const [savingShop, setSavingShop] = useState(false);
  const [deletingShop, setDeletingShop] = useState<ShopRow | null>(null);

  const [editingUser, setEditingUser] = useState<ProfileRow | null>(null);
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm);
  const [savingUser, setSavingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState<ProfileRow | null>(null);
  const [deletingUserInFlight, setDeletingUserInFlight] = useState(false);

  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "client" | "barber" | "admin">("all");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!isAdmin) {
      toast({
        title: "Acesso restrito",
        description: "Esta área é exclusiva para administradores.",
        variant: "destructive",
      });
      navigate("/", { replace: true });
    }
  }, [authLoading, user, isAdmin, navigate, toast]);

  const loadAll = async () => {
    setLoading(true);
    const [shopsRes, rolesRes, apptsRes, profilesRes] = await Promise.all([
      supabase
        .from("barber_shops")
        .select("id, name, address, phone, description, logo_url, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("appointments").select("id", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("id, full_name, phone, avatar_url, created_at")
        .order("created_at", { ascending: false }),
    ]);
    setShops((shopsRes.data ?? []) as ShopRow[]);
    setRoles((rolesRes.data ?? []) as RoleRow[]);
    setProfiles((profilesRes.data ?? []) as ProfileRow[]);
    setAppointmentsCount(apptsRes.count ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    void loadAll();
  }, [isAdmin]);

  const rolesByUser = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const r of roles) {
      const list = map.get(r.user_id) ?? [];
      list.push(r.role);
      map.set(r.user_id, list);
    }
    return map;
  }, [roles]);

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    return profiles.filter((p) => {
      const userRoles = rolesByUser.get(p.id) ?? [];
      if (userFilter !== "all" && !userRoles.includes(userFilter)) return false;
      if (!term) return true;
      return (
        (p.full_name ?? "").toLowerCase().includes(term) ||
        (p.phone ?? "").toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term)
      );
    });
  }, [profiles, rolesByUser, userFilter, userSearch]);

  // --- Shops ---
  const openEditShop = (shop: ShopRow) => {
    setEditingShop(shop);
    setShopForm({
      name: shop.name,
      address: shop.address,
      phone: shop.phone ?? "",
      description: shop.description ?? "",
      logo_url: shop.logo_url ?? "",
    });
  };
  const closeEditShop = () => {
    setEditingShop(null);
    setShopForm(emptyShopForm);
  };
  const saveShop = async () => {
    if (!editingShop) return;
    if (!shopForm.name.trim() || !shopForm.address.trim()) {
      toast({ title: "Dados incompletos", description: "Nome e endereço são obrigatórios.", variant: "destructive" });
      return;
    }
    setSavingShop(true);
    const { error } = await supabase
      .from("barber_shops")
      .update({
        name: shopForm.name.trim(),
        address: shopForm.address.trim(),
        phone: shopForm.phone.trim() || null,
        description: shopForm.description.trim() || null,
        logo_url: shopForm.logo_url.trim() || null,
      })
      .eq("id", editingShop.id);
    setSavingShop(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Barbearia atualizada", description: "As alterações foram salvas." });
    closeEditShop();
    await loadAll();
  };
  const confirmDeleteShop = async () => {
    if (!deletingShop) return;
    const { error } = await supabase.from("barber_shops").delete().eq("id", deletingShop.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Barbearia excluída", description: `${deletingShop.name} foi removida.` });
    setDeletingShop(null);
    await loadAll();
  };

  // --- Users ---
  const openEditUser = (p: ProfileRow) => {
    setEditingUser(p);
    setUserForm({ full_name: p.full_name ?? "", phone: p.phone ?? "" });
  };
  const closeEditUser = () => {
    setEditingUser(null);
    setUserForm(emptyUserForm);
  };
  const saveUser = async () => {
    if (!editingUser) return;
    setSavingUser(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: userForm.full_name.trim() || null,
        phone: userForm.phone.trim() || null,
      })
      .eq("id", editingUser.id);
    setSavingUser(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Cadastro atualizado", description: "As alterações foram salvas." });
    closeEditUser();
    await loadAll();
  };

  const toggleBarberRole = async (p: ProfileRow, makeBarber: boolean) => {
    if (makeBarber) {
      const { error } = await supabase.from("user_roles").insert({ user_id: p.id, role: "barber" });
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Função atribuída", description: "Usuário agora é barbeiro." });
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", p.id).eq("role", "barber");
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Função removida", description: "Usuário não é mais barbeiro." });
    }
    await loadAll();
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;
    setDeletingUserInFlight(true);
    const { data, error } = await supabase.functions.invoke("admin-delete-user", {
      body: { target_user_id: deletingUser.id },
    });
    setDeletingUserInFlight(false);
    if (error || (data && (data as { error?: string }).error)) {
      const msg = (data as { error?: string } | null)?.error ?? error?.message ?? "Falha ao excluir";
      toast({ title: "Erro ao excluir", description: msg, variant: "destructive" });
      return;
    }
    toast({ title: "Cadastro excluído", description: "Usuário removido permanentemente." });
    setDeletingUser(null);
    await loadAll();
  };

  if (authLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const counts = {
    admin: roles.filter((r) => r.role === "admin").length,
    barber: roles.filter((r) => r.role === "barber").length,
    client: roles.filter((r) => r.role === "client").length,
  };

  return (
    <main className="ambient-bg relative isolate min-h-screen">
      <div className="container relative z-10 py-6 sm:py-10">
        <header className="flex items-center justify-between gap-4 border-b border-border/60 pb-5">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Izzy Barber" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Izzy Barber</p>
              <p className="text-sm font-semibold text-foreground inline-flex items-center gap-2">
                <Shield className="size-3.5 text-brand" /> Painel administrativo
              </p>
            </div>
          </Link>
          <Button variant="ghost" size="pill" onClick={() => signOut()}>
            <LogOut className="size-4" /> Sair
          </Button>
        </header>

        <div className="mt-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Voltar
          </Link>
        </div>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="metric-tile">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground inline-flex items-center gap-1">
              <Store className="size-3 text-brand" /> Barbearias
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">{shops.length}</p>
          </div>
          <div className="metric-tile">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground inline-flex items-center gap-1">
              <Users className="size-3 text-brand" /> Clientes
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">{counts.client}</p>
          </div>
          <div className="metric-tile">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground inline-flex items-center gap-1">
              <Users className="size-3 text-brand" /> Barbeiros
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">{counts.barber}</p>
          </div>
          <div className="metric-tile">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Agendamentos</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{appointmentsCount}</p>
          </div>
        </section>

        <Tabs defaultValue="users" className="mt-6">
          <TabsList>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="shops">Barbearias</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            <section className="glass-panel rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Clientes e barbeiros</h2>
                  <p className="text-sm text-muted-foreground">
                    Edite cadastros, promova/revogue barbeiros e exclua usuários permanentemente.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, telefone ou ID"
                    className="pl-9"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  {(["all", "client", "barber", "admin"] as const).map((f) => (
                    <Button
                      key={f}
                      variant={userFilter === f ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUserFilter(f)}
                    >
                      {f === "all" ? "Todos" : f === "client" ? "Clientes" : f === "barber" ? "Barbeiros" : "Admins"}
                    </Button>
                  ))}
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {filteredUsers.map((p) => {
                    const userRoles = rolesByUser.get(p.id) ?? [];
                    const isBarber = userRoles.includes("barber");
                    const isAdminRow = userRoles.includes("admin");
                    const isSelf = user?.id === p.id;
                    return (
                      <li
                        key={p.id}
                        className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {p.avatar_url ? (
                            <img
                              src={p.avatar_url}
                              alt={p.full_name ?? "Usuário"}
                              className="size-12 rounded-full object-cover border border-border/60"
                            />
                          ) : (
                            <div className="flex size-12 items-center justify-center rounded-full bg-secondary/60 text-muted-foreground">
                              <UserCog className="size-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-foreground truncate">
                                {p.full_name ?? "(sem nome)"}
                              </p>
                              {isAdminRow && <Badge variant="secondary">admin</Badge>}
                              {isBarber && <Badge variant="secondary">barbeiro</Badge>}
                              {!isBarber && !isAdminRow && <Badge variant="outline">cliente</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{p.phone ?? "—"}</p>
                            <p className="text-[11px] text-muted-foreground/70 truncate font-mono">{p.id}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:shrink-0">
                          <Button variant="outline" size="sm" onClick={() => openEditUser(p)}>
                            <Pencil className="size-4" /> Editar
                          </Button>
                          {!isAdminRow && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleBarberRole(p, !isBarber)}
                            >
                              {isBarber ? "Revogar barbeiro" : "Tornar barbeiro"}
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isSelf}
                            title={isSelf ? "Você não pode excluir a si mesmo" : undefined}
                            onClick={() => setDeletingUser(p)}
                          >
                            <Trash2 className="size-4" /> Excluir
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </TabsContent>

          <TabsContent value="shops" className="mt-4">
            <section className="glass-panel rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Barbearias cadastradas</h2>
                  <p className="text-sm text-muted-foreground">Edite informações ou remova barbearias do sistema.</p>
                </div>
              </div>

              {shops.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">Nenhuma barbearia cadastrada ainda.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {shops.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {s.logo_url ? (
                          <img
                            src={s.logo_url}
                            alt={s.name}
                            className="size-12 rounded-lg object-cover border border-border/60"
                          />
                        ) : (
                          <div className="flex size-12 items-center justify-center rounded-lg bg-secondary/60 text-muted-foreground">
                            <Store className="size-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{s.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{s.address}</p>
                          {s.phone && <p className="text-xs text-muted-foreground">{s.phone}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2 sm:shrink-0">
                        <Button variant="outline" size="sm" onClick={() => openEditShop(s)}>
                          <Pencil className="size-4" /> Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeletingShop(s)}>
                          <Trash2 className="size-4" /> Excluir
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </TabsContent>
        </Tabs>

        <section className="glass-panel mt-6 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground">Atalhos</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="pill">
              <Link to="/painel">Abrir painel da barbearia</Link>
            </Button>
            <Button asChild variant="outline" size="pill">
              <Link to="/buscar">Ver app do cliente</Link>
            </Button>
          </div>
        </section>
      </div>

      {/* Edit shop */}
      <Dialog open={!!editingShop} onOpenChange={(open) => !open && closeEditShop()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar barbearia</DialogTitle>
            <DialogDescription>Atualize as informações exibidas para os clientes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="shop-name">Nome</Label>
              <Input id="shop-name" value={shopForm.name} onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shop-address">Endereço</Label>
              <Input id="shop-address" value={shopForm.address} onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shop-phone">Telefone</Label>
              <Input id="shop-phone" value={shopForm.phone} onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shop-logo">URL do logo</Label>
              <Input id="shop-logo" value={shopForm.logo_url} onChange={(e) => setShopForm({ ...shopForm, logo_url: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shop-desc">Descrição</Label>
              <Textarea
                id="shop-desc"
                rows={3}
                value={shopForm.description}
                onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeEditShop} disabled={savingShop}>
              Cancelar
            </Button>
            <Button onClick={saveShop} disabled={savingShop}>
              {savingShop && <Loader2 className="size-4 animate-spin" />}
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit user */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && closeEditUser()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar cadastro</DialogTitle>
            <DialogDescription>Atualize o nome e telefone do usuário.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="u-name">Nome completo</Label>
              <Input
                id="u-name"
                value={userForm.full_name}
                onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-phone">Telefone</Label>
              <Input
                id="u-phone"
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeEditUser} disabled={savingUser}>
              Cancelar
            </Button>
            <Button onClick={saveUser} disabled={savingUser}>
              {savingUser && <Loader2 className="size-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete shop */}
      <AlertDialog open={!!deletingShop} onOpenChange={(open) => !open && setDeletingShop(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir barbearia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá <strong>{deletingShop?.name}</strong> e todos os dados associados (serviços, equipe,
              agendamentos). Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteShop}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete user */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && !deletingUserInFlight && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cadastro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá <strong>{deletingUser?.full_name ?? "este usuário"}</strong> permanentemente, incluindo
              login, perfil e funções. Agendamentos e histórico podem ser apagados em cascata. Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingUserInFlight}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDeleteUser();
              }}
              disabled={deletingUserInFlight}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingUserInFlight && <Loader2 className="size-4 animate-spin" />}
              Excluir permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default Admin;
