(() => {
  "use strict";
  const pageLoadStart = Date.now();

  const cfg = window.RW26_CONFIG || {};
  const navbar = document.getElementById("mainNav");
  const backToTop = document.getElementById("backToTop");
  const navLinks = [...document.querySelectorAll(".nav-link")];
  const sections = [...document.querySelectorAll("main section[id]")];
  const collapseElement = document.getElementById("navbarMenu");
  const year = document.getElementById("year");
  let galleryData = [];
  let heroData = [];
  let lightboxSource = [];
  let currentAlbum = 0;
  let currentPhoto = 0;

  const fallback = {
    himbauan: [
      {
        judul: "Kerja bakti lingkungan",
        kategori: "Kegiatan",
        ringkasan: "Mari menjaga kebersihan jalan, selokan, dan fasilitas umum bersama warga.",
        imageUrl: "assets/images/slide-kerja-bakti.svg"
      },
      {
        judul: "Posyandu RW 026",
        kategori: "Kesehatan",
        ringkasan: "Layanan kesehatan balita, lansia, dan konsultasi gizi untuk keluarga.",
        imageUrl: "assets/images/slide-posyandu.svg"
      },
      {
        judul: "Pelayanan administrasi",
        kategori: "Administrasi",
        ringkasan: "Informasi pengajuan surat dan layanan administrasi warga RW 026.",
        imageUrl: "assets/images/slide-pelayanan.svg"
      }
    ],
    announcements: [
      {
        judul: "Jadwal kerja bakti lingkungan",
        kategori: "Kegiatan",
        tanggal: "2026-07-07",
        ringkasan: "Kerja bakti dilaksanakan mulai pukul 07.00 WIB. Warga dimohon membawa alat kebersihan masing-masing.",
        status: "Aktif"
      },
      {
        judul: "Pendataan warga baru",
        kategori: "Administrasi",
        tanggal: "2026-07-10",
        ringkasan: "Warga baru dapat menghubungi ketua RT setempat untuk melengkapi data keluarga.",
        status: "Aktif"
      },
      {
        judul: "Kegiatan posyandu bulanan",
        kategori: "Kesehatan",
        tanggal: "2026-07-14",
        ringkasan: "Posyandu akan melayani penimbangan balita, pemeriksaan lansia, dan konsultasi kesehatan dasar.",
        status: "Aktif"
      }
    ],
    news: [
      {
        judul: "Warga kompak menjaga kebersihan lingkungan",
        kategori: "Kegiatan",
        tanggal: "2026-07-01",
        ringkasan: "Kegiatan kebersihan rutin berjalan lancar dengan dukungan warga dari beberapa RT.",
        imageUrl: "assets/images/slide-kerja-bakti.svg",
        status: "Aktif"
      },
      {
        judul: "Pelayanan administrasi semakin mudah",
        kategori: "Administrasi",
        tanggal: "2026-06-28",
        ringkasan: "Pengurus RW menyiapkan kanal informasi agar warga lebih mudah memahami alur layanan.",
        imageUrl: "assets/images/slide-pelayanan.svg",
        status: "Aktif"
      }
    ],
    facilities: [
      { nama: "Balai Warga", kategori: "Fasilitas", deskripsi: "Ruang pertemuan dan kegiatan warga." },
      { nama: "Pos Keamanan", kategori: "Keamanan", deskripsi: "Tempat koordinasi keamanan lingkungan." },
      { nama: "Area Olahraga", kategori: "Olahraga", deskripsi: "Sarana aktivitas sehat bersama warga." },
      { nama: "Bank Sampah", kategori: "Lingkungan", deskripsi: "Dukungan pengelolaan sampah bernilai guna." }
    ],
    organization: {
      rw: [
        { nama: "Ketua RW 026", jabatan: "Ketua RW" },
        { nama: "Sekretaris RW", jabatan: "Sekretaris" },
        { nama: "Bendahara RW", jabatan: "Bendahara" }
      ],
      posyandu: [
        { nama: "Koordinator Posyandu", jabatan: "Koordinator" }
      ],
      pkk: [
        { nama: "Ketua PKK", jabatan: "Ketua" }
      ],
      "bank-sampah": [
        { nama: "Koordinator Bank Sampah", jabatan: "Koordinator" }
      ],
      pokmas: [
        { nama: "Koordinator Pokmas", jabatan: "Koordinator" }
      ]
    },
    gallery: [
      {
        nama: "Kegiatan RW 026",
        deskripsi: "Dokumentasi kegiatan warga RW 026",
        photos: [
          { imageUrl: "assets/images/slide-kerja-bakti.svg", name: "Kerja Bakti" },
          { imageUrl: "assets/images/slide-posyandu.svg", name: "Posyandu" },
          { imageUrl: "assets/images/slide-pelayanan.svg", name: "Pelayanan" }
        ]
      }
    ],
    statistik: [
      { nama: "Jumlah Warga", nilai: 1950 },
      { nama: "Kepala Keluarga", nilai: 620 },
      { nama: "Kegiatan", nilai: 0 },
      { nama: "RT Aktif", nilai: 10 }
    ]
  };

  const icons = {
    Administrasi: "bi-receipt",
    Fasilitas: "bi-buildings",
    Informasi: "bi-megaphone",
    Kegiatan: "bi-people-fill",
    Kesehatan: "bi-heart-pulse",
    Keamanan: "bi-shield-check",
    Lingkungan: "bi-tree",
    Olahraga: "bi-trophy"
  };
  const iconColors = ["amber", "green", "blue", "rose"];

  const esc = (value) => {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
  };

  const sanitizeHtml = (html) => {
    const div = document.createElement("div");
    div.innerHTML = html ?? "";
    div.querySelectorAll("script, iframe, style, object, embed, form, input").forEach(el => el.remove());
    div.querySelectorAll("*").forEach(el => {
      [...el.attributes].forEach(attr => {
        if (attr.name.startsWith("on") || (attr.name === "href" && attr.value.startsWith("javascript:"))) {
          el.removeAttribute(attr.name);
        }
      });
    });
    return div.innerHTML;
  };

  const plainText = (value) => {
    const div = document.createElement("div");
    div.innerHTML = value ?? "";
    return div.textContent.trim();
  };

  const isActive = (item) => String(item?.status || "Aktif").toLowerCase() === "aktif";

  const initials = (name) => String(name || "RW")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const getText = (item, fields) => {
    for (const field of fields) {
      if (item && item[field]) return item[field];
    }
    return "";
  };

  const parseDate = (value) => {
    if (typeof value === "string") {
      const m = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (m) {
        const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
        if (!Number.isNaN(d.getTime())) return d;
      }
    }
    return new Date(value);
  };

  const formatDate = (value, withReadTime = false) => {
    if (!value) return "TERBARU";
    const date = parseDate(value);
    const formatted = Number.isNaN(date.getTime())
      ? String(value).toUpperCase()
      : new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date).toUpperCase();
    return withReadTime ? `${formatted} • 3 MENIT BACA` : formatted;
  };

  const imageUrl = (item, size = "w1200") => {
    if (!item) return "";
    if (item.fileId) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(item.fileId)}&sz=${size}`;
    return item.imageUrl || item.foto || item.gambar || "";
  };

  const expandableText = (text, length, className = "summary-text") => {
    const raw = String(text || "").trim();
    if (!raw) return `<p class="${className}">Informasi detail akan diperbarui oleh pengurus.</p>`;
    const plain = plainText(raw);
    if (plain.length <= length) return `<div class="${className}">${sanitizeHtml(raw)}</div>`;
    return `
      <div class="${className} expandable-text">
        <span class="summary-short">${esc(plain.slice(0, length).trim())}...</span>
        <span class="summary-full">${sanitizeHtml(raw)}</span>
      </div>
      <button class="more-link" type="button" data-more-toggle>
        <span>Tampilkan lebih banyak</span><i class="bi bi-chevron-down"></i>
      </button>`;
  };

  const loadingMarkup = (label = "Memuat data...") => `
    <div class="col-12">
      <div class="loading-state"><span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>${esc(label)}</div>
    </div>`;

  const emptyMarkup = (label) => `<div class="col-12"><div class="empty-state">${esc(label)}</div></div>`;

  const clearContainers = () => {
    ["facilityList"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = loadingMarkup();
    });
    const announceSidebar = document.getElementById("announcementSidebar");
    if (announceSidebar) announceSidebar.innerHTML = "";
    const announceMain = document.getElementById("announcementMainContent");
    if (announceMain) announceMain.innerHTML = loadingMarkup("Memuat pengumuman...");
    const newsSidebar = document.getElementById("newsSidebar");
    if (newsSidebar) newsSidebar.innerHTML = "";
    const newsMain = document.getElementById("newsMainContent");
    if (newsMain) newsMain.innerHTML = loadingMarkup("Memuat berita...");
    const org = document.getElementById("orgList");
    if (org) org.innerHTML = '<div class="loading-state">Memuat struktur pengurus...</div>';
    const gallery = document.getElementById("galleryContainer");
    if (gallery) gallery.innerHTML = loadingMarkup("Memuat galeri...");
  };

  const renderHero = (items = fallback.himbauan) => {
    const slides = document.getElementById("heroSlides");
    const indicators = document.getElementById("heroIndicators");
    if (!slides || !indicators) return;

    const activeItems = (items.length ? items : fallback.himbauan).filter(Boolean);
    heroData = activeItems;
    slides.innerHTML = activeItems.map((item, idx) => `
      <div class="carousel-item ${idx === 0 ? "active" : ""}">
        <article class="hero-slide">
          <img src="${esc(imageUrl(item, "w2000") || fallback.himbauan[idx % fallback.himbauan.length].imageUrl)}" alt="${esc(item.judul || "Informasi RW 026")}">

        </article>
      </div>`).join("");

    indicators.innerHTML = activeItems.map((_, idx) => `
      <button type="button" data-bs-target="#infoCarousel" data-bs-slide-to="${idx}" class="${idx === 0 ? "active" : ""}" aria-label="Slide ${idx + 1}"></button>`).join("");
  };

  const renderAnnouncements = (items = []) => {
    const sidebar = document.getElementById("announcementSidebar");
    const mainContent = document.getElementById("announcementMainContent");
    if (!sidebar || !mainContent) return;

    const active = (items.length ? items : fallback.announcements).filter(isActive);
    if (!active.length) {
      mainContent.innerHTML = emptyMarkup("Belum ada pengumuman aktif.");
      sidebar.innerHTML = "";
      return;
    }

    const getDate = (item) => {
      const raw = item.tanggal || "";
      if (!raw) return 0;
      const d = parseDate(raw);
      return Number.isNaN(d.getTime()) ? 0 : d.getTime();
    };

    const sorted = [...active].sort((a, b) => getDate(b) - getDate(a));
    const accentColors = ["#e11d48", "#f59e0b", "#2563eb", "#eab308", "#16a34a"];

    sidebar.innerHTML = sorted.map((item, idx) => `
      <div class="news-sidebar-item ${idx === 0 ? "active" : ""}" data-index="${idx}">
        <span class="news-accent-bar" style="background:${accentColors[idx % accentColors.length]}"></span>
        <div class="news-sidebar-content">
          <span class="news-sidebar-date">${esc(formatDate(item.tanggal))}</span>
          <h4>${esc(item.judul || "Pengumuman RW")}</h4>
        </div>
      </div>`).join("");

    const renderMainArticle = (item, idx) => {
      const bodyText = getText(item, ["ringkasan", "isi", "deskripsi", "konten"]);
      mainContent.innerHTML = `
        <article class="info-card" style="height:auto">
          <div class="card-icon ${iconColors[idx % iconColors.length]}">
            <i class="bi ${icons[item.kategori] || "bi-megaphone"}"></i>
          </div>
          <span class="info-date"><i class="bi bi-calendar2-week"></i>${esc(formatDate(item.tanggal))}</span>
          <h3>${esc(item.judul || "Pengumuman RW")}</h3>
          <p class="summary-text">${sanitizeHtml(bodyText || "Informasi detail akan diperbarui oleh pengurus.")}</p>
        </article>`;
    };

    renderMainArticle(sorted[0], 0);

    const handleSidebarClick = (e) => {
      const item = e.target.closest(".news-sidebar-item");
      if (!item) return;
      const idx = parseInt(item.dataset.index, 10);
      if (item.classList.contains("active")) return;
      sidebar.querySelectorAll(".news-sidebar-item").forEach(el => el.classList.remove("active"));
      item.classList.add("active");
      renderMainArticle(sorted[idx], idx);
    };

    sidebar.removeEventListener("click", sidebar._announceClick);
    sidebar._announceClick = handleSidebarClick;
    sidebar.addEventListener("click", handleSidebarClick);
  };

  const renderNews = (items = []) => {
    const sidebar = document.getElementById("newsSidebar");
    const mainContent = document.getElementById("newsMainContent");
    if (!sidebar || !mainContent) return;

    const active = (items.length ? items : fallback.news).filter(isActive);
    if (!active.length) {
      mainContent.innerHTML = emptyMarkup("Belum ada berita aktif.");
      sidebar.innerHTML = "";
      return;
    }

    const getDate = (item) => {
      const raw = item.tanggal || item.tgl || item.date || item.tanggal_terbit || "";
      if (!raw) return 0;
      const d = parseDate(raw);
      return Number.isNaN(d.getTime()) ? 0 : d.getTime();
    };

    const sorted = [...active].sort((a, b) => getDate(b) - getDate(a));
    const accentColors = ["#e11d48", "#f59e0b", "#2563eb", "#eab308", "#16a34a"];

    sidebar.innerHTML = sorted.map((item, idx) => `
      <div class="news-sidebar-item ${idx === 0 ? "active" : ""}" data-index="${idx}">
        <span class="news-accent-bar" style="background:${accentColors[idx % accentColors.length]}"></span>
        <div class="news-sidebar-content">
          <span class="news-sidebar-date">${esc(formatDate(item.tanggal))}</span>
          <h4>${esc(item.judul || "Berita RW 026")}</h4>
        </div>
      </div>`).join("");

    const renderMainArticle = (item, idx) => {
      const img = imageUrl(item, "w1200") || fallback.himbauan[idx % fallback.himbauan.length].imageUrl;
      const bodyText = getText(item, ["isi", "konten", "ringkasan", "deskripsi"]);
      mainContent.innerHTML = `
        <article class="news-main-article">
          <div class="news-main-meta">
            <span class="news-main-category" style="background:${accentColors[idx % accentColors.length]}">${esc(item.kategori || "Berita")}</span>
            <span class="news-main-date"><i class="bi bi-calendar2-week"></i> ${esc(formatDate(item.tanggal))}</span>
          </div>
          <h3 class="news-main-title">${esc(item.judul || "Berita RW 026")}</h3>
          <div class="news-main-image">
            <img src="${esc(img)}" alt="${esc(item.judul || "Berita RW 026")}">
          </div>
          <div class="news-main-body">
            ${sanitizeHtml(bodyText || "Informasi detail akan diperbarui oleh pengurus.")}
          </div>
        </article>`;
    };

    renderMainArticle(sorted[0], 0);

    const handleSidebarClick = (e) => {
      const item = e.target.closest(".news-sidebar-item");
      if (!item) return;
      const idx = parseInt(item.dataset.index, 10);
      if (item.classList.contains("active")) return;
      sidebar.querySelectorAll(".news-sidebar-item").forEach(el => el.classList.remove("active"));
      item.classList.add("active");
      renderMainArticle(sorted[idx], idx);
    };

    sidebar.removeEventListener("click", sidebar._newsClick);
    sidebar._newsClick = handleSidebarClick;
    sidebar.addEventListener("click", handleSidebarClick);
  };

  const renderFacilities = (items = []) => {
    const target = document.getElementById("facilityList");
    if (!target) return;

    const list = items.length ? items : fallback.facilities;
    if (!list.length) {
      target.innerHTML = emptyMarkup("Data fasilitas belum tersedia.");
      return;
    }

    target.innerHTML = list.map((item, idx) => {
      const category = item.kategori || item.jenis || "Fasilitas";
      return `
        <div class="col-md-6 col-lg-3">
          <article class="facility-card">
            <i class="bi ${icons[category] || "bi-buildings"}"></i>
            <span class="facility-meta">${esc(category)}</span>
            <h3>${esc(item.nama || item.judul || "Fasilitas RW")}</h3>
            ${expandableText(getText(item, ["deskripsi", "ringkasan", "keterangan"]), 105)}
          </article>
        </div>`;
    }).join("");
  };

  const renderOrganization = (org = fallback.organization) => {
    const target = document.getElementById("orgList");
    if (!target) return;

    const groups = [
      { key: "rw", title: "Pengurus RW", icon: "bi-people-fill" },
      { key: "posyandu", title: "Posyandu", icon: "bi-hospital" },
      { key: "pkk", title: "PKK", icon: "bi-people" },
      { key: "bank-sampah", title: "Bank Sampah", icon: "bi-recycle" },
      { key: "pokmas", title: "Pokmas", icon: "bi-diagram-3" }
    ];

    target.innerHTML = groups.map((group) => {
      const list = Array.isArray(org?.[group.key]) ? org[group.key].filter(isActive) : [];
      return `
        <section class="org-group" aria-labelledby="org-${esc(group.key)}">
          <div class="org-group-heading" data-toggle="org-accordion">
            <span><i class="bi ${group.icon}"></i></span>
            <div>
              <h3 id="org-${esc(group.key)}">${esc(group.title)}</h3>
              <small>${list.length ? `${list.length} pengurus` : "Belum ada data"}</small>
            </div>
          </div>
          <div class="org-members">
            ${list.length ? list.map((person) => `
              <article class="org-person">
                ${imageUrl(person, "w400") ? `<img src="${esc(imageUrl(person, "w400"))}" alt="${esc(person.nama || person.jabatan || "Pengurus")}">` : `<div class="org-avatar">${esc(initials(person.nama || person.jabatan))}</div>`}
                <div>
                  <span>${esc(person.jabatan || "-")}</span>
                  <strong>${esc(person.nama || "-")}</strong>
                </div>
              </article>`).join("") : '<p class="org-empty">Data pengurus belum tersedia.</p>'}
          </div>
        </section>`;
    }).join("");
  };

  const renderGallery = (items = []) => {
    const target = document.getElementById("galleryContainer");
    if (!target) return;

    const active = items.length ? items : fallback.gallery;
    galleryData = active;
    if (!active.length) {
      target.innerHTML = emptyMarkup("Belum ada foto kegiatan.");
      return;
    }

    target.innerHTML = active.map((album, albumIdx) => {
      const photos = album.photos;
      const total = photos.length;
      const take = total >= 4 ? 4 : total;
      const cells = photos.slice(0, take);
      let gridClass = "";
      if (total === 1) gridClass = "album-card-grid--1";
      else if (total === 2) gridClass = "album-card-grid--2";
      else if (total === 3) gridClass = "album-card-grid--3";
      else gridClass = "album-card-grid--4";

      return `
        <article class="album-card" data-album-index="${albumIdx}">
          <div class="album-card-cover">
            <div class="album-card-grid ${gridClass}">
              ${cells.map((photo, i) => `
                <div class="album-card-grid-cell${i === 0 && total === 3 ? " album-card-grid-cell--wide" : ""}">
                  <img src="${esc(imageUrl(photo))}" alt="" loading="lazy">
                </div>
              `).join("")}
            </div>
            <div class="album-card-count-overlay"><span>${total} foto</span></div>
          </div>
          <div class="album-card-body">
            <h3>${esc(album.nama || "Album")}</h3>
            ${album.deskripsi ? `<p>${esc(album.deskripsi)}</p>` : ""}
          </div>
        </article>`;
    }).join("");
  };

  const openLightbox = (source, albumIdx, photoIdx) => {
    const overlay = document.getElementById("lightboxOverlay");
    const img = overlay.querySelector(".lightbox-image");
    lightboxSource = source;
    const album = lightboxSource[albumIdx];
    if (!album || !album.photos[photoIdx]) return;

    currentAlbum = albumIdx;
    currentPhoto = photoIdx;

    const photo = album.photos[photoIdx];
    img.src = imageUrl(photo, "w2000");
    img.alt = photo.name || "Foto kegiatan";

    overlay.querySelector(".lightbox-counter").textContent = `${photoIdx + 1}/${album.photos.length}`;
    overlay.querySelector(".lightbox-name").textContent = album.nama || "";

    updateNavButtons();
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      overlay.classList.add("is-open");
    });
  };

  const closeLightbox = () => {
    const overlay = document.getElementById("lightboxOverlay");
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
  };

  const navigateLightbox = (dir) => {
    const album = lightboxSource[currentAlbum];
    if (!album) return;
    const next = currentPhoto + dir;
    if (next < 0 || next >= album.photos.length) return;
    openLightbox(lightboxSource, currentAlbum, next);
  };

  const updateNavButtons = () => {
    const album = lightboxSource[currentAlbum];
    if (!album) return;
    const prev = document.querySelector(".lightbox-prev");
    const next = document.querySelector(".lightbox-next");
    prev.classList.toggle("is-hidden", currentPhoto === 0);
    next.classList.toggle("is-hidden", currentPhoto === album.photos.length - 1);
  };

  const renderStatistics = (items = []) => {
    const container = document.getElementById("statsContainer");
    if (!container) return;
    if (!items.length) { container.innerHTML = ""; return; }

    const iconMap = {
      warga: "bi-people-fill",
      "kepala keluarga": "bi-house-door-fill",
      kk: "bi-house-door-fill",
      kegiatan: "bi-calendar-event-fill",
      agenda: "bi-calendar-event-fill",
      rt: "bi-shield-check",
      "rukun tetangga": "bi-shield-check",
      laki: "bi-gender-male",
      perempuan: "bi-gender-female",
      balita: "bi-heart-fill",
      lansia: "bi-person-wheelchair"
    };

    const getIcon = (name) => {
      const lower = (name || "").toLowerCase();
      for (const [key, icon] of Object.entries(iconMap)) {
        if (lower.includes(key)) return icon;
      }
      return "bi-bar-chart-fill";
    };

    container.innerHTML = items.map((item) => `
      <div class="col-6 col-lg-3">
        <div class="stat-card">
          <i class="bi ${getIcon(item.nama)}"></i>
          <strong data-target="${Number(item.nilai || 0)}">0</strong>
          <span>${esc(item.nama)}</span>
        </div>
      </div>`).join("");

    animateCounters();
  };

  const animateCounters = () => {
    const container = document.getElementById("statsContainer");
    if (!container) return;
    const targets = container.querySelectorAll("[data-target]");
    if (!targets.length) return;

    const duration = 2000;

    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const startAnimation = (el) => {
      const target = parseInt(el.dataset.target, 10) || 0;
      if (target === 0) return;
      const startTime = performance.now();

      const tick = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const value = Math.round(easeOut(progress) * target);
        el.textContent = value.toLocaleString("id-ID");
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window)) {
      targets.forEach(startAnimation);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startAnimation(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    targets.forEach((el) => observer.observe(el));
  };

  const updateStats = (data) => {
    renderStatistics(data.statistik || fallback.statistik);
  };

  const renderKasReport = (bulan, tahun) => {
    const loading = document.getElementById("kasLoadingState");
    const reportBox = document.getElementById("kasReportBox");
    const emptyState = document.getElementById("kasEmptyState");
    const btn = document.getElementById("kasBtnCari");
    const bulanSel = document.getElementById("kasFilterBulan");
    const tahunSel = document.getElementById("kasFilterTahun");

    if (!bulanSel || !tahunSel) return;

    if (!bulanSel.options.length) {
      const namaBulan = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
      const now = new Date();
      namaBulan.forEach((nama, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.text = nama;
        if (i === now.getMonth()) opt.selected = true;
        bulanSel.appendChild(opt);
      });
      for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) {
        const opt = document.createElement("option");
        opt.value = y;
        opt.text = y;
        if (y === now.getFullYear()) opt.selected = true;
        tahunSel.appendChild(opt);
      }
    }

    const b = bulan !== undefined ? bulan : bulanSel.value;
    const t = tahun !== undefined ? tahun : tahunSel.value;

    if (reportBox) reportBox.style.display = "none";
    if (emptyState) emptyState.style.display = "none";
    if (loading) loading.style.display = "flex";
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Memuat'; }

    if (!cfg.APPS_SCRIPT_URL) {
      if (loading) loading.style.display = "none";
      if (emptyState) emptyState.style.display = "flex";
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-search"></i> Cari'; }
      return;
    }

    fetchWithTimeout(`${cfg.APPS_SCRIPT_URL}?action=publicKasReport&bulan=${encodeURIComponent(b)}&tahun=${encodeURIComponent(t)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat laporan.");
        return res.json();
      })
      .then((data) => {
        if (loading) loading.style.display = "none";
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-search"></i> Cari'; }
        if (!data.ok || (!data.rincianMasuk.length && !data.rincianKeluar.length && data.saldoAwal === 0)) {
          if (emptyState) emptyState.style.display = "flex";
          return;
        }
        if (reportBox) reportBox.style.display = "block";
        const fmt = (n) => "Rp " + Number(n).toLocaleString("id-ID");
        const sa = document.getElementById("kasSaldoAwal");
        const tm = document.getElementById("kasTotalMasuk");
        const tk = document.getElementById("kasTotalKeluar");
        const sk = document.getElementById("kasSaldoAkhir");
        if (sa) sa.textContent = fmt(data.saldoAwal);
        if (tm) tm.textContent = fmt(data.totalMasuk);
        if (tk) tk.textContent = fmt(data.totalKeluar);
        if (sk) sk.textContent = fmt(data.saldoAkhir);

        const bm = document.getElementById("kasBodyMasuk");
        const bk = document.getElementById("kasBodyKeluar");
        if (bm) {
          bm.innerHTML = data.rincianMasuk.length
            ? data.rincianMasuk.map((r) => `<tr><td>${esc(r.uraian)}</td><td class="text-end fw-bold text-success">${fmt(r.nominal)}</td></tr>`).join("")
            : '<tr class="kas-empty-row"><td colspan="2">Tidak ada pemasukan</td></tr>';
        }
        if (bk) {
          bk.innerHTML = data.rincianKeluar.length
            ? data.rincianKeluar.map((r) => `<tr><td>${esc(r.uraian)}</td><td class="text-end fw-bold text-danger">${fmt(r.nominal)}</td></tr>`).join("")
            : '<tr class="kas-empty-row"><td colspan="2">Tidak ada pengeluaran</td></tr>';
        }
      })
      .catch(() => {
        if (loading) loading.style.display = "none";
        if (emptyState) emptyState.style.display = "flex";
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-search"></i> Cari'; }
      });
  };

  const renderContent = (data = fallback) => {
    renderHero(data.himbauan || fallback.himbauan);
    renderAnnouncements(data.announcements || fallback.announcements);
    renderNews(data.news || fallback.news);
    renderFacilities(data.facilities || fallback.facilities);
    renderOrganization(data.organization || fallback.organization);
    renderGallery(data.gallery || fallback.gallery);
    updateStats(data);
  };

  const handleScroll = () => {
    if (navbar) navbar.classList.toggle("navbar-scrolled", window.scrollY > 24);
    if (backToTop) backToTop.classList.toggle("show", window.scrollY > 500);

    const current = sections.findLast((section) => window.scrollY >= section.offsetTop - 130);
    if (!current) return;
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${current.id}`);
    });
  };

  const initInteractions = () => {
    document.addEventListener("click", (event) => {
      const moreButton = event.target.closest("[data-more-toggle]");
      if (moreButton) {
        const text = moreButton.previousElementSibling;
        const expanded = text?.classList.toggle("is-expanded");
        moreButton.innerHTML = expanded
          ? '<span>Tampilkan lebih sedikit</span><i class="bi bi-chevron-up"></i>'
          : '<span>Tampilkan lebih banyak</span><i class="bi bi-chevron-down"></i>';
      }
    });

    document.addEventListener("click", (event) => {
      const heading = event.target.closest("[data-toggle=\"org-accordion\"]");
      if (heading) {
        heading.closest(".org-group")?.classList.toggle("is-expanded");
      }
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (!collapseElement || !window.bootstrap) return;
        const instance = window.bootstrap.Collapse.getInstance(collapseElement);
        if (instance) instance.hide();
      });
    });

    if (backToTop) {
      backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    }

    const kasBtn = document.getElementById("kasBtnCari");
    if (kasBtn) {
      kasBtn.addEventListener("click", () => renderKasReport());
    }

    const galleryContainer = document.getElementById("galleryContainer");
    if (galleryContainer) {
      galleryContainer.addEventListener("click", (e) => {
        const card = e.target.closest(".album-card");
        if (card) {
          openLightbox(galleryData, parseInt(card.dataset.albumIndex, 10), 0);
        }
      });
    }

    const heroSlides = document.getElementById("heroSlides");
    if (heroSlides) {
      heroSlides.addEventListener("click", (e) => {
        const img = e.target.closest(".hero-slide img");
        if (!img) return;
        const heroAlbum = [{
          nama: "Slide Beranda",
          photos: heroData.map((item) => ({
            imageUrl: imageUrl(item, "w2000") || "",
            name: item.judul || "Slide Beranda"
          }))
        }];
        const slideIdx = [...heroSlides.querySelectorAll(".carousel-item")].findIndex(
          (ci) => ci.contains(img)
        );
        openLightbox(heroAlbum, 0, slideIdx >= 0 ? slideIdx : 0);
      });
    }

    const overlay = document.getElementById("lightboxOverlay");
    if (overlay) {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeLightbox();
      });

      overlay.querySelector(".lightbox-close")?.addEventListener("click", closeLightbox);
      overlay.querySelector(".lightbox-prev")?.addEventListener("click", () => navigateLightbox(-1));
      overlay.querySelector(".lightbox-next")?.addEventListener("click", () => navigateLightbox(1));

      const wrap = overlay.querySelector(".lightbox-image-wrap");
      if (wrap) {
        let sx = 0;
        wrap.addEventListener("touchstart", (e) => { sx = e.changedTouches[0].screenX; }, { passive: true });
        wrap.addEventListener("touchend", (e) => {
          const dx = e.changedTouches[0].screenX - sx;
          if (Math.abs(dx) > 50) navigateLightbox(dx > 0 ? -1 : 1);
        }, { passive: true });
      }
    }

    document.addEventListener("keydown", (e) => {
      if (overlay && overlay.classList.contains("is-open")) {
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") navigateLightbox(-1);
        if (e.key === "ArrowRight") navigateLightbox(1);
      }
    });
  };

  const fetchWithTimeout = (url, ms = 10000) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
  };

  const loadPublicContent = () => {
    if (!cfg.APPS_SCRIPT_URL) {
      renderContent(fallback);
      return;
    }

    const action = encodeURIComponent(cfg.PUBLIC_ACTION || "publicContent");
    fetchWithTimeout(`${cfg.APPS_SCRIPT_URL}?action=${action}`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat data publik.");
        return res.json();
      })
      .then((data) => renderContent(data?.ok ? data : fallback))
      .catch(() => renderContent(fallback));
  };

  const initDarkMode = () => {
    const toggle = document.getElementById("darkModeToggle");
    const icon = toggle?.querySelector("i");
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefersDark;

    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    if (icon) icon.className = isDark ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";

    toggle?.addEventListener("click", () => {
      const now = document.documentElement.getAttribute("data-theme") === "dark";
      document.documentElement.setAttribute("data-theme", now ? "light" : "dark");
      localStorage.setItem("theme", now ? "light" : "dark");
      if (icon) icon.className = now ? "bi bi-moon-stars-fill" : "bi bi-sun-fill";
    });
  };

  const initScrollReveal = () => {
    if (!("IntersectionObserver" in window)) return;
    const els = document.querySelectorAll(
      ".section-header, .info-card, .news-sidebar, .news-main-article, .facility-card, .org-group, .album-card, .contact-list, .map-box"
    );
    els.forEach((el) => el.classList.add("reveal"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => observer.observe(el));
  };

  window.addEventListener("load", () => {
    const preloader = document.getElementById("preloader");
    if (!preloader) return;
    const elapsed = Date.now() - pageLoadStart;
    const remaining = Math.max(0, 3000 - elapsed);
    setTimeout(() => {
      preloader.classList.add("hide");
      setTimeout(() => preloader.remove(), 450);
    }, remaining);
  });

  document.addEventListener("DOMContentLoaded", () => {
    if (year) year.textContent = new Date().getFullYear();
    clearContainers();
    initInteractions();
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    initDarkMode();
    initScrollReveal();
    loadPublicContent();
    renderKasReport();
  });
})();
