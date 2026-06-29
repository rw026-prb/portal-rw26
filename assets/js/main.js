(() => {
  "use strict";

  const cfg = window.RW26_CONFIG || {};
  
  // 1. Fungsi Pembersihan (Utility)
  const clearContainer = (id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<div class="text-center py-4 text-muted"><small>Memuat data...</small></div>';
  };

  // 2. Fungsi Utama Render (Revisi)
  const renderContent = (data) => {
    // Bersihkan semua kontainer sebelum diisi data dari Spreadsheet
    clearContainer("heroCarouselInner");
    clearContainer("announcementContainer");
    clearContainer("newsContainer");
    clearContainer("facilitiesContainer");
    clearContainer("organizationContainer");

    // Lakukan render data
    // Pastikan fungsi renderHero, renderAnnouncements, dll sudah didefinisikan sebelumnya
    if (data.himbauan) renderHero(data.himbauan);
    if (data.announcements) renderAnnouncements(data.announcements);
    if (data.news) renderNews(data.news);
    if (data.facilities) renderFacilities(data.facilities);
    if (data.organization) renderOrganization(data.organization);
  };

  // 3. Fungsi Ambil Data (GET method)
  const getApi = async (action) => {
    try {
      const response = await fetch(`${cfg.APPS_SCRIPT_URL}?action=${encodeURIComponent(action)}`);
      if (!response.ok) throw new Error("Gagal mengambil data");
      return await response.json();
    } catch (err) {
      console.error(err);
      return null; // Return null jika gagal agar fall back ke data statis
    }
  };

  // 4. Inisialisasi
  document.addEventListener("DOMContentLoaded", () => {
    // Jalankan render awal dengan data fallback
    renderContent(fallback); 

    // Ambil data dinamis
    getApi(cfg.PUBLIC_ACTION || "publicContent").then((data) => {
      if (data && data.ok) {
        renderContent(data); // Timpa tampilan dengan data asli dari Sheet
      } else {
        console.warn("Menggunakan data fallback karena API error.");
      }
    });

    // ... (Sisa fungsi pendukung lainnya seperti handleScroll, backToTop, dll tetap di bawah sini)
  });
})();