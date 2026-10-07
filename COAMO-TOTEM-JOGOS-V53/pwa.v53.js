(() => {
  "use strict";

  const VERSION = "53.0";

  function isAppMode() {
    return (
      window.matchMedia?.("(display-mode: fullscreen)").matches ||
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  function isTouchTotem() {
    return (
      (window.matchMedia?.("(pointer: coarse)").matches ?? false) ||
      (navigator.maxTouchPoints || 0) > 0
    );
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
    const tryFullscreen = () => {
      requestRealFullscreen();
      if (document.fullscreenElement) disarm();
    };
    const disarm = () => {
      document.removeEventListener("pointerdown", tryFullscreen, true);
      document.removeEventListener("touchend", tryFullscreen, true);
      document.removeEventListener("click", tryFullscreen, true);
    };
    document.addEventListener("pointerdown", tryFullscreen, true);
    document.addEventListener("touchend", tryFullscreen, true);
    document.addEventListener("click", tryFullscreen, true);
  }

  // Navegação explícita dos cards de jogos. Evita que WebViews/totens antigos
  // reutilizem a navegação de apresentação ao tocar rapidamente nos cards.
  function protectGameNavigation() {
    document.addEventListener("click", (event) => {
      const link = event.target?.closest?.("a.game-menu-card[href]");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      event.preventDefault();
      event.stopPropagation();
      window.location.assign(new URL(href, window.location.href).href);
    }, true);
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register(`./service-worker.js?v=${VERSION}`, { scope: "./", updateViaCache: "none" })
        .then(async (registration) => {
          try { await registration.update(); } catch (_) {}
        })
        .catch(() => {});
    });
  }

  const boot = () => {
    protectGameNavigation();
    armFullscreenFallback();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
