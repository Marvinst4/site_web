(() => {
  const key = "les-jeunes-explorateurs-theme";
  const stored = localStorage.getItem(key);
  const initialTheme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(key, theme);
    const button = document.querySelector(".theme-toggle");
    if (button) {
      const dark = theme === "dark";
      button.textContent = dark ? "☀" : "☾";
      button.setAttribute("aria-label", dark ? "Activer le mode clair" : "Activer le mode sombre");
      button.title = button.getAttribute("aria-label");
    }
  };
  applyTheme(initialTheme);
  document.addEventListener("DOMContentLoaded", () => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle";
    const header = document.querySelector(".site-header");
    if (header) {
      const anchor = header.querySelector(".mobile-menu-toggle, .button-small");
      anchor ? header.insertBefore(button, anchor) : header.append(button);
    } else {
      button.classList.add("floating");
      document.body.append(button);
    }
    button.addEventListener("click", () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
    applyTheme(document.documentElement.dataset.theme);
  });
})();
