import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { USERNAME_REGEX, usernameToEmail } from "@/lib/menus";
import { Loader2, Lock, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk — Arsip Digital Bank BJB" },
      { name: "description", content: "Halaman masuk sistem arsip digital Bank BJB." },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/dashboard" });
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-bootstrap demo accounts on first load (idempotent).
  useEffect(() => {
    fetch("/api/public/seed").catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const u = username.trim().toUpperCase();
    if (!USERNAME_REGEX.test(u)) {
      toast.error("Username harus 4 karakter (huruf kapital & angka).");
      return;
    }
    if (password.length < 8) {
      toast.error("Password minimal 8 karakter.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(u),
      password,
    });
    setLoading(false);
    if (error) {
      toast.error("Username atau password salah.");
      return;
    }
    toast.success("Berhasil masuk");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4"
      style={{ background: "var(--gradient-hero)" }}>
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 0, transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.3) 0, transparent 40%)",
        }}
      />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <span className="text-2xl font-black tracking-tight">bjb</span>
          </div>
          <h1 className="text-2xl font-bold">Arsip Digital Bank BJB</h1>
          <p className="mt-1 text-sm opacity-90">Sistem pengarsipan berkas dokumen internal</p>
        </div>

        <Card className="p-6 shadow-2xl" style={{ boxShadow: "var(--shadow-elegant)" }}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <div className="relative mt-1.5">
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toUpperCase())}
                  maxLength={4}
                  className="pl-9 uppercase tracking-widest"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                4 karakter, kombinasi huruf kapital &amp; angka.
              </p>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Masuk
            </Button>
          </form>

        </Card>

        <p className="mt-6 text-center text-xs text-white/80">
          © {new Date().getFullYear()} Bank BJB · Akses internal
        </p>
      </div>
    </div>
  );
}