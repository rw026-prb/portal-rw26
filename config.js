/**
 * Konfigurasi data Portal Digital RW 026.
 *
 * Sekarang isian datang dari DUA sumber:
 *
 *   Supabase       - himbauan, pengumuman, fasilitas, struktur organisasi,
 *                    statistik warga, dan laporan kas
 *   Apps Script    - berita, galeri foto, video sambutan, video kegiatan
 *
 * Dua alasan pisahnya: media (foto dan video) masih berada di Google Drive,
 * dan Drive hanya bisa ditulis lewat Apps Script. Data yang berupa teks
 * dipindah ke Supabase karena lebih cepat, bisa diindeks, dan aturan aksesnya
 * bisa diatur per baris.
 */

/** Alamat proyek Supabase. */
const SUPABASE_URL = "https://puoahgfoaeuyaeerxbnt.supabase.co";

/**
 * Kunci "anon public". Boleh publik - Pengunjung tidak punya akun, dan
 * yang mereka baca memang sudah terbuka untuk umum.
 *
 * Yang melindungi data sensitif (buku kas, daftar pengguna, log) adalah aturan
 * Row Level Security di database, BUKAN kunci ini. Buku kas hanya bisa dibaca
 * lewat fungsi kas_report() dan kas_cash_flow(), yang sengaja tidak
 * mengembalikan baris mentah.
 */
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1b2FoZ2ZvYWV1eWFlZXJ4Ym50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMDgxMjAsImV4cCI6MjEwMjY4NDEyMH0.B4iw5kFsnmz-_i2UT7M7V9dh0_SxGXPD23vFdXfXucs";

/**
 * URL Web App Google Apps Script.
 *
 * Hanya dipakai untuk galeri foto, berita, dan video. Buat deployment BARU
 * setiap kali Code.gs diperbarui - URL yang lama pernah ikut ter-commit ke
 * repository publik.
 */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx-jZ6Q8SfUblW0oDW7JokjorLll0Jd9xKzvPPcg-LtdharV2_KE4bGfwNOJGchwwcU/exec";

/** Nama aksi yang dipanggil ke Apps Script. */
const PUBLIC_ACTION = "publicContent";

window.RW26_CONFIG = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  APPS_SCRIPT_URL,
  PUBLIC_ACTION
};
