import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Loader2, LockKeyhole, LogOut, Shield, Store, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

type AuthMode = "sign-in" | "sign-up";
type AccessRole = "client" | "barber" | "admin";

const roleMeta: Record<AccessRole, { label: string; icon: typeof UserRound }> = {
  client: { label: "Cliente", icon: UserRound },
  barber: { label: "Administrador da barbearia", icon: Store },
  admin: { label: "Admin da plataforma", icon: Shield },
};

export const GlobalAuthPanel = () => {
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AccessRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<AccessRole>("client");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const loadRoles = async (userId: string) => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);

      if (error) {
        toast({
          title: "Não foi possível carregar o acesso",
          description: error.message,
          variant: "destructive",
        });
        setRoles([]);
        return;
      }

      setRoles((data ?? []).map((item) => item.role as AccessRole));
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user.id) {
        void loadRoles(nextSession.user.id);
      } else {
        setRoles([]);
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user.id) {
        void loadRoles(data.session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const canSelfRegister = selectedRole === "client";

  const currentAccess = useMemo(() => {
    if (!roles.length) return "Sem papel definido";
    return roles.map((role) => roleMeta[role].label).join(" · ");
  }, [roles]);

  const resetFields = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setSelectedRole("client");
  };

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast({ title: "Falha no login", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Login realizado", description: "Acesso global liberado com sucesso." });
    resetFields();
  };

  const handleSignUp = async () => {
    if (!canSelfRegister) {
      toast({
        title: "Cadastro assistido",
        description: "Perfis de administrador da barbearia e admin global são liberados internamente após aprovação.",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);

    if (error) {
      toast({ title: "Falha no cadastro", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Conta criada",
      description: "Confira seu e-mail para confirmar o acesso, se a confirmação estiver ativada.",
    });
    resetFields();
    setMode("sign-in");
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Falha ao sair", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Sessão encerrada", description: "Você saiu do painel global." });
  };

  return (
    <Card className="glass-panel overflow-hidden rounded-[1.5rem] border-brand/20 shadow-glow">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">painel global</p>
            <h3 className="mt-1 text-2xl font-semibold text-foreground">Login central do Izzy Barber</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Um único acesso para cliente, administrador da barbearia e admin da plataforma.
            </p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-full border border-brand/25 bg-brand-soft text-brand">
            <LockKeyhole className="size-5" />
          </div>
        </div>

        {session ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-secondary/45 p-4">
              <p className="text-sm text-muted-foreground">Sessão ativa</p>
              <p className="mt-1 break-all text-base font-semibold text-foreground">{session.user.email}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {roles.length ? (
                  roles.map((role) => {
                    const Icon = roleMeta[role].icon;
                    return (
                      <span
                        key={role}
                        className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-brand"
                      >
                        <Icon className="size-3.5" />
                        {roleMeta[role].label}
                      </span>
                    );
                  })
                ) : (
                  <span className="rounded-full border border-border/70 bg-secondary px-3 py-1.5 text-xs text-muted-foreground">
                    Sem papel carregado
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="metric-tile">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Acesso detectado</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{currentAccess}</p>
              </div>
              <div className="metric-tile">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Próximo passo</p>
                <p className="mt-2 text-sm font-semibold text-foreground">Entrar no painel correspondente</p>
              </div>
            </div>

            <Button variant="luxe" size="pill" className="w-full" onClick={handleSignOut}>
              <LogOut className="size-4" />
              Sair da sessão
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="glass-panel inline-flex rounded-full p-1">
              <Button variant={mode === "sign-in" ? "hero" : "tab"} size="pill" onClick={() => setMode("sign-in")}>
                Entrar
              </Button>
              <Button variant={mode === "sign-up" ? "hero" : "tab"} size="pill" onClick={() => setMode("sign-up")}>
                Criar conta
              </Button>
            </div>

            <div className="space-y-4 rounded-2xl border border-border/70 bg-secondary/35 p-4">
              {mode === "sign-up" && (
                <div className="space-y-2">
                  <Label htmlFor="global-full-name">Nome</Label>
                  <Input
                    id="global-full-name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Seu nome completo"
                    className="rounded-xl border-border/70 bg-card"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="global-email">E-mail</Label>
                <Input
                  id="global-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@izzyshop.com"
                  className="rounded-xl border-border/70 bg-card"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="global-password">Senha</Label>
                <Input
                  id="global-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl border-border/70 bg-card"
                />
              </div>

              {mode === "sign-up" && (
                <div className="space-y-2">
                  <Label htmlFor="global-access-role">Tipo de acesso</Label>
                  <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AccessRole)}>
                    <SelectTrigger id="global-access-role" className="rounded-xl border-border/70 bg-card">
                      <SelectValue placeholder="Selecione o acesso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Cliente</SelectItem>
                      <SelectItem value="barber">Administrador da barbearia</SelectItem>
                      <SelectItem value="admin">Admin da plataforma</SelectItem>
                    </SelectContent>
                  </Select>
                  {!canSelfRegister && (
                    <p className="text-xs leading-5 text-muted-foreground">
                      Este acesso é liberado internamente para manter o controle das barbearias.
                    </p>
                  )}
                </div>
              )}

              <Button
                variant="hero"
                size="pill"
                className="w-full"
                onClick={mode === "sign-in" ? handleSignIn : handleSignUp}
                disabled={loading || !email || !password || (mode === "sign-up" && !fullName)}
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                {mode === "sign-in" ? "Entrar no painel global" : "Criar acesso"}
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {([
                ["Cliente", "Busca, agenda, histórico e fidelidade"],
                ["Barbearia", "Equipe, serviços, agenda e clientes"],
                ["Plataforma", "Gestão completa e governança"],
              ] as const).map(([title, text]) => (
                <div key={title} className="metric-tile">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
                  <p className="mt-2 text-sm font-semibold leading-5 text-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};