import { useMemo, useRef, useState, Fragment, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthProfile } from "@/lib/use-auth";
import {
  MENUS,
  accessibleDivisions,
  canAccessMenu,
  divisionLabel,
  menuLabel,
  type Division,
  type MenuKey,
} from "@/lib/menus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Upload,
  Search,
  Download,
  Printer,
  Trash2,
  FileText,
  Loader2,
  ShieldAlert,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Folder,
  Image as ImageIcon,
  FileSpreadsheet,
  FileArchive,
  FileVideo,
  FileAudio,
  File,
  MoreVertical,
  Edit2,
  FolderInput,
} from "lucide-react";

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType.startsWith("audio/")) return FileAudio;
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv")) return FileSpreadsheet;
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar") || mimeType.includes("archive") || mimeType.includes("7z")) return FileArchive;
  if (mimeType.includes("word") || mimeType.includes("document") || mimeType.includes("text")) return FileText;
  return FileText;
}

interface DocRow {
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
}

export function DocumentManager({ menu, division }: { menu: MenuKey; division: Division }) {
  const { data: profile } = useAuthProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderUploadOpen, setFolderUploadOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  const [renameItem, setRenameItem] = useState<{ oldName: string; isFolder: boolean; id?: string; fieldToUpdate?: "title" | "file_name" } | null>(null);
  const [renameName, setRenameName] = useState("");

  const [moveItem, setMoveItem] = useState<{ id: string; oldTitle: string; fileName: string } | null>(null);
  const [moveTarget, setMoveTarget] = useState("");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isDragging, setIsDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);

  useEffect(() => {
    setCurrentFolder(null);
    setSelectedIds(new Set());
    setSearch("");
    setDateFrom("");
    setDateTo("");
  }, [menu, division]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!hasAccess) return;
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set to false if we are leaving the main window, not just inner elements
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!hasAccess) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setDroppedFiles(Array.from(e.dataTransfer.files));
      if (currentFolder) {
        setFolderUploadOpen(true);
      } else {
        setUploadOpen(true);
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      if (currentFolder) {
        const ids = filtered.filter(f => f.title === currentFolder && f.mime_type !== "folder").map(f => f.id);
        setSelectedIds(new Set([...selectedIds, ...ids]));
      } else {
        const ids = filtered.filter(f => f.mime_type !== "folder").map(f => f.id);
        setSelectedIds(new Set(ids));
      }
    } else {
      if (currentFolder) {
        const idsToRemove = new Set(filtered.filter(f => f.title === currentFolder && f.mime_type !== "folder").map(f => f.id));
        const newSet = new Set([...selectedIds].filter(id => !idsToRemove.has(id)));
        setSelectedIds(newSet);
      } else {
        setSelectedIds(new Set());
      }
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedIds(newSet);
  };

  const handleSelectGroup = (title: string, checked: boolean) => {
    const groupIds = filtered.filter(f => f.title === title && f.mime_type !== "folder").map(f => f.id);
    const newSet = new Set(selectedIds);
    if (checked) {
      groupIds.forEach(id => newSet.add(id));
    } else {
      groupIds.forEach(id => newSet.delete(id));
    }
    setSelectedIds(newSet);
  };

  const batchDelete = () => {
    if (confirm(`Pindahkan ${selectedIds.size} file terpilih ke Sampah?`)) {
      const toDelete = filtered.filter(f => selectedIds.has(f.id));
      toDelete.forEach(f => deleteMutation.mutate(f));
      setSelectedIds(new Set());
    }
  };
  
  const batchDownload = async () => {
    const toDownload = filtered.filter(f => selectedIds.has(f.id));
    for (const file of toDownload) {
      openFile(file, "download");
      await new Promise(r => setTimeout(r, 300));
    }
  };

  const menuDef = MENUS.find((m) => m.key === menu);
  const hasAccess = !!profile && !!menuDef && canAccessMenu(profile.role, menu);
  
  const divs = profile && menuDef ? accessibleDivisions(profile.role, menu) : [division];
  const effectiveDivision: Division = divs.includes(division) ? division : divs[0];

  const q = useQuery({
    queryKey: ["docs", menu, effectiveDivision],
    queryFn: async () => {
      let { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("menu", menu)
        .eq("division", effectiveDivision)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
        
      if (error && error.code === "42703") {
        const fallback = await supabase
          .from("documents")
          .select("*")
          .eq("menu", menu)
          .eq("division", effectiveDivision)
          .order("created_at", { ascending: false });
        data = fallback.data;
        error = fallback.error;
      }
        
      if (error) throw error;
      return (data || []) as DocRow[];
    },
    enabled: hasAccess,
  });

  const filtered = useMemo(() => {
    let rows = q.data ?? [];
    if (search.trim()) {
      const s = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(s) ||
          r.file_name.toLowerCase().includes(s) ||
          (r.description ?? "").toLowerCase().includes(s) ||
          r.uploader_username.toLowerCase().includes(s),
      );
    }
    if (dateFrom) rows = rows.filter((r) => r.created_at >= dateFrom);
    if (dateTo) rows = rows.filter((r) => r.created_at <= dateTo + "T23:59:59");
    return rows;
  }, [q.data, search, dateFrom, dateTo]);

  const groupedDocs = useMemo(() => {
    const groups = new Map<string, DocRow[]>();
    filtered.forEach((row) => {
      if (!groups.has(row.title)) groups.set(row.title, []);
      groups.get(row.title)!.push(row);
    });

    const result: {
      id: string;
      isFolder: boolean;
      title: string;
      files: DocRow[];
      totalSize: number;
      latestDate: string;
      uploader: string;
    }[] = [];

    groups.forEach((files, title) => {
      const hasFolderRecord = files.some((f) => f.mime_type === "folder");
      if (files.length === 1 && !hasFolderRecord) {
        result.push({
          id: files[0].id,
          isFolder: false,
          title: title,
          files: files,
          totalSize: files[0].file_size,
          latestDate: files[0].created_at,
          uploader: files[0].uploader_username,
        });
      } else {
        const actualFiles = files.filter((f) => f.mime_type !== "folder");
        result.push({
          id: title,
          isFolder: true,
          title: title,
          files: actualFiles.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")),
          totalSize: actualFiles.reduce((acc, f) => acc + f.file_size, 0),
          latestDate: files.reduce(
            (max, f) => (f.created_at > max ? f.created_at : max),
            files[0].created_at,
          ),
          uploader: files[0].uploader_username,
        });
      }
    });

    return result.sort((a, b) => (b.latestDate || "").localeCompare(a.latestDate || ""));
  }, [filtered]);

  const renameMutation = useMutation({
    mutationFn: async (args: { oldName: string; newName: string; isFolder: boolean; id?: string; fieldToUpdate?: "title" | "file_name" }) => {
      if (!args.newName.trim()) throw new Error("Nama tidak boleh kosong");
      if (args.isFolder) {
        const { error } = await supabase
          .from("documents")
          .update({ title: args.newName.trim(), file_name: args.newName.trim() })
          .eq("menu", menu)
          .eq("title", args.oldName);
        if (error) throw error;
        await supabase.from("activity_logs").insert({
          user_id: profile!.userId,
          username: profile!.username,
          action: "EDIT",
          details: `Mengubah nama folder dari "${args.oldName}" menjadi "${args.newName.trim()}" di menu ${menuLabel(menu)} (${divisionLabel(effectiveDivision)})`,
        });
      } else {
        const updateData = args.fieldToUpdate === "title" 
          ? { title: args.newName.trim() }
          : { file_name: args.newName.trim() };
        const { error } = await supabase
          .from("documents")
          .update(updateData)
          .eq("id", args.id!);
        if (error) throw error;
        await supabase.from("activity_logs").insert({
          user_id: profile!.userId,
          username: profile!.username,
          action: "EDIT",
          details: `Mengubah nama file dari "${args.oldName}" menjadi "${args.newName.trim()}" di menu ${menuLabel(menu)} (${divisionLabel(effectiveDivision)})`,
        });
      }
    },
    onSuccess: () => {
      toast.success("Berhasil mengubah nama");
      queryClient.invalidateQueries({ queryKey: ["docs", menu, effectiveDivision] });
      setRenameItem(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const moveMutation = useMutation({
    mutationFn: async (args: { id: string; newTitle: string }) => {
      if (!args.newTitle.trim()) throw new Error("Folder tujuan tidak valid");
      const { error } = await supabase
        .from("documents")
        .update({ title: args.newTitle.trim() })
        .eq("id", args.id);
      if (error) throw error;
      await supabase.from("activity_logs").insert({
        user_id: profile!.userId,
        username: profile!.username,
        action: "MOVE",
        details: `Memindahkan file ke folder "${args.newTitle.trim()}" di menu ${menuLabel(menu)} (${divisionLabel(effectiveDivision)})`,
      });
    },
    onSuccess: () => {
      toast.success("Berhasil memindahkan file");
      queryClient.invalidateQueries({ queryKey: ["docs", menu, effectiveDivision] });
      setMoveItem(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (row: DocRow) => {
      const now = new Date().toISOString();
      if (row.mime_type === "folder") {
        // Soft-delete all files in the folder (same title)
        let { error } = await supabase
          .from("documents")
          .update({ deleted_at: now })
          .eq("menu", menu)
          .eq("division", effectiveDivision)
          .eq("title", row.title);
          
        if (error && error.message.includes("deleted_at")) {
          // Fallback to hard delete if column doesn't exist
          const { error: fallbackError } = await supabase
            .from("documents")
            .delete()
            .eq("menu", menu)
            .eq("division", effectiveDivision)
            .eq("title", row.title);
          error = fallbackError;
        }
        
        if (error) throw error;
        await supabase.from("activity_logs").insert({
          user_id: profile!.userId,
          username: profile!.username,
          action: "DELETE",
          details: `Memindahkan folder "${row.title}" ke sampah di menu ${menuLabel(menu)} (${divisionLabel(effectiveDivision)})`,
        });
      } else {
        let { error } = await supabase
          .from("documents")
          .update({ deleted_at: now })
          .eq("id", row.id);
          
        if (error && error.message.includes("deleted_at")) {
          // Fallback to hard delete if column doesn't exist
          await supabase.storage.from("documents").remove([row.file_path]);
          const { error: fallbackError } = await supabase
            .from("documents")
            .delete()
            .eq("id", row.id);
          error = fallbackError;
        }
        
        if (error) throw error;
        await supabase.from("activity_logs").insert({
          user_id: profile!.userId,
          username: profile!.username,
          action: "DELETE",
          details: `Memindahkan file "${row.file_name}" ke sampah di menu ${menuLabel(menu)} (${divisionLabel(effectiveDivision)})`,
        });
      }
    },
    onSuccess: () => {
      toast.success("Berkas dipindahkan ke Sampah", {
        description: "Anda dapat memulihkannya dalam 30 hari.",
      });
      queryClient.invalidateQueries({ queryKey: ["docs", menu] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["trash"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function openFile(row: DocRow, mode: "download" | "print" | "view") {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(
        row.file_path,
        300,
        mode === "download" ? { download: row.file_name } : undefined,
      );
    if (error || !data) {
      toast.error("Gagal membuka file");
      return;
    }
    
    await supabase.from("activity_logs").insert({
      user_id: profile!.userId,
      username: profile!.username,
      action: mode === "download" ? "DOWNLOAD" : "VIEW",
      details: `${mode === "download" ? "Mengunduh" : "Membuka"} file "${row.file_name}" di menu ${menuLabel(menu)} (${divisionLabel(effectiveDivision)})`,
    });
    if (mode === "download") {
      window.location.href = data.signedUrl;
    } else if (mode === "print") {
      const w = window.open(data.signedUrl, "_blank");
      if (w) {
        w.addEventListener("load", () => {
          try {
            w.focus();
            w.print();
          } catch {
            /* noop */
          }
        });
      }
    } else {
      window.open(data.signedUrl, "_blank");
    }
  }

  if (!profile) return null;
  if (!hasAccess || !menuDef) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {menuDef.adminOnly ? "Admin" : "Divisi"} · {divisionLabel(effectiveDivision)}
          </div>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{menuLabel(menu)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola berkas {menuLabel(menu)} — unggah, cari, unduh, cetak, atau hapus.
          </p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" /> Unggah Berkas
            </Button>
          </DialogTrigger>
          <UploadDialog
            menu={menu}
            division={effectiveDivision}
            uploader={{ id: profile.userId, username: profile.username }}
            onClose={() => { setUploadOpen(false); setDroppedFiles([]); }}
            existingTitles={Array.from(new Set(filtered.map((f) => f.title)))}
            initialFiles={droppedFiles}
          />
        </Dialog>
      </div>

      {divs.length > 1 && (
        <Tabs
          value={effectiveDivision}
          onValueChange={(v) =>
            navigate({ to: "/docs/$menu", params: { menu }, search: { division: v } })
          }
        >
          <TabsList>
            {divs.map((d) => (
              <TabsTrigger key={d} value={d}>
                {divisionLabel(d)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari judul, nama file, atau uploader…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">s/d</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setDateFrom("");
              setDateTo("");
            }}
          >
            Reset
          </Button>
        </div>
      </Card>

      {/* BATCH ACTION BAR */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-background border border-border shadow-lg rounded-full px-6 py-3 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5">
          <span className="text-sm font-medium">{selectedIds.size} file terpilih</span>
          <div className="h-5 w-px bg-border"></div>
          <Button size="sm" variant="outline" className="gap-2" onClick={batchDownload}>
            <Download className="h-4 w-4" /> Unduh Terpilih
          </Button>
          <Button size="sm" variant="destructive" className="gap-2" onClick={batchDelete}>
            <Trash2 className="h-4 w-4" /> Hapus Terpilih
          </Button>
        </div>
      )}

      {/* DRAG AND DROP OVERLAY */}
      {isDragging && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-background/80 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-primary">
          <div className="text-center">
            <div className="bg-primary/20 text-primary p-4 rounded-full inline-flex mb-4">
              <Upload className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold">Lepaskan file untuk mengunggah</h2>
            <p className="text-muted-foreground mt-2">File akan langsung dimasukkan ke {currentFolder ? `folder "${currentFolder}"` : "menu ini"}</p>
          </div>
        </div>
      )}

      {/* RENAME DIALOG */}
      <Dialog open={!!renameItem} onOpenChange={(open) => { if (!open) setRenameItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Nama {renameItem?.isFolder ? "Folder" : "File"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Nama Baru</Label>
            <Input 
              autoFocus
              defaultValue={renameItem?.oldName} 
              onChange={(e) => setRenameName(e.target.value)} 
              placeholder="Masukkan nama baru..." 
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameItem(null)}>Batal</Button>
            <Button 
              onClick={() => renameMutation.mutate({ 
                oldName: renameItem!.oldName, 
                newName: renameName || renameItem!.oldName, 
                isFolder: renameItem!.isFolder, 
                id: renameItem!.id,
                fieldToUpdate: renameItem!.fieldToUpdate
              })}
              disabled={renameMutation.isPending}
            >
              {renameMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MOVE DIALOG */}
      <Dialog open={!!moveItem} onOpenChange={(open) => { if (!open) setMoveItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pindahkan File</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label className="text-muted-foreground text-xs">File</Label>
              <div className="font-medium">{moveItem?.fileName}</div>
            </div>
            <div>
              <Label>Pindah ke Folder</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={moveTarget}
                onChange={(e) => setMoveTarget(e.target.value)}
              >
                <option value="" disabled>Pilih Folder Tujuan...</option>
                <option value={moveItem?.fileName}>[ Keluarkan dari Folder (Root) ]</option>
                {Array.from(new Set(filtered.map(f => f.title))).filter(t => t !== moveItem?.oldTitle).map(t => (
                  <option key={t} value={t}>📁 {t}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveItem(null)}>Batal</Button>
            <Button 
              onClick={() => moveMutation.mutate({ id: moveItem!.id, newTitle: moveTarget })}
              disabled={!moveTarget || moveMutation.isPending}
            >
              {moveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Pindahkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="overflow-hidden">
        {currentFolder && (
          <div className="bg-muted/30 border-b border-border p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setCurrentFolder(null)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Kembali
              </Button>
              <div className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-blue-500 fill-blue-500/20" />
                <span className="font-semibold">{currentFolder}</span>
              </div>
            </div>
            <Dialog open={folderUploadOpen} onOpenChange={setFolderUploadOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" className="gap-2">
                  <Upload className="h-4 w-4" /> Tambah File
                </Button>
              </DialogTrigger>
              <UploadDialog
                menu={menu}
                division={effectiveDivision}
                uploader={{ id: profile.userId, username: profile.username }}
                onClose={() => { setFolderUploadOpen(false); setDroppedFiles([]); }}
                existingTitles={Array.from(new Set(filtered.map((f) => f.title)))}
                defaultTitle={currentFolder}
                initialFiles={droppedFiles}
              />
            </Dialog>
          </div>
        )}
        {q.isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat berkas…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FileText className="h-6 w-6" />
            </div>
            <div className="mt-3 font-medium">Belum ada berkas</div>
            <div className="text-sm text-muted-foreground">
              Unggah berkas pertama untuk menu ini.
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
                        (currentFolder 
                          ? filtered.filter(f => f.title === currentFolder && f.mime_type !== "folder").every(f => selectedIds.has(f.id)) 
                          : filtered.filter(f => f.mime_type !== "folder").every(f => selectedIds.has(f.id)))
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Judul & File</th>
                  <th className="px-4 py-3 text-left">Uploader</th>
                  <th className="px-4 py-3 text-left">Tanggal</th>
                  <th className="px-4 py-3 text-left">Ukuran</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentFolder ? (
                  // Inside Folder View
                  filtered.filter((f) => f.title === currentFolder && f.mime_type !== "folder")
                    .length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Folder ini masih kosong.
                      </td>
                    </tr>
                  ) : (
                    filtered
                      .filter((f) => f.title === currentFolder && f.mime_type !== "folder")
                      .map((row) => {
                        const Icon = getFileIcon(row.mime_type);
                        return (
                        <tr key={row.id} className="border-t border-border hover:bg-muted/30">
                          <td className="px-4 py-3 text-center">
                            <Checkbox 
                              checked={selectedIds.has(row.id)} 
                              onCheckedChange={(c) => handleSelect(row.id, !!c)} 
                            />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => openFile(row, "view")}
                              className="text-left flex items-start gap-2"
                              title="Klik untuk melihat preview"
                            >
                              <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                              <div>
                                <div className="font-medium text-foreground hover:text-primary">
                                  {row.file_name}
                                </div>
                                {row.description && (
                                  <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                                    {row.description}
                                  </div>
                                )}
                              </div>
                            </button>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{row.uploader_username}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(row.created_at).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatBytes(row.file_size)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="ghost">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openFile(row, "print")}>
                                    <Printer className="mr-2 h-4 w-4" /> Cetak
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openFile(row, "download")}>
                                    <Download className="mr-2 h-4 w-4" /> Unduh
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => setRenameItem({ oldName: row.file_name, isFolder: false, id: row.id, fieldToUpdate: "file_name" })}>
                                    <Edit2 className="mr-2 h-4 w-4" /> Ubah Nama
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setMoveItem({ id: row.id, oldTitle: row.title, fileName: row.file_name })}>
                                    <FolderInput className="mr-2 h-4 w-4" /> Pindahkan
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive" 
                                    onClick={() => {
                                      if (confirm(`Pindahkan "${row.file_name}" ke Sampah?`)) deleteMutation.mutate(row);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )
                ) : (
                  // Root View
                  groupedDocs.map((group) => {
                    if (!group.isFolder) {
                      const row = group.files[0];
                      const Icon = getFileIcon(row.mime_type);
                      return (
                        <tr key={row.id} className="border-t border-border hover:bg-muted/30">
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <Checkbox 
                              checked={selectedIds.has(row.id)} 
                              onCheckedChange={(c) => handleSelect(row.id, !!c)} 
                            />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => openFile(row, "view")}
                              className="text-left flex items-start gap-2"
                              title="Klik untuk melihat preview"
                            >
                              <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                              <div>
                                <div className="font-medium text-foreground hover:text-primary">
                                  {row.title}
                                </div>
                                <div className="text-xs text-muted-foreground">{row.file_name}</div>
                                {row.description && (
                                  <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                                    {row.description}
                                  </div>
                                )}
                              </div>
                            </button>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{row.uploader_username}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(row.created_at).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatBytes(row.file_size)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="ghost">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openFile(row, "print")}>
                                    <Printer className="mr-2 h-4 w-4" /> Cetak
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openFile(row, "download")}>
                                    <Download className="mr-2 h-4 w-4" /> Unduh
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => setRenameItem({ oldName: row.title, isFolder: false, id: row.id, fieldToUpdate: "title" })}>
                                    <Edit2 className="mr-2 h-4 w-4" /> Ubah Judul
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setMoveItem({ id: row.id, oldTitle: row.title, fileName: row.file_name })}>
                                    <FolderInput className="mr-2 h-4 w-4" /> Pindahkan
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive" 
                                    onClick={() => {
                                      if (confirm(`Pindahkan "${row.title}" ke Sampah?`)) deleteMutation.mutate(row);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    } else {
                      return (
                        <tr
                          key={group.title}
                          className="cursor-pointer border-t border-border hover:bg-muted/30"
                          onClick={() => setCurrentFolder(group.title)}
                        >
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <Checkbox 
                              checked={group.files.filter(f => f.mime_type !== "folder").every(f => selectedIds.has(f.id)) && group.files.filter(f => f.mime_type !== "folder").length > 0} 
                              onCheckedChange={(c) => handleSelectGroup(group.title, !!c)} 
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Folder className="h-5 w-5 text-blue-500 fill-blue-500/20" />
                              <div className="font-medium text-foreground">{group.title}</div>
                            </div>
                            <div className="text-xs text-muted-foreground ml-7">
                              {group.files.length} file
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{group.uploader}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(group.latestDate).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatBytes(group.totalSize)}
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="ghost">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setRenameItem({ oldName: group.title, isFolder: true })}>
                                    <Edit2 className="mr-2 h-4 w-4" /> Ubah Nama Folder
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive" 
                                    onClick={() => {
                                      if (confirm(`Pindahkan seluruh folder "${group.title}" beserta isinya ke Sampah?`)) {
                                        const toDelete = filtered.filter((f) => f.title === group.title);
                                        toDelete.forEach((f) => deleteMutation.mutate(f));
                                      }
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Hapus Folder
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function UploadDialog({
  menu,
  division,
  uploader,
  onClose,
  existingTitles = [],
  defaultTitle = "",
  initialFiles = [],
}: {
  menu: MenuKey;
  division: Division;
  uploader: { id: string; username: string };
  onClose: () => void;
  existingTitles?: string[];
  defaultTitle?: string;
  initialFiles?: File[];
}) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"file" | "folder">(defaultTitle ? "file" : "file");
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>(initialFiles || []);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      setFiles(initialFiles);
      setMode("file");
      if (initialFiles.length === 1 && !title && !defaultTitle) {
        const nameWithoutExt = initialFiles[0].name.replace(/\.[^/.]+$/, "");
        setTitle(nameWithoutExt);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  useEffect(() => {
    setTitle(defaultTitle || "");
  }, [defaultTitle]);


  const upload = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Judul wajib diisi");

      if (mode === "folder") {
        const { error: insErr } = await supabase.from("documents").insert({
          menu,
          division,
          title: title.trim(),
          description: description.trim() || null,
          file_path: `folder-${crypto.randomUUID()}`,
          file_name: title.trim(),
          file_size: 0,
          mime_type: "folder",
          uploaded_by: uploader.id,
          uploader_username: uploader.username,
        });
        if (insErr) throw insErr;
        
        await supabase.from("activity_logs").insert({
          user_id: uploader.id,
          username: uploader.username,
          action: "UPLOAD",
          details: `Membuat folder: ${title.trim()} di menu ${menuLabel(menu)} (${divisionLabel(division)})`,
        });
      } else {
        if (files.length === 0) throw new Error("Pilih file terlebih dahulu");
        for (const f of files) {
          const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `${menu}/${division}/${crypto.randomUUID()}-${safeName}`;
          const { error: upErr } = await supabase.storage
            .from("documents")
            .upload(path, f, { contentType: f.type || "application/octet-stream" });
          if (upErr) throw upErr;
          const { error: insErr } = await supabase.from("documents").insert({
            menu,
            division,
            title: title.trim(),
            description: description.trim() || null,
            file_path: path,
            file_name: f.name,
            file_size: f.size,
            mime_type: f.type || null,
            uploaded_by: uploader.id,
            uploader_username: uploader.username,
          });
          if (insErr) {
            await supabase.storage.from("documents").remove([path]);
            throw insErr;
          }

          await supabase.from("activity_logs").insert({
            user_id: uploader.id,
            username: uploader.username,
            action: "UPLOAD",
            details: `Mengunggah file: ${f.name} ke menu ${menuLabel(menu)} (${divisionLabel(division)})`,
          });
        }
      }
    },
    onSuccess: () => {
      toast.success("Berkas berhasil diunggah");
      queryClient.invalidateQueries({ queryKey: ["docs", menu] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setTitle("");
      setDescription("");
      setFiles([]);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Unggah Berkas {menuLabel(menu)}</DialogTitle>
      </DialogHeader>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          upload.mutate();
        }}
      >
        {!defaultTitle && (
          <div className="flex items-center gap-2 mb-2">
            <Button
            type="button"
            variant={mode === "file" ? "default" : "outline"}
            className="flex-1"
            onClick={() => {
              setMode("file");
              setFiles([]);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            File
          </Button>
          <Button
            type="button"
            variant={mode === "folder" ? "default" : "outline"}
            className="flex-1"
            onClick={() => {
              setMode("folder");
              setFiles([]);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            Folder
          </Button>
        </div>
        )}
        <div>
          <Label htmlFor="title">Judul</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            list="existing-titles"
            autoComplete="off"
            readOnly={!!defaultTitle}
            className={defaultTitle ? "bg-muted" : ""}
          />
          <datalist id="existing-titles">
            {existingTitles.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
        <div>
          <Label htmlFor="desc">Keterangan (opsional)</Label>
          <Textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={1000}
          />
        </div>
        {mode === "file" && (
          <div>
            <Label htmlFor="file">Berkas</Label>
            <Input
              id="file"
              ref={inputRef}
              type="file"
              onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
              required
            />
            {files.length > 0 && (
              <div className="mt-1 text-xs text-muted-foreground">
                {files.length === 1 ? files[0].name : `${files.length} file dipilih`} ·{" "}
                {formatBytes(files.reduce((acc, f) => acc + f.size, 0))}
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={upload.isPending}>
            Batal
          </Button>
          <Button type="submit" disabled={upload.isPending}>
            {upload.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "folder" ? "Buat Folder" : "Unggah"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function AccessDenied() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-xl font-semibold">Akses Ditolak</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Anda tidak memiliki hak akses untuk menu ini.
      </p>
      <Button asChild className="mt-6">
        <Link to="/dashboard">Kembali ke Dashboard</Link>
      </Button>
    </div>
  );
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
