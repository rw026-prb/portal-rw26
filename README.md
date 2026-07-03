## Portal Digital RW 026

Website warga RW 026 Pengasinan Rawalumbu dengan tampilan modern, responsif, dan mudah dibaca oleh warga.

## Koneksi Database

Website ini tetap mengambil data publik dari backend Google Apps Script milik `D:\Mgt-portal RW` melalui `config.js`.

Data yang dirender dinamis:
- Slide himbauan
- Pengumuman aktif
- Berita aktif
- Fasilitas umum
- Struktur pengurus RW

File `config.js` menyimpan URL Web App Apps Script dan action publik:

```js
window.RW26_CONFIG = {
  APPS_SCRIPT_URL: ".../exec",
  PUBLIC_ACTION: "publicContent"
};
```

## Preview Lokal

Jalankan server statis dari folder project:

```powershell
python -m http.server 8081 --bind 127.0.0.1
```

Buka `http://127.0.0.1:8081/`.

Setelah perubahan `Code.gs` di project `Mgt-portal RW`, deploy ulang Apps Script sebagai Web App agar action `publicContent` tersedia di URL produksi.
