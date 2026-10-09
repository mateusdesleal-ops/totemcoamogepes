/* =========================================================
   COAMO GAMES — V63 · CONTAGEM "3, 2, 1, JÁ!"
   Antes da Classificação e do Silo começarem (e ao jogar de novo),
   mostra uma contagem rápida. Depois clica no botão original:
   as regras dos jogos não mudam.
   ========================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var IDS = ["grainStart", "grainPlayAgain", "siloStart", "siloPlayAgain"];
  var running = false;

  function countdown(done) {
    var box = document.createElement("div");
    box.className = "cg-count";
    box.setAttribute("aria-live", "assertive");
    document.body.appendChild(box);
    var steps = ["3", "2", "1", "Já!"], i = 0;
    (function next() {
      if (i >= steps.length) { box.remove(); done(); return; }
      box.innerHTML = '<b class="' + (i === 3 ? "is-go" : "") + '">' + steps[i] + "</b>";
      i++;
      setTimeout(next, i === 4 ? 650 : 800);
    })();
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("button");
    if (!btn || IDS.indexOf(btn.id) < 0) return;
    if (btn.dataset.cgGo === "1") { delete btn.dataset.cgGo; return; }  /* clique liberado: o jogo começa */
    if (reduce) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (running) return;
    running = true;
    window.scrollTo({ top: 0, behavior: "smooth" });
    countdown(function () {
      running = false;
      btn.dataset.cgGo = "1";
      btn.click();
    });
  }, true);
})();
