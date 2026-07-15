# Arsip Digital Bank BJB

Selamat datang di repositori aplikasi **Arsip Digital Bank BJB**. Aplikasi ini merupakan sistem pengarsipan berkas dokumen internal berbasis web yang dirancang khusus untuk memfasilitasi, menata, dan mengamankan manajemen dokumen operasional di lingkungan Bank BJB.

## Tentang Aplikasi
Aplikasi Arsip Digital Bank BJB dibangun untuk mendigitalisasi ruang penyimpanan arsip fisik bank. Melalui sistem ini, proses pelacakan, pencarian, dan penyimpanan dokumen krusial nasabah dapat dilakukan secara terpusat, aman, dan efisien tanpa adanya risiko kehilangan atau kerusakan berkas fisik.

## Fitur Utama Sistem
- **Manajemen Hak Akses Divisi Terisolasi**: Menggunakan sistem otentikasi berbasis *role* yang membatasi akses pengelolaan dokumen sesuai ranah kerja divisi (Admin, Konsumer, Ritel, dan Mikro).
- **Pengarsipan Kategori Terstruktur**: Tersedianya ruang penyimpanan khusus untuk berbagai kategori berkas operasional perbankan (meliputi dokumen SLIK, Mutasi Rekening, TASPEN, AMOLA, Kolateral, SITANTI, hingga bukti Berkas Lunas).
- **Pencarian Cerdas & Filter Lanjutan**: Kemudahan melacak dan menemukan dokumen di lautan arsip melalui fitur pencarian (*search*) berdasarkan nama file atau pengunggah, yang dipadukan dengan filter rentang kalender (*date range*).
- **Log Aktivitas (*Audit Trail*)**: Sistem merekam seluruh histori tindakan pengguna secara otomatis di latar belakang (mencakup aktivitas login, unggah dokumen, hingga penghapusan berkas) untuk menjamin transparansi sistem.
- **Pemulihan Berkas (Tempat Sampah)**: Terdapat sistem perlindungan data dari kelalaian pengguna. Berkas yang terhapus dapat dipulihkan (*restore*) ke posisi semula dalam masa tenggang 30 hari.

## Teknologi Utama yang Digunakan
Sistem pengarsipan ini dikembangkan menggunakan *stack* teknologi modern untuk memastikan kecepatan, keamanan, dan keandalan data:
- **Frontend**: React.js, TypeScript, Tailwind CSS
- **Backend & Database**: Supabase (PostgreSQL, Supabase Storage, Row Level Security)
- **Deployment**: Netlify

---
*Catatan: Repositori ini merupakan arsip pengembangan untuk aplikasi internal pelacakan dan pengarsipan dokumen bank.*
