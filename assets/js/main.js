(() => {
  "use strict";

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
  let lightboxLoadId = 0;
  let lightboxTrigger = null;
  let galleryViewIdx = null;
  let galleryViewTrigger = null;
  const galleryAlbumRequests = new Map();

  const placeholderImages = [
    "assets/images/slide-kerja-bakti.svg",
    "assets/images/slide-posyandu.svg",
    "assets/images/slide-pelayanan.svg"
  ];

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
    if (!value) return new Date(0); // Return invalid date for empty values
    
    if (typeof value === "string") {
      // Format 1: DD/MM/YYYY atau DD-MM-YYYY
      let m = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (m) {
        const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
        if (!Number.isNaN(d.getTime())) return d;
      }
      
      // Format 2: YYYY-MM-DD (format ISO)
      m = value.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
      if (m) {
        const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
        if (!Number.isNaN(d.getTime())) return d;
      }
      
      // Format 3: DD/MM/YY (2 digit tahun)
      m = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
      if (m) {
        const year = Number(m[3]) + (Number(m[3]) < 50 ? 2000 : 1900);
        const d = new Date(year, Number(m[2]) - 1, Number(m[1]));
        if (!Number.isNaN(d.getTime())) return d;
      }
      
      // Coba parsing langsung
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) return d;
    }
    
    // Fallback: date object atau invalid
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? new Date(0) : d;
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
    const carousel = document.getElementById("infoCarousel");
    const heroPanel = carousel?.closest(".hero-panel");
    if (carousel) carousel.style.display = "none";
    heroPanel?.querySelector(".hero-empty")?.remove();
    if (heroPanel) {
      heroPanel.insertAdjacentHTML("beforeend", `
        <div class="hero-empty hero-loading" role="status">
          <span class="spinner-border" aria-hidden="true"></span>
          <p>Memuat informasi terbaru...</p>
        </div>`);
    }
    ["facilityList", "statsContainer"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = loadingMarkup(id === "statsContainer" ? "Memuat statistik..." : "Memuat fasilitas...");
    });
    const statistics = document.querySelector(".statistics");
    if (statistics) statistics.style.display = "";
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
    const videoWrap = document.getElementById("heroVideoWrap");
    if (videoWrap) videoWrap.style.display = "none";
    const videoContainer = document.getElementById("videoContainer");
    if (videoContainer) videoContainer.innerHTML = loadingMarkup("Memuat video...");
  };

  const renderHero = (items = []) => {
    const slides = document.getElementById("heroSlides");
    const indicators = document.getElementById("heroIndicators");
    const carousel = document.getElementById("infoCarousel");
    if (!slides || !indicators || !carousel) return;

    const panel = carousel.closest(".hero-panel");
    const activeItems = (items || []).filter(Boolean);
    heroData = activeItems;

    if (panel) {
      panel.querySelector(".hero-empty")?.remove();
    }

    if (!activeItems.length) {
      slides.innerHTML = "";
      indicators.innerHTML = "";
      carousel.style.display = "none";
      if (panel) {
        panel.insertAdjacentHTML("beforeend", `
          <div class="hero-empty">
            <i class="bi bi-megaphone"></i>
            <p>Belum ada pengumuman dari pengurus RW.</p>
          </div>`);
      }
      return;
    }

    carousel.style.display = "";
    slides.innerHTML = activeItems.map((item, idx) => `
      <div class="carousel-item ${idx === 0 ? "active" : ""}">
        <article class="hero-slide">
          <img src="${esc(imageUrl(item, "w2000") || placeholderImages[idx % placeholderImages.length])}" alt="${esc(item.judul || "Informasi RW 026")}">
        </article>
      </div>`).join("");

    indicators.innerHTML = activeItems.map((_, idx) => `
      <button type="button" data-bs-target="#infoCarousel" data-bs-slide-to="${idx}" class="${idx === 0 ? "active" : ""}" aria-label="Slide ${idx + 1}"></button>`).join("");
  };

  const renderAnnouncements = (items = []) => {
    const sidebar = document.getElementById("announcementSidebar");
    const mainContent = document.getElementById("announcementMainContent");
    if (!sidebar || !mainContent) return;

    const active = (items || []).filter(isActive);
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

    const getDate = (item) => {
      const raw = item.tanggal || item.tgl || item.date || item.tanggal_terbit || "";
      if (!raw) return 0;
      const d = parseDate(raw);
      return Number.isNaN(d.getTime()) ? 0 : d.getTime();
    };

    const active = (items || [])/*.filter(isActive)*/;

    if (!active.length) {
      mainContent.innerHTML = emptyMarkup("Belum ada berita aktif.");
      sidebar.innerHTML = "";
      return;
    }

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
      const img = imageUrl(item, "w1200") || placeholderImages[idx % placeholderImages.length];
      const bodyText = getText(item, ["isi", "konten", "ringkasan", "deskripsi"]);
      mainContent.innerHTML = `
        <article class="news-main-article">
          <div class="news-main-meta">
            <span class="news-main-category" style="background:${accentColors[idx % accentColors.length]}">${esc(item.kategori || item.category || "Berita")}</span>
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

    const list = items || [];
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

  const renderOrganization = (org = {}) => {
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

    const active = items || [];
    galleryData = active;
    if (!active.length) {
      target.innerHTML = emptyMarkup("Belum ada foto kegiatan.");
      return;
    }

    target.innerHTML = active.map((album, albumIdx) => {
      const total = Number(album.photoCount ?? album.photos?.length ?? 0);
      const thumbnail = album.thumbnailId ? { fileId: album.thumbnailId } : album.photos?.[0];
      if (!thumbnail || !total) return "";
      return `
        <article class="album-card" data-album-index="${albumIdx}" tabindex="0" role="button" aria-label="Buka album ${esc(album.nama || "galeri")}">
          <div class="album-card-cover">
            <div class="album-card-grid album-card-grid--1">
              <div class="album-card-grid-cell"><img src="${esc(imageUrl(thumbnail, "w400"))}" alt="" loading="lazy"></div>
            </div>
            <div class="album-card-count-overlay"><span>${total} foto</span></div>
          </div>
          <div class="album-card-body">
            <h3>${esc(album.nama || "Album")}</h3>
            ${album.deskripsi ? `<p>${esc(album.deskripsi)}</p>` : ""}
          </div>
        </article>`;
    }).join("") || emptyMarkup("Belum ada foto kegiatan.");
  };

  const showGalleryAlbumView = () => {
    galleryViewIdx = null;
    document.getElementById("galleryAlbumView")?.classList.remove("d-none");
    document.getElementById("galleryPhotoView")?.classList.add("d-none");
    galleryViewTrigger?.focus?.();
    galleryViewTrigger = null;
  };

  const showGalleryGridView = (albumIdx) => {
    const album = galleryData[albumIdx];
    if (!album || !Array.isArray(album.photos) || !album.photos.length) return;
    galleryViewIdx = albumIdx;
    document.getElementById("galleryAlbumView")?.classList.add("d-none");
    const view = document.getElementById("galleryPhotoView");
    view?.classList.remove("d-none");
    document.getElementById("photoAlbumTitle").textContent = album.nama || "Album";
    document.getElementById("breadcrumbAlbumName").textContent = album.nama || "Album";
    const grid = document.getElementById("photoGrid");
    grid.innerHTML = album.photos.map((photo, idx) => `
      <button type="button" data-photo-index="${idx}" aria-label="Lihat ${esc(photo.name || "foto " + (idx + 1))}">
        <img src="${esc(imageUrl(photo, "w400"))}" alt="${esc(photo.name || "Foto kegiatan")}" loading="lazy">
      </button>`).join("");
    view?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const videoData = [];
  let currentVideoIndex = -1;

  const youtubeVideoId = (url) => {
    if (!url) return "";
    const m = String(url).match(/(?:youtube\.com\/(?:watch\?.*?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : "";
  };

  const renderVideoCard = (video, idx) => {
    const id = youtubeVideoId(video.url);
    if (!id) return "";
    return `
      <article class="video-card" data-video-index="${idx}" tabindex="0" role="button" aria-label="Putar video ${esc(video.judul || "Sambutan")}">
        <div class="video-card-cover">
          <img src="https://img.youtube.com/vi/${id}/hqdefault.jpg" alt="${esc(video.judul || "Sambutan")}" loading="lazy">
          <span class="video-card-play"><i class="bi bi-play-fill"></i></span>
        </div>
        <div class="video-card-body">
          <h3>${esc(video.judul || "Video Sambutan")}</h3>
          ${video.deskripsi ? `<p>${esc(video.deskripsi)}</p>` : ""}
        </div>
      </article>`;
  };

  const renderVideos = (items = []) => {
    const container = document.getElementById("videoContainer");
    if (!container) return;
    videoData.length = 0;
    (items || []).forEach((v) => { if (youtubeVideoId(v.url)) videoData.push(v); });
    const wrap = document.getElementById("heroVideoWrap");
    const autoWrap = document.getElementById("heroVideoAutoplay");
    const autoFrame = document.getElementById("heroAutoplayFrame");
    if (!videoData.length) {
      if (wrap) wrap.style.display = "none";
      if (autoWrap) autoWrap.style.display = "none";
      if (autoFrame) autoFrame.src = "";
      container.innerHTML = "";
      return;
    }
    if (wrap) wrap.style.display = "block";
    container.innerHTML = videoData.map(renderVideoCard).join("");
    const nav = document.getElementById("heroVideoNav");
    if (nav) nav.style.display = videoData.length > 1 ? "flex" : "none";
    if (autoWrap && autoFrame) {
      const autoItem = videoData.find((v) => v.autoplay) || null;
      if (autoItem) {
        const id = youtubeVideoId(autoItem.url);
        if (id) { autoWrap.style.display = "block"; autoFrame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&playsinline=1&rel=0&loop=1&playlist=${id}`; }
        else { autoWrap.style.display = "none"; autoFrame.src = ""; }
      } else { autoWrap.style.display = "none"; autoFrame.src = ""; }
    }
  };

  const playInlineVideo = (idx) => {
    const video = videoData[idx];
    const id = video && youtubeVideoId(video.url);
    if (!video || !id) return;
    currentVideoIndex = idx;
    const autoWrap = document.getElementById("heroVideoAutoplay");
    const autoFrame = document.getElementById("heroAutoplayFrame");
    if (!autoWrap || !autoFrame) return;
    autoWrap.style.display = "block";
    autoFrame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=0&playsinline=1&rel=0`;
    document.querySelectorAll(".video-card").forEach((c, i) => c.classList.toggle("is-active", i === idx));
    autoWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const scrollVideoTrack = (dir) => {
    const track = document.getElementById("videoContainer");
    if (!track) return;
    const card = track.querySelector(".video-card");
    const amount = (card ? card.offsetWidth + 24 : 340) * dir;
    track.scrollBy({ left: amount, behavior: "smooth" });
  };

  const videoScrollStep = () => {
    const track = document.getElementById("videoContainer");
    if (!track) return;
    document.getElementById("videoPrev")?.addEventListener("click", () => scrollVideoTrack(-1));
    document.getElementById("videoNext")?.addEventListener("click", () => scrollVideoTrack(1));
    track.addEventListener("click", (event) => {
      const card = event.target.closest("[data-video-index]");
      if (card) playInlineVideo(Number(card.dataset.videoIndex));
    });
    track.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = event.target.closest("[data-video-index]");
      if (card) {
        event.preventDefault();
        playInlineVideo(Number(card.dataset.videoIndex));
      }
    });
  };

  const setLightboxLoading = (isLoading, label = "Memuat foto...") => {
    const overlay = document.getElementById("lightboxOverlay");
    const wrap = overlay?.querySelector(".lightbox-image-wrap");
    if (!overlay || !wrap) return;
    overlay.classList.toggle("is-loading", isLoading);
    wrap.setAttribute("aria-busy", String(isLoading));
    overlay.querySelector(".lightbox-loading-text").textContent = label;
  };

  const showLightbox = () => {
    const overlay = document.getElementById("lightboxOverlay");
    if (!overlay) return;
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => overlay.classList.add("is-open"));
    overlay.querySelector(".lightbox-close")?.focus();
  };

  const openGalleryAlbumGrid = (albumIdx, trigger) => {
    const album = galleryData[albumIdx];
    if (!album) return;
    galleryViewTrigger = trigger || document.activeElement;
    const target = document.getElementById("galleryAlbumView");
    const grid = document.getElementById("photoGrid");
    if (target && grid) {
      grid.innerHTML = '<div class="col-12"><div class="loading-state"><span class="spinner-border spinner-border-sm me-2"></span>Memuat foto album...</div></div>';
      document.getElementById("galleryPhotoView")?.classList.remove("d-none");
      target.classList.add("d-none");
      document.getElementById("photoAlbumTitle").textContent = album.nama || "Album";
      document.getElementById("breadcrumbAlbumName").textContent = album.nama || "Album";
    }
  };

  const loadGalleryAlbum = (albumIdx, trigger) => {
    const album = galleryData[albumIdx];
    if (!album) return;
    if (Array.isArray(album.photos)) {
      showGalleryGridView(albumIdx);
      return;
    }

    openGalleryAlbumGrid(albumIdx, trigger);
    if (galleryAlbumRequests.has(albumIdx)) return;

    const card = document.querySelector(`.album-card[data-album-index="${albumIdx}"]`);
    card?.setAttribute("aria-busy", "true");
    const action = encodeURIComponent("publicGalleryPhotos");
    const request = fetchWithTimeout(`${cfg.APPS_SCRIPT_URL}?action=${action}&albumId=${encodeURIComponent(album.id)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat album.");
        return res.json();
      })
      .then((data) => {
        if (!data?.ok || !Array.isArray(data.photos) || !data.photos.length) throw new Error("Foto album tidak tersedia.");
        album.photos = data.photos;
        if (galleryViewIdx === albumIdx || document.getElementById("galleryPhotoView")?.classList.contains("d-none") === false) showGalleryGridView(albumIdx);
        else if (galleryViewIdx === null) showGalleryGridView(albumIdx);
      })
      .catch(() => {
        const grid = document.getElementById("photoGrid");
        if (grid) grid.innerHTML = '<div class="col-12"><div class="empty-state">Foto album belum dapat dimuat.</div></div>';
      })
      .finally(() => {
        galleryAlbumRequests.delete(albumIdx);
        card?.removeAttribute("aria-busy");
      });
    galleryAlbumRequests.set(albumIdx, request);
  };

  const openLightbox = (source, albumIdx, photoIdx, trigger) => {
    const overlay = document.getElementById("lightboxOverlay");
    const img = overlay?.querySelector(".lightbox-image");
    lightboxSource = source;
    const album = lightboxSource[albumIdx];
    if (!overlay || !img || !album || !album.photos[photoIdx]) return;

    currentAlbum = albumIdx;
    currentPhoto = photoIdx;
    lightboxTrigger = trigger || lightboxTrigger || document.activeElement;
    const photo = album.photos[photoIdx];
    const src = imageUrl(photo, "w800");
    const loadId = ++lightboxLoadId;

    overlay.querySelector(".lightbox-counter").textContent = `${photoIdx + 1}/${album.photos.length}`;
    overlay.querySelector(".lightbox-name").textContent = album.nama || "";
    updateNavButtons();
    setLightboxLoading(true);
    showLightbox();

    const preload = new Image();
    preload.onload = async () => {
      try { await preload.decode?.(); } catch {}
      if (loadId !== lightboxLoadId) return;
      img.src = src;
      img.alt = photo.name || "Foto kegiatan";
      setLightboxLoading(false);
    };
    preload.onerror = () => {
      if (loadId === lightboxLoadId) setLightboxLoading(true, "Foto belum dapat dimuat.");
    };
    preload.src = src;
  };

  const closeLightbox = () => {
    const overlay = document.getElementById("lightboxOverlay");
    if (!overlay) return;
    ++lightboxLoadId;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lightboxTrigger?.focus?.();
    lightboxTrigger = null;
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
    const prev = document.querySelector(".lightbox-prev");
    const next = document.querySelector(".lightbox-next");
    if (!prev || !next) return;
    if (!Array.isArray(album?.photos)) {
      prev.classList.add("is-hidden");
      next.classList.add("is-hidden");
      return;
    }
    prev.classList.toggle("is-hidden", currentPhoto === 0);
    next.classList.toggle("is-hidden", currentPhoto === album.photos.length - 1);
  };

  const renderStatistics = (items = []) => {
    const section = document.querySelector(".statistics");
    const container = document.getElementById("statsContainer");
    if (!container) return;
    const list = items || [];
    if (!list.length) {
      container.innerHTML = "";
      if (section) section.style.display = "none";
      return;
    }
    if (section) section.style.display = "";

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

    container.innerHTML = list.map((item) => `
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
    renderStatistics(data.statistik);
  };

  const renderKasReport = (bulan, tahun, force = false) => {
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
    const cacheKey = `rw26.kas.${b}.${t}.${CACHE_VERSION}`;
    if (force) cacheRemove(cacheKey);

    const cached = cacheRead(cacheKey);
    if (cached) {
      renderKasData(cached.data);
      if (cacheIsFresh(cached, CACHE_TTL_KAS)) return;
      fetchKasReport(cacheKey, b, t, true);
      return;
    }

    fetchKasReport(cacheKey, b, t, false);
  };

  const initKasArus = () => {
    const namaBulan = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    [["kasArusBulanAwal", start.getMonth()], ["kasArusBulanAkhir", now.getMonth()]].forEach(([id, selected]) => {
      const el = document.getElementById(id);
      if (!el || el.options.length) return;
      namaBulan.forEach((nama, value) => el.add(new Option(nama, value, false, value === selected)));
    });
    [["kasArusTahunAwal", start.getFullYear()], ["kasArusTahunAkhir", now.getFullYear()]].forEach(([id, selected]) => {
      const el = document.getElementById(id);
      if (!el || el.options.length) return;
      for (let year = now.getFullYear() - 2; year <= now.getFullYear() + 1; year++) el.add(new Option(year, year, false, year === selected));
    });
  };

  const monthRange = (startMonth, startYear, endMonth, endYear) => {
    const months = [];
    for (let year = startYear, month = startMonth; year < endYear || (year === endYear && month <= endMonth); month++) {
      months.push({ bulan: month, tahun: year });
      if (month === 11) { month = -1; year++; }
    }
    return months;
  };

  const renderKasArus = (items) => {
    const fmt = (n) => "Rp " + Number(n).toLocaleString("id-ID");
    const totalMasuk = items.reduce((sum, item) => sum + item.masuk, 0);
    const totalKeluar = items.reduce((sum, item) => sum + item.keluar, 0);
    const saldoAkhir = items.at(-1)?.saldoAkhir || 0;
    document.getElementById("kasArusTotalMasuk").textContent = fmt(totalMasuk);
    document.getElementById("kasArusTotalKeluar").textContent = fmt(totalKeluar);
    document.getElementById("kasArusSaldoAkhir").textContent = fmt(saldoAkhir);
    const max = Math.max(...items.flatMap((item) => [item.masuk, item.keluar, Math.abs(item.saldoAkhir)]), 1);
    document.getElementById("kasArusChart").innerHTML = items.map((item) => `<div class="kas-arus-item"><div class="kas-arus-bars"><span class="kas-arus-bar kas-arus-bar-saldo" style="height:${Math.max(4, Math.abs(item.saldoAkhir) / max * 100)}%" title="Saldo: ${fmt(item.saldoAkhir)}"></span><span class="kas-arus-bar kas-arus-bar-masuk" style="height:${Math.max(4, item.masuk / max * 100)}%" title="Masuk: ${fmt(item.masuk)}"></span><span class="kas-arus-bar kas-arus-bar-keluar" style="height:${Math.max(4, item.keluar / max * 100)}%" title="Keluar: ${fmt(item.keluar)}"></span></div><small>${esc(item.label)}</small></div>`).join("");
    document.getElementById("kasArusLegend").innerHTML = '<span><i class="kas-arus-bar-saldo"></i>Saldo</span><span><i class="kas-arus-bar-masuk"></i>Pemasukan</span><span><i class="kas-arus-bar-keluar"></i>Pengeluaran</span>';
  };

  const renderKasArusReport = () => {
    const startMonth = Number(document.getElementById("kasArusBulanAwal").value);
    const startYear = Number(document.getElementById("kasArusTahunAwal").value);
    const endMonth = Number(document.getElementById("kasArusBulanAkhir").value);
    const endYear = Number(document.getElementById("kasArusTahunAkhir").value);
    const loading = document.getElementById("kasArusLoadingState");
    const box = document.getElementById("kasArusBox");
    const empty = document.getElementById("kasArusEmptyState");
    const btn = document.getElementById("kasArusBtnCari");
    if (startYear > endYear || (startYear === endYear && startMonth > endMonth)) { empty.style.display = "flex"; return; }
    if (!cfg.APPS_SCRIPT_URL) { empty.style.display = "flex"; return; }
    const months = monthRange(startMonth, startYear, endMonth, endYear);
    const namaBulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    loading.style.display = "flex"; box.style.display = "none"; empty.style.display = "none"; btn.disabled = true;
    Promise.all(months.map(({ bulan, tahun }) => fetchWithTimeout(`${cfg.APPS_SCRIPT_URL}?action=publicKasReport&bulan=${bulan}&tahun=${tahun}`).then((res) => res.ok ? res.json() : Promise.reject())))
      .then((reports) => {
        let saldo = 0;
        const items = reports.map((report, index) => {
          const data = report.ok ? report : {};
          saldo = Number(data.saldoAkhir ?? saldo);
          return { label: `${namaBulan[months[index].bulan]} ${months[index].tahun}`, masuk: Number(data.totalMasuk) || 0, keluar: Number(data.totalKeluar) || 0, saldoAkhir: saldo };
        });
        if (!items.some((item) => item.masuk || item.keluar || item.saldoAkhir)) { empty.style.display = "flex"; return; }
        renderKasArus(items); box.style.display = "block";
      })
      .catch(() => { empty.style.display = "flex"; })
      .finally(() => { loading.style.display = "none"; btn.disabled = false; });
  };

  const renderKasData = (data) => {
    const reportBox = document.getElementById("kasReportBox");
    const emptyState = document.getElementById("kasEmptyState");
    const updatedAtEl = document.getElementById("kasUpdatedAt");
    if (emptyState) emptyState.style.display = "none";
    if (reportBox) reportBox.style.display = "block";

    const updatedTimeEl = document.getElementById("kasUpdatedTime");
    if (updatedAtEl && updatedTimeEl) {
      const d = data.updatedAt ? new Date(data.updatedAt) : new Date();
      updatedTimeEl.textContent = d.toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
      updatedAtEl.style.display = "flex";
    }

    const fmt = (n) => "Rp " + Number(n).toLocaleString("id-ID");
    const sa = document.getElementById("kasSaldoAwal");
    const tm = document.getElementById("kasTotalMasuk");
    const tk = document.getElementById("kasTotalKeluar");
    const sk = document.getElementById("kasSaldoAkhir");
    if (sa) sa.textContent = fmt(data.saldoAwal);
    if (tm) tm.textContent = fmt(data.totalMasuk);
    if (tk) tk.textContent = fmt(data.totalKeluar);
    if (sk) sk.textContent = fmt(data.saldoAkhir);

    const masuk = data.rincianMasuk || [];
    const keluar = data.rincianKeluar || [];
    const bm = document.getElementById("kasBodyMasuk");
    const bk = document.getElementById("kasBodyKeluar");
    if (bm) {
      bm.innerHTML = masuk.length
        ? masuk.map((r) => `<tr><td>${esc(r.tanggal)}</td><td>${esc(r.uraian)}</td><td class="text-end fw-bold text-success">${fmt(r.nominal)}</td></tr>`).join("")
        : '<tr class="kas-empty-row"><td colspan="3">Tidak ada pemasukan</td></tr>';
    }
    if (bk) {
      bk.innerHTML = keluar.length
        ? keluar.map((r) => `<tr><td>${esc(r.tanggal)}</td><td>${esc(r.uraian)}</td><td class="text-end fw-bold text-danger">${fmt(r.nominal)}</td></tr>`).join("")
        : '<tr class="kas-empty-row"><td colspan="3">Tidak ada pengeluaran</td></tr>';
    }
  };

  const fetchKasReport = (cacheKey, bulan, tahun, background) => {
    const loading = document.getElementById("kasLoadingState");
    const reportBox = document.getElementById("kasReportBox");
    const emptyState = document.getElementById("kasEmptyState");
    const btn = document.getElementById("kasBtnCari");

    if (!background) {
      if (reportBox) reportBox.style.display = "none";
      if (emptyState) emptyState.style.display = "none";
      const updatedAtEl = document.getElementById("kasUpdatedAt");
      if (updatedAtEl) updatedAtEl.style.display = "none";
      if (loading) loading.style.display = "flex";
      if (btn) { btn.disabled = true; btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Memuat'; }
    }

    if (!cfg.APPS_SCRIPT_URL) {
      if (loading) loading.style.display = "none";
      if (emptyState) emptyState.style.display = "flex";
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-search"></i> Cari'; }
      return;
    }

    fetchWithTimeout(`${cfg.APPS_SCRIPT_URL}?action=publicKasReport&bulan=${encodeURIComponent(bulan)}&tahun=${encodeURIComponent(tahun)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat laporan.");
        return res.json();
      })
      .then((data) => {
        if (!background) {
          if (loading) loading.style.display = "none";
          if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-search"></i> Cari'; }
        }
        const masuk = data.rincianMasuk || [];
        const keluar = data.rincianKeluar || [];
        if (!data.ok || (!masuk.length && !keluar.length && data.saldoAwal === 0)) {
          if (!background && emptyState) emptyState.style.display = "flex";
          return;
        }
        renderKasData(data);
        cacheWrite(cacheKey, data);
      })
      .catch(() => {
        if (!background) {
          if (loading) loading.style.display = "none";
          if (emptyState) emptyState.style.display = "flex";
          if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-search"></i> Cari'; }
        }
      });
  };

  const renderContent = (data = {}) => {
    const tasks = [
      () => renderHero(data.himbauan),
      () => renderAnnouncements(data.announcements),
      () => renderNews(data.news),
      () => renderFacilities(data.facilities),
      () => renderOrganization(data.organization),
      () => renderGallery(data.gallery),
      () => renderVideos(data.videos),
      () => updateStats(data)
    ];
    tasks.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
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
    if (kasBtn) kasBtn.addEventListener("click", () => renderKasReport(undefined, undefined, true));
    const kasArusBtn = document.getElementById("kasArusBtnCari");
    if (kasArusBtn) kasArusBtn.addEventListener("click", renderKasArusReport);
    [["kasLaporanTab", "kasLaporanPanel"], ["kasArusTab", "kasArusPanel"]].forEach(([tabId, panelId]) => {
      document.getElementById(tabId)?.addEventListener("click", () => {
        [["kasLaporanTab", "kasLaporanPanel"], ["kasArusTab", "kasArusPanel"]].forEach(([id, panel]) => {
          const active = id === tabId;
          document.getElementById(id).classList.toggle("is-active", active);
          document.getElementById(id).setAttribute("aria-selected", active);
          document.getElementById(panel).hidden = !active;
        });
        if (panelId === "kasArusPanel") renderKasArusReport();
      });
    });

    const galleryContainer = document.getElementById("galleryContainer");
    if (galleryContainer) {
      const openAlbumFromCard = (card) => {
        if (card) loadGalleryAlbum(parseInt(card.dataset.albumIndex, 10), card);
      };
      galleryContainer.addEventListener("click", (e) => openAlbumFromCard(e.target.closest(".album-card")));
      galleryContainer.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openAlbumFromCard(e.target.closest(".album-card"));
        }
      });
    }

    const photoGridEl = document.getElementById("photoGrid");
    if (photoGridEl) {
      photoGridEl.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-photo-index]");
        if (!btn || galleryViewIdx === null) return;
        const idx = parseInt(btn.dataset.photoIndex, 10);
        openLightbox(galleryData, galleryViewIdx, idx, btn);
      });
      photoGridEl.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const btn = e.target.closest("[data-photo-index]");
        if (!btn || galleryViewIdx === null) return;
        e.preventDefault();
        openLightbox(galleryData, galleryViewIdx, parseInt(btn.dataset.photoIndex, 10), btn);
      });
    }
    document.getElementById("backToAlbums")?.addEventListener("click", showGalleryAlbumView);
    document.getElementById("breadcrumbAlbums")?.addEventListener("click", (e) => { e.preventDefault(); showGalleryAlbumView(); });

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

    videoScrollStep();
  };

  const fetchWithTimeout = (url, ms = 15000) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
  };

  const CACHE_VERSION = "v1";
  const CACHE_TTL_CONTENT = 15 * 60 * 1000;
  const CACHE_TTL_KAS = 30 * 60 * 1000;

  const cacheRead = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (!entry || typeof entry.savedAt !== "number" || !entry.data) return null;
      return entry;
    } catch {
      return null;
    }
  };

  const cacheWrite = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data }));
    } catch {
      // kuota penuh / mode pribadi: simpanan diabaikan
    }
  };

  const cacheRemove = (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // abaikan
    }
  };

  const cacheIsFresh = (entry, ttl) => Boolean(entry) && Date.now() - entry.savedAt <= ttl;

  const removeErrorBanner = () => {
    document.getElementById("errorBanner")?.remove();
  };

  const renderErrorState = (message = "Gagal memuat data.", { retry = false } = {}) => {
    removeErrorBanner();
    const main = document.getElementById("mainContent");
    if (!main) return;
    const banner = document.createElement("div");
    banner.id = "errorBanner";
    banner.className = "error-banner";
    banner.setAttribute("role", "alert");
    banner.innerHTML = `
      <i class="bi bi-wifi-off"></i>
      <div class="error-banner-text">
        <strong>Data belum dapat dimuat</strong>
        <p>${esc(message)}</p>
      </div>
      ${retry ? '<button type="button" class="btn btn-outline-danger btn-sm" id="errorRetryBtn"><i class="bi bi-arrow-clockwise"></i> Coba Lagi</button>' : ""}`;
    main.prepend(banner);
    if (retry) {
      banner.querySelector("#errorRetryBtn")?.addEventListener("click", () => loadPublicContent(true));
    }
  };

  const loadPublicContent = (force = false) => {
    removeErrorBanner();

    if (!cfg.APPS_SCRIPT_URL) {
      renderErrorState("Konfigurasi data tidak tersedia. Hubungi pengurus RW.", { retry: true });
      return;
    }

    const cacheKey = `rw26.content.${CACHE_VERSION}`;
    if (force) {
      cacheRemove(cacheKey);
      clearContainers();
    }

    const cached = cacheRead(cacheKey);
    if (cached) {
      renderContent(cached.data);
      if (cacheIsFresh(cached, CACHE_TTL_CONTENT)) return;
      fetchPublicContent(cacheKey, true);
      return;
    }

    fetchPublicContent(cacheKey, false);
  };

  const fetchPublicContent = (cacheKey, background, attempt = 1) => {
    const action = encodeURIComponent(cfg.PUBLIC_ACTION || "publicContent");
    const maxRetry = 3;
    fetchWithTimeout(`${cfg.APPS_SCRIPT_URL}?action=${action}`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat data publik.");
        return res.json();
      })
      .then((data) => {
        if (data?.ok) {
          removeErrorBanner();
          renderContent(data);
          cacheWrite(cacheKey, data);
        } else {
          throw new Error(data?.error || "Data tidak valid.");
        }
      })
      .catch((err) => {
        if (background) {
          console.error(err);
          return;
        }
        if (attempt < maxRetry) {
          const delay = attempt === 1 ? 3000 : 6000;
          setTimeout(() => fetchPublicContent(cacheKey, false, attempt + 1), delay);
        } else {
          cacheRemove(cacheKey);
          renderErrorState(err?.message || "Gagal memuat data. Periksa koneksi atau coba lagi.", { retry: true });
        }
      });
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

  const logPublicVisitor = () => {
    try {
      if (!cfg.APPS_SCRIPT_URL) return;
      const now = Date.now();
      const last = parseInt(localStorage.getItem("rw26_vlog_ts") || "0", 10);
      if (last && now - last < 15 * 60 * 1000) return;
      let sid = "";
      try { sid = sessionStorage.getItem("rw26_vid") || ""; } catch {}
      if (!sid) { sid = Math.random().toString(36).slice(2) + now.toString(36); try { sessionStorage.setItem("rw26_vid", sid); } catch {} }
      localStorage.setItem("rw26_vlog_ts", String(now));
      const payload = JSON.stringify({
        action: "logVisitor",
        page: location.pathname + location.hash || "/",
        referrer: document.referrer || "",
        ua: navigator.userAgent.slice(0, 400),
        bahasa: navigator.language || "",
        screen: (screen.width + "x" + screen.height),
        sessionId: sid
      });
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "text/plain;charset=utf-8" });
        navigator.sendBeacon(cfg.APPS_SCRIPT_URL, blob);
      } else {
        fetch(cfg.APPS_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: payload, keepalive: true }).catch(() => {});
      }
    } catch {}
  };

  const dismissPreloader = () => {
    const preloader = document.getElementById("preloader");
    if (!preloader || preloader.classList.contains("hide")) return;
    preloader.classList.add("hide");
    setTimeout(() => preloader.remove(), 450);
  };

  document.addEventListener("DOMContentLoaded", () => {
    if (year) year.textContent = new Date().getFullYear();
    clearContainers();
    initInteractions();
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    initDarkMode();
    initScrollReveal();
    dismissPreloader();
    loadPublicContent();
    renderKasReport();
    initKasArus();
    setTimeout(logPublicVisitor, 1200);
  });
})();
