(() => {
  const transitionDuration = 260;

  const isInternalPageLink = (link, event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (link.target || link.hasAttribute("download") || link.dataset.noTransition !== undefined) return false;

    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(href)) return false;

    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin) return false;
    if (destination.pathname === window.location.pathname && destination.search === window.location.search) return false;

    return true;
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link || !isInternalPageLink(link, event)) return;

    event.preventDefault();
    document.body.classList.add("is-leaving");

    window.setTimeout(() => {
      window.location.assign(link.href);
    }, transitionDuration);
  });

  window.addEventListener("pageshow", () => {
    document.body.classList.remove("is-leaving");
  });
})();
