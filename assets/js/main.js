(() => {
  "use strict";

  const cfg = window.RW26_CONFIG || {};
  const navbar = document.getElementById("mainNav");
  const backToTop = document.getElementById("backToTop");
  const navLinks = [...document.querySelectorAll(".nav-link")];
  const sections = [...document.querySelectorAll("main section[id]")];
  const collapseElement = document.getElementById("navbarMenu");
  const year = document.getElementById("year");
  const showAllButton = document.getElementById("showAllAnnouncements");

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
      "bank-sampah": [
        { nama: "Koordinator Bank Sampah", jabatan: "Koordinator" }
      ],
      pokmas: [
        { nama: "Koordinator Pokmas", jabatan: "Koordinator" }
      ]
    }
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

  const formatDate = (value, withReadTime = false) => {
    if (!value) return "TERBARU";
    const date = new Date(value);
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
    ["announcementList", "facilityList"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = loadingMarkup();
    });
    const newsSidebar = document.getElementById("newsSidebar");
    if (newsSidebar) newsSidebar.innerHTML = "";
    const newsMain = document.getElementById("newsMainContent");
    if (newsMain) newsMain.innerHTML = loadingMarkup("Memuat berita...");
    const org = document.getElementById("orgList");
    if (org) org.innerHTML = '<div class="loading-state">Memuat struktur pengurus...</div>';
  };

  const renderHero = (items = fallback.himbauan) => {
    const slides = document.getElementById("heroSlides");
    const indicators = document.getElementById("heroIndicators");
    if (!slides || !indicators) return;

    const activeItems = (items.length ? items : fallback.himbauan).filter(Boolean);
    slides.innerHTML = activeItems.map((item, idx) => `
      <div class="carousel-item ${idx === 0 ? "active" : ""}">
        <article class="hero-slide">
          <img src="${esc(imageUrl(item, "w2000") || fallback.himbauan[idx % fallback.himbauan.length].imageUrl)}" alt="${esc(item.judul || "Informasi RW 026")}">
          <div class="hero-caption">
            <span>${esc(item.kategori || "Info RW")}</span>
            <h2>${esc(item.judul || "Informasi RW 026")}</h2>
          </div>
        </article>
      </div>`).join("");

    indicators.innerHTML = activeItems.map((_, idx) => `
      <button type="button" data-bs-target="#infoCarousel" data-bs-slide-to="${idx}" class="${idx === 0 ? "active" : ""}" aria-label="Slide ${idx + 1}"></button>`).join("");
  };

  const renderAnnouncements = (items = []) => {
    const target = document.getElementById("announcementList");
    if (!target) return;

    const active = (items.length ? items : fallback.announcements).filter(isActive);
    if (!active.length) {
      target.innerHTML = emptyMarkup("Belum ada pengumuman aktif.");
      if (showAllButton) showAllButton.classList.add("d-none");
      return;
    }

    target.innerHTML = active.map((item, idx) => `
      <div class="col-md-6 col-lg-4 announcement-item ${idx > 2 ? "d-none extra-announcement" : ""}">
        <article class="info-card">
          <div class="card-icon ${iconColors[idx % iconColors.length]}"><i class="bi ${icons[item.kategori] || "bi-megaphone"}"></i></div>
          <span class="info-date"><i class="bi bi-calendar2-week"></i>${esc(formatDate(item.tanggal))}</span>
          <h3>${esc(item.judul || "Pengumuman RW")}</h3>
          ${expandableText(getText(item, ["ringkasan", "isi", "deskripsi", "konten"]), 145)}
        </article>
      </div>`).join("");

    if (showAllButton) {
      showAllButton.classList.toggle("d-none", active.length <= 3);
      showAllButton.dataset.expanded = "false";
      showAllButton.innerHTML = '<i class="bi bi-grid-3x3-gap-fill"></i> Lihat Semua';
    }
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

    const sorted = [...active].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
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

  const updateStats = (data) => {
    const orgCount = Object.values(data.organization || {}).reduce((total, group) => total + (Array.isArray(group) ? group.filter(isActive).length : 0), 0);
    const stats = {
      statAgenda: (data.news || fallback.news).filter(isActive).length + (data.announcements || fallback.announcements).filter(isActive).length,
      statRT: Math.max(10, orgCount || 10)
    };
    Object.entries(stats).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });
  };

  const renderContent = (data = fallback) => {
    renderHero(data.himbauan || fallback.himbauan);
    renderAnnouncements(data.announcements || fallback.announcements);
    renderNews(data.news || fallback.news);
    renderFacilities(data.facilities || fallback.facilities);
    renderOrganization(data.organization || fallback.organization);
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

    if (showAllButton) {
      showAllButton.addEventListener("click", () => {
        const expanded = showAllButton.dataset.expanded === "true";
        document.querySelectorAll(".extra-announcement").forEach((item) => item.classList.toggle("d-none", expanded));
        showAllButton.dataset.expanded = String(!expanded);
        showAllButton.innerHTML = expanded
          ? '<i class="bi bi-grid-3x3-gap-fill"></i> Lihat Semua'
          : '<i class="bi bi-chevron-up"></i> Tampilkan Ringkas';
      });
    }

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
      ".section-header, .info-card, .news-sidebar, .news-main-article, .facility-card, .org-group, .gallery-grid, .contact-list, .map-box"
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
    preloader.classList.add("hide");
    setTimeout(() => preloader.remove(), 450);
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
  });
})();
