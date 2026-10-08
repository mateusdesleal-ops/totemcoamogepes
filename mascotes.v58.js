/* =========================================================
   COAMO GAMES — V58 · MASCOTES ARTICULADOS (Toninho e Aroldinho)
   Cada personagem é um "boneco" montado com as partes da arte original:
   corpo, cabeça (gira no pescoço), mão/braço (gira no pulso ou ombro),
   pálpebras (piscar) e a própria boca levemente mais aberta (falar).
   O rosto nunca é redesenhado: as emoções vêm do corpo.

   Ações: piscar · falar · acenar · comemorar · pensar · lamentar (erro)
   API:   CoamoMascots.play(elementoOuSeletor, "celebrate")
   Depende de: mascotes-rigs.v58.js (window.COAMO_RIGS)
   Se algo falhar, a arte original continua aparecendo normalmente.
   ========================================================= */
(function () {
  "use strict";
  var RIGS = window.COAMO_RIGS || {};

  /* arte original → rig(s). Banners: [aroldinho, toninho] sobre o fundo limpo */
  var IMAGE_RIGS = {
    "mascote_toninho.png": "g_ton1",
    "mascote_toninho_pose2.png": "g_ton2",
    "mascote_aroldinho.png": "g_aro1",
    "mascote_aroldinho_pose2.png": "g_aro2"
  };
  var BANNERS = {
    "hero_coamo_games.png":       { plate: "assets/mascotes/v58/b_hero_plate.webp",           rigs: ["b_hero_aro", "b_hero_ton"] },
    "area_banner.png":            { plate: "assets/mascotes/v58/b_area_plate.webp",           rigs: ["b_area_aro", "b_area_ton"] },
    "memory_banner.png":          { plate: "assets/mascotes/v58/b_memory_plate.webp",         rigs: ["b_memory_aro", "b_memory_ton"] },
    "chain_banner.png":           { plate: "assets/mascotes/v58/b_chain_plate.webp",          rigs: ["b_chain_aro", "b_chain_ton"] },
    "classification_banner.png":  { plate: "assets/mascotes/v58/b_classification_plate.webp", rigs: ["b_classification_aro", "b_classification_ton"] },
    "silo_banner.png":            { plate: "assets/mascotes/v58/b_silo_plate.webp",           rigs: ["b_silo_aro", "b_silo_ton"] }
  };
  var GUIDE_TEXT = {
    "game-profile": ["Olá! Eu sou o Toninho. Escolha a opção que mais combina com você.", "E eu sou o Aroldinho! Não existe resposta errada, vamos lá!"],
    "game-memory":  ["Toninho aqui! Encontre os pares e descubra curiosidades da Coamo.", "Aroldinho: memorize bem onde está cada carta!"],
    "game-chain":   ["Sou o Toninho! Monte a jornada do campo ao mercado.", "Aroldinho: pense na ordem certa de cada etapa!"]
  };
  var OOPS = /(quase|n[aã]o foi|n[aã]o [eé] a|errad|perdeu|cuidado|alerta|vidas acabaram|item fora|recomece)/i;
  var YAY  = /(acert|parab|excelente|[óo]timo|muito bem|conclu|complet|cumprida|encontrou|boa!|par encontrado|combo)/i;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var page = document.body ? document.body.getAttribute("data-page") : "";
  var puppets = [];

  function fileOf(src) { return (src || "").split("?")[0].split("/").pop(); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function preload(srcs) {
    return Promise.all(srcs.map(function (s) {
      return new Promise(function (ok, fail) { var i = new Image(); i.onload = ok; i.onerror = fail; i.src = s; });
    }));
  }
  function anim(el, frames, opts) {
    if (!el || reduce || !el.animate) return null;
    var k = parseFloat(el.dataset && el.dataset.k);
    if (k && k !== 1) frames = frames.map(function (f) {
      if (!f.rotate) return f;
      var g = Object.assign({}, f); g.rotate = (parseFloat(f.rotate) * k) + "deg"; return g;
    });
    try { return el.animate(frames, Object.assign({ easing: "ease-in-out", fill: "none" }, opts)); } catch (e) { return null; }
  }

  /* ---------------------------------------------------------- montagem */
  function buildRig(id) {
    var R = RIGS[id];
    if (!R) return null;
    var root = document.createElement("span");
    root.className = "coamo-rig";
    root.setAttribute("aria-hidden", "true");
    var puppet = document.createElement("span");
    puppet.className = "coamo-rig__puppet";
    root.appendChild(puppet);
    var parts = {}, kids = [];
    R.layers.forEach(function (L) {
      var box = document.createElement("span");
      box.className = "coamo-rig__part coamo-rig__part--" + L.n;
      box.style.left = L.g[0] + "%"; box.style.top = L.g[1] + "%";
      box.style.width = L.g[2] + "%"; box.style.height = L.g[3] + "%";
      box.style.zIndex = L.z || 0;
      if (L.p) box.style.transformOrigin = L.p[0] + "% " + L.p[1] + "%";
      if (L.n === "head" && R.ha) box.dataset.k = R.ha;
      if (/^arm/.test(L.n) && R.aa) box.dataset.k = R.aa;
      var im = document.createElement("img");
      im.src = L.f; im.alt = ""; im.draggable = false; im.decoding = "async";
      box.appendChild(im);
      parts[L.n] = box;
      if (L.parent) kids.push([L.parent, box]); else puppet.appendChild(box);
    });
    kids.forEach(function (k) { (parts[k[0]] || puppet).appendChild(k[1]); });
    if (parts.head) {
      var think = document.createElement("span");
      think.className = "coamo-rig__think";
      think.innerHTML = "<i></i><i></i><i></i>";
      parts.head.appendChild(think);
    }
    var P = { id: id, R: R, root: root, puppet: puppet, parts: parts, busy: false, visible: true };
    root._puppet = P;
    puppets.push(P);
    scheduleBlink(P);
    return P;
  }

  /* posiciona uma camada exatamente sobre a área desenhada de um <img> (object-fit) */
  function parsePos(v, free) { return /%$/.test(v) ? (parseFloat(v) / 100) * free : (parseFloat(v) || 0); }
  function placeOver(img, el) {
    var parent = img.parentElement;
    if (!parent || !img.isConnected) return;
    var bw = img.clientWidth, bh = img.clientHeight;
    if (!bw || !bh) { el.style.display = "none"; return; }
    var nw = img.naturalWidth || 1, nh = img.naturalHeight || 1;
    var cs = getComputedStyle(img), fit = cs.objectFit || "fill", cw = bw, ch = bh;
    if (fit === "contain" || fit === "scale-down" || fit === "cover") {
      var s = fit === "cover" ? Math.max(bw / nw, bh / nh) : Math.min(bw / nw, bh / nh);
      if (fit === "scale-down") s = Math.min(1, s);
      cw = nw * s; ch = nh * s;
    } else if (fit === "none") { cw = nw; ch = nh; }
    var pos = (cs.objectPosition || "50% 50%").split(/\s+/);
    var ox = parsePos(pos[0], bw - cw), oy = parsePos(pos[1], bh - ch);
    var ir = img.getBoundingClientRect(), pr = parent.getBoundingClientRect();
    var k = ir.width / (img.offsetWidth || bw) || 1;
    el.style.display = "";
    el.style.left = (ir.left - pr.left - parent.clientLeft + (img.clientLeft + ox) * k) + "px";
    el.style.top = (ir.top - pr.top - parent.clientTop + (img.clientTop + oy) * k) + "px";
    el.style.width = (cw * k) + "px";
    el.style.height = (ch * k) + "px";
  }
  function mount(img, overlay, after) {
    var parent = img.parentElement;
    if (getComputedStyle(parent).position === "static") parent.style.position = "relative";
    var z = getComputedStyle(img).zIndex;
    if (z && z !== "auto") overlay.style.zIndex = z;
    img.insertAdjacentElement("afterend", overlay);
    if (after) after();
    var redo = function () { placeOver(img, overlay); };
    img.addEventListener("load", redo);
    if (window.ResizeObserver) { var ro = new ResizeObserver(redo); ro.observe(img); ro.observe(parent); }
    window.addEventListener("resize", redo);
    redo(); requestAnimationFrame(redo); setTimeout(redo, 400);
    watch(overlay);
  }

  /* banner: troca a arte pelo fundo limpo e monta os dois bonecos por cima */
  function liveBanner(img, B) {
    if (img.dataset.coamoRig) return;
    var ids = B.rigs.filter(function (r) { return RIGS[r]; });
    if (!ids.length) return;
    img.dataset.coamoRig = "banner";
    var srcs = [B.plate];
    ids.forEach(function (r) { RIGS[r].layers.forEach(function (L) { srcs.push(L.f); }); });
    preload(srcs).then(function () {
      var ov = document.createElement("span");
      ov.className = "coamo-stage";
      ov.setAttribute("aria-hidden", "true");
      var tap = !img.closest("a, button");
      ids.forEach(function (r) {
        var P = buildRig(r);
        P.root.classList.add("coamo-rig--full");
        P.banner = true;
        if (tap) {
          P.root.classList.add("coamo-rig--tap");
          P.root.addEventListener("pointerdown", function () { play(P, Math.random() < .5 ? "celebrate" : "wave", true); });
        }
        ov.appendChild(P.root);
      });
      var card = img.closest(".game-menu-card");
      if (card) card.addEventListener("pointerenter", function () {
        ov.querySelectorAll(".coamo-rig").forEach(function (r, i) { setTimeout(function () { play(r._puppet, "wave"); }, i * 220); });
      });
      mount(img, ov, function () {
        img.dataset.coamoOriginal = img.getAttribute("src");
        img.removeAttribute("srcset");
        img.src = B.plate;
      });
    }).catch(function () { delete img.dataset.coamoRig; });
  }

  /* mascote solto: esconde o PNG (mantém o espaço) e põe o boneco no lugar */
  function liveMascot(img, id) {
    if (img.dataset.coamoRig || !RIGS[id]) return;
    img.dataset.coamoRig = "solo";
    preload(RIGS[id].layers.map(function (L) { return L.f; })).then(function () {
      var P = buildRig(id);
      P.root.classList.add("coamo-rig--solo");
      P.img = img;
      P.root.addEventListener("pointerdown", function () { play(P, "celebrate", true); });
      mount(img, P.root, function () { img.classList.add("coamo-rig-hidden"); });
    }).catch(function () { delete img.dataset.coamoRig; });
  }

  function scan(root) {
    (root || document).querySelectorAll("img").forEach(function (img) {
      if (img.closest(".coamo-rig, .coamo-stage")) return;
      var src = img.getAttribute("src") || "", f = fileOf(src);
      if (BANNERS[f] && /games\/v4[6-9]\//.test(src)) liveBanner(img, BANNERS[f]);
      else if (IMAGE_RIGS[f]) liveMascot(img, IMAGE_RIGS[f]);
    });
  }

  /* ---------------------------------------------------------- visibilidade */
  var io = window.IntersectionObserver ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var on = e.isIntersecting;
      e.target.classList.toggle("is-paused", !on);
      e.target.querySelectorAll(".coamo-rig").forEach(function (r) { r._puppet.visible = on; });
      if (e.target._puppet) e.target._puppet.visible = on;
      if (on && !e.target.dataset.greeted) {
        e.target.dataset.greeted = "1";
        var list = e.target._puppet ? [e.target._puppet] : Array.prototype.map.call(e.target.querySelectorAll(".coamo-rig"), function (r) { return r._puppet; });
        list.forEach(function (P, i) { setTimeout(function () { play(P, "wave"); }, 500 + i * 450); });
      }
    });
  }, { threshold: 0.1 }) : null;
  function watch(el) { if (io) io.observe(el); }
  function shown(P) { return P.visible && !document.hidden && P.root.offsetParent !== null; }

  /* ---------------------------------------------------------- ações */
  function blink(P, hold) {
    var e = P.parts.eyes_closed;
    if (!e || reduce) return;
    anim(e, [{ opacity: 1 }, { opacity: 1 }], { duration: hold || 120, easing: "linear" });
  }
  function scheduleBlink(P) {
    setTimeout(function () {
      if (shown(P)) {
        blink(P);
        if (Math.random() < 0.22) setTimeout(function () { blink(P); }, 230);
      }
      scheduleBlink(P);
    }, rand(2200, 5200));
  }
  function talk(P, ms) {
    var m = P.parts.mouth_open;
    if (!m) return;
    var n = Math.max(2, Math.round(ms / 170)), fr = [];
    for (var i = 0; i < n; i++) { fr.push({ opacity: i % 2 ? 0 : 1 }); }
    fr.push({ opacity: 0 });
    anim(m, fr, { duration: ms, easing: "steps(" + (n + 1) + ", end)" });
    anim(P.parts.head, [{ rotate: "0deg" }, { rotate: "-1.6deg" }, { rotate: "1.2deg" }, { rotate: "-1deg" }, { rotate: "0deg" }], { duration: ms });
  }

  function pup(P, frames, opts) { if (!P.banner) anim(P.puppet, frames, opts); }

  var ACTIONS = {
    talk: function (P, o) { var ms = (o && o.ms) || 1200; talk(P, ms); return ms; },

    wave: function (P) {
      var u = P.R.up, a = P.parts.arm || P.parts.arm2;
      var amp = P.R.arm === "shoulder" ? 13 : 17;
      anim(a, [{ rotate: "0deg" }, { rotate: (u * amp) + "deg" }, { rotate: (u * amp * .25) + "deg" }, { rotate: (u * amp) + "deg" }, { rotate: (u * amp * .25) + "deg" }, { rotate: "0deg" }], { duration: 1300 });
      anim(P.parts.head, [{ rotate: "0deg" }, { rotate: (-u * 3) + "deg" }, { rotate: (-u * 3) + "deg" }, { rotate: "0deg" }], { duration: 1300 });
      pup(P, [{ translate: "0 0" }, { translate: "0 -1.2%" }, { translate: "0 0" }], { duration: 650, iterations: 2 });
      talk(P, 700);
      return 1300;
    },

    celebrate: function (P) {
      var u = P.R.up, amp = P.R.arm === "shoulder" ? 16 : 22;
      var jump = "-7%";
      pup(P, [
        { translate: "0 0", scale: "1 1" }, { translate: "0 0", scale: "1.04 .95", offset: .14 },
        { translate: "0 " + jump, scale: ".97 1.04", offset: .34 }, { translate: "0 0", scale: "1.03 .97", offset: .52 },
        { translate: "0 -3.5%", scale: "1 1", offset: .7 }, { translate: "0 0", scale: "1 1" }
      ], { duration: 1200, easing: "cubic-bezier(.3,.7,.4,1)" });
      ["arm", "arm2"].forEach(function (k, i) {
        anim(P.parts[k], [{ rotate: "0deg" }, { rotate: ((i ? -u : u) * amp) + "deg", offset: .3 }, { rotate: ((i ? -u : u) * amp * .4) + "deg", offset: .55 }, { rotate: ((i ? -u : u) * amp) + "deg", offset: .75 }, { rotate: "0deg" }], { duration: 1200 });
      });
      anim(P.parts.head, [{ rotate: "0deg" }, { rotate: "-4deg", offset: .3 }, { rotate: "3deg", offset: .6 }, { rotate: "0deg" }], { duration: 1200 });
      anim(P.parts.mouth_open, [{ opacity: 1 }, { opacity: 1 }], { duration: 1050, easing: "linear" });
      return 1250;
    },

    think: function (P) {
      var u = P.R.up;
      anim(P.parts.head, [{ rotate: "0deg" }, { rotate: (u * -6) + "deg", offset: .2 }, { rotate: (u * -7) + "deg", offset: .5 }, { rotate: (u * -6) + "deg", offset: .8 }, { rotate: "0deg" }], { duration: 2600, easing: "ease-in-out" });
      anim(P.parts.arm, [{ rotate: "0deg" }, { rotate: (u * 4) + "deg", offset: .25 }, { rotate: (u * 5) + "deg", offset: .75 }, { rotate: "0deg" }], { duration: 2600 });
      pup(P, [{ rotate: "0deg" }, { rotate: (u * 1) + "deg", offset: .3 }, { rotate: (u * 1) + "deg", offset: .8 }, { rotate: "0deg" }], { duration: 2600 });
      var t = P.parts.head && P.parts.head.querySelector(".coamo-rig__think");
      if (t) { t.classList.remove("is-on"); void t.offsetWidth; t.classList.add("is-on"); setTimeout(function () { t.classList.remove("is-on"); }, 2500); }
      setTimeout(function () { blink(P, 160); }, 900);
      return 2600;
    },

    oops: function (P) {
      var u = P.R.up;
      anim(P.parts.head, [{ rotate: "0deg" }, { rotate: "-5deg", offset: .18 }, { rotate: "5deg", offset: .38 }, { rotate: "-4deg", offset: .58 }, { rotate: "2deg", offset: .78 }, { rotate: "0deg" }], { duration: 950 });
      anim(P.parts.arm, [{ rotate: "0deg" }, { rotate: (-u * 8) + "deg", offset: .3 }, { rotate: (-u * 8) + "deg", offset: .7 }, { rotate: "0deg" }], { duration: 950 });
      pup(P, [{ translate: "0 0", scale: "1 1" }, { translate: "0 0", scale: "1.02 .97", offset: .25 }, { translate: "0 0", scale: "1 1" }], { duration: 700 });
      blink(P, 340);
      return 950;
    }
  };

  function play(P, name, force) {
    if (!P || reduce || !ACTIONS[name]) return;
    if (P.busy && !force) return;
    P.busy = true;
    var ms = ACTIONS[name](P, arguments[3]) || 1000;
    clearTimeout(P._busyT);
    P._busyT = setTimeout(function () { P.busy = false; }, ms);
  }
  function puppetOf(x) {
    if (!x) return null;
    if (x._puppet) return x._puppet;
    var el = typeof x === "string" ? document.querySelector(x) : x;
    if (!el) return null;
    if (el._puppet) return el._puppet;
    var r = el.querySelector && el.querySelector(".coamo-rig");
    if (r) return r._puppet;
    var img = el.tagName === "IMG" ? el : el.querySelector && el.querySelector("img[data-coamo-rig]");
    var sib = img && img.nextElementSibling;
    return sib && sib._puppet || null;
  }

  /* ---------------------------------------------------------- falas e reações */
  function bindSpeech(cap) {
    if (!cap || cap.dataset.coamoSpeech) return;
    cap.dataset.coamoSpeech = "1";
    new MutationObserver(function () {
      var fig = cap.closest("figure");
      var img = fig && fig.querySelector("img");
      var P = puppetOf(img);
      var txt = cap.textContent || "";
      cap.classList.remove("is-said"); void cap.offsetWidth; cap.classList.add("is-said");
      if (!P) return;
      var ms = Math.max(900, Math.min(2600, txt.length * 42));
      if (OOPS.test(txt)) { play(P, "oops", true); setTimeout(function () { P.busy = false; play(P, "talk", true, { ms: ms }); }, 950); }
      else if (YAY.test(txt) && Math.random() < .6) { play(P, "celebrate", true); }
      else play(P, "talk", true, { ms: ms });
    }).observe(cap, { childList: true, characterData: true, subtree: true });
  }
  function scanSpeech(root) {
    (root || document).querySelectorAll("#leftMascotSpeech, #rightMascotSpeech, #grainToninhoSpeech, #grainAroldinhoSpeech, #siloToninho, #siloAroldinho").forEach(bindSpeech);
  }

  /* guias nos jogos que não tinham os mascotes (o app.v48.js já envia as falas) */
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
    var anchor = panel.querySelector(".memory-status, .game-progress, #chainTrack, .profile-game");
    if (anchor && anchor.parentElement === panel) panel.insertBefore(box, anchor);
    else { var poster = panel.querySelector(".game-stage-poster-v34"); if (poster) poster.insertAdjacentElement("afterend", box); else panel.insertBefore(box, panel.firstChild); }
  }
  /* app.v48.js marca o painel com is-success-reaction / is-error-reaction */
  function bindReactions() {
    document.querySelectorAll(".game-panel--single").forEach(function (panel) {
      new MutationObserver(function () {
        var ok = panel.classList.contains("is-success-reaction"), bad = panel.classList.contains("is-error-reaction");
        if (!ok && !bad) return;
        panel.querySelectorAll(".coamo-guide .coamo-rig").forEach(function (r, i) {
          setTimeout(function () { play(r._puppet, bad ? "oops" : "celebrate", true); }, i * 160);
        });
      }).observe(panel, { attributes: true, attributeFilter: ["class"] });
    });
  }

  /* vida própria: gestos de tempos em tempos e "pensativo" quando ninguém joga */
  var lastInput = Date.now();
  ["pointerdown", "keydown", "touchstart"].forEach(function (ev) { document.addEventListener(ev, function () { lastInput = Date.now(); }, { passive: true }); });
  function ambient() {
    var live = puppets.filter(function (P) { return shown(P) && !P.busy; });
    if (live.length) {
      var P = live[Math.floor(Math.random() * live.length)];
      var idle = Date.now() - lastInput > 8000;
      var r = Math.random();
      play(P, idle && r < .5 ? "think" : r < .45 ? "wave" : r < .7 ? "think" : r < .85 ? "talk" : "celebrate", false, { ms: 900 });
    }
    setTimeout(ambient, rand(3200, 6200));
  }

  function init() {
    if (!Object.keys(RIGS).length) return;
    document.documentElement.classList.add("coamo-mascots-v58");
    addGuides();
    scan();
    scanSpeech();
    bindReactions();
    new MutationObserver(function (list) {
      list.forEach(function (rec) {
        rec.addedNodes.forEach(function (n) {
          if (n.nodeType !== 1 || n.closest(".coamo-rig, .coamo-stage")) return;
          var host = n.parentElement || n;
          scan(host); scanSpeech(host);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
    if (!reduce) setTimeout(ambient, 3000);
  }

  window.CoamoMascots = { play: function (x, name) { play(puppetOf(x), name, true); }, puppets: puppets };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
