(() => {
  "use strict";
  const VERSION = "55.0";

  function isAppMode() {
    return (
      window.matchMedia?.("(display-mode: fullscreen)").matches ||
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  function isTouchTotem() {
    return ((window.matchMedia?.("(pointer: coarse)").matches ?? false) || (navigator.maxTouchPoints || 0) > 0);
  }

  async function requestRealFullscreen() {
    if (!isTouchTotem() || isAppMode() || document.fullscreenElement) return;
    const el = document.documentElement;
    const fn = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!fn) return;
    try {
      const result = fn.call(el, { navigationUI: "hide" });
      if (result && typeof result.catch === "function") await result.catch(() => {});
    } catch (_) {}
  }

  function armFullscreenFallback() {
    if (!isTouchTotem() || isAppMode()) return;
    const tryFullscreen = () => requestRealFullscreen();
    document.addEventListener("pointerdown", tryFullscreen, true);
    document.addEventListener("touchend", tryFullscreen, true);
  }

  // V55: navegação dos cards é feita diretamente para o HTML do jogo.
  // Nenhuma falha de página pode cair no modo apresentação.
  function protectGameNavigation() {
    document.addEventListener("click", (event) => {
      const link = event.target?.closest?.("a.game-menu-card[href]");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.href = new URL(href, window.location.href).href;
    }, true);
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const reg = await navigator.serviceWorker.register(`./service-worker.js?v=${VERSION}`, {
          scope: "./",
          updateViaCache: "none"
        });
        await reg.update().catch(() => {});
        if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
      } catch (_) {}
    });
  }

  const boot = () => {
    protectGameNavigation();
    armFullscreenFallback();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once:true });
  else boot();
})();
