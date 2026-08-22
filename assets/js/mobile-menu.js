document.querySelectorAll(".mobile-menu-toggle").forEach((button) => {
  const header = button.closest(".site-header");
  const close = () => { header.classList.remove("mobile-menu-open"); button.setAttribute("aria-expanded", "false"); };
  button.addEventListener("click", () => {
    const opening = !header.classList.contains("mobile-menu-open");
    header.classList.toggle("mobile-menu-open", opening);
    button.setAttribute("aria-expanded", String(opening));
  });
  header.querySelectorAll("nav a").forEach((link) => link.addEventListener("click", close));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
});
