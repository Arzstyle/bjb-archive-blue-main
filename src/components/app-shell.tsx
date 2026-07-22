import { type ReactNode, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  X as CloseIcon,
  ChevronDown,
  User as UserIcon,
  ShieldCheck,
  FileSearch,
  Wallet,
  ArrowLeftRight,
  Banknote,
  Landmark,
  CheckCircle2,
  Trash2,
  Activity,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MENUS, canAccessMenu, accessibleDivisions, divisionLabel, type MenuKey } from "@/lib/menus";
import { useAuthProfile } from "@/lib/use-auth";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  FileSearch, Wallet, ArrowLeftRight, Banknote, ShieldCheck, Landmark, CheckCircle2,
};

export function AppShell({ children }: { children: ReactNode }) {
  const { data: profile, isLoading } = useAuthProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Anda berhasil keluar");
    navigate({ to: "/auth", replace: true });
  }

  if (isLoading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Memuat…</div>
      </div>
    );
  }

  const visibleMenus = MENUS.filter((m) => canAccessMenu(profile.role, m.key));

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold">
            bjb
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Arsip Digital</div>
            <div className="text-xs opacity-80">Bank BJB</div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto rounded-md p-1 hover:bg-sidebar-accent lg:hidden"
            aria-label="Tutup menu"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <div className="rounded-lg bg-sidebar-accent p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground font-semibold">
                <UserIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{profile.username}</div>
                <div className="text-xs capitalize opacity-80">{profile.role}</div>
              </div>
            </div>
          </div>

          <nav className="mt-6 space-y-1">
            <Link
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === "/dashboard"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "hover:bg-sidebar-accent",
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>

            {profile.role !== "admin" && (
              <Link
                to="/templates"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors mt-1",
                  pathname.startsWith("/templates")
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "hover:bg-sidebar-accent",
                )}
              >
                <FileText className="h-4 w-4" />
                Template Formulir
              </Link>
            )}

            <div className="mt-4 mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider opacity-60">
              Menu Berkas
            </div>
            {visibleMenus.map((m) => {
              const Icon = ICONS[m.icon] ?? LayoutDashboard;
              const divs = accessibleDivisions(profile.role, m.key);
              const firstDiv = divs[0];
              const href = `/docs/${m.key}?division=${firstDiv}`;
              const active = pathname.startsWith(`/docs/${m.key}`);
              return (
                <Link
                  key={m.key}
                  to="/docs/$menu"
                  params={{ menu: m.key }}
                  search={{ division: firstDiv }}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "hover:bg-sidebar-accent",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {m.label}
                </Link>
              );
            })}

            <div className="mt-4 mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider opacity-60">
              Lainnya
            </div>
            <TrashLink pathname={pathname} onClick={() => setMobileOpen(false)} role={profile.role} />
            <Link
              to="/activity-log"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                pathname === "/activity-log"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "hover:bg-sidebar-accent",
              )}
            >
              <Activity className="h-4 w-4" />
              Log Aktivitas
            </Link>
          </nav>

          <button
            onClick={handleSignOut}
            className="mt-8 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/90 hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Navbar */}
        <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-2 hover:bg-muted lg:hidden"
              aria-label="Buka menu"
            >
              <MenuIcon className="h-5 w-5" />
            </button>

            <nav className="hidden flex-1 items-center gap-1 md:flex">
              {visibleMenus.map((m) => (
                <NavbarMenuItem key={m.key} menuKey={m.key} label={m.label} role={profile.role} />
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <div className="text-sm font-semibold text-foreground">{profile.username}</div>
                <div className="text-xs capitalize text-muted-foreground">{profile.role}</div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <UserIcon className="h-4 w-4" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function NavbarMenuItem({ menuKey, label, role }: { menuKey: MenuKey; label: string; role: "admin" | "konsumer" | "ritel" | "mikro" }) {
  const divs = accessibleDivisions(role, menuKey);
  const menu = MENUS.find((m) => m.key === menuKey)!;
  const Icon = ICONS[menu.icon] ?? LayoutDashboard;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-sm font-medium">
          <Icon className="h-4 w-4" />
          {label}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel className="text-xs">
          {menu.adminOnly ? "Akses Admin" : "Pilih Divisi"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {divs.map((d) => (
          <DropdownMenuItem key={d} asChild>
            <Link to="/docs/$menu" params={{ menu: menuKey }} search={{ division: d }}>
              {divisionLabel(d)}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TrashLink({ pathname, onClick, role }: { pathname: string; onClick: () => void; role: string }) {
  const active = pathname === "/trash";

  const trashCount = useQuery({
    queryKey: ["trash-count", role],
    queryFn: async () => {
      let query = supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .not("deleted_at", "is", null);

      if (role !== "admin") {
        query = query.eq("division", role as "konsumer" | "ritel" | "mikro" | "admin");
      }

      const { count, error } = await query;
      if (error) return 0;
      return count ?? 0;
    },
    staleTime: 30_000,
    retry: false, // Prevents hanging loading state if column is missing
  });

  return (
    <Link
      to="/trash"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "hover:bg-sidebar-accent",
      )}
    >
      <Trash2 className="h-4 w-4" />
      Sampah
      {(trashCount.data ?? 0) > 0 && (
        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive/20 text-destructive text-[10px] font-semibold px-1.5">
          {trashCount.data}
        </span>
      )}
    </Link>
  );
}