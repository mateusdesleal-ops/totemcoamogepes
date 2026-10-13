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

  /* dentro da moldura do totem (totem.html), a tela cheia é pedida para a moldura inteira,
     senão o navegador estica a página interna e ela volta ao formato largo */
  function fullscreenDoc() {
    try { if (window.top !== window && window.top.document && window.top.__coamoMoldura) return window.top.document; } catch (_) {}
    return document;
  }
  async function requestRealFullscreen() {
    const doc = fullscreenDoc();
    if (!isTouchTotem() || isAppMode() || doc.fullscreenElement) return;
    const el = doc.documentElement;
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

  /* V67: atualização automática do totem.
     A cada 5 min confere se a página foi publicada de novo (o HTML muda a cada atualização).
     Se mudou e ninguém está usando há 90 s, recarrega sozinha — sem precisar mexer no totem. */
  (function autoUpdate() {
    if (!/^https?:/.test(location.protocol)) return;
    let base = null, lastInput = Date.now(), pending = false;
    ["pointerdown", "keydown", "touchstart"].forEach(ev => document.addEventListener(ev, () => { lastInput = Date.now(); }, { passive: true, capture: true }));
    const sig = t => { let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return h + ":" + t.length; };
    const url = () => location.pathname + (location.pathname.endsWith("/") ? "" : "") + "?_upd=" + Date.now();
    async function check() {
      try {
        const r = await fetch(url(), { cache: "no-store", credentials: "same-origin" });
        if (!r.ok) return;
        const s = sig(await r.text());
        if (base === null) base = s; else if (s !== base) pending = true;
      } catch (_) {}
    }
    setTimeout(check, 4000);
    setInterval(check, 5 * 60 * 1000);
    setInterval(() => {
      if (pending && Date.now() - lastInput > 90 * 1000 && document.visibilityState === "visible") location.reload();
    }, 15 * 1000);
  })();
})();
