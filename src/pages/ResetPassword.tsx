import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";

import logo from "@/assets/izzy-barber-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase coloca os tokens no hash; o cliente já cria a sessão sozinho.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "Use pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Senhas diferentes", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao atualizar", description: "Não foi possível concluir a operação. Tente novamente.", variant: "destructive" });
      return;
    }
    toast({ title: "Senha atualizada" });
    navigate("/", { replace: true });
  };

  return (
    <main className="ambient-bg relative isolate flex min-h-screen items-center justify-center px-4 py-10">
      <div className="relative z-10 w-full max-w-md space-y-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="Izzy Barber" className="h-16 w-auto" />
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Nova senha</p>
        </div>
        <div className="glass-panel space-y-4 rounded-2xl p-6 sm:p-7">
          {!ready ? (
            <p className="text-sm text-muted-foreground">
              Verificando link de recuperação… Abra o link recebido por e-mail nesta mesma janela.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Nova senha</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl bg-card" />
              </div>
              <div className="space-y-2">
                <Label>Confirmar senha</Label>
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="rounded-xl bg-card" />
              </div>
              <Button variant="hero" size="pill" className="w-full" onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />} Atualizar senha
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default ResetPassword;
