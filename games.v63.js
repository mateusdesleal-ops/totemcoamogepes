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

/* =========================================================
   COAMO GAMES — V64 · O JOGO EM SI
   Som (com botão liga/desliga) e vibração, barra de combo, aviso de fase,
   item caindo na caixa, carga entrando no silo, caminho da cadeia,
   revelação e gráfico de afinidades do quiz.
   Só escuta os eventos "coamo:game": as regras dos jogos não mudam.
   ========================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var page = document.body ? document.body.getAttribute("data-page") || "" : "";
  var isGamePage = /jogo-(area|memoria|cadeia|classificacao|silo)\.html/.test(location.pathname) ||
    !!document.querySelector("#grainGame, #siloGame, #memoryGrid, #chainTrack, #profileGame, #gameProfile");
  var KEY = "coamoGamesSound";

  /* ---------- som ---------- */
  var soundOn = true;
  try { soundOn = localStorage.getItem(KEY) !== "off"; } catch (_) {}
  var ctx = null;
  function audio() {
    try {
      if (!ctx) { var A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ctx = new A(); }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch (_) { return null; }
  }
  function note(c, freq, start, dur, type, vol) {
    var o = c.createOscillator(), g = c.createGain(), t = c.currentTime + start;
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.09, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.03);
  }
  var SOUNDS = {
    tap:     function (c) { note(c, 620, 0, .06, "triangle", .06); },
    flip:    function (c) { note(c, 540, 0, .05, "triangle", .06); note(c, 760, .04, .06, "triangle", .05); },
    success: function (c) { note(c, 660, 0, .1, "sine", .09); note(c, 990, .08, .16, "sine", .08); },
    error:   function (c) { note(c, 240, 0, .12, "sawtooth", .045); note(c, 180, .1, .18, "sawtooth", .04); },
    win:     function (c) { [523, 659, 784, 1046].forEach(function (f, i) { note(c, f, i * .11, i === 3 ? .4 : .14, "triangle", .09); }); },
    phase:   function (c) { note(c, 440, 0, .1, "square", .035); note(c, 660, .1, .1, "square", .035); note(c, 880, .2, .2, "square", .035); }
  };
  window.CoamoGameSound = function (kind) {
    if (!soundOn) return;
    var c = audio(); if (!c) return;
    try { (SOUNDS[kind] || SOUNDS.tap)(c); } catch (_) {}
  };
  function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (_) {} }

  if (isGamePage && document.body) {
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "cg-sound";
    var paintBtn = function () {
      btn.setAttribute("aria-pressed", soundOn ? "true" : "false");
      btn.setAttribute("aria-label", soundOn ? "Som ligado. Toque para desligar" : "Som desligado. Toque para ligar");
      btn.innerHTML = soundOn
        ? '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>'
        : '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
    };
    btn.addEventListener("click", function () {
      soundOn = !soundOn;
      try { localStorage.setItem(KEY, soundOn ? "on" : "off"); } catch (_) {}
      paintBtn();
      if (soundOn) window.CoamoGameSound("tap");
    });
    paintBtn();
    document.body.appendChild(btn);
  }

  /* ---------- utilidades ---------- */
  function bump(el, cls) {
    if (!el) return;
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
    setTimeout(function () { el.classList.remove(cls); }, 700);
  }
  function flyTo(html, from, to) {
    if (reduce || !html || !to) return;
    var b = to.getBoundingClientRect();
    var a = from ? from.getBoundingClientRect() : { left: b.left + b.width / 2, top: b.top - 160, width: 0, height: 0 };
    var d = document.createElement("div");
    d.className = "cg-drop"; d.innerHTML = html;
    d.style.left = (a.left + a.width / 2) + "px"; d.style.top = (a.top + a.height / 2) + "px";
    document.body.appendChild(d);
    var dx = (b.left + b.width / 2) - (a.left + a.width / 2), dy = (b.top + b.height * 0.35) - (a.top + a.height / 2);
    var anim = d.animate([
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: "translate(" + dx * 0.5 + "px," + (dy * 0.5 - 70) + "px) scale(1.15)", opacity: 1, offset: 0.5 },
      { transform: "translate(" + dx + "px," + dy + "px) scale(.35)", opacity: 0 }
    ], { duration: 520, easing: "cubic-bezier(.4,0,.6,1)" });
    anim.onfinish = function () { d.remove(); };
    setTimeout(function () { d.remove(); }, 900);
  }
  function phaseBanner(title, small, extreme) {
    if (reduce) return;
    var old = document.querySelector(".cg-phase"); if (old) old.remove();
    var p = document.createElement("div");
    p.className = "cg-phase" + (extreme ? " is-extreme" : "");
    p.setAttribute("aria-hidden", "true");
    p.innerHTML = "<small>" + small + "</small>" + title;
    document.body.appendChild(p);
    setTimeout(function () { p.remove(); }, 1700);
  }

  /* ---------- Classificação: barra de combo ---------- */
  var combo = null;
  function comboBar() {
    if (combo) return combo;
    var hud = document.querySelector("#grainGame .grain-hud");
    if (!hud) return null;
    combo = document.createElement("div");
    combo.className = "cg-combo";
    combo.innerHTML = '<span class="cg-combo__label">Combo <b>x0</b></span><span class="cg-combo__bar"><i></i></span>';
    hud.insertAdjacentElement("afterend", combo);
    return combo;
  }
  function setCombo(n) {
    var c = comboBar(); if (!c) return;
    c.querySelector("b").textContent = "x" + n;
    c.querySelector("i").style.width = Math.min(100, n * 10) + "%";
    c.classList.toggle("is-hot", n >= 5);
  }

  /* ---------- Silo: guarda o ícone da carga antes do toque ---------- */
  var siloIcon = "";
  document.addEventListener("pointerdown", function (e) {
    var u = e.target.closest && e.target.closest(".silo-unit");
    if (!u) return;
    var ic = document.getElementById("siloLoadIcon");
    siloIcon = ic ? ic.innerHTML : "";
  }, true);

  /* ---------- Cadeia: caminho iluminado ---------- */
  var chainTrack = document.getElementById("chainTrack");
  var snapNext = false;
  function paintChain() {
    if (!chainTrack) return;
    var list = chainTrack.querySelector(".chain-track__list");
    if (!list) return;
    var slots = list.querySelectorAll(".chain-slot"), done = list.querySelectorAll(".chain-slot.is-done");
    var p = slots.length > 1 ? Math.round((done.length / slots.length) * 100) : 0;
    list.style.setProperty("--cg-p", p + "%");
    if (snapNext && done.length) { snapNext = false; bump(done[done.length - 1], "cg-snap"); }
  }
  if (chainTrack && window.MutationObserver) {
    new MutationObserver(paintChain).observe(chainTrack, { childList: true, subtree: false });
    paintChain();
  }

  /* ---------- Quiz: revelação + gráfico de afinidades ---------- */
  function quizChart() {
    var res = document.querySelector(".profile-result");
    if (!res || res.querySelector(".cg-aff")) return;
    var match = res.querySelector(".profile-result__match");
    var spans = match ? match.querySelectorAll("span") : [];
    var rows = [];
    for (var i = 0; i < spans.length; i++) {
      var t = spans[i].textContent, m = t.match(/^(.*)·\s*(\d+)\s*pts/);
      if (m) rows.push({ name: m[1].trim(), pts: +m[2] });
    }
    if (!rows.length) return;
    var max = Math.max.apply(null, rows.map(function (r) { return r.pts; })) || 1;
    var box = document.createElement("div");
    box.className = "cg-aff";
    box.innerHTML = rows.map(function (r) {
      return '<div class="cg-aff__row"><span>' + r.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</span><span class="cg-aff__bar"><i data-w="' + Math.round(r.pts / max * 100) + '"></i></span><span>' + r.pts + " pts</span></div>";
    }).join("");
    for (var j = 0; j < spans.length; j++) spans[j].style.display = "none";
    match.appendChild(box);
    var kicker = res.querySelector(".game-result-kicker");
    if (kicker) { var r = document.createElement("div"); r.className = "cg-reveal"; r.textContent = "Resultado revelado"; kicker.insertAdjacentElement("beforebegin", r); }
    requestAnimationFrame(function () { setTimeout(function () {
      box.querySelectorAll("i").forEach(function (b) { b.style.width = b.dataset.w + "%"; });
    }, reduce ? 0 : 250); });
  }

  /* ---------- ranking do evento também na Memória e na Cadeia ---------- */
  function rankLater(game, entry) {
    if (!window.CoamoLeaderboard || !entry.score) return;
    setTimeout(function () { try { window.CoamoLeaderboard.maybeCapture(game, entry); } catch (_) {} }, 2600);
  }

  /* ---------- eventos dos jogos ---------- */
  document.addEventListener("coamo:game", function (e) {
    var d = e.detail || {}, g = d.game, t = d.type;
    if (g === "grain") {
      if (t === "start") { setCombo(0); }
      if (t === "hit") {
        setCombo(d.combo || 0); bump(d.el, "is-hit"); buzz(18);
        var ic = d.el && d.el.querySelector(".grain-bin__icon");
        flyTo(ic ? ic.innerHTML : "", document.getElementById("grainConveyor"), d.el);
      }
      if (t === "miss") { setCombo(0); bump(d.el, "is-wrong"); buzz([40, 40, 40]); }
      if (t === "escape") { setCombo(0); buzz(60); }
      if (t === "phase") {
        var n = d.phase || 1;
        if (n > 1) { phaseBanner(d.name || ("Fase " + n), "FASE " + n, n >= 9); window.CoamoGameSound("phase"); }
      }
      if (t === "finish") window.CoamoGameSound("win");
    }
    if (g === "silo") {
      if (t === "assign" || t === "correct") {
        flyTo(siloIcon, document.getElementById("siloLoad"), d.el);
        setTimeout(function () { bump(d.el, "cg-receive"); }, reduce ? 0 : 420);
        window.CoamoGameSound("success"); buzz(18);
      }
      if (t === "wrong" || t === "capacity") { bump(d.el, "cg-refuse"); window.CoamoGameSound("error"); buzz([40, 40, 40]); }
      if (t === "timeout") { window.CoamoGameSound("error"); buzz(60); }
      if (t === "expedition") window.CoamoGameSound("flip");
      if (t === "start") window.CoamoGameSound("tap");
      if (t === "finish") window.CoamoGameSound("win");
    }
    if (g === "memory") {
      if (t === "finish") rankLater("memoria", { score: Math.max(100, Math.round(3200 - (d.moves || 0) * 60 - (d.seconds || 0) * 8)), duration: d.seconds, accuracy: d.moves ? Math.round((d.matches || 8) / d.moves * 100) : null });
      if (t === "match") buzz(18);
      if (t === "miss") buzz([30, 30, 30]);
    }
    if (g === "chain") {
      if (t === "finish") rankLater("cadeia", { score: (d.score || 0) + (d.hearts || 0) * 150 });
      if (t === "correct") { snapNext = true; buzz(18); setTimeout(paintChain, 30); }
      if (t === "wrong") buzz([40, 40, 40]);
      if (t === "start") setTimeout(paintChain, 30);
    }
    if (g === "profile") {
      if (t === "answer") buzz(12);
      if (t === "finish") setTimeout(quizChart, 0);
    }
  });
})();
