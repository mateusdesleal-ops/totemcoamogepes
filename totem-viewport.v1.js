/* A janela do navegador pode continuar mais larga que o monitor após girar
   a tela do totem. Usa a área visível, sem alterar o zoom do usuário. */
(() => {
  "use strict";
  function visibleViewport() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    const display = window.screen;
    if (display && display.height > display.width && display.width > 0) {
      width = Math.min(width, display.width);
      height = Math.min(height, display.height);
    }
    const visual = window.visualViewport;
    if (visual && Math.abs(visual.scale - 1) < 0.01) {
      width = Math.min(width, visual.width);
      height = Math.min(height, visual.height);
    }
    return { width, height };
  }
  window.coamoVisibleViewport = visibleViewport;
  try {
    if (window.top !== window) {
      // Atualiza também uma moldura antiga quando a página interna recebe esta versão.
      if (window.top.__coamoMoldura && !window.top.coamoVisibleViewport) window.top.location.reload();
      return;
    }
    if (/\/totem\.html$/.test(location.pathname)) return;
    const { width, height } = visibleViewport();
    if (height > width && (width >= 1300 || window.innerWidth > width + 2)) {
      location.replace("totem.html?u=" + encodeURIComponent(location.pathname.replace(/^\//, "") + location.search));
    }
  } catch (_) {}
})();
