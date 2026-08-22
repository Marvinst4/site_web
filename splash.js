(() => {
  const splash = document.querySelector(".site-splash");
  if (!splash) return;

  const storageKey = "les-jeunes-explorateurs-splash-seen";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasSeenSplash = sessionStorage.getItem(storageKey) === "true";

  const hideSplash = () => {
    splash.classList.add("is-hidden");
    window.setTimeout(() => splash.remove(), 420);
  };

  if (reducedMotion || hasSeenSplash) {
    hideSplash();
    return;
  }

  sessionStorage.setItem(storageKey, "true");
  window.setTimeout(hideSplash, 1050);
})();
