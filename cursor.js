(() => {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const cursor = document.createElement("div");
  cursor.className = "magic-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML = '<span class="magic-cursor__arrow">→</span>';
  document.body.append(cursor);
  document.body.classList.add("cursor-ready");

  const arrow = cursor.querySelector(".magic-cursor__arrow");
  let x = window.innerWidth / 2, y = window.innerHeight / 2;
  let targetX = x, targetY = y, frame;
  let scrollTimer;

  const draw = () => {
    x += (targetX - x) * 0.18;
    y += (targetY - y) * 0.18;
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    frame = requestAnimationFrame(draw);
  };
  draw();

  window.addEventListener("mousemove", event => {
    targetX = event.clientX;
    targetY = event.clientY;
    const target = event.target.closest("a, button, summary, [role='button']");
    const field = event.target.closest("input, textarea, select");
    cursor.classList.toggle("is-link", Boolean(target));
    cursor.classList.toggle("is-hidden", Boolean(field));
  });

  window.addEventListener("mouseleave", () => cursor.classList.add("is-hidden"));
  window.addEventListener("mouseenter", () => cursor.classList.remove("is-hidden"));
  window.addEventListener("wheel", event => {
    const down = event.deltaY > 0;
    arrow.textContent = down ? "↓" : "↑";
    cursor.classList.add("is-scrolling");
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => cursor.classList.remove("is-scrolling"), 180);
  }, { passive:true });

  window.addEventListener("beforeunload", () => cancelAnimationFrame(frame));
})();
