import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/templates/akad")({
  head: () => ({
    meta: [{ title: "Formulir Akad Kredit — Arsip Digital Bank BJB" }],
  }),
  component: AkadPage,
});

function AkadPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fileName, setFileName] = useState("Akad_Kredit_Konsumer");

  // State Halaman 1
  const [namaDebitur, setNamaDebitur] = useState("");
  const [noPK, setNoPK] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [namaPimpinan, setNamaPimpinan] = useState("");

  const [hasPasangan, setHasPasangan] = useState(true);
  const [namaPasangan, setNamaPasangan] = useState("");

  // State Halaman 2 (Pernyataan Pasangan) & Halaman 3 (Debitur)
  const [hari, setHari] = useState("");
  const [ktpDebitur, setKtpDebitur] = useState("");
  const [ttlDebitur, setTtlDebitur] = useState("");
  const [alamatDebitur, setAlamatDebitur] = useState("");
  
  const [ktpPasangan, setKtpPasangan] = useState("");
  const [ttlPasangan, setTtlPasangan] = useState("");
  const [alamatPasangan, setAlamatPasangan] = useState("");

  const [pekerjaanDebitur, setPekerjaanDebitur] = useState("");
  
  const [nominalPinjaman, setNominalPinjaman] = useState("");
  const [angsuran, setAngsuran] = useState("");
  const [jumlahAngsuran, setJumlahAngsuran] = useState("1");

  const formattedDate = tanggal ? new Date(tanggal).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' }) : "";
  const hariIni = hari || "";

  // Helper untuk format Rupiah
  const formatRupiah = (value: string) => {
    const numberString = value.replace(/[^,\d]/g, "").toString();
    const split = numberString.split(",");
    const sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    if (ribuan) {
      const separator = sisa ? "." : "";
      rupiah += separator + ribuan.join(".");
    }

    return split[1] != undefined ? rupiah + "," + split[1] : rupiah;
  };

  const handleDownloadWord = () => {
    
    // Baris ke-3 tabel Halaman 1
    const pasanganRowHTML = hasPasangan ? `
      <tr>
        <td align="center" style="border: 1px solid black; text-align: center; height: 80px;">3</td>
        <td style="border: 1px solid black; text-transform: uppercase;">${namaPasangan}</td>
        <td style="border: 1px solid black;">PASANGAN DEBITUR</td>
        <td style="border: 1px solid black;"></td>
        <td style="border: 1px solid black;"></td>
        <td style="border: 1px solid black;"></td>
      </tr>
    ` : "";

    // Halaman 2 (Surat Pernyataan Pasangan) - TETAP ADA walau hasPasangan false, hanya TTD yang hilang
    const pasanganPage2HTML = `
      <br clear="all" style="page-break-before:always" />
      
      <!-- HALAMAN 2 -->
      <p align="center" style="text-align: center; margin: 0; padding: 0; text-decoration: underline;"><b>SURAT PERNYATAAN</b></p>
      <br/>
      <p style="text-align: justify; margin: 0;">Pada hari <b>${hariIni}</b>, Tanggal <b>${formattedDate}</b> bertempat di bank bjb Kcp Cibadak, kami yang bertanda tangan dibawah ini :</p>
      <br/>
      
      <p style="margin: 0; margin-left: 20px;"><b>1. DEBITUR</b></p>
      <br/>
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr><td width="30"></td><td width="150" style="padding-bottom: 5px;">Nama</td><td width="20" style="padding-bottom: 5px;">:</td><td style="padding-bottom: 5px;">${namaDebitur}</td></tr>
        <tr><td width="30"></td><td width="150" style="padding-bottom: 5px;">Nomor KTP</td><td width="20" style="padding-bottom: 5px;">:</td><td style="padding-bottom: 5px;">${ktpDebitur}</td></tr>
        <tr><td width="30"></td><td width="150" style="padding-bottom: 5px;">Tempat Tanggal Lahir</td><td width="20" style="padding-bottom: 5px;">:</td><td style="padding-bottom: 5px;">${ttlDebitur}</td></tr>
        <tr><td width="30"></td><td width="150" style="padding-bottom: 5px;">Alamat</td><td width="20" style="padding-bottom: 5px;">:</td><td style="padding-bottom: 5px;">${alamatDebitur}</td></tr>
      </table>
      <br/>

      <p style="margin: 0; margin-left: 20px;"><b>2. PASANGAN DEBITUR</b></p>
      <br/>
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr><td width="30"></td><td width="150" style="padding-bottom: 5px;">Nama</td><td width="20" style="padding-bottom: 5px;">:</td><td style="padding-bottom: 5px;">${hasPasangan ? namaPasangan : ''}</td></tr>
        <tr><td width="30"></td><td width="150" style="padding-bottom: 5px;">Nomor KTP</td><td width="20" style="padding-bottom: 5px;">:</td><td style="padding-bottom: 5px;">${hasPasangan ? ktpPasangan : ''}</td></tr>
        <tr><td width="30"></td><td width="150" style="padding-bottom: 5px;">Tempat Tanggal Lahir</td><td width="20" style="padding-bottom: 5px;">:</td><td style="padding-bottom: 5px;">${hasPasangan ? ttlPasangan : ''}</td></tr>
        <tr><td width="30"></td><td width="150" style="padding-bottom: 5px;">Alamat</td><td width="20" style="padding-bottom: 5px;">:</td><td style="padding-bottom: 5px;">${hasPasangan ? alamatPasangan : ''}</td></tr>
      </table>
      <br/><br/>

      <p style="text-align: justify; margin: 0; line-height: 1.5;">Dengan ini kami menyatakan bahwa kami telah membaca, mengetahui, memahami, dan menyetujui serta menerima seluruh syarat dan ketentuan sebagaimana yang disampaikan oleh Bank terkait fasilitas pembiayaan yang kami terima.</p>
      <br/>
      <p style="text-align: justify; margin: 0; line-height: 1.5;">Dengan ini kami menyatakan bahwa kami telah membaca, mengetahui, memahami, dan menyetujui serta menerima seluruh syarat dan ketentuan sebagaimana yang disampaikan oleh Bank terkait fasilitas pembiayaan yang kami terima.</p>
      <br/><br/><br/>

      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td width="50%" align="center" style="text-align: center;"></td>
          <td width="50%" align="center" style="text-align: center;">Cibadak, ${formattedDate}</td>
        </tr>
        <tr>
          <td width="50%" align="center" style="text-align: center;">${hasPasangan ? 'PASANGAN DEBITUR' : ''}</td>
          <td width="50%" align="center" style="text-align: center;">Debitur</td>
        </tr>
        <tr>
          <td height="80"></td>
          <td height="80" align="center" style="text-align: center; vertical-align: middle; font-size: 10pt; color: gray;">Materai Rp.10.000</td>
        </tr>
        <tr>
          <td align="center" style="text-align: center;"><span style="text-decoration: underline; text-transform: uppercase;">${hasPasangan ? namaPasangan : ''}</span></td>
          <td align="center" style="text-align: center;"><span style="text-decoration: underline; text-transform: uppercase;">${namaDebitur}</span></td>
        </tr>
      </table>
    `;

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
          body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; }
          table { border-collapse: collapse; }
          td, th { font-family: Arial, sans-serif; font-size: 11pt; }
        </style>
      </head>
      <body>
        <div class="WordSection1">
          <!-- HALAMAN 1 -->
          <p align="center" style="text-align: center; margin: 0; padding: 0;"><b>DAFTAR HADIR</b></p>
          <p align="center" style="text-align: center; margin: 0; padding: 0; text-decoration: underline;"><b>AKAD KREDIT KONSUMER</b></p>
          <br/><br/>
          
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr><td width="120" style="padding-bottom: 5px;">Nama Debitur</td><td width="20" style="padding-bottom: 5px;">:</td><td style="padding-bottom: 5px;"><b>${namaDebitur}</b></td></tr>
            <tr><td width="120" style="padding-bottom: 5px;">No. PK</td><td width="20" style="padding-bottom: 5px;">:</td><td style="padding-bottom: 5px;"><b>${noPK}</b></td></tr>
            <tr><td width="120" style="padding-bottom: 5px;">Tanggal</td><td width="20" style="padding-bottom: 5px;">:</td><td style="padding-bottom: 5px;"><b>${formattedDate}</b></td></tr>
          </table>
          <br/>
          
          <table border="1" cellpadding="5" cellspacing="0" width="100%" style="border: 1px solid black; border-collapse: collapse;">
            <thead>
              <tr>
                <th width="5%" style="border: 1px solid black; text-align: center; font-weight: bold;">NO</th>
                <th width="25%" style="border: 1px solid black; text-align: center; font-weight: bold;">NAMA</th>
                <th width="20%" style="border: 1px solid black; text-align: center; font-weight: bold;">SEBAGAI</th>
                <th width="20%" style="border: 1px solid black; text-align: center; font-weight: bold;">CAP JARI (JEMPOL KANAN)</th>
                <th width="20%" style="border: 1px solid black; text-align: center; font-weight: bold;">TANDA TANGAN</th>
                <th width="10%" style="border: 1px solid black; text-align: center; font-weight: bold;">PARAF</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td align="center" style="border: 1px solid black; text-align: center; height: 80px;">1</td>
                <td style="border: 1px solid black; text-transform: uppercase;">${namaPimpinan}</td>
                <td style="border: 1px solid black;">PEMIMPIN KCP</td>
                <td style="border: 1px solid black;"></td>
                <td style="border: 1px solid black;"></td>
                <td style="border: 1px solid black;"></td>
              </tr>
              <tr>
                <td align="center" style="border: 1px solid black; text-align: center; height: 80px;">2</td>
                <td style="border: 1px solid black; text-transform: uppercase;">${namaDebitur}</td>
                <td style="border: 1px solid black;">DEBITUR</td>
                <td style="border: 1px solid black;"></td>
                <td style="border: 1px solid black;"></td>
                <td style="border: 1px solid black;"></td>
              </tr>
              ${pasanganRowHTML}
            </tbody>
          </table>
          
          ${pasanganPage2HTML}

          <br clear="all" style="page-break-before:always" />

          <!-- HALAMAN AKHIR (Pernyataan Debitur) -->
          <p align="center" style="text-align: center; margin: 0; padding: 0; text-decoration: underline;"><b>SURAT PERNYATAAN</b></p>
          <br/>
          <p style="margin: 0;">Saya yang bertanda tangan di bawah ini :</p>
          <br/>
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr><td width="120" style="padding-bottom: 5px;">Nama</td><td width="20" style="padding-bottom: 5px;">:</td><td style="padding-bottom: 5px;">${namaDebitur}</td></tr>
            <tr><td width="120" style="padding-bottom: 5px;">Alamat</td><td width="20" style="padding-bottom: 5px;">:</td><td style="padding-bottom: 5px;">${alamatDebitur}</td></tr>
            <tr><td width="120" style="padding-bottom: 5px;">NIK</td><td width="20" style="padding-bottom: 5px;">:</td><td style="padding-bottom: 5px;">${ktpDebitur}</td></tr>
            <tr><td width="120" style="padding-bottom: 5px;">Pekerjaan</td><td width="20" style="padding-bottom: 5px;">:</td><td style="padding-bottom: 5px;">${pekerjaanDebitur}</td></tr>
          </table>
          <br/>
          <p style="margin: 0;">Dengan ini menyatakan:</p>
          <br/>
          <p style="text-align: justify; margin: 0; line-height: 1.5;">Saya telah mengajukan dan memperoleh fasilitas kredit dari Bank <b>bjb</b> sebesar Rp. <b>${nominalPinjaman}</b>,- sesuai dengan Perjanjian Kredit <b>(PK) No ${noPK}</b></p>
          <br/>
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
               <td width="30" style="vertical-align: top;">1.</td>
               <td style="text-align: justify; padding-bottom: 15px; line-height: 1.5;">Bank <b>bjb</b> telah menjelaskan dengan terperinci dan jelas perihal seluruh kewajiban dan hak saya atas fasilitas kredit tersebut, termasuk biaya-biaya yang timbul sesusai dengan yang tertera pada Perjanjian Kredit (PK). Dan Saya telah mengerti akan hak dan kewajiban baik fitur maupun Perjanjian Kredit (PK) atas fasilitas kredit tersebut.</td>
            </tr>
            <tr>
               <td width="30" style="vertical-align: top;">2.</td>
               <td style="text-align: justify; line-height: 1.5;">Saya memberi persetujuan dan kuasa kepada Bank <b>bjb</b> untuk melakukan pemblokiran dana angsuran sebesar <b>Rp ${angsuran}</b> atau <b>${jumlahAngsuran}x</b> angsuran terhadap rekening tabungan saya sesuai ketentuan yang berlaku dalam Perjanjian Kredit.</td>
            </tr>
          </table>
          <br/>
          <p style="text-align: justify; margin: 0; line-height: 1.5;">Demikian surat pernyataan ini saya buat dalam keadaan sadar dan tanpa paksaan dari pihak manapun untuk dipergunakan sebagaimana mestinya.</p>
          <br/><br/><br/>

          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="50%" align="center" style="text-align: center;"></td>
              <td width="50%" align="center" style="text-align: center;">Cibadak, ${formattedDate}</td>
            </tr>
            <tr>
              <td width="50%" align="center" style="text-align: center;">${hasPasangan ? 'PASANGAN DEBITUR' : ''}</td>
              <td width="50%" align="center" style="text-align: center;">Debitur</td>
            </tr>
            <tr>
              <td height="80"></td>
              <td height="80" align="center" style="text-align: center; vertical-align: middle; font-size: 10pt; color: gray;">Materai Rp.10.000</td>
            </tr>
            <tr>
              <td align="center" style="text-align: center;"><span style="text-decoration: underline; text-transform: uppercase;">${hasPasangan ? namaPasangan : ''}</span></td>
              <td align="center" style="text-align: center;"><span style="text-decoration: underline; text-transform: uppercase;">${namaDebitur}</span></td>
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
    link.download = (fileName || 'Akad_Kredit') + '.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDialogOpen(false);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link to="/templates">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Formulir Akad Kredit</h1>
          <p className="text-sm text-muted-foreground">Isi data di bawah lalu klik Unduh Word.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* form */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Informasi Umum</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hari</Label>
                <Input value={hari} onChange={(e) => setHari(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>No. PK</Label>
              <Input value={noPK} onChange={(e) => setNoPK(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nama Pimpinan KCP</Label>
              <Input value={namaPimpinan} onChange={(e) => setNamaPimpinan(e.target.value)} />
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Data Debitur</h2>
            <div className="space-y-2">
              <Label>Nama Debitur</Label>
              <Input value={namaDebitur} onChange={(e) => setNamaDebitur(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nomor KTP / NIK</Label>
              <Input value={ktpDebitur} onChange={(e) => setKtpDebitur(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tempat Tanggal Lahir</Label>
              <Input value={ttlDebitur} onChange={(e) => setTtlDebitur(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Alamat</Label>
              <Input value={alamatDebitur} onChange={(e) => setAlamatDebitur(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Pekerjaan</Label>
              <Input value={pekerjaanDebitur} onChange={(e) => setPekerjaanDebitur(e.target.value)} />
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Data Pasangan Debitur</h2>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="has-pasangan" 
                  checked={hasPasangan} 
                  onCheckedChange={setHasPasangan} 
                />
                <Label htmlFor="has-pasangan">Ada Pasangan?</Label>
              </div>
            </div>
            
            {hasPasangan && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Nama Pasangan</Label>
                  <Input value={namaPasangan} onChange={(e) => setNamaPasangan(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Nomor KTP / NIK</Label>
                  <Input value={ktpPasangan} onChange={(e) => setKtpPasangan(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tempat Tanggal Lahir</Label>
                  <Input value={ttlPasangan} onChange={(e) => setTtlPasangan(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Alamat</Label>
                  <Input value={alamatPasangan} onChange={(e) => setAlamatPasangan(e.target.value)} />
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Data Kredit (Pernyataan)</h2>
            <div className="space-y-2">
              <Label>Nominal Pinjaman (Rp)</Label>
              <Input 
                value={nominalPinjaman} 
                onChange={(e) => setNominalPinjaman(formatRupiah(e.target.value))} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nominal Angsuran (Rp)</Label>
                <Input 
                  value={angsuran} 
                  onChange={(e) => setAngsuran(formatRupiah(e.target.value))} 
                />
              </div>
              <div className="space-y-2">
                <Label>Jumlah Blokir Angsuran</Label>
                <Input type="number" value={jumlahAngsuran} onChange={(e) => setJumlahAngsuran(e.target.value)} />
              </div>
            </div>
          </Card>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full gap-2" size="lg">
                <Download className="h-5 w-5" /> Unduh Dokumen Akad
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
                    placeholder="Contoh: Akad_Kredit_Budi"
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
        <div className="lg:col-span-7 bg-muted rounded-xl p-4 sm:p-8 flex flex-col items-center gap-8 overflow-auto border border-dashed border-gray-300 h-[800px]">
          
          {/* HALAMAN 1 */}
          <div className="bg-white shadow-xl w-full max-w-[21cm] min-h-[29.7cm] p-[2.54cm] shrink-0">
            <div className="text-black font-sans text-[11pt] leading-normal">
              <div className="text-center font-bold">DAFTAR HADIR</div>
              <div className="text-center font-bold underline mb-8">AKAD KREDIT KONSUMER</div>
              
              <table className="w-full mb-6">
                <tbody>
                  <tr><td className="w-32 pb-1">Nama Debitur</td><td className="w-4 pb-1">:</td><td className="font-bold pb-1">{namaDebitur}</td></tr>
                  <tr><td className="w-32 pb-1">No. PK</td><td className="w-4 pb-1">:</td><td className="font-bold pb-1">{noPK}</td></tr>
                  <tr><td className="w-32 pb-1">Tanggal</td><td className="w-4 pb-1">:</td><td className="font-bold pb-1">{formattedDate}</td></tr>
                </tbody>
              </table>

              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr>
                    <th className="border border-black p-2 w-[5%]">NO</th>
                    <th className="border border-black p-2 w-[25%]">NAMA</th>
                    <th className="border border-black p-2 w-[20%]">SEBAGAI</th>
                    <th className="border border-black p-2 w-[20%]">CAP JARI (JEMPOL KANAN)</th>
                    <th className="border border-black p-2 w-[20%]">TANDA TANGAN</th>
                    <th className="border border-black p-2 w-[10%]">PARAF</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-2 text-center h-20">1</td>
                    <td className="border border-black p-2 uppercase">{namaPimpinan}</td>
                    <td className="border border-black p-2">PEMIMPIN KCP</td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 text-center h-20">2</td>
                    <td className="border border-black p-2 uppercase">{namaDebitur}</td>
                    <td className="border border-black p-2">DEBITUR</td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                  </tr>
                  {hasPasangan && (
                    <tr>
                      <td className="border border-black p-2 text-center h-20">3</td>
                      <td className="border border-black p-2 uppercase">{namaPasangan}</td>
                      <td className="border border-black p-2">PASANGAN DEBITUR</td>
                      <td className="border border-black p-2"></td>
                      <td className="border border-black p-2"></td>
                      <td className="border border-black p-2"></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* HALAMAN 2 */}
          <div className="bg-white shadow-xl w-full max-w-[21cm] min-h-[29.7cm] p-[2.54cm] shrink-0">
            <div className="text-black font-sans text-[11pt] leading-relaxed">
              <div className="text-center font-bold underline mb-6">SURAT PERNYATAAN</div>
              <p className="text-justify mb-4">
                Pada hari <b>{hariIni}</b>, Tanggal <b>{formattedDate}</b> bertempat di bank bjb Kcp Cibadak, kami yang bertanda tangan dibawah ini :
              </p>
              
              <div className="pl-6 mb-4">
                <p className="font-bold mb-2">1. DEBITUR</p>
                <table className="w-full pl-6 mb-2">
                  <tbody>
                    <tr><td className="w-40 pb-1">Nama</td><td className="w-4 pb-1">:</td><td className="pb-1">{namaDebitur}</td></tr>
                    <tr><td className="w-40 pb-1">Nomor KTP</td><td className="w-4 pb-1">:</td><td className="pb-1">{ktpDebitur}</td></tr>
                    <tr><td className="w-40 pb-1">Tempat Tanggal Lahir</td><td className="w-4 pb-1">:</td><td className="pb-1">{ttlDebitur}</td></tr>
                    <tr><td className="w-40 pb-1">Alamat</td><td className="w-4 pb-1">:</td><td className="pb-1">{alamatDebitur}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="pl-6 mb-6">
                <p className="font-bold mb-2">2. PASANGAN DEBITUR</p>
                <table className="w-full pl-6 mb-2">
                  <tbody>
                    <tr><td className="w-40 pb-1">Nama</td><td className="w-4 pb-1">:</td><td className="pb-1">{hasPasangan ? namaPasangan : ''}</td></tr>
                    <tr><td className="w-40 pb-1">Nomor KTP</td><td className="w-4 pb-1">:</td><td className="pb-1">{hasPasangan ? ktpPasangan : ''}</td></tr>
                    <tr><td className="w-40 pb-1">Tempat Tanggal Lahir</td><td className="w-4 pb-1">:</td><td className="pb-1">{hasPasangan ? ttlPasangan : ''}</td></tr>
                    <tr><td className="w-40 pb-1">Alamat</td><td className="w-4 pb-1">:</td><td className="pb-1">{hasPasangan ? alamatPasangan : ''}</td></tr>
                  </tbody>
                </table>
              </div>

              <p className="text-justify mb-2">
                Dengan ini kami menyatakan bahwa kami telah membaca, mengetahui, memahami, dan menyetujui serta menerima seluruh syarat dan ketentuan sebagaimana yang disampaikan oleh Bank terkait fasilitas pembiayaan yang kami terima.
              </p>
              <p className="text-justify mb-10">
                Dengan ini kami menyatakan bahwa kami telah membaca, mengetahui, memahami, dan menyetujui serta menerima seluruh syarat dan ketentuan sebagaimana yang disampaikan oleh Bank terkait fasilitas pembiayaan yang kami terima.
              </p>

              <div className="flex justify-between text-center">
                <div className="w-1/2">
                  <p className="text-transparent">.</p>
                  <p>{hasPasangan ? 'PASANGAN DEBITUR' : ''}</p>
                  <div className="h-20"></div>
                  <p className="uppercase underline">{hasPasangan ? namaPasangan : ''}</p>
                </div>
                <div className="w-1/2">
                  <p>Cibadak, {formattedDate}</p>
                  <p>Debitur</p>
                  <div className="h-20 flex items-center justify-center text-sm text-gray-500">Materai Rp.10.000</div>
                  <p className="uppercase underline">{namaDebitur}</p>
                </div>
              </div>
            </div>
          </div>

          {/* HALAMAN AKHIR (DEBITUR SAJA) */}
          <div className="bg-white shadow-xl w-full max-w-[21cm] min-h-[29.7cm] p-[2.54cm] shrink-0">
            <div className="text-black font-sans text-[11pt] leading-relaxed">
              <div className="text-center font-bold underline mb-6">SURAT PERNYATAAN</div>
              <p className="mb-4">Saya yang bertanda tangan di bawah ini :</p>
              
              <table className="w-full mb-4">
                <tbody>
                  <tr><td className="w-32 pb-1">Nama</td><td className="w-4 pb-1">:</td><td className="pb-1">{namaDebitur}</td></tr>
                  <tr><td className="w-32 pb-1">Alamat</td><td className="w-4 pb-1">:</td><td className="pb-1">{alamatDebitur}</td></tr>
                  <tr><td className="w-32 pb-1">NIK</td><td className="w-4 pb-1">:</td><td className="pb-1">{ktpDebitur}</td></tr>
                  <tr><td className="w-32 pb-1">Pekerjaan</td><td className="w-4 pb-1">:</td><td className="pb-1">{pekerjaanDebitur}</td></tr>
                </tbody>
              </table>

              <p className="mb-4">Dengan ini menyatakan:</p>
              
              <p className="text-justify mb-4">
                Saya telah mengajukan dan memperoleh fasilitas kredit dari Bank <b>bjb</b> sebesar Rp. <b>{nominalPinjaman}</b>,- 
                sesuai dengan Perjanjian Kredit <b>(PK) No {noPK}</b>
              </p>

              <ol className="list-decimal pl-6 mb-6 space-y-2">
                <li className="text-justify">
                  Bank <b>bjb</b> telah menjelaskan dengan terperinci dan jelas perihal seluruh kewajiban dan hak saya atas fasilitas kredit tersebut, termasuk biaya-biaya yang timbul sesusai dengan yang tertera pada Perjanjian Kredit (PK). Dan Saya telah mengerti akan hak dan kewajiban baik fitur maupun Perjanjian Kredit (PK) atas fasilitas kredit tersebut.
                </li>
                <li className="text-justify">
                  Saya memberi persetujuan dan kuasa kepada Bank <b>bjb</b> untuk melakukan pemblokiran dana angsuran sebesar <b>Rp {angsuran}</b> atau <b>{jumlahAngsuran}x</b> angsuran terhadap rekening tabungan saya sesuai ketentuan yang berlaku dalam Perjanjian Kredit.
                </li>
              </ol>

              <p className="text-justify mb-10">
                Demikian surat pernyataan ini saya buat dalam keadaan sadar dan tanpa paksaan dari pihak manapun untuk dipergunakan sebagaimana mestinya.
              </p>

              <div className="flex justify-between text-center">
                <div className="w-1/2">
                  <p className="text-transparent">.</p>
                  <p>{hasPasangan ? 'PASANGAN DEBITUR' : ''}</p>
                  <div className="h-20"></div>
                  <p className="uppercase underline">{hasPasangan ? namaPasangan : ''}</p>
                </div>
                <div className="w-1/2">
                  <p>Cibadak, {formattedDate}</p>
                  <p>Debitur</p>
                  <div className="h-20 flex items-center justify-center text-sm text-gray-500">Materai Rp.10.000</div>
                  <p className="uppercase underline">{namaDebitur}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
