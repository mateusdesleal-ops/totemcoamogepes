(() => {
  "use strict";

  const VERSION = "52.0";

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
      if (result && typeof result.catch === "function") {
        await result.catch(() => {});
      }
    } catch (_) {
      // Alguns navegadores Android bloqueiam fullscreen sem gesto; tentamos novamente no próximo toque.
    }
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

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register(`./service-worker.js?v=${VERSION}`, {
          scope: "./",
          updateViaCache: "none"
        })
        .then((registration) => registration.update().catch(() => {}))
        .catch(() => {});
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", armFullscreenFallback, { once: true });
  } else {
    armFullscreenFallback();
  }
})();
