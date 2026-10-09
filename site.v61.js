/* =========================================================
   TOTEM COAMO — V61 · AJUSTES GERAIS DO SITE
   - Falas dos mascotes no Início, em Vagas e no Sorteio
   - Sorteio: tela reserva do vídeo quando o totem está sem internet
   ========================================================= */
(function () {
  "use strict";
  var page = document.body ? document.body.getAttribute("data-page") : "";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- falas (t = Toninho, a = Aroldinho) ---------- */
  var SCRIPTS = {
    home: [
      [["t", "Olá! Que bom ter você aqui."], ["a", "Eu sou o Aroldinho, e esse é o Toninho!"], ["t", "Vamos te ajudar a conhecer a Coamo."], ["a", "Toque em uma opção para começar!"]],
      [["t", "Procurando trabalho? Veja as vagas abertas."], ["a", "Ou divirta-se no Coamo Games!", "games"]],
      [["a", "Já se cadastrou no sorteio?", "raffle"], ["t", "Leva menos de um minuto, aqui mesmo no totem."]],
      [["t", "A Coamo tem mais de 32 mil cooperados."], ["a", "E mais de 12 mil funcionários. Que tal ser o próximo?"]]
    ],
    vagas: [
      [["t", "Dica do Toninho: busque pelo cargo ou escolha sua cidade."]],
      [["t", "Toque em uma vaga para ver os detalhes."]],
      [["t", "Não achou? Novas vagas aparecem sempre por aqui."]]
    ],
    raffle: [
      [["a", "Preencha seu nome e telefone. É rapidinho!"]],
      [["a", "Marque a autorização e toque em “Quero participar”."]],
      [["a", "Boa sorte! Torço por você."]]
    ]
  };

  function featureOn(name) {
    if (!name) return true;
    var el = document.querySelector('[data-feature="' + name + '"]');
    return !el || !el.classList.contains("is-feature-hidden");
  }
  function bubble(who) { return document.querySelector('.home-say[data-say="' + who + '"]'); }
  function rigOf(cap) {
    var fig = cap && cap.closest("figure");
    var r = fig && fig.querySelector(".coamo-rig");
    return r || null;
  }
  function onScreen(el) {
    if (!el || document.hidden) return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
  }
  var typing = {};
  function say(who, text) {
    var cap = bubble(who);
    if (!cap) return;
    clearInterval(typing[who]);
    cap.classList.remove("is-said"); void cap.offsetWidth; cap.classList.add("is-said");
    cap.setAttribute("aria-label", text);
    if (reduce) { cap.textContent = text; return; }
    var i = 0;
    cap.textContent = "";
    typing[who] = setInterval(function () {
      i += 2; cap.textContent = text.slice(0, i);
      if (i >= text.length) { clearInterval(typing[who]); cap.textContent = text; }
    }, 32);
    var rig = rigOf(cap);
    if (rig && window.CoamoMascots) window.CoamoMascots.play(rig, Math.random() < .35 ? "wave" : "talk");
  }

  function runScripts(list) {
    if (!list || !bubble("t") && !bubble("a")) return;
    var round = 0;
    function next() {
      var anchor = bubble("t") || bubble("a");
      if (!onScreen(anchor)) { setTimeout(next, 1500); return; }
      var script = list[round % list.length].filter(function (l) { return featureOn(l[2]); });
      round++;
      var t = round === 1 ? 900 : 0;
      script.forEach(function (line) {
        setTimeout(function () { say(line[0], line[1]); }, t);
        t += Math.max(2600, 1200 + line[1].length * 50);
      });
      setTimeout(next, t + 7000);
    }
    setTimeout(next, 600);
    /* tocar no mascote: ele responde */
    ["t", "a"].forEach(function (who) {
      var cap = bubble(who), fig = cap && cap.closest("figure");
      if (!fig) return;
      fig.addEventListener("pointerdown", function () {
        say(who, who === "t" ? "Estou aqui para te guiar. Escolha uma opção!" : "Opa! Bora explorar a Coamo?");
      });
    });
  }
  runScripts(SCRIPTS[page]);

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
