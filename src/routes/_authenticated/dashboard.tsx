import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { useAuthProfile } from "@/lib/use-auth";
import { MENUS, canAccessMenu, accessibleDivisions } from "@/lib/menus";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  FileSearch, Wallet, ArrowLeftRight, Banknote, ShieldCheck, Landmark, CheckCircle2,
  type LucideIcon, FileText, HardDrive, Layers, Clock, Trash2, Folder,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — Arsip Digital Bank BJB" }],
  }),
  component: DashboardPage,
});

const ICONS: Record<string, LucideIcon> = {
  FileSearch, Wallet, ArrowLeftRight, Banknote, ShieldCheck, Landmark, CheckCircle2,
};

function DashboardPage() {
  const { data: profile } = useAuthProfile();

  const stats = useQuery({
    queryKey: ["dashboard-stats", profile?.userId],
    enabled: !!profile,
    queryFn: async () => {
      let { data, error } = await supabase
        .from("documents")
        .select("id, menu, file_size, created_at, mime_type")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
        
      if (error && error.code === "42703") {
        // Fallback if deleted_at column doesn't exist yet
        const fallback = await supabase
          .from("documents")
          .select("id, menu, file_size, created_at, mime_type")
          .order("created_at", { ascending: false });
        data = fallback.data;
        error = fallback.error;
      }

      if (error) throw error;
      if (!data) return { totalFiles: 0, totalFolders: 0, size: 0, latest: null, byMenu: {} };
      const totalFiles = data.filter((d) => d.mime_type !== "folder").length;
      const totalFolders = data.filter((d) => d.mime_type === "folder").length;
      const size = data.reduce((s, d) => s + Number(d.file_size ?? 0), 0);
      const latest = data[0]?.created_at ?? null;
      const byMenu = data.reduce<Record<string, number>>((acc, d) => {
        acc[d.menu] = (acc[d.menu] ?? 0) + 1;
        return acc;
      }, {});
      return { totalFiles, totalFolders, size, latest, byMenu };
    },
  });

  const trashCount = useQuery({
    queryKey: ["trash-count-dashboard", profile?.userId],
    enabled: !!profile,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .not("deleted_at", "is", null);
      if (error) return 0;
      return count ?? 0;
    },
    retry: false, // Don't retry if column doesn't exist to prevent slow loading
  });

  if (!profile) return null;
  const visibleMenus = MENUS.filter((m) => canAccessMenu(profile.role, m.key));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section
        className="rounded-2xl p-8 text-white"
        style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-elegant)" }}
      >
        <div className="text-sm opacity-80">Selamat datang kembali,</div>
        <h1 className="mt-1 text-3xl font-bold">
          {profile.username} <span className="text-lg font-normal opacity-80">· {profile.role}</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm opacity-90">
          Kelola berkas arsip Bank BJB dengan aman dan terstruktur. Pilih menu di navbar atau kartu
          di bawah untuk mulai mengelola dokumen.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={FileText} label="Total Berkas" value={stats.data?.totalFiles ?? "—"} />
        <StatCard icon={Folder} label="Total Folder" value={stats.data?.totalFolders ?? "—"} />
        <StatCard
          icon={HardDrive}
          label="Total Ukuran"
          value={stats.data ? formatBytes(stats.data.size) : "—"}
        />
        <StatCard
          icon={Clock}
          label="Unggahan Terakhir"
          value={stats.data?.latest ? new Date(stats.data.latest).toLocaleDateString("id-ID") : "—"}
        />
        <StatCard icon={Trash2} label="Di Sampah" value={trashCount.data ?? "—"} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Menu Berkas</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleMenus.map((m) => {
            const Icon = ICONS[m.icon] ?? FileText;
            const divs = accessibleDivisions(profile.role, m.key);
            const count = stats.data?.byMenu?.[m.key] ?? 0;
            return (
              <Link
                key={m.key}
                to="/docs/$menu"
                params={{ menu: m.key }}
                search={{ division: divs[0] }}
                className="group"
              >
                <Card className="h-full p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-primary-foreground"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                      {m.adminOnly ? "Admin" : "Divisi"}
                    </span>
                  </div>
                  <div className="mt-4 text-base font-semibold">{m.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {count} berkas · {divs.map((d) => d === "admin" ? "Admin" : d).join(", ")}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-xl font-bold">{value}</div>
        </div>
      </div>
    </Card>
  );
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}