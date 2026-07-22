import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { FileText, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/templates/")({
  head: () => ({
    meta: [{ title: "Template Formulir — Arsip Digital Bank BJB" }],
  }),
  component: TemplatesIndexPage,
});

function TemplatesIndexPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section
        className="rounded-2xl p-8 text-white"
        style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-elegant)" }}
      >
        <h1 className="text-3xl font-bold">Template Formulir</h1>
        <p className="mt-2 max-w-xl text-sm opacity-90">
          Pilih template formulir di bawah ini untuk mengisi data dan mencetak dokumen secara instan
          tanpa perlu menggunakan Microsoft Word.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/templates/serah-terima" className="group">
          <Card className="flex h-full flex-col justify-between p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FileText className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-gray-900">Serah Terima Berkas</h2>
              <p className="mt-1 text-sm text-gray-500">
                Formulir digital cetak Tanda Penyerahan/Penerimaan berkas.
              </p>
            </div>
            <div className="mt-6 flex items-center text-sm font-semibold text-blue-600">
              Buat Formulir <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Card>
        </Link>
        <Link to="/templates/akad">
          <Card className="flex h-full flex-col justify-between p-6 transition-all hover:shadow-lg hover:border-primary">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 mb-4">
                <FileText className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold mb-2">Form Akad Kredit</h2>
              <p className="text-sm text-muted-foreground">
                Daftar Hadir Akad Kredit dan Surat Pernyataan (3 Halaman).
              </p>
            </div>
            <div className="mt-6 flex items-center text-sm font-medium text-primary">
              Buka Template <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          </Card>
        </Link>
        
        {/* templates lain */}
        <Card className="flex h-full flex-col justify-between p-6 border-dashed bg-gray-50 opacity-60">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200 text-gray-400">
              <FileText className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-gray-600">Template Lainnya</h2>
            <p className="mt-1 text-sm text-gray-500">Akan ditambahkan sesuai kebutuhan</p>
          </div>
        </Card>
      </section>
    </div>
  );
}
