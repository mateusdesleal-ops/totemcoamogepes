/* =========================================================
   COAMO GAMES — V59 · MASCOTES QUE INTERAGEM COM O JOGO
   - Bonecos articulados (cabeça, braços, piscar) com o rosto original
   - Falas letra a letra, os dois conversando, curiosidades e dicas
   - Passinhos até a jogada, efeitos (+100, ✓, estrelas), entrada em cena
   Os jogos avisam o que acontece pelo evento "coamo:game"
   (app.v59.js / silo.v59.js). As falas ficam em mascotes-falas.v59.js.
   Se algo falhar, os jogos continuam funcionando normalmente.
   ========================================================= */
(function () {
  "use strict";
  var RIGS = window.COAMO_RIGS || {};
  var FALAS = window.COAMO_FALAS || {};
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var page = document.body ? document.body.getAttribute("data-page") : "";

  /* a partir daqui, quem fala nos jogos são os mascotes (o jogo só avisa) */
  var API = window.CoamoMascots = window.CoamoMascots || {};
  API.speaks = !!(RIGS && Object.keys(RIGS).length && FALAS && FALAS.memory);

  var IMAGE_RIGS = {
    "mascote_toninho.png": "g_ton1", "mascote_toninho_pose2.png": "g_ton2",
    "mascote_aroldinho.png": "g_aro1", "mascote_aroldinho_pose2.png": "g_aro2"
  };
  var BANNERS = {
    "hero_coamo_games.png":      { plate: "assets/mascotes/v58/b_hero_plate.webp",           rigs: ["b_hero_aro", "b_hero_ton"] },
    "area_banner.png":           { plate: "assets/mascotes/v58/b_area_plate.webp",           rigs: ["b_area_aro", "b_area_ton"] },
    "memory_banner.png":         { plate: "assets/mascotes/v58/b_memory_plate.webp",         rigs: ["b_memory_aro", "b_memory_ton"] },
    "chain_banner.png":          { plate: "assets/mascotes/v58/b_chain_plate.webp",          rigs: ["b_chain_aro", "b_chain_ton"] },
    "classification_banner.png": { plate: "assets/mascotes/v58/b_classification_plate.webp", rigs: ["b_classification_aro", "b_classification_ton"] },
    "silo_banner.png":           { plate: "assets/mascotes/v58/b_silo_plate.webp",           rigs: ["b_silo_aro", "b_silo_ton"] }
  };
  var GUIDE_GAMES = { "game-profile": 1, "game-memory": 1, "game-chain": 1 };
  var SPEECH = {
    t: ["#leftMascotSpeech", "#grainToninhoSpeech", "#siloToninho"],
    a: ["#rightMascotSpeech", "#grainAroldinhoSpeech", "#siloAroldinho"]
  };

  var puppets = [];
  function fileOf(src) { return (src || "").split("?")[0].split("/").pop(); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(list) { return list && list.length ? list[Math.floor(Math.random() * list.length)] : null; }
  function visible(el) { return !!(el && el.isConnected && el.offsetParent !== null && el.getClientRects().length); }
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

  /* ======================================================== BONECOS */
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
      if (/^mouth/.test(L.n)) return; /* a boca fica sempre a original */
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
    var P = { id: id, R: R, root: root, puppet: puppet, parts: parts, busy: false, visible: true };
    root._puppet = P;
    puppets.push(P);
    scheduleBlink(P);
    return P;
  }

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
  /* algumas telas posicionam os mascotes por ordem (img:first-child / img:last-child).
     Antes de encaixar o boneco ao lado da imagem, fixamos a posição atual dela,
     para que a nova peça não mude qual é a "primeira" ou a "última". */
  function freezePlacement(img) {
    var cs = getComputedStyle(img);
    if (cs.position !== "absolute" && cs.position !== "fixed") return;
    ["left", "right", "top", "bottom", "height", "width"].forEach(function (k) {
      if (!img.style[k] && cs[k] !== "auto") img.style.setProperty(k, cs[k], "important");
    });
  }
  function mount(img, overlay, after) {
    var parent = img.parentElement;
    freezePlacement(img);
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

  function liveBanner(img, B) {
    if (img.dataset.coamoRig) return;
    var ids = B.rigs.filter(function (r) { return RIGS[r]; });
    if (!ids.length) return;
    img.dataset.coamoRig = "banner";
    var srcs = [B.plate];
    ids.forEach(function (r) { RIGS[r].layers.forEach(function (L) { if (!/^mouth/.test(L.n)) srcs.push(L.f); }); });
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

  function liveMascot(img, id) {
    if (img.dataset.coamoRig || !RIGS[id]) return;
    img.dataset.coamoRig = "solo";
    preload(RIGS[id].layers.filter(function (L) { return !/^mouth/.test(L.n); }).map(function (L) { return L.f; })).then(function () {
      var P = buildRig(id);
      P.root.classList.add("coamo-rig--solo");
      P.img = img;
      P.root.addEventListener("pointerdown", function () { play(P, "celebrate", true); });
      mount(img, P.root, function () { img.classList.add("coamo-rig-hidden"); });
    }).catch(function () { delete img.dataset.coamoRig; });
  }

  function scan(root) {
    (root || document).querySelectorAll("img").forEach(function (img) {
      if (img.closest(".coamo-rig, .coamo-stage, .cg-banner")) return;
      var src = img.getAttribute("src") || "", f = fileOf(src);
      if (BANNERS[f] && /games\/v4[6-9]\//.test(src) && !newBanners()) liveBanner(img, BANNERS[f]);
      else if (IMAGE_RIGS[f]) liveMascot(img, IMAGE_RIGS[f]);
    });
  }
  function newBanners() { return !!(window.COAMO_NEW_BANNERS || document.querySelector('script[src*="mascotes-banners"]')); }
  API.scan = scan;
  API.buildRig = buildRig;

  var io = window.IntersectionObserver ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var on = e.isIntersecting;
      e.target.classList.toggle("is-paused", !on);
      e.target.querySelectorAll(".coamo-rig").forEach(function (r) { r._puppet.visible = on; });
      if (e.target._puppet) e.target._puppet.visible = on;
      if (on && !e.target.dataset.greeted && !e.target.closest(".coamo-guide")) {
        e.target.dataset.greeted = "1";
        var list = e.target._puppet ? [e.target._puppet] : Array.prototype.map.call(e.target.querySelectorAll(".coamo-rig"), function (r) { return r._puppet; });
        list.forEach(function (P, i) { setTimeout(function () { play(P, "wave"); }, 500 + i * 450); });
      }
    });
  }, { threshold: 0.1 }) : null;
  function watch(el) { if (io) io.observe(el); }
  API.watch = watch;
  function shown(P) { return P.visible && !document.hidden && P.root.offsetParent !== null; }

  /* ======================================================== AÇÕES DO CORPO */
  function blink(P, hold) {
    var e = P.parts.eyes_closed;
    if (!e || reduce) return;
    anim(e, [{ opacity: 1 }, { opacity: 1 }], { duration: hold || 120, easing: "linear" });
  }
  function scheduleBlink(P) {
    setTimeout(function () {
      if (shown(P)) { blink(P); if (Math.random() < 0.22) setTimeout(function () { blink(P); }, 230); }
      scheduleBlink(P);
    }, rand(2200, 5200));
  }
  function pup(P, frames, opts) { if (!P.banner) anim(P.puppet, frames, opts); }

  var ACTIONS = {
    /* falar: a cabeça acompanha a frase (a boca não muda) */
    talk: function (P, o) {
      var ms = (o && o.ms) || 1200, n = Math.max(2, Math.round(ms / 420)), fr = [{ rotate: "0deg", translate: "0 0" }];
      for (var i = 1; i < n; i++) fr.push({ rotate: (i % 2 ? -1.8 : 1.4) + "deg", translate: "0 " + (i % 2 ? "-1%" : "0") });
      fr.push({ rotate: "0deg", translate: "0 0" });
      anim(P.parts.head, fr, { duration: ms });
      return 300;
    },
    wave: function (P) {
      var u = P.R.up, a = P.parts.arm || P.parts.arm2, amp = P.R.arm === "shoulder" ? 13 : 17;
      anim(a, [{ rotate: "0deg" }, { rotate: (u * amp) + "deg" }, { rotate: (u * amp * .25) + "deg" }, { rotate: (u * amp) + "deg" }, { rotate: (u * amp * .25) + "deg" }, { rotate: "0deg" }], { duration: 1300 });
      anim(P.parts.head, [{ rotate: "0deg" }, { rotate: (-u * 3) + "deg" }, { rotate: (-u * 3) + "deg" }, { rotate: "0deg" }], { duration: 1300 });
      pup(P, [{ translate: "0 0" }, { translate: "0 -1.2%" }, { translate: "0 0" }], { duration: 650, iterations: 2 });
      return 1300;
    },
    celebrate: function (P, o) {
      var u = P.R.up, amp = P.R.arm === "shoulder" ? 16 : 22, big = o && o.big;
      pup(P, [
        { translate: "0 0", scale: "1 1" }, { translate: "0 0", scale: "1.04 .95", offset: .14 },
        { translate: "0 " + (big ? "-10%" : "-6%"), scale: ".97 1.04", offset: .34 }, { translate: "0 0", scale: "1.03 .97", offset: .52 },
        { translate: "0 " + (big ? "-5%" : "-3%"), scale: "1 1", offset: .7 }, { translate: "0 0", scale: "1 1" }
      ], { duration: 1200, easing: "cubic-bezier(.3,.7,.4,1)", iterations: big ? 2 : 1 });
      ["arm", "arm2"].forEach(function (k, i) {
        anim(P.parts[k], [{ rotate: "0deg" }, { rotate: ((i ? -u : u) * amp) + "deg", offset: .3 }, { rotate: ((i ? -u : u) * amp * .4) + "deg", offset: .55 }, { rotate: ((i ? -u : u) * amp) + "deg", offset: .75 }, { rotate: "0deg" }], { duration: 1200, iterations: big ? 2 : 1 });
      });
      anim(P.parts.head, [{ rotate: "0deg" }, { rotate: "-4deg", offset: .3 }, { rotate: "3deg", offset: .6 }, { rotate: "0deg" }], { duration: 1200, iterations: big ? 2 : 1 });
      if (big) setTimeout(function () { blink(P, 380); }, 300);
      return big ? 2400 : 1250;
    },
    /* pensativo: só corpo — cabeça inclinada e olhar parado */
    think: function (P) {
      var u = P.R.up;
      anim(P.parts.head, [{ rotate: "0deg" }, { rotate: (u * -7) + "deg", offset: .2 }, { rotate: (u * -8) + "deg", offset: .5 }, { rotate: (u * -7) + "deg", offset: .8 }, { rotate: "0deg" }], { duration: 2600 });
      anim(P.parts.arm, [{ rotate: "0deg" }, { rotate: (u * 4) + "deg", offset: .25 }, { rotate: (u * 5) + "deg", offset: .75 }, { rotate: "0deg" }], { duration: 2600 });
      pup(P, [{ rotate: "0deg" }, { rotate: (u * 1.2) + "deg", offset: .3 }, { rotate: (u * 1.2) + "deg", offset: .8 }, { rotate: "0deg" }], { duration: 2600 });
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
  function play(P, name, force, o) {
    if (!P || reduce || !ACTIONS[name]) return;
    if (P.busy && !force) return;
    P.busy = true;
    var ms = ACTIONS[name](P, o) || 1000;
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
  API.play = function (x, name) { play(puppetOf(x), name, true); };
  API.puppets = puppets;

  /* ======================================================== PERSONAGENS NA TELA */
  function speaker(who) {
    var list = SPEECH[who] || [];
    for (var i = 0; i < list.length; i++) {
      var cap = document.querySelector(list[i]);
      if (visible(cap)) {
        var fig = cap.closest("figure");
        var img = fig && fig.querySelector("img[data-coamo-rig]");
        return { who: who, cap: cap, fig: fig, P: puppetOf(img) };
      }
    }
    return null;
  }
  function bothSpeakers() { return [speaker("t"), speaker("a")].filter(Boolean); }

  /* ---------- passinhos até a jogada ---------- */
  function walkTo(S, target, after) {
    if (!S || !S.fig || !target || reduce || !visible(target)) { if (after) after(); return; }
    var fig = S.fig, cont = fig.parentElement;
    var fr = fig.getBoundingClientRect(), tr = target.getBoundingClientRect(), cr = cont.getBoundingClientRect();
    var cur = fig._x || 0;
    var homeL = fr.left - cur, homeR = fr.right - cur;
    var want = (tr.left + tr.width / 2) - (homeL + homeR) / 2;
    var minL = cr.left, maxR = cr.right;
    if (cont.classList.contains("coamo-guides") && cr.width > 700) {
      /* cada um anda só na sua metade, para os balões não se cruzarem */
      var mid = cr.left + cr.width / 2;
      if (S.who === "t") maxR = mid - 12; else minL = mid + 12;
    }
    var dx = Math.max(minL - homeL, Math.min(maxR - homeR, want));
    if (Math.abs(dx - cur) < 40) { if (after) after(); return; }
    hop(fig, cur, dx, function () {
      fig._x = dx;
      if (after) after();
      clearTimeout(fig._home);
      fig._home = setTimeout(function () { goHome(S); }, 1900);
    });
  }
  function goHome(S) {
    var fig = S && S.fig;
    if (!fig || !fig._x) return;
    var from = fig._x;
    hop(fig, from, 0, function () { fig._x = 0; });
  }
  function hop(fig, from, to, done) {
    var dist = Math.abs(to - from), steps = Math.max(2, Math.min(7, Math.round(dist / 70))), fr = [];
    for (var i = 0; i <= steps; i++) {
      var x = from + (to - from) * (i / steps);
      fr.push({ translate: x + "px 0", rotate: (i === 0 || i === steps ? 0 : (i % 2 ? 2.5 : -2.5)) + "deg" });
      if (i < steps) fr.push({ translate: (from + (to - from) * ((i + .5) / steps)) + "px -14px", rotate: "0deg" });
    }
    fig.classList.add("is-walking");
    var a = fig.animate ? fig.animate(fr, { duration: 170 * steps + 120, easing: "linear", fill: "forwards" }) : null;
    var fin = function () {
      fig.style.translate = to + "px 0";
      if (a) try { a.cancel(); } catch (e) {}
      fig.classList.remove("is-walking");
      if (done) done();
    };
    if (a) a.onfinish = fin; else fin();
  }
  function nearest(target) {
    var list = bothSpeakers();
    if (!target || list.length < 2) return list[0] || null;
    var tr = target.getBoundingClientRect(), tx = tr.left + tr.width / 2;
    list.sort(function (A, B) {
      var a = A.fig.getBoundingClientRect(), b = B.fig.getBoundingClientRect();
      return Math.abs(a.left + a.width / 2 - tx) - Math.abs(b.left + b.width / 2 - tx);
    });
    return list[0];
  }

  /* ---------- entrada em cena ---------- */
  function enter(S, side, delay) {
    if (!S || !S.fig || reduce) return;
    var fig = S.fig, r = fig.getBoundingClientRect();
    var off = side < 0 ? -(r.right + 40) : (window.innerWidth - r.left + 40);
    fig.style.translate = off + "px 0";
    setTimeout(function () {
      hop(fig, off, 0, function () { fig._x = 0; fig.style.translate = ""; play(S.P, "wave", true); });
    }, delay || 0);
  }

  /* ---------- efeitos ---------- */
  function fx(target, text, kind) {
    if (!target || reduce || !visible(target)) return;
    var r = target.getBoundingClientRect();
    var el = document.createElement("span");
    el.className = "cg-fx cg-fx--" + (kind || "gold");
    el.textContent = text;
    el.style.left = (r.left + r.width / 2) + "px";
    el.style.top = (r.top + Math.min(r.height * .35, 60)) + "px";
    document.body.appendChild(el);
    var a = el.animate([
      { opacity: 0, translate: "-50% 10px", scale: ".6" },
      { opacity: 1, translate: "-50% -12px", scale: "1.15", offset: .25 },
      { opacity: 1, translate: "-50% -40px", scale: "1", offset: .7 },
      { opacity: 0, translate: "-50% -70px", scale: ".95" }
    ], { duration: 1100, easing: "ease-out" });
    a.onfinish = function () { el.remove(); };
  }
  function stars(S, n) {
    if (!S || !S.fig || reduce) return;
    var r = S.fig.querySelector("img[data-coamo-rig]") || S.fig;
    r = r.getBoundingClientRect();
    for (var i = 0; i < (n || 8); i++) (function (i) {
      var el = document.createElement("span");
      el.className = "cg-star";
      el.textContent = i % 3 ? "✦" : "★";
      el.style.left = (r.left + r.width / 2) + "px";
      el.style.top = (r.top + r.height * .35) + "px";
      document.body.appendChild(el);
      var ang = (i / (n || 8)) * Math.PI * 2 + rand(-.3, .3), d = rand(60, 120);
      var a = el.animate([
        { opacity: 0, translate: "-50% -50%", scale: ".3", rotate: "0deg" },
        { opacity: 1, offset: .2 },
        { opacity: 0, translate: "calc(-50% + " + Math.cos(ang) * d + "px) calc(-50% + " + Math.sin(ang) * d + "px)", scale: "1.1", rotate: rand(-90, 90) + "deg" }
      ], { duration: 950, delay: i * 25, easing: "cubic-bezier(.2,.7,.3,1)", fill: "backwards" });
      a.onfinish = function () { el.remove(); };
    })(i);
  }

  /* ======================================================== FALAS */
  var speech = { prio: -1, token: 0, timers: [], typing: {} };
  function fill(text, vars) {
    return String(text).replace(/\{(\w+)\}/g, function (_, k) { return vars && vars[k] != null ? vars[k] : ""; });
  }
  function clearSpeech() {
    speech.timers.forEach(clearTimeout); speech.timers = [];
    Object.keys(speech.typing).forEach(function (k) { clearInterval(speech.typing[k]); });
    speech.typing = {};
  }
  function typeLine(S, text, token) {
    var cap = S.cap, i = 0;
    clearInterval(speech.typing[S.who]);
    cap.classList.remove("is-said"); void cap.offsetWidth; cap.classList.add("is-said");
    cap.setAttribute("aria-label", text);
    cap.textContent = "";
    if (reduce) { cap.textContent = text; return; }
    speech.typing[S.who] = setInterval(function () {
      if (token !== speech.token) { clearInterval(speech.typing[S.who]); cap.textContent = text; return; }
      i += 2;
      cap.textContent = text.slice(0, i);
      if (i >= text.length) { clearInterval(speech.typing[S.who]); cap.textContent = text; }
    }, 34);
  }
  /* script = [["t","..."],["a","..."]] */
  function say(script, prio, vars) {
    if (!API.speaks || !script || !script.length) return false;
    if (speech.prio > prio) return false;
    clearSpeech();
    var token = ++speech.token, t = 0;
    speech.prio = prio;
    script.forEach(function (line, idx) {
      var who = line[0], text = fill(line[1], vars);
      speech.timers.push(setTimeout(function () {
        if (token !== speech.token) return;
        var S = speaker(who) || speaker(who === "t" ? "a" : "t");
        if (!S) return;
        typeLine(S, text, token);
        var talkMs = Math.min(2600, 500 + text.length * 17);
        if (S.P && !S.P.busy) play(S.P, "talk", false, { ms: talkMs });
      }, t));
      t += Math.max(1500, 700 + text.length * 45);
    });
    speech.timers.push(setTimeout(function () { if (token === speech.token) speech.prio = -1; }, t));
    return true;
  }
  function sayFrom(bank, prio, vars) { return say(pick(bank), prio, vars); }
  API.say = say;

  /* ======================================================== DIRETOR DO JOGO */
  var state = { running: false, game: "", lastInput: Date.now(), lastHint: 0, prev: "", missRow: 0, seen: {}, entered: false, finishedAt: 0, ambientDone: false };
  ["pointerdown", "keydown", "touchstart"].forEach(function (ev) {
    document.addEventListener(ev, function () { state.lastInput = Date.now(); }, { passive: true, capture: true });
  });

  function react(kind, target, opts) {
    var list = bothSpeakers();
    if (!list.length) return;
    opts = opts || {};
    if (kind === "good") {
      var S = nearest(target);
      var other = list.filter(function (x) { return x !== S; })[0];
      var go = function () { if (S) play(S.P, "celebrate", true); };
      if (opts.walk && GUIDE_GAMES[page]) walkTo(S, target, go); else go();
      if (other && Math.random() < .5) setTimeout(function () { play(other.P, "wave"); }, 250);
    } else if (kind === "bad") {
      list.forEach(function (S, i) { setTimeout(function () { play(S.P, "oops", true); }, i * 140); });
      if (opts.walk && GUIDE_GAMES[page]) walkTo(nearest(target), target);
    } else if (kind === "big") {
      list.forEach(function (S, i) { setTimeout(function () { goHome(S); play(S.P, "celebrate", true, { big: true }); stars(S, 10); }, i * 220); });
    } else if (kind === "sad") {
      list.forEach(function (S, i) { setTimeout(function () { goHome(S); play(S.P, "oops", true); }, i * 200); });
      setTimeout(function () { list.forEach(function (S) { play(S.P, "think", true); }); }, 1100);
    }
  }

  function whenVisible(cb, tries) {
    var S = speaker("t") || speaker("a");
    if (S) return cb();
    if ((tries || 0) > 240) return;
    setTimeout(function () { whenVisible(cb, (tries || 0) + 1); }, 250);
  }
  function onStart(bank, vars) {
    state.running = true; state.missRow = 0; state.seen = {}; state.prev = ""; state.lastHint = Date.now(); state.ambientDone = false;
    whenVisible(function () {
      var list = bothSpeakers();
      var wait = 0;
      if (!state.entered && list.length) {
        state.entered = true;
        list.forEach(function (S, i) { enter(S, S.who === "t" ? -1 : 1, i * 180); });
        wait = 1300;
      }
      setTimeout(function () { sayFrom(bank, 2, vars); }, wait);
    });
  }

  var H = {
    profile: function (d, F) {
      if (d.type === "start") return onStart(F.start);
      if (d.type === "answer") {
        fx(d.el, "+" + (d.gain || 100) + " XP", "gold");
        react("good", d.el, { walk: true });
        var script = pick(F.answer[d.primary]) || [];
        if (d.step === Math.ceil(d.total / 2)) script = script.concat(pick(F.half) || []);
        else if (d.step === d.total - 1) script = script.concat(pick(F.last) || []);
        return say(script, 2, d);
      }
      if (d.type === "finish") { state.running = false; state.finishedAt = Date.now(); react("big"); return sayFrom(F.finish, 5, d); }
    },
    memory: function (d, F) {
      if (d.type === "start") return onStart(F.start);
      if (d.type === "match") {
        state.missRow = 0;
        fx(d.el, d.streak >= 2 ? "✓ Combo x" + d.streak : "✓ Par!", "green");
        react("good", d.el, { walk: true });
        var script = [];
        if (!state.seen[d.pairId] && FALAS.curiosidades && FALAS.curiosidades[d.pairId]) { script = FALAS.curiosidades[d.pairId]; state.seen[d.pairId] = 1; }
        else if (d.streak >= 2) script = pick(F.streak);
        if (d.matches === d.total - 1) script = script.concat(pick(F.lastPair) || []);
        else if (d.matches === Math.round(d.total / 2)) script = script.concat(pick(F.half) || []);
        return say(script, 3, d);
      }
      if (d.type === "miss") {
        state.missRow += 1;
        react("bad", d.el, { walk: false });
        return state.missRow >= 3 ? (state.missRow = 0, sayFrom(F.missStreak, 3, d)) : sayFrom(F.miss, 2, d);
      }
      if (d.type === "finish") { state.running = false; state.finishedAt = Date.now(); setTimeout(function () { react("big"); }, 200); return sayFrom(F.finish, 5, d); }
    },
    chain: function (d, F) {
      if (d.type === "start") return onStart(F.start);
      if (d.type === "turn") { state.prev = d.prev; state.step = d.step; return; }
      if (d.type === "correct") {
        fx(d.el, "+" + (d.gain || 100), "gold");
        react("good", d.el, { walk: true });
        var script = (d.step === 1 ? (pick(F.correctFirst) || []) : []).concat(pick(F.correct) || []);
        return say(script, 3, d);
      }
      if (d.type === "wrong") {
        fx(d.el, "−1 ❤", "red");
        react("bad", d.el, { walk: true });
        var s2 = d.step === 1 ? pick(F.wrongFirst) : pick(F.wrong);
        if (d.hearts === 1) s2 = (s2 || []).concat(pick(F.lastLife) || []);
        return say(s2, 3, d);
      }
      if (d.type === "gameover") { state.running = false; state.finishedAt = Date.now(); react("sad"); return sayFrom(F.gameover, 5, d); }
      if (d.type === "finish") { state.running = false; state.finishedAt = Date.now(); react("big"); return sayFrom(F.finish, 5, d); }
    },
    grain: function (d, F) {
      if (d.type === "start") { state.entered = true; return onStart(F.start); }
      if (d.type === "hit") {
        fx(d.el, "+" + d.gain, "gold");
        react("good", d.el);
        var c = d.combo;
        if (c === 3) return sayFrom(F.combo3, 3, d);
        if (c === 6) return sayFrom(F.combo6, 3, d);
        if (c === 10) return sayFrom(F.combo10, 3, d);
        if (c >= 15 && c % 5 === 0) return sayFrom(F.combo15, 3, d);
        if (Math.random() < .3) return sayFrom(F.hit, 1, d);
        return;
      }
      if (d.type === "miss" || d.type === "escape") {
        if (d.el) fx(d.el, "−1 ❤", "red");
        react("bad", d.el);
        if (d.lives === 1) return sayFrom(F.lastLife, 3, d);
        return sayFrom(d.type === "miss" ? F.miss : F.escape, 2, d);
      }
      if (d.type === "phase") return sayFrom(d.phase === 5 ? F.phase5 : F.phase, 3, d);
      if (d.type === "finish") {
        state.running = false; state.finishedAt = Date.now();
        var key = /ouro/i.test(d.title) ? "gold" : /prata/i.test(d.title) ? "silver" : "bronze";
        return sayFrom(F.finish[key], 5, d);
      }
    },
    silo: function (d, F) {
      if (d.type === "start") { state.entered = true; return onStart(F.start); }
      if (d.type === "assign" || d.type === "correct") {
        fx(d.el, "+" + d.gain, "gold");
        react("good", d.el);
        if (d.type === "assign") return sayFrom(F.assign, 3, d);
        if (d.combo === 3) return sayFrom(F.combo3, 3, d);
        if (d.combo === 6 || (d.combo > 6 && d.combo % 4 === 2)) return sayFrom(F.combo6, 3, d);
        if (Math.random() < .3) return sayFrom(F.correct, 1, d);
        return;
      }
      if (d.type === "capacity") { state.lastBad = "capacity"; return; }
      if (d.type === "timeout") { state.lastBad = "timeout"; return; }
      if (d.type === "wrong") {
        if (d.el) fx(d.el, "−1 ❤", "red");
        react("bad", d.el);
        var bank = state.lastBad === "capacity" ? F.capacity : state.lastBad === "timeout" ? F.timeout : F.wrong;
        state.lastBad = "";
        if (d.lives === 1) return say((pick(bank) || []).concat(pick(F.lastLife) || []), 3, d);
        return sayFrom(bank, 3, d);
      }
      if (d.type === "load") { if (d.known && Math.random() < .25) sayFrom(F.known, 1, d); return; }
      if (d.type === "expedition") return sayFrom(F.expedition, 2, d);
      if (d.type === "time") return sayFrom(d.seconds <= 10 ? F.time10 : F.time30, 3, d);
      if (d.type === "finish") {
        state.running = false; state.finishedAt = Date.now();
        return sayFrom(d.survived ? F.finish.win : F.finish.lose, 5, d);
      }
    }
  };

  document.addEventListener("coamo:game", function (e) {
    var d = e.detail || {};
    state.game = d.game;
    var F = FALAS[d.game];
    if (!F || !H[d.game]) return;
    try { H[d.game](d, F); } catch (err) { if (window.console) console.warn("mascotes", err); }
  });

  /* dicas quando a pessoa para de jogar + vida própria */
  function idleLoop() {
    var now = Date.now(), idle = now - state.lastInput;
    var F = FALAS[state.game];
    if (state.running && F && F.idle && idle > 9000 && now - state.lastHint > 16000 && speech.prio < 0) {
      state.lastHint = now;
      var bank = state.game === "chain" && state.step === 1 && F.idleFirst ? F.idleFirst : F.idle;
      if (state.game === "chain" && !state.prev) bank = F.idleFirst || bank;
      sayFrom(bank, 1, { prev: state.prev });
      var S = pick(bothSpeakers());
      if (S) play(S.P, "think", true);
    } else if (!state.running && state.finishedAt && !state.ambientDone && now - state.finishedAt > 15000 && idle > 15000 && speech.prio < 0) {
      state.ambientDone = true;
      sayFrom(FALAS.ambient, 0, {});
    }
    setTimeout(idleLoop, 1000);
  }

  /* espiar o tabuleiro / gestos de vez em quando */
  function ambient() {
    var now = Date.now();
    var live = puppets.filter(function (P) { return shown(P) && !P.busy; });
    if (live.length) {
      var guides = bothSpeakers();
      if (GUIDE_GAMES[page] && state.running && guides.length && now - state.lastInput > 5000 && speech.prio < 0 && Math.random() < .45) {
        var S = pick(guides), board = document.querySelector("#memoryGrid, #chainOptions, #profileGame");
        if (S && board && visible(board)) {
          walkTo(S, board, function () { play(S.P, "think", true); });
        }
      } else {
        var P = live[Math.floor(Math.random() * live.length)], r = Math.random();
        play(P, r < .5 ? "wave" : r < .75 ? "think" : "celebrate");
      }
    }
    setTimeout(ambient, rand(4200, 7500));
  }

  /* guias nos jogos que não tinham os mascotes */
  var GUIDE_TEXT = {
    "game-profile": ["Olá! Eu sou o Toninho.", "E eu sou o Aroldinho!"],
    "game-memory":  ["Olá! Eu sou o Toninho.", "E eu sou o Aroldinho!"],
    "game-chain":   ["Olá! Eu sou o Toninho.", "E eu sou o Aroldinho!"]
  };
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

  /* ao rolar o tabuleiro, os guias descem para o rodapé e continuam presentes */
  function dockGuides() {
    var box = document.querySelector(".coamo-guides");
    if (!box) return;
    var spacer = document.createElement("div");
    spacer.className = "coamo-guides-spacer";
    box.parentElement.insertBefore(spacer, box);
    var docked = false, h = 0;
    function check() {
      var big = window.innerHeight >= 900 && window.innerWidth >= 700;
      var top = spacer.getBoundingClientRect().top;
      if (!docked) h = box.offsetHeight;
      var out = big && visible(spacer.parentElement) && top + h < 0;
      if (out === docked) return;
      docked = out;
      spacer.style.height = docked ? h + "px" : "";
      /* no rodapé o grupo vai para o <body>: um ancestral com transform prenderia o position:fixed */
      if (docked) document.body.appendChild(box); else spacer.insertAdjacentElement("afterend", box);
      box.classList.toggle("is-docked", docked);
      if (docked) bothSpeakers().forEach(function (S, i) { setTimeout(function () { play(S.P, "wave", true); }, 350 + i * 200); });
    }
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    setInterval(check, 600);
  }

  function init() {
    if (!Object.keys(RIGS).length) return;
    document.documentElement.classList.add("coamo-mascots-v59");
    addGuides();
    dockGuides();
    scan();
    new MutationObserver(function (list) {
      list.forEach(function (rec) {
        rec.addedNodes.forEach(function (n) {
          if (n.nodeType !== 1 || n.closest(".coamo-rig, .coamo-stage, .cg-banner")) return;
          scan(n.parentElement || n);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
    if (!reduce) { setTimeout(ambient, 3500); }
    setTimeout(idleLoop, 1000);
  }

  if (document.body && document.readyState !== "complete") {
    /* o script fica no fim do <body>: a página acima já existe */
    init();
  } else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
