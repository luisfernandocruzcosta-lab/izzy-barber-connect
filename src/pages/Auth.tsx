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

type Mode = "sign-in" | "sign-up" | "forgot";
type Role = "client" | "barber";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, homePath, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<Mode>("sign-in");
  const [role, setRole] = useState<Role>("client");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && session) {
      navigate(homePath, { replace: true });
    }
  }, [authLoading, session, homePath, navigate]);

  const handleForgot = async () => {
    if (!email) {
      toast({ title: "Informe o e-mail", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      console.error("Reset password error:", error);
      toast({ title: "Erro", description: "Não foi possível enviar o e-mail. Tente novamente.", variant: "destructive" });
      return;
    }
    toast({ title: "Verifique seu e-mail", description: "Enviamos o link para redefinir a senha." });
    setMode("sign-in");
  };

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      console.error("Sign in error:", error);
      toast({ title: "Falha no login", description: "E-mail ou senha inválidos.", variant: "destructive" });
      return;
    }
    setLoading(false);
    toast({ title: "Bem-vindo de volta" });
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone, requested_role: role },
        emailRedirectTo: `${window.location.origin}/painel`,
      },
    });

    if (error) {
      setLoading(false);
      console.error("Sign up error:", error);
      const msg = error.message?.toLowerCase().includes("registered")
        ? "Este e-mail já está em uso ou inválido."
        : "Não foi possível concluir o cadastro. Verifique os dados e tente novamente.";
      toast({ title: "Falha no cadastro", description: msg, variant: "destructive" });
      return;
    }

    // Caso o usuário já tenha sido autenticado (auto-confirm), garante o papel solicitado.
    if (data.session && role === "barber") {
      await supabase.rpc("claim_barber_role");
    }

    setLoading(false);
    toast({
      title: "Conta criada com sucesso",
      description: data.session
        ? "Tudo pronto, redirecionando…"
        : "Verifique seu e-mail para confirmar o cadastro.",
    });
    if (!data.session) {
      setMode("sign-in");
      setPassword("");
    }
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

            {mode === "sign-up" && (
              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 91234-5678"
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

            {mode !== "forgot" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  {mode === "sign-in" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs text-muted-foreground underline hover:text-foreground"
                    >
                      Esqueci a senha
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl bg-card"
                />
              </div>
            )}

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
              disabled={
                loading ||
                !email ||
                (mode !== "forgot" && !password) ||
                (mode === "sign-up" && !fullName)
              }
              onClick={
                mode === "sign-in" ? handleSignIn : mode === "sign-up" ? handleSignUp : handleForgot
              }
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {mode === "sign-in" ? "Entrar" : mode === "sign-up" ? "Criar conta" : "Enviar link"}
            </Button>

            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => setMode("sign-in")}
                className="block w-full text-center text-xs text-muted-foreground underline hover:text-foreground"
              >
                Voltar para o login
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Auth;
