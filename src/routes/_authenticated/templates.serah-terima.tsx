import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Printer, Trash } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/templates/serah-terima")({
  head: () => ({
    meta: [{ title: "Formulir Serah Terima — Arsip Digital Bank BJB" }],
  }),
  component: SerahTerimaPage,
});

interface Item {
  uraian: string;
  banyaknya: string;
  satuan: string;
}

function SerahTerimaPage() {
  const [kantor, setKantor] = useState("BANK BJB KCP CIBADAK");
  const [tanggal, setTanggal] = useState("");
  const [diterimaDari, setDiterimaDari] = useState("");
  const [diserahkanKepada, setDiserahkanKepada] = useState("");
  const [items, setItems] = useState<Item[]>([{ uraian: "", banyaknya: "", satuan: "" }]);
  const [penerima, setPenerima] = useState("");
  const [penyerah, setPenyerah] = useState("");
  const [fileName, setFileName] = useState("Serah_Terima_Berkas");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDownloadWord = () => {
    const formattedDate = tanggal ? new Date(tanggal).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' }) : "...........................................";
    
    let tableRows = items.map((item, idx) => `
      <tr>
        <td align="center" style="border: 1px solid black; text-align: center; vertical-align: top;">${idx + 1}</td>
        <td style="border: 1px solid black; vertical-align: top;">${item.uraian}</td>
        <td align="center" style="border: 1px solid black; text-align: center; vertical-align: top;">${item.banyaknya}</td>
        <td align="center" style="border: 1px solid black; text-align: center; vertical-align: top;">${item.satuan}</td>
      </tr>
    `).join("");

    if (items.length < 5) {
      for (let i = items.length; i < 5; i++) {
        tableRows += `
          <tr>
            <td style="border: 1px solid black; height: 50px;"></td>
            <td style="border: 1px solid black; height: 50px;"></td>
            <td style="border: 1px solid black; height: 50px;"></td>
            <td style="border: 1px solid black; height: 50px;"></td>
          </tr>
        `;
      }
    }

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Export HTML To Doc</title>
        <style>
          @page WordSection1 {
            size: 21cm 29.7cm;
            margin: 2.54cm 2.54cm 2.54cm 2.54cm;
            mso-header-margin: 1.27cm;
            mso-footer-margin: 1.27cm;
            mso-paper-source: 0;
          }
          div.WordSection1 { page: WordSection1; }
          body { font-family: Arial, sans-serif; font-size: 11pt; }
          table { border-collapse: collapse; }
          td, th { font-family: Arial, sans-serif; font-size: 11pt; }
        </style>
      </head>
      <body>
        <div class="WordSection1" style="font-family: Arial, sans-serif; font-size: 11pt;">
          <p style="margin: 0; padding: 0;">KANTOR: ${kantor || "..................................................."}</p>
          <br/><br/>
          <p align="center" style="text-align: center; margin: 0; padding: 0;"><b>TANDA PENYERAHAN/PENERIMAAN</b></p>
          <br/><br/>
          
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr><td width="150" style="padding-bottom: 8px;">Tanggal</td><td width="20" style="padding-bottom: 8px;">:</td><td style="padding-bottom: 8px;">${formattedDate}</td></tr>
            <tr><td width="150" style="padding-bottom: 8px;">Diterima Dari</td><td width="20" style="padding-bottom: 8px;">:</td><td style="padding-bottom: 8px;">${diterimaDari || "..........................................."}</td></tr>
            <tr><td width="150" style="padding-bottom: 8px;">Diserahkan Kepada</td><td width="20" style="padding-bottom: 8px;">:</td><td style="padding-bottom: 8px;">${diserahkanKepada || "..........................................."}</td></tr>
          </table>
          <br/>
          
          <p style="margin: 0; padding: 0; margin-bottom: 12px;">Harap diterima barang-barang/surat seperti tersebut dibawah ini :</p>
          
          <table border="1" cellpadding="5" cellspacing="0" width="100%" style="border: 1px solid black; border-collapse: collapse;">
            <thead>
              <tr>
                <th width="10%" style="border: 1px solid black; text-align: center; font-weight: bold;">NO URUT</th>
                <th width="50%" style="border: 1px solid black; text-align: center; font-weight: bold;">URAIAN</th>
                <th width="20%" style="border: 1px solid black; text-align: center; font-weight: bold;">BANYAKNYA</th>
                <th width="20%" style="border: 1px solid black; text-align: center; font-weight: bold;">SATUAN</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <br/><br/><br/>
          
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="50%" align="center" style="text-align: center;">Yang Menerima</td>
              <td width="50%" align="center" style="text-align: center;">Yang Menyerahkan</td>
            </tr>
            <tr>
              <td height="100"></td>
              <td height="100"></td>
            </tr>
            <tr>
              <td align="center" style="text-align: center; font-weight: bold;">${penerima || "_________________________"}</td>
              <td align="center" style="text-align: center; font-weight: bold;">${penyerah || "_________________________"}</td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = (fileName || 'Serah_Terima_Berkas') + '.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDialogOpen(false);
  };

  const addItem = () => {
    setItems([...items, { uraian: "", banyaknya: "", satuan: "" }]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof Item, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/templates">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Formulir Serah Terima Berkas</h1>
          <p className="text-sm text-muted-foreground">Isi data di bawah lalu klik Cetak PDF.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* form */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Informasi Kop & Header</h2>
            <div className="space-y-2">
              <Label>Nama Kantor</Label>
              <Input value={kantor} onChange={(e) => setKantor(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Diterima Dari</Label>
              <Input value={diterimaDari} onChange={(e) => setDiterimaDari(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Diserahkan Kepada</Label>
              <Input value={diserahkanKepada} onChange={(e) => setDiserahkanKepada(e.target.value)} />
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Daftar Berkas</h2>
              <Button onClick={addItem} size="sm" variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> Tambah Baris
              </Button>
            </div>
            
            <div className="space-y-4">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start p-3 border rounded-md bg-muted/30">
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs">Uraian (Nama Berkas/SK)</Label>
                    <Input 
                      value={item.uraian} 
                      onChange={(e) => updateItem(i, "uraian", e.target.value)} 
                      placeholder="Contoh: SK Pengangkatan"
                    />
                  </div>
                  <div className="w-20 space-y-2">
                    <Label className="text-xs">Jml</Label>
                    <Input 
                      type="number"
                      value={item.banyaknya} 
                      onChange={(e) => updateItem(i, "banyaknya", e.target.value)} 
                      placeholder="1"
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <Label className="text-xs">Satuan</Label>
                    <Input 
                      value={item.satuan} 
                      onChange={(e) => updateItem(i, "satuan", e.target.value)} 
                      placeholder="Berkas"
                    />
                  </div>
                  {items.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="mt-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeItem(i)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Penandatangan</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Penerima</Label>
                <Input value={penerima} onChange={(e) => setPenerima(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nama Penyerah</Label>
                <Input value={penyerah} onChange={(e) => setPenyerah(e.target.value)} />
              </div>
            </div>
          </Card>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full gap-2" size="lg">
                <Printer className="h-5 w-5" /> Unduh Serah Terima
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nama File Unduhan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Masukkan nama file PDF yang akan diunduh/dicetak:</Label>
                  <Input 
                    value={fileName} 
                    onChange={(e) => setFileName(e.target.value)} 
                    placeholder="Contoh: Serah_Terima_Berkas_SK"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                <Button onClick={handleDownloadWord}>Oke, Unduh Word</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* preview */}
        <div className="lg:col-span-7 bg-muted rounded-xl p-4 sm:p-8 flex items-start justify-center overflow-auto border border-dashed border-gray-300">
          <div className="bg-white shadow-xl w-full max-w-[21cm] min-h-[29.7cm] p-[2cm]">
            <div className="text-black font-sans text-[11pt] leading-normal">
              
              <div className="font-bold">
                KANTOR: {kantor || "..................................................."}
              </div>

              <div className="text-center font-bold mt-12 mb-8">
                TANDA PENYERAHAN/PENERIMAAN
              </div>

              <table className="mb-8">
                <tbody>
                  <tr>
                    <td className="w-40 py-1">Tanggal</td>
                    <td className="w-4">:</td>
                    <td className="font-semibold">{tanggal ? new Date(tanggal).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' }) : "..........................................."}</td>
                  </tr>
                  <tr>
                    <td className="w-40 py-1">Diterima Dari</td>
                    <td className="w-4">:</td>
                    <td className="font-semibold">{diterimaDari || "..........................................."}</td>
                  </tr>
                  <tr>
                    <td className="w-40 py-1">Diserahkan Kepada</td>
                    <td className="w-4">:</td>
                    <td className="font-semibold">{diserahkanKepada || "..........................................."}</td>
                  </tr>
                </tbody>
              </table>

              <div className="mb-4">
                Harap diterima barang-barang/surat seperti tersebut dibawah ini :
              </div>

              <table className="w-full border-collapse border border-black mb-12">
                <thead>
                  <tr>
                    <th className="border border-black py-2 px-2 w-16 text-center">NO URUT</th>
                    <th className="border border-black py-2 px-2 text-center">URAIAN</th>
                    <th className="border border-black py-2 px-2 w-28 text-center">BANYAKNYA</th>
                    <th className="border border-black py-2 px-2 w-28 text-center">SATUAN</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="border border-black py-2 px-2 text-center align-top">{idx + 1}</td>
                      <td className="border border-black py-2 px-2 align-top">{item.uraian}</td>
                      <td className="border border-black py-2 px-2 text-center align-top">{item.banyaknya}</td>
                      <td className="border border-black py-2 px-2 text-center align-top">{item.satuan}</td>
                    </tr>
                  ))}
                  {/* Fill empty rows to make it look standard if there's only a few items */}
                  {items.length < 5 && Array.from({ length: 5 - items.length }).map((_, idx) => (
                    <tr key={`empty-${idx}`}>
                      <td className="border border-black py-4 px-2"></td>
                      <td className="border border-black py-4 px-2"></td>
                      <td className="border border-black py-4 px-2"></td>
                      <td className="border border-black py-4 px-2"></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between mt-12 pt-8">
                <div className="text-center">
                  <p>Yang Menerima</p>
                  <div className="h-24"></div>
                  <p className="font-semibold">{penerima || "_________________________"}</p>
                </div>
                <div className="text-center">
                  <p>Yang Menyerahkan</p>
                  <div className="h-24"></div>
                  <p className="font-semibold">{penyerah || "_________________________"}</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
