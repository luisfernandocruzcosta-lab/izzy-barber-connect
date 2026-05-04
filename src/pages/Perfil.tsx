import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";

import logo from "@/assets/izzy-barber-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Perfil = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, signOut, isBarber } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    favorite_style: "",
    preferred_contact_channel: "whatsapp",
  });
  const [pwd, setPwd] = useState({ current: "", next: "" });
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, favorite_style, preferred_contact_channel")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setForm({
          full_name: data.full_name ?? "",
          phone: data.phone ?? "",
          favorite_style: data.favorite_style ?? "",
          preferred_contact_channel: data.preferred_contact_channel ?? "whatsapp",
        });
      }
      setLoading(false);
    })();
  }, [authLoading, user, navigate]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name || null,
        phone: form.phone || null,
        favorite_style: form.favorite_style || null,
        preferred_contact_channel: form.preferred_contact_channel,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: "Não foi possível concluir a operação. Tente novamente.", variant: "destructive" });
      return;
    }
    toast({ title: "Perfil atualizado" });
  };

  const handleChangePassword = async () => {
    if (pwd.next.length < 6) {
      toast({ title: "Senha curta", description: "Mínimo de 6 caracteres.", variant: "destructive" });
      return;
    }
    setPwdSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwd.next });
    setPwdSaving(false);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível concluir a operação. Tente novamente.", variant: "destructive" });
      return;
    }
    toast({ title: "Senha alterada" });
    setPwd({ current: "", next: "" });
  };

  if (authLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="ambient-bg relative isolate min-h-screen px-4 py-8">
      <div className="container relative z-10 max-w-2xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Voltar
          </Link>
          <img src={logo} alt="Izzy Barber" className="h-9 w-auto" />
        </header>

        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Perfil</p>
          <h1 className="mt-1 text-3xl font-semibold text-foreground">Meus dados</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>

        <section className="glass-panel space-y-4 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground">Informações pessoais</h2>
          <div className="space-y-2">
            <Label>Nome completo</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="rounded-xl bg-card" />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 91234-5678" className="rounded-xl bg-card" />
          </div>
          <div className="space-y-2">
            <Label>Estilo preferido (opcional)</Label>
            <Input value={form.favorite_style} onChange={(e) => setForm({ ...form, favorite_style: e.target.value })} placeholder="Ex.: degradê médio" className="rounded-xl bg-card" />
          </div>
          <Button variant="hero" size="pill" className="w-full" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />} Salvar alterações
          </Button>
        </section>

        <section className="glass-panel space-y-4 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground">Segurança</h2>
          <div className="space-y-2">
            <Label>Nova senha</Label>
            <Input type="password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} className="rounded-xl bg-card" />
          </div>
          <Button variant="outline" size="pill" className="w-full" onClick={handleChangePassword} disabled={pwdSaving}>
            {pwdSaving && <Loader2 className="size-4 animate-spin" />} Alterar senha
          </Button>
        </section>

        <div className="flex flex-wrap gap-2">
          {isBarber && (
            <Button asChild variant="outline" size="pill">
              <Link to="/painel">Ir para o painel</Link>
            </Button>
          )}
          <Button asChild variant="outline" size="pill">
            <Link to="/minhas-reservas">Minhas reservas</Link>
          </Button>
          <Button variant="ghost" size="pill" onClick={() => signOut().then(() => navigate("/"))}>
            Sair da conta
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Perfil;
