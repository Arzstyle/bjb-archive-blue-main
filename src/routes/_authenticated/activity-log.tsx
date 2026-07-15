import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { ArrowUpDown } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export const Route = createFileRoute("/_authenticated/activity-log")({
  component: ActivityLog,
});

function ActivityLog() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: logs, isLoading } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredLogs = useMemo(() => {
    let result = logs || [];
    
    if (actionFilter !== "ALL") {
      result = result.filter(log => log.action === actionFilter);
    }
    
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (log) =>
          log.username.toLowerCase().includes(s) ||
          log.action.toLowerCase().includes(s) ||
          (log.details ?? "").toLowerCase().includes(s),
      );
    }
    
    if (sortConfig) {
      result = [...result].sort((a, b) => {
        let aVal = a[sortConfig.key as keyof typeof a] || "";
        let bVal = b[sortConfig.key as keyof typeof b] || "";
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [logs, search, actionFilter, sortConfig]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const currentLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatAction = (action: string) => {
    switch (action) {
      case "LOGIN":
        return <span className="text-blue-500 font-semibold">Login</span>;
      case "UPLOAD":
        return <span className="text-green-500 font-semibold">Unggah</span>;
      case "EDIT":
        return <span className="text-yellow-600 font-semibold">Ubah</span>;
      case "MOVE":
        return <span className="text-orange-500 font-semibold">Pindah</span>;
      case "DELETE":
        return <span className="text-destructive font-semibold">Hapus</span>;
      case "VIEW":
        return <span className="text-purple-500 font-semibold">Akses/Lihat</span>;
      case "DOWNLOAD":
        return <span className="text-indigo-500 font-semibold">Unduh</span>;
      default:
        return <span>{action}</span>;
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Log Aktivitas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pantau riwayat login, unggah, ubah, dan hapus berkas dari seluruh pengguna.
        </p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari username, aksi, atau detail..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="flex h-10 w-full sm:w-48 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="ALL">Semua Aksi</option>
            <option value="LOGIN">Login</option>
            <option value="UPLOAD">Unggah</option>
            <option value="EDIT">Ubah</option>
            <option value="MOVE">Pindah</option>
            <option value="DELETE">Hapus</option>
            <option value="VIEW">Akses/Lihat</option>
            <option value="DOWNLOAD">Unduh</option>
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat log...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            Belum ada aktifitas yang tercatat atau cocok dengan pencarian.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort("created_at")}>
                      <div className="flex items-center gap-1">Waktu <ArrowUpDown className="h-3 w-3" /></div>
                    </th>
                    <th className="px-4 py-3 text-left cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort("username")}>
                      <div className="flex items-center gap-1">Pengguna <ArrowUpDown className="h-3 w-3" /></div>
                    </th>
                    <th className="px-4 py-3 text-left cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort("action")}>
                      <div className="flex items-center gap-1">Aksi <ArrowUpDown className="h-3 w-3" /></div>
                    </th>
                    <th className="px-4 py-3 text-left">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLogs.map((log) => (
                    <tr key={log.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(log.created_at).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium">{log.username}</td>
                      <td className="px-4 py-3">{formatAction(log.action)}</td>
                      <td className="px-4 py-3 text-muted-foreground break-all">
                        {log.details || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="border-t border-border p-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="text-sm px-4">Halaman {currentPage} dari {totalPages}</span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
