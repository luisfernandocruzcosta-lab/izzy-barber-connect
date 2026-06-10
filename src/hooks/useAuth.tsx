import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "client" | "barber" | "admin";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  isBarber: boolean;
  isAdmin: boolean;
  isClient: boolean;
  homePath: string;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadRoles = async (userId: string) => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (cancelled) return;
      if (error) console.error("Failed to load user roles:", error);
      setRoles((data ?? []).map((r) => r.role as AppRole));
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user.id) {
        // Carrega roles e só então libera `loading` para evitar
        // que o redirect use um homePath defasado.
        setLoading(true);
        setTimeout(() => {
          void loadRoles(nextSession.user.id).finally(() => {
            if (!cancelled) setLoading(false);
          });
        }, 0);
      } else {
        setRoles([]);
        setLoading(false);
      }
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (data.session?.user.id) {
        await loadRoles(data.session.user.id);
      }
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    roles,
    loading,
    isBarber: roles.includes("barber") || roles.includes("admin"),
    isAdmin: roles.includes("admin"),
    isClient: roles.includes("client") && !roles.includes("barber") && !roles.includes("admin"),
    homePath: roles.includes("admin")
      ? "/admin"
      : roles.includes("barber")
        ? "/painel"
        : "/minhas-reservas",
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
