## Koneksi Database Portal RW

Website ini mengambil data publik dari backend Google Apps Script milik `D:\Mgt-portal RW` melalui `config.js`.

Data yang dirender dinamis:
- Slide himbauan
- Pengumuman aktif
- Berita aktif
- Fasilitas umum
- Struktur pengurus RW

Setelah perubahan `Code.gs` di project `Mgt-portal RW`, deploy ulang Apps Script sebagai Web App agar action `publicContent` tersedia di URL produksi.
