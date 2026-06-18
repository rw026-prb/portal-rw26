(() => {
  "use strict";

  const navbar = document.getElementById("mainNav");
  const backToTop = document.getElementById("backToTop");
  const navLinks = [...document.querySelectorAll(".nav-link")];
  const sections = [...document.querySelectorAll("main section[id]")];
  const collapseElement = document.getElementById("navbarMenu");

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

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", () => {
      if (collapseElement.classList.contains("show")) {
        bootstrap.Collapse.getOrCreateInstance(collapseElement).hide();
      }
    });
  });

  const showAllButton = document.getElementById("showAllAnnouncements");
  showAllButton.addEventListener("click", () => {
    const extras = document.querySelectorAll(".extra-announcement");
    const willShow = [...extras].some((item) => item.classList.contains("d-none"));
    extras.forEach((item) => item.classList.toggle("d-none", !willShow));
    showAllButton.innerHTML = willShow
      ? 'Tampilkan lebih sedikit <i class="bi bi-arrow-up ms-2"></i>'
      : 'Lihat semua <i class="bi bi-arrow-right ms-2"></i>';
  });

  backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.getElementById("year").textContent = new Date().getFullYear();
})();
