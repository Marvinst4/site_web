(() => {
  const key = "les-jeunes-explorateurs-cookie-choice-v2";
  const measurementId = "G-3PW7ZYKBPF";
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = document.currentScript?.src
    ? new URL("../css/cookie.css", document.currentScript.src).href
    : "assets/css/cookie.css";
  document.head.append(stylesheet);

  const readChoice = () => { try { const choice = JSON.parse(localStorage.getItem(key)); return choice?.expiresAt > Date.now() ? choice : null; } catch { return null; } };
  const saveChoice = (choice) => localStorage.setItem(key, JSON.stringify({ choice, expiresAt: Date.now() + 180 * 24 * 60 * 60 * 1000 }));
  const removeBanner = () => document.querySelector(".cookie-banner")?.remove();

  const loadAnalytics = () => {
    if (window.__lesJeunesExplorateursAnalyticsLoaded) return;
    window.__lesJeunesExplorateursAnalyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.append(script);
  };

  const disableAnalytics = () => {
    window[`ga-disable-${measurementId}`] = true;
  };

  const showBanner = () => {
    removeBanner();
    const banner = document.createElement("section");
    banner.className = "cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-modal", "true");
    banner.setAttribute("aria-label", "Préférences de confidentialité");
    banner.innerHTML = `<h2>Vos préférences de confidentialité</h2><p>Nous utilisons des cookies nécessaires au fonctionnement du site. Avec votre accord, Google Analytics nous aide à comprendre la fréquentation du site et à améliorer son contenu. Vous pouvez accepter ou refuser cette mesure d’audience. Votre choix sera conservé pendant 6 mois.</p><p><a href="confidentialite.html">En savoir plus dans la politique de confidentialité</a></p><div class="cookie-actions"><button class="cookie-button" type="button" data-choice="refused">Tout refuser</button><button class="cookie-button primary" type="button" data-choice="accepted">Tout accepter</button></div>`;
    document.body.append(banner);
    banner.querySelectorAll("[data-choice]").forEach(button => button.addEventListener("click", () => {
      const choice = button.dataset.choice;
      saveChoice(choice);
      if (choice === "accepted") loadAnalytics();
      else disableAnalytics();
      removeBanner();
      showSettings();
    }));
  };

  const showSettings = () => {
    if (document.querySelector(".cookie-settings")) return;
    const button = document.createElement("button");
    button.className = "cookie-settings"; button.type = "button"; button.textContent = "🍪"; button.title = "Gérer mes préférences"; button.setAttribute("aria-label", "Gérer mes préférences de cookies");
    button.addEventListener("click", showBanner); document.body.append(button);
  };

  const choice = readChoice();
  if (choice?.choice === "accepted") loadAnalytics();
  if (choice) showSettings(); else showBanner();
})();
