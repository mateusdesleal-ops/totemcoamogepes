/* =========================================================
   TOTEM COAMO — V61 · AJUSTES GERAIS DO SITE
   - Sorteio: tela reserva do vídeo quando o totem está sem internet
   ========================================================= */
(function () {
  "use strict";
  var page = document.body ? document.body.getAttribute("data-page") : "";

  /* ---------- Sorteio: vídeo sem internet ---------- */
  if (page === "raffle") {
    /* mensagem do aceite em português, no lugar do aviso padrão do navegador */
    var consent = document.getElementById("sorteioAceite");
    if (consent) {
      var msg = function () { consent.setCustomValidity(consent.checked ? "" : "Marque a autorização para participar do sorteio."); };
      consent.addEventListener("change", msg); msg();
      var form = document.getElementById("sorteioForm");
      if (form) form.addEventListener("submit", function () { setTimeout(msg, 900); });
    }
    var frame = document.querySelector(".raffle-video-frame iframe");
    var offline = document.querySelector(".raffle-video-offline");
    var sync = function () {
      if (!frame || !offline) return;
      var off = navigator.onLine === false;
      offline.hidden = !off;
      frame.hidden = off;
    };
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    sync();
  }
})();
