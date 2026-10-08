/* =========================================================
   COAMO GAMES — V57 · MASCOTES ANIMADOS (Toninho e Aroldinho)
   1) Banners: os personagens foram recortados das artes em camadas
      (assets/games/v57/live). O script troca a arte pelo fundo limpo
      e posiciona os personagens por cima, com animação.
   2) Mascotes soltos (PNG) dentro dos jogos ganham movimento e reagem
      quando falam.
   3) Quiz, Memória e Cadeia ganham os dois como guias que falam
      (o app.v48.js já envia as falas para #leftMascotSpeech/#rightMascotSpeech).
   Se algo falhar, a arte original continua aparecendo normalmente.
   ========================================================= */
(function () {
  "use strict";

  var BANNERS = {"hero_coamo_games.png":{"plate":"assets/games/v57/live/hero_plate.webp","chars":[["aroldinho","assets/games/v57/live/hero_aroldinho.webp",5.801,22.099,37.017,46.685],["toninho","assets/games/v57/live/hero_toninho.webp",57.597,25.414,38.052,43.278]]},"area_banner.png":{"plate":"assets/games/v57/live/area_plate.webp","chars":[["aroldinho","assets/games/v57/live/area_aroldinho.webp",18.424,20.41,26.628,38.672],["toninho","assets/games/v57/live/area_toninho.webp",51.432,22.363,24.414,34.766]]},"memory_banner.png":{"plate":"assets/games/v57/live/memory_plate.webp","chars":[["aroldinho","assets/games/v57/live/memory_aroldinho.webp",0.0,24.707,25.065,35.059],["toninho","assets/games/v57/live/memory_toninho.webp",72.917,28.32,25.846,35.156]]},"chain_banner.png":{"plate":"assets/games/v57/live/chain_plate.webp","chars":[["aroldinho","assets/games/v57/live/chain_aroldinho.webp",7.031,16.699,25.065,39.453],["toninho","assets/games/v57/live/chain_toninho.webp",70.508,18.457,22.721,38.281]]},"classification_banner.png":{"plate":"assets/games/v57/live/classification_plate.webp","chars":[["aroldinho","assets/games/v57/live/classification_aroldinho.webp",2.409,9.277,27.148,47.852],["toninho","assets/games/v57/live/classification_toninho.webp",71.81,13.281,28.19,42.871]]},"silo_banner.png":{"plate":"assets/games/v57/live/silo_plate.webp","chars":[["aroldinho","assets/games/v57/live/silo_aroldinho.webp",0.0,19.531,33.268,40.039],["toninho","assets/games/v57/live/silo_toninho.webp",75.326,33.203,24.674,51.758]]}};

  var GUIDE_TEXT = {
    "game-profile": ["Olá! Eu sou o Toninho. Escolha a opção que mais combina com você.", "E eu sou o Aroldinho! Não existe resposta errada, vamos lá!"],
    "game-memory":  ["Toninho aqui! Encontre os pares e descubra curiosidades da Coamo.", "Aroldinho: memorize bem onde está cada carta!"],
    "game-chain":   ["Sou o Toninho! Monte a jornada do campo ao mercado.", "Aroldinho: pense na ordem certa de cada etapa!"]
  };

  var OOPS = /(quase|n[aã]o foi|n[aã]o [eé]|errad|perdeu|aten[cç][aã]o|cuidado|alerta|vidas acabaram|tente)/i;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var page = document.body ? document.body.getAttribute("data-page") : "";

  /* ---------- utilidades ---------- */
  function fileOf(src) { return (src || "").split("?")[0].split("/").pop(); }
  function restart(el, cls, ms) {
    if (!el) return;
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
    clearTimeout(el["_t_" + cls]);
    el["_t_" + cls] = setTimeout(function () { el.classList.remove(cls); }, ms || 900);
  }
  function preload(srcs) {
    return Promise.all(srcs.map(function (s) {
      return new Promise(function (ok, fail) { var i = new Image(); i.onload = ok; i.onerror = fail; i.src = s; });
    }));
  }

  /* ---------- 1. banners em camadas ---------- */
  var liveBanners = [];

  function parsePos(v, free) {
    if (!v) return free / 2;
    if (/%$/.test(v)) return (parseFloat(v) / 100) * free;
    return parseFloat(v) || 0;
  }

  function placeOverlay(item) {
    var img = item.img, ov = item.overlay, parent = img.parentElement;
    if (!parent || !img.isConnected) return;
    var bw = img.clientWidth, bh = img.clientHeight;
    if (!bw || !bh) { ov.style.display = "none"; return; }
    var nw = img.naturalWidth || 3, nh = img.naturalHeight || 2;
    var cs = getComputedStyle(img), fit = cs.objectFit || "fill";
    var cw = bw, ch = bh;
    if (fit === "contain" || fit === "scale-down" || fit === "cover") {
      var s = fit === "cover" ? Math.max(bw / nw, bh / nh) : Math.min(bw / nw, bh / nh);
      if (fit === "scale-down") s = Math.min(1, s);
      cw = nw * s; ch = nh * s;
    } else if (fit === "none") { cw = nw; ch = nh; }
    var pos = (cs.objectPosition || "50% 50%").split(/\s+/);
    var ox = parsePos(pos[0], bw - cw), oy = parsePos(pos[1], bh - ch);
    var ir = img.getBoundingClientRect(), pr = parent.getBoundingClientRect();
    var sx = ir.width / bw || 1; // compensa transformações (zoom) do cartão
    ov.style.display = "";
    ov.style.left = (ir.left - pr.left - parent.clientLeft + img.clientLeft * sx + ox * sx) + "px";
    ov.style.top = (ir.top - pr.top - parent.clientTop + img.clientTop * sx + oy * sx) + "px";
    ov.style.width = (cw * sx) + "px";
    ov.style.height = (ch * sx) + "px";
    // a arte inteira cabe dentro da área visível do contêiner (contain); em "cover" recorta
    ov.style.clipPath = fit === "cover" ? "inset(" + Math.max(0, -oy) + "px " + Math.max(0, cw - bw + ox) + "px " + Math.max(0, ch - bh + oy) + "px " + Math.max(0, -ox) + "px)" : "";
  }

  function buildBanner(img, data) {
    if (img.dataset.coamoLive) return;
    img.dataset.coamoLive = "1";
    var originalSrc = img.getAttribute("src");
    var ov = document.createElement("span");
    ov.className = "coamo-live";
    ov.setAttribute("aria-hidden", "true");
    var interactive = !img.closest("a, button");
    if (interactive) ov.classList.add("coamo-live--tap");

    data.chars.forEach(function (c, i) {
      var wrap = document.createElement("span");
      wrap.className = "coamo-live__char coamo-live__char--" + c[0];
      wrap.style.left = c[2] + "%"; wrap.style.top = c[3] + "%";
      wrap.style.width = c[4] + "%"; wrap.style.height = c[5] + "%";
      wrap.style.animationDelay = (i ? -1.7 : 0) + "s";
      var pic = document.createElement("img");
      pic.src = c[1]; pic.alt = ""; pic.draggable = false; pic.decoding = "async";
      wrap.appendChild(pic);
      if (interactive) wrap.addEventListener("pointerdown", function () { restart(wrap, "is-gesture", 950); });
      ov.appendChild(wrap);
    });

    preload([data.plate].concat(data.chars.map(function (c) { return c[1]; }))).then(function () {
      var parent = img.parentElement;
      if (!parent) return;
      if (getComputedStyle(parent).position === "static") parent.style.position = "relative";
      var z = getComputedStyle(img).zIndex;
      if (z && z !== "auto") ov.style.zIndex = z;
      img.insertAdjacentElement("afterend", ov);
      img.dataset.coamoOriginal = originalSrc;
      img.removeAttribute("srcset");
      img.src = data.plate;
      var item = { img: img, overlay: ov };
      liveBanners.push(item);
      var redo = function () { placeOverlay(item); };
      img.addEventListener("load", redo);
      if (window.ResizeObserver) { var ro = new ResizeObserver(redo); ro.observe(img); ro.observe(parent); }
      redo();
      requestAnimationFrame(redo);
      watchVisibility(ov);
    }).catch(function () { /* mantém a arte original */ });
  }

  function scanBanners(root) {
    (root || document).querySelectorAll("img").forEach(function (img) {
      var data = BANNERS[fileOf(img.getAttribute("src"))];
      if (data && /games\/v4[6-9]\//.test(img.getAttribute("src"))) buildBanner(img, data);
    });
  }

  /* ---------- visibilidade: pausa fora da tela e anima a entrada ---------- */
  var io = window.IntersectionObserver ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      e.target.classList.toggle("is-paused", !e.isIntersecting);
      if (e.isIntersecting && !e.target.classList.contains("is-in")) {
        var t = e.target;
        t.classList.add("is-in");
        setTimeout(function () { t.classList.add("is-entered"); }, 1300);
      }
    });
  }, { threshold: 0.05 }) : null;
  function watchVisibility(el) { if (io) io.observe(el); else el.classList.add("is-in"); }

  /* gesto aleatório de tempos em tempos (aceno/pulinho) */
  function randomGesture() {
    if (!document.hidden) {
      var pool = Array.prototype.slice.call(document.querySelectorAll(".coamo-live.is-in:not(.is-paused) .coamo-live__char, img.coamo-alive.is-in:not(.is-paused)"));
      pool = pool.filter(function (el) { return el.offsetParent !== null; });
      if (pool.length) {
        var el = pool[Math.floor(Math.random() * pool.length)];
        restart(el, el.tagName === "IMG" ? "is-talk" : "is-gesture", 950);
      }
    }
    setTimeout(randomGesture, 3500 + Math.random() * 3500);
  }

  /* ---------- 2. mascotes soltos nos jogos ---------- */
  function scanMascots(root) {
    (root || document).querySelectorAll("img").forEach(function (img, i) {
      if (img.dataset.coamoAlive || img.closest(".coamo-live")) return;
      var m = /mascote_(toninho|aroldinho)/.exec(img.getAttribute("src") || "");
      if (!m) return;
      img.dataset.coamoAlive = "1";
      img.classList.add("coamo-alive", "coamo-alive--" + m[1]);
      img.style.animationDelay = (-(i % 5) * 0.7) + "s";
      img.addEventListener("pointerdown", function () { restart(img, "is-talk", 950); });
    });
  }

  /* quando um balão muda de texto, o mascote ao lado reage */
  function bindSpeech(cap) {
    if (!cap || cap.dataset.coamoSpeech) return;
    cap.dataset.coamoSpeech = "1";
    new MutationObserver(function () {
      var fig = cap.closest("figure");
      var img = fig && fig.querySelector("img");
      var oops = OOPS.test(cap.textContent || "");
      restart(cap, "is-said", 600);
      if (img) restart(img, oops ? "is-oops" : "is-talk", oops ? 700 : 950);
    }).observe(cap, { childList: true, characterData: true, subtree: true });
  }
  function scanSpeech(root) {
    (root || document).querySelectorAll("#leftMascotSpeech, #rightMascotSpeech, #grainToninhoSpeech, #grainAroldinhoSpeech, #siloToninho, #siloAroldinho, .silo-guide figcaption").forEach(bindSpeech);
  }

  /* ---------- 3. guias nos jogos que não tinham os mascotes ---------- */
  function addGuides() {
    var text = GUIDE_TEXT[page];
    if (!text || document.getElementById("leftMascotSpeech")) return;
    var panel = document.querySelector(".game-panel--single");
    if (!panel) return;
    var box = document.createElement("div");
    box.className = "coamo-guides";
    box.innerHTML =
      '<figure class="coamo-guide coamo-guide--toninho"><img src="assets/mascote_toninho_pose2.png" alt="Toninho"><figcaption id="leftMascotSpeech" aria-live="polite">' + text[0] + '</figcaption></figure>' +
      '<figure class="coamo-guide coamo-guide--aroldinho"><figcaption id="rightMascotSpeech" aria-live="polite">' + text[1] + '</figcaption><img src="assets/mascote_aroldinho.png" alt="Aroldinho"></figure>';
    var poster = panel.querySelector(".game-stage-poster-v34");
    var anchor = panel.querySelector(".memory-status, .game-progress, .chain-track, #chainTrack, .profile-game");
    if (anchor && anchor.parentElement === panel) panel.insertBefore(box, anchor);
    else if (poster) poster.insertAdjacentElement("afterend", box);
    else panel.insertBefore(box, panel.firstChild);
    box.querySelectorAll(".coamo-guide").forEach(watchVisibility);
  }

  /* app.v48.js marca o painel com is-success-reaction / is-error-reaction */
  function bindReactions() {
    document.querySelectorAll(".game-panel--single").forEach(function (panel) {
      new MutationObserver(function () {
        var ok = panel.classList.contains("is-success-reaction"), bad = panel.classList.contains("is-error-reaction");
        if (!ok && !bad) return;
        panel.querySelectorAll(".coamo-guide img").forEach(function (img) { restart(img, bad ? "is-oops" : "is-cheer", 900); });
      }).observe(panel, { attributes: true, attributeFilter: ["class"] });
    });
  }

  function init() {
    document.documentElement.classList.add("coamo-mascots-v57");
    if (reduce) document.documentElement.classList.add("coamo-reduce-motion");
    addGuides();
    scanBanners();
    scanMascots();
    scanSpeech();
    bindReactions();
    document.querySelectorAll(".coamo-alive").forEach(function (img) { watchVisibility(img); });
    // conteúdo criado depois (resultados, telas de fim de jogo)
    new MutationObserver(function (list) {
      list.forEach(function (rec) {
        rec.addedNodes.forEach(function (n) {
          if (n.nodeType !== 1 || n.closest(".coamo-live")) return;
          scanBanners(n.parentElement || n); scanMascots(n.parentElement || n); scanSpeech(n.parentElement || n);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", function () { liveBanners.forEach(placeOverlay); });
    if (!reduce) setTimeout(randomGesture, 2500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
