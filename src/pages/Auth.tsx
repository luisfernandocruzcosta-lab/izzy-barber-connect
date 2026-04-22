import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";

import logo from "@/assets/izzy-barber-logo.png";
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
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Mode = "sign-in" | "sign-up";
type Role = "client" | "barber";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, isBarber, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<Mode>("sign-in");
  const [role, setRole] = useState<Role>("client");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && session) {
      navigate(isBarber ? "/painel" : "/", { replace: true });
    }
  }, [authLoading, session, isBarber, navigate]);

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Falha no login", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Bem-vindo de volta" });
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/painel`,
      },
    });

    if (error) {
      setLoading(false);
      toast({ title: "Falha no cadastro", description: error.message, variant: "destructive" });
      return;
    }

    // Se a barbearia foi escolhida, adiciona o papel "barber" ao novo usuário
    if (role === "barber" && data.user) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: data.user.id, role: "barber" });
      if (roleError) {
        toast({
          title: "Conta criada, mas o perfil de barbearia não foi liberado",
          description: roleError.message,
          variant: "destructive",
        });
      }
    }

    setLoading(false);
    toast({
      title: "Conta criada com sucesso",
      description: "Você já pode entrar.",
    });
    setMode("sign-in");
    setPassword("");
  };

  return (
    <main className="ambient-bg relative isolate flex min-h-screen items-center justify-center px-4 py-10">
      <div className="relative z-10 w-full max-w-md space-y-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Voltar
        </Link>

        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="Izzy Barber" className="h-16 w-auto" />
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Acesso Izzy Barber</p>
        </div>

        <div className="glass-panel rounded-2xl p-6 sm:p-7">
          <div className="mb-5 inline-flex w-full rounded-full border border-border/70 bg-secondary/40 p-1">
            <Button
              variant={mode === "sign-in" ? "hero" : "tab"}
              size="pill"
              className="flex-1"
              onClick={() => setMode("sign-in")}
            >
              Entrar
            </Button>
            <Button
              variant={mode === "sign-up" ? "hero" : "tab"}
              size="pill"
              className="flex-1"
              onClick={() => setMode("sign-up")}
            >
              Criar conta
            </Button>
          </div>

          <div className="space-y-4">
            {mode === "sign-up" && (
              <div className="space-y-2">
                <Label htmlFor="full-name">Nome completo</Label>
                <Input
                  id="full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  className="rounded-xl bg-card"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                className="rounded-xl bg-card"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-xl bg-card"
              />
            </div>

            {mode === "sign-up" && (
              <div className="space-y-2">
                <Label htmlFor="role">Tipo de conta</Label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger id="role" className="rounded-xl bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Cliente — quero agendar</SelectItem>
                    <SelectItem value="barber">Barbearia — quero gerenciar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              variant="hero"
              size="pill"
              className="w-full"
              disabled={loading || !email || !password || (mode === "sign-up" && !fullName)}
              onClick={mode === "sign-in" ? handleSignIn : handleSignUp}
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {mode === "sign-in" ? "Entrar" : "Criar conta"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Auth;
