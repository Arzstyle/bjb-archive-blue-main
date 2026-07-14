import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthProfile } from "@/lib/use-auth";
import {
  menuLabel,
  divisionLabel,
  canAccessMenu,
  type MenuKey,
  type Division,
} from "@/lib/menus";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Trash2,
  RotateCcw,
  Search,
  Loader2,
  FileText,
  Clock,
  AlertTriangle,
  ShieldAlert,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
  FileArchive,
  FileVideo,
  FileAudio,
  Folder,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/trash")({
  head: () => ({
    meta: [{ title: "Sampah — Arsip BJB" }],
  }),
  component: TrashPage,
});

const TRASH_RETENTION_DAYS = 30;

interface TrashRow {
  id: string;
  menu: MenuKey;
  division: Division;
  title: string;
  description: string | null;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string | null;
  uploader_username: string;
  created_at: string;
  deleted_at: string;
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType === "folder") return Folder;
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType.startsWith("audio/")) return FileAudio;
  if (mimeType.includes("pdf")) return FileText;
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv")
  )
    return FileSpreadsheet;
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("tar") ||
    mimeType.includes("archive") ||
    mimeType.includes("7z")
  )
    return FileArchive;
  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.includes("text")
  )
    return FileText;
  return FileText;
}

function daysRemaining(deletedAt: string): number {
  const deleted = new Date(deletedAt);
  const expiry = new Date(deleted.getTime() + TRASH_RETENTION_DAYS * 86400000);
  const now = new Date();
  return Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / 86400000));
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function TrashPage() {
  const { data: profile } = useAuthProfile();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmPurge, setConfirmPurge] = useState(false);

  const trashQuery = useQuery({
    queryKey: ["trash", profile?.role],
    queryFn: async () => {
      let query = supabase
        .from("documents")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      // Non-admin users only see their division's trash
      if (profile && profile.role !== "admin") {
        query = query.eq("division", profile.role as "konsumer" | "ritel" | "mikro" | "admin");
      }

      const { data, error } = await query;
      if (error) return [];
      return data as TrashRow[];
    },
    enabled: !!profile,
    retry: false,
  });

  // Auto-purge expired items (> 30 days)
  const expiredItems = useMemo(() => {
    if (!trashQuery.data) return [];
    return trashQuery.data.filter((r) => daysRemaining(r.deleted_at) === 0);
  }, [trashQuery.data]);

  const autoPurgeMutation = useMutation({
    mutationFn: async (items: TrashRow[]) => {
      for (const item of items) {
        if (item.mime_type !== "folder") {
          await supabase.storage.from("documents").remove([item.file_path]);
        }
        await supabase.from("documents").delete().eq("id", item.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });

  // Trigger auto-purge on mount when expired items exist
  useMemo(() => {
    if (expiredItems.length > 0 && !autoPurgeMutation.isPending) {
      autoPurgeMutation.mutate(expiredItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiredItems.length]);

  const activeItems = useMemo(() => {
    if (!trashQuery.data) return [];
    return trashQuery.data.filter((r) => daysRemaining(r.deleted_at) > 0);
  }, [trashQuery.data]);

  const filtered = useMemo(() => {
    if (!search.trim()) return activeItems;
    const s = search.toLowerCase();
    return activeItems.filter(
      (r) =>
        r.title.toLowerCase().includes(s) ||
        r.file_name.toLowerCase().includes(s) ||
        (r.description ?? "").toLowerCase().includes(s) ||
        r.uploader_username.toLowerCase().includes(s),
    );
  }, [activeItems, search]);

  const restoreMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("documents")
        .update({ deleted_at: null })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Berkas berhasil dipulihkan");
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      queryClient.invalidateQueries({ queryKey: ["docs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setSelectedIds(new Set());
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (items: TrashRow[]) => {
      for (const item of items) {
        if (item.mime_type !== "folder") {
          await supabase.storage.from("documents").remove([item.file_path]);
        }
        const { error } = await supabase
          .from("documents")
          .delete()
          .eq("id", item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Berkas dihapus permanen");
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setSelectedIds(new Set());
      setConfirmPurge(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filtered.map((f) => f.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedIds(newSet);
  };

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {profile.role === "admin" ? "Admin" : "Divisi"} ·{" "}
          {profile.role === "admin" ? "Semua" : divisionLabel(profile.role as Division)}
        </div>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl flex items-center gap-3">
          <Trash2 className="h-7 w-7 text-destructive" />
          Sampah
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Berkas yang dihapus akan tersimpan di sini selama {TRASH_RETENTION_DAYS} hari
          sebelum dihapus permanen secara otomatis.
        </p>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari di sampah…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {selectedIds.size > 0 && (
            <>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() =>
                  restoreMutation.mutate(Array.from(selectedIds))
                }
                disabled={restoreMutation.isPending}
              >
                {restoreMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Pulihkan ({selectedIds.size})
              </Button>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => setConfirmPurge(true)}
              >
                <Trash2 className="h-4 w-4" />
                Hapus Permanen ({selectedIds.size})
              </Button>
            </>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        {trashQuery.isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat sampah…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="mt-3 font-medium">Sampah kosong</div>
            <div className="text-sm text-muted-foreground">
              Tidak ada berkas yang dihapus baru-baru ini.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 w-10 text-center">
                    <Checkbox
                      checked={
                        filtered.length > 0 &&
                        filtered.every((f) => selectedIds.has(f.id))
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left">File</th>
                  <th className="px-4 py-3 text-left">Menu Asal</th>
                  <th className="px-4 py-3 text-left">Dihapus</th>
                  <th className="px-4 py-3 text-left">Sisa Waktu</th>
                  <th className="px-4 py-3 text-left">Ukuran</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const Icon = getFileIcon(row.mime_type);
                  const remaining = daysRemaining(row.deleted_at);
                  return (
                    <tr
                      key={row.id}
                      className="border-t border-border hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 text-center">
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          onCheckedChange={(c) => handleSelect(row.id, !!c)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-foreground">
                              {row.title}
                            </div>
                            {row.file_name !== row.title && (
                              <div className="text-xs text-muted-foreground">
                                {row.file_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                          {menuLabel(row.menu)}
                        </span>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {divisionLabel(row.division)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(row.deleted_at).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className={`flex items-center gap-1 text-xs font-medium ${
                            remaining <= 3
                              ? "text-destructive"
                              : remaining <= 7
                                ? "text-amber-500"
                                : "text-muted-foreground"
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          {remaining} hari
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatBytes(row.file_size)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 h-8 text-xs"
                            onClick={() =>
                              restoreMutation.mutate([row.id])
                            }
                            disabled={restoreMutation.isPending}
                          >
                            <RotateCcw className="h-3 w-3" />
                            Pulihkan
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 h-8 text-xs text-destructive hover:text-destructive"
                            onClick={() => {
                              if (
                                confirm(
                                  `Hapus "${row.file_name}" secara permanen? Tindakan ini tidak bisa dibatalkan.`,
                                )
                              ) {
                                permanentDeleteMutation.mutate([row]);
                              }
                            }}
                            disabled={permanentDeleteMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Confirm Permanent Delete Dialog */}
      <Dialog open={confirmPurge} onOpenChange={setConfirmPurge}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Hapus Permanen
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Anda akan menghapus <strong>{selectedIds.size} berkas</strong> secara
            permanen. File akan dihapus dari storage dan{" "}
            <strong>tidak bisa dipulihkan lagi</strong>.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmPurge(false)}
              disabled={permanentDeleteMutation.isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const items = filtered.filter((f) =>
                  selectedIds.has(f.id),
                );
                permanentDeleteMutation.mutate(items);
              }}
              disabled={permanentDeleteMutation.isPending}
            >
              {permanentDeleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Ya, Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
