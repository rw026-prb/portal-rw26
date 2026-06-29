(() => {
  "use strict";

  const cfg = window.RW26_CONFIG || {};
  const navbar = document.getElementById("mainNav");
  const backToTop = document.getElementById("backToTop");
  const navLinks = [...document.querySelectorAll(".nav-link")];
  const sections = [...document.querySelectorAll("main section[id]")];
  const collapseElement = document.getElementById("navbarMenu");
  const fallback = {
    himbauan: [
      { judul: "Kerja bakti lingkungan", imageUrl: "assets/images/slide-kerja-bakti.svg" },
      { judul: "Posyandu RW 26", imageUrl: "assets/images/slide-posyandu.svg" },
      { judul: "Pelayanan administrasi", imageUrl: "assets/images/slide-pelayanan.svg" }
    ],
    announcements: [
      { judul: "Perbaikan saluran air", kategori: "Fasilitas", ringkasan: "Pengerjaan drainase di RT 03 dimulai pukul 08.00. Warga dimohon tidak memarkir kendaraan di area pekerjaan.", tanggal: "18/06/2026", status: "Aktif" },
      { judul: "Kerja bakti lingkungan", kategori: "Kegiatan", ringkasan: "Warga berkumpul di pos RW pukul 07.00. Peralatan kebersihan disiapkan masing-masing RT.", tanggal: "22/06/2026", status: "Aktif" },
      { judul: "Batas pembayaran iuran", kategori: "Administrasi", ringkasan: "Pembayaran iuran keamanan dan kebersihan bulan Juni dapat disampaikan melalui bendahara RT masing-masing.", tanggal: "30/06/2026", status: "Aktif" },
      { judul: "Posyandu balita", kategori: "Kesehatan", ringkasan: "Pelayanan timbang balita dan konsultasi kesehatan akan berlangsung di aula RW mulai pukul 08.00.", tanggal: "06/07/2026", status: "Aktif" }
    ],
    news: [
      { judul: "Gerakan satu rumah satu tanaman mulai digalakkan", category: "Program Warga", isi: "Program penghijauan sederhana untuk membuat lingkungan RW 26 semakin teduh, sehat, dan nyaman.", tanggal: "15/06/2026", status: "Aktif" },
      { judul: "Posyandu RW 26 layani pemeriksaan rutin", category: "Kesehatan", isi: "Pelayanan kesehatan ibu dan anak berlangsung tertib dengan dukungan kader.", tanggal: "10/06/2026", status: "Aktif" },
      { judul: "Persiapan lomba antar-RT dimulai", category: "Olahraga", isi: "Koordinasi cabang olahraga dan kegiatan warga menyambut bulan kemerdekaan.", tanggal: "02/06/2026", status: "Aktif" }
    ],
    facilities: [
      { nama: "Aula Warga", deskripsi: "Kegiatan bersama", icon: "bi-building" },
      { nama: "Pos Keamanan", deskripsi: "Layanan 24 jam", icon: "bi-shield-check" },
      { nama: "Posyandu", deskripsi: "Kesehatan warga", icon: "bi-heart-pulse" },
      { nama: "Lapangan", deskripsi: "Olahraga warga", icon: "bi-dribbble" },
      { nama: "Taman Baca", deskripsi: "Literasi anak", icon: "bi-book" },
      { nama: "Taman Warga", deskripsi: "Ruang terbuka", icon: "bi-flower1" }
    ],
    organization: {
      rw: [
        { jabatan: "Ketua RW", nama: "Pengurus RW 26" },
        { jabatan: "Sekretaris", nama: "Sekretariat RW 26" },
        { jabatan: "Bendahara", nama: "Bendahara RW 26" }
      ],
      "bank-sampah": [],
      pokmas: []
    }
  };

  const icons = {
    Administrasi: "bi-receipt",
    Fasilitas: "bi-tools",
    Informasi: "bi-megaphone",
    Kegiatan: "bi-people-fill",
    Kesehatan: "bi-heart-pulse",
    Olahraga: "bi-trophy"
  };
  const iconColors = ["amber", "green", "blue", "purple"];

  const handleScroll = () => {
    navbar.classList.toggle("scrolled", window.scrollY > 24);
    backToTop.classList.toggle("show", window.scrollY > 500);

    let current = "beranda";
    sections.forEach((section) => {
      if (window.scrollY >= section.offsetTop - 150) current = section.id;
    });
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
    });
  };

  const esc = (value) => {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
  };

  const plainText = (value) => {
    const div = document.createElement("div");
    div.innerHTML = value ?? "";
    return div.textContent.trim();
  };

  const isActive = (item) => String(item.status || "Aktif").toLowerCase() === "aktif";
  const limitWords = (text, length = 150) => {
    const value = plainText(text);
    return value.length > length ? `${value.slice(0, length).trim()}...` : value;
  };

  const expandableText = (text, length, className = "summary-text") => {
    const value = plainText(text);
    if (value.length <= length) return `<p class="${className}">${esc(value)}</p>`;
    return `
      <p class="${className} expandable-text">
        <span class="summary-short">${esc(value.slice(0, length).trim())}...</span>
        <span class="summary-full">${esc(value)}</span>
      </p>
      <button class="more-link" type="button" data-more-toggle>
        <span>Tampilkan lebih banyak</span><i class="bi bi-chevron-down"></i>
      </button>
    `;
  };

  const formatDate = (value, withReadTime = false) => {
    if (!value) return "";
    const parts = String(value).match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    let date = null;
    if (parts) date = new Date(Number(parts[3]), Number(parts[2]) - 1, Number(parts[1]));
    else {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) date = parsed;
    }
    const formatted = date
      ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date).toUpperCase().replace(".", "")
      : String(value).toUpperCase();
    return withReadTime ? `${formatted} · 3 MENIT BACA` : formatted;
  };

  const imageUrl = (item, size = "w1200") => {
    if (item.fileId) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(item.fileId)}&sz=${size}`;
    return item.imageUrl || item.foto || "";
  };

  const postApi = async (action) => {
    if (!cfg.APPS_SCRIPT_URL?.startsWith("https://script.google.com/")) {
      throw new Error("APPS_SCRIPT_URL belum dikonfigurasi.");
    }
    const response = await fetch(cfg.APPS_SCRIPT_URL, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action })
    });
    const data = await response.json();
    if (!data.ok) throw new Error(data.message || "Data portal tidak dapat dimuat.");
    return data;
  };
  const getApi = async (action) => {
    if (!cfg.APPS_SCRIPT_URL?.startsWith("https://script.google.com/")) {
      throw new Error("APPS_SCRIPT_URL belum dikonfigurasi.");
    }
    
    // Tambahkan parameter action ke endpoint
    const url = `${cfg.APPS_SCRIPT_URL}?action=${encodeURIComponent(action)}`;
    
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow"
    });
    
    const data = await response.json();
    if (!data.ok) throw new Error(data.message || "Data portal tidak dapat dimuat.");
    return data;
  };
  const renderHero = (items) => {
    const active = items.filter((item) => imageUrl(item, "w2000"));
    if (!active.length) return;
    document.getElementById("heroIndicators").innerHTML = active.map((item, index) => `
      <button type="button" data-bs-target="#infoCarousel" data-bs-slide-to="${index}" class="${index === 0 ? "active" : ""}" ${index === 0 ? 'aria-current="true"' : ""} aria-label="${esc(item.judul || `Slide ${index + 1}`)}"></button>
    `).join("");
    document.getElementById("heroSlides").innerHTML = active.map((item, index) => `
      <div class="carousel-item ${index === 0 ? "active" : ""}">
        <img src="${esc(imageUrl(item, "w2000"))}" class="d-block w-100" alt="${esc(item.judul || "Informasi RW 26")}">
      </div>
    `).join("");
  };

  const renderAnnouncements = (items) => {
    const active = items.filter(isActive);
    const target = document.getElementById("announcementList");
    target.innerHTML = active.length ? active.map((item, index) => {
      const category = item.kategori || "Informasi";
      return `
        <div class="col-md-6 col-lg-4 announcement-item ${index > 2 ? "d-none extra-announcement" : ""}">
          <article class="info-card h-100 ${index === 1 ? "featured" : ""}">
            <div class="card-icon ${iconColors[index % iconColors.length]}"><i class="bi ${icons[category] || "bi-megaphone"}"></i></div>
            <span class="info-date">${esc(formatDate(item.tanggal))}</span>
            <h3>${esc(item.judul)}</h3>
            ${expandableText(item.ringkasan, 145, "announcement-summary")}
            <a href="#kontak" class="card-action">Informasi lebih lanjut <i class="bi bi-arrow-right"></i></a>
          </article>
        </div>
      `;
    }).join("") : '<div class="col-12"><p class="text-secondary mb-0">Belum ada pengumuman aktif.</p></div>';
    bindShowAllButton();
    bindMoreButtons(target);
  };

  const newsVisual = (item, mode, index = 0) => {
    const photo = imageUrl(item);
    if (photo) return `<div class="news-visual ${mode}"><img class="news-photo" src="${esc(photo)}" alt="${esc(item.judul)}"></div>`;
    const visualClasses = ["visual-community", "visual-health", "visual-sport"];
    const icon = icons[item.category] || "bi-newspaper";
    return `<div class="news-visual ${visualClasses[index % visualClasses.length]}"><i class="bi ${icon}"></i>${mode === "main" ? `<span>${esc(item.category || "Berita RW")}</span>` : ""}</div>`;
  };

  const renderNews = (items) => {
    const active = items.filter(isActive);
    const target = document.getElementById("newsList");
    if (!active.length) {
      target.innerHTML = '<div class="col-12 text-center text-secondary">Belum ada berita aktif.</div>';
      return;
    }
    const main = active[0];
    const rows = active.slice(1, 3);
    target.innerHTML = `
      <div class="col-lg-6">
        <article class="news-card news-main h-100">
          ${newsVisual(main, "main", 0)}
          <div class="news-body"><span class="info-date">${esc(formatDate(main.tanggal, true))}</span><h3>${esc(main.judul)}</h3>${expandableText(main.isi, 155, "news-summary")}<a href="#kontak" class="card-action">Baca selengkapnya <i class="bi bi-arrow-right"></i></a></div>
        </article>
      </div>
      <div class="col-lg-6">
        <div class="d-grid gap-4">
          ${rows.map((item, index) => `
            <article class="news-card news-row">
              ${newsVisual(item, "row", index + 1)}
              <div class="news-body"><span class="info-date">${esc(formatDate(item.tanggal))}</span><h3>${esc(item.judul)}</h3>${expandableText(item.isi, 110, "news-summary")}</div>
            </article>
          `).join("")}
        </div>
      </div>
    `;
    bindMoreButtons(target);
  };

  const renderFacilities = (items) => {
    const target = document.getElementById("facilityList");
    target.innerHTML = items.length ? items.slice(0, 6).map((item, index) => `
      <div class="col-6 col-md-4 col-lg-2">
        ${item.maps ? `<a class="facility-card facility-link" href="${esc(item.maps)}" target="_blank" rel="noopener">` : '<div class="facility-card">'}
          <i class="bi ${esc(item.icon || icons[item.kategori] || fallback.facilities[index]?.icon || "bi-buildings")}"></i>
          <h3>${esc(item.nama)}</h3>
          <span>${esc(limitWords(item.deskripsi, 44))}</span>
        ${item.maps ? "</a>" : "</div>"}
      </div>
    `).join("") : '<div class="col-12 text-secondary">Belum ada data fasilitas.</div>';
  };

  const renderOrganization = (organization) => {
    const groups = [
      { key: "rw", title: "Pengurus RW", icon: "bi-people-fill" },
      { key: "bank-sampah", title: "Bank Sampah", icon: "bi-recycle" },
      { key: "pokmas", title: "Pokmas", icon: "bi-diagram-3" }
    ];
    const target = document.getElementById("orgList");
    target.innerHTML = groups.map((group) => {
      const list = (organization && organization[group.key]) || [];
      return `
        <section class="org-group">
          <div class="org-group-heading">
            <span><i class="bi ${group.icon}"></i></span>
            <div><h3>${group.title}</h3><small>${list.length ? `${list.length} pengurus` : "Belum ada data"}</small></div>
          </div>
          <div class="org-members">
            ${list.length ? list.map((person) => `
              <article class="org-person">
                ${imageUrl(person, "w400") ? `<img src="${esc(imageUrl(person, "w400"))}" alt="${esc(person.nama)}">` : `<div class="org-avatar">${esc(initials(person.nama))}</div>`}
                <div>
                  <span>${esc(person.jabatan || "-")}</span>
                  <strong>${esc(person.nama || "-")}</strong>
                </div>
              </article>
            `).join("") : '<p class="org-empty">Data pengurus belum tersedia.</p>'}
          </div>
        </section>
      `;
    }).join("");
  };

  const initials = (name) => String(name || "RW").split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase();

  const bindShowAllButton = () => {
    const showAllButton = document.getElementById("showAllAnnouncements");
    if (!showAllButton) return;
    const extras = [...document.querySelectorAll(".extra-announcement")];
    showAllButton.classList.toggle("d-none", !extras.length);
    showAllButton.onclick = () => {
      const willShow = extras.some((item) => item.classList.contains("d-none"));
      extras.forEach((item) => item.classList.toggle("d-none", !willShow));
      showAllButton.innerHTML = willShow
        ? 'Tampilkan lebih sedikit <i class="bi bi-arrow-up ms-2"></i>'
        : 'Lihat semua <i class="bi bi-arrow-right ms-2"></i>';
    };
  };
  const bindMoreButtons = (container) => {
    if (!container) return;
    const buttons = container.querySelectorAll('[data-more-toggle]');
    buttons.forEach((button) => {
      button.addEventListener("click", function () {
        const textContainer = this.previousElementSibling;
        if (textContainer && textContainer.classList.contains("expandable-text")) {
          const isExpanded = textContainer.classList.toggle("expanded");
          this.innerHTML = isExpanded
            ? '<span>Tampilkan lebih sedikit</span><i class="bi bi-chevron-up"></i>'
            : '<span>Tampilkan lebih banyak</span><i class="bi bi-chevron-down"></i>';
        }
      });
    });
  };
  const renderContent = (data) => {
    renderHero(data.himbauan || fallback.himbauan);
    renderAnnouncements(data.announcements || fallback.announcements);
    renderNews(data.news || fallback.news);
    renderFacilities(data.facilities || fallback.facilities);
    renderOrganization(data.organization || fallback.organization);
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", () => {
      if (collapseElement.classList.contains("show")) {
        bootstrap.Collapse.getOrCreateInstance(collapseElement).hide();
      }
    });
  });

  backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.getElementById("year").textContent = new Date().getFullYear();
  // Tampilkan data fallback terlebih dahulu agar layar tidak kosong
  renderContent(fallback);
  
  // Tarik data asli menggunakan metode GET
  getApi(cfg.PUBLIC_ACTION || "publicContent")
    .then((data) => {
      // Timpa data fallback dengan data dari Apps Script
      renderContent(data);
    })
    .catch((error) => console.warn("Memakai data fallback:", error.message));
})();
