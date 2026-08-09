(() => {
  const key = "petits-explorateurs-cookie-choice";
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet"; stylesheet.href = "cookie.css"; document.head.append(stylesheet);
  const readChoice = () => { try { const choice = JSON.parse(localStorage.getItem(key)); return choice?.expiresAt > Date.now() ? choice : null; } catch { return null; } };
  const saveChoice = (choice) => localStorage.setItem(key, JSON.stringify({ choice, expiresAt: Date.now() + 180 * 24 * 60 * 60 * 1000 }));
  const removeBanner = () => document.querySelector(".cookie-banner")?.remove();
  const showBanner = () => {
    removeBanner();
    const banner = document.createElement("section");
    banner.className = "cookie-banner";
    banner.setAttribute("role", "dialog"); banner.setAttribute("aria-label", "Préférences de confidentialité");
    banner.innerHTML = `<h2>Vos préférences</h2><p>Ce site utilise des données de fonctionnement nécessaires à son bon usage. Il n’utilise actuellement ni publicité ciblée ni outil de mesure d’audience. Vous pourrez modifier ce choix à tout moment.</p><p><a href="confidentialite.html">Consulter la politique de confidentialité</a></p><div class="cookie-actions"><button class="cookie-button" data-choice="refused">Tout refuser</button><button class="cookie-button primary" data-choice="accepted">Tout accepter</button></div>`;
    document.body.append(banner);
    banner.querySelectorAll("[data-choice]").forEach(button => button.addEventListener("click", () => { saveChoice(button.dataset.choice); removeBanner(); showSettings(); }));
  };
  const showSettings = () => {
    if (document.querySelector(".cookie-settings")) return;
    const button = document.createElement("button");
    button.className = "cookie-settings"; button.type = "button"; button.textContent = "🍪"; button.title = "Gérer mes préférences"; button.setAttribute("aria-label", "Gérer mes préférences de cookies");
    button.addEventListener("click", showBanner); document.body.append(button);
  };
  if (readChoice()) showSettings(); else showBanner();
})();
