/* =========================================================
   COAMO GAMES — V60 · BANNERS VETORIAIS
   Substitui as artes antigas (assets/games/v48/*.png) por banners
   desenhados em vetor, com a onda e o sol da marca Coamo, título em
   texto nítido e os mascotes oficiais articulados.
   A imagem original continua no HTML (alt, fallback): se este arquivo
   falhar, a arte antiga aparece normalmente.
   Depende de mascotes.v59.js (bonecos) e mascotes-rigs.v58.js.
   ========================================================= */
(function () {
  "use strict";
  var API = window.CoamoMascots;
  if (!API || !API.buildRig) return;
  window.COAMO_NEW_BANNERS = true;

  var W = 1536, H = 1024;
  var PLACEHOLDER = "data:image/svg+xml;charset=utf-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024"/>');

  /* ---------------------------------------------------------- textos e elenco */
  var BANNERS = {
    "hero_coamo_games.webp": {
      key: "hero", title: "Coamo Games", sub: "Aprenda, jogue e descubra a Coamo de um jeito diferente.",
      left: "g_aro2", right: "g_ton2", scene: hero
    },
    "area_banner.webp": {
      key: "area", title: "Descubra sua área na Coamo", sub: "Responda e descubra o universo profissional que combina com você.",
      left: "g_aro1", right: "g_ton2", scene: area
    },
    "memory_banner.webp": {
      key: "memory", title: "Jogo da Memória", sub: "Encontre os pares e descubra curiosidades da Coamo.",
      left: "g_ton1", right: "g_aro2", scene: memory
    },
    "chain_banner.webp": {
      key: "chain", title: "Monte a cadeia Coamo", sub: "Do campo ao mercado: coloque cada etapa no lugar certo.",
      left: "g_aro1", right: "g_ton1", scene: chain
    },
    "classification_banner.webp": {
      key: "grain", title: "Desafio da Classificação", sub: "Separe grãos e impurezas antes que a esteira acelere.",
      left: "g_ton1", right: "g_aro1", scene: grain
    },
    "silo_banner.webp": {
      key: "silo", title: "Silo em Equilíbrio", sub: "Memorize os destinos e mantenha a operação sob controle.",
      left: "g_aro2", right: "g_ton2", scene: silo
    }
  };

  /* ---------------------------------------------------------- paleta (marca Coamo) */
  var C = {
    deep: "#054d24", leaf: "#3f8a4e", lime: "#8bbd4a", field: "#a9cf6b", field2: "#c9df8a",
    sun1: "#f6cf3c", sun2: "#e0742a", sky1: "#bfe0f0", sky2: "#eef7ec",
    soil: "#b97d45", wood: "#8a5a32", steel: "#e7ecee", steel2: "#b8c4ca", ink: "#103d26", white: "#ffffff"
  };

  /* ---------------------------------------------------------- peças de cenário */
  function defs(id) {
    return '<defs>' +
      '<linearGradient id="' + id + 'sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + C.sky1 + '"/><stop offset=".72" stop-color="' + C.sky2 + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + C.sun1 + '"/><stop offset="1" stop-color="' + C.sun2 + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'wave" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + C.lime + '"/><stop offset=".55" stop-color="#5f9c4c"/><stop offset="1" stop-color="' + C.leaf + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfd8dc"/><stop offset=".45" stop-color="#f7f9fa"/><stop offset="1" stop-color="#b9c5cb"/></linearGradient>' +
      '<pattern id="' + id + 'rows" width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)"><rect width="34" height="34" fill="' + C.field + '"/><rect width="34" height="9" y="12" fill="#97c25c"/></pattern>' +
      '<pattern id="' + id + 'rows2" width="46" height="46" patternUnits="userSpaceOnUse" patternTransform="rotate(6)"><rect width="46" height="46" fill="#7fb24f"/><rect width="46" height="12" y="16" fill="#6ea444"/></pattern>' +
      '</defs>';
  }
  function sky(id, noSun) {
    return '<rect width="1536" height="1024" fill="url(#' + id + 'sky)"/>' +
      (noSun ? '' : '<circle cx="1352" cy="176" r="132" fill="' + C.sun1 + '" opacity=".16"/>' +
      '<circle cx="1352" cy="176" r="84" fill="url(#' + id + 'sun)"/>') +
      cloud(150, 210, .9) + cloud(1120, 300, .55);
  }
  function cloud(x, y, s) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="#fff" opacity=".92">' +
      '<rect x="0" y="22" width="190" height="44" rx="22"/><circle cx="62" cy="26" r="34"/><circle cx="112" cy="18" r="40"/></g>';
  }
  /* horizonte: colinas com fileiras de plantio e a onda verde da marca */
  function land(id, opts) {
    opts = opts || {};
    var horizon = opts.horizon || 600;
    var h = horizon;
    return '' +
      '<path d="M0 ' + (h + 10) + ' C 240 ' + (h - 60) + ' 470 ' + (h - 40) + ' 700 ' + (h + 5) + ' S 1180 ' + (h - 70) + ' 1536 ' + (h - 20) + ' V1024 H0Z" fill="#b8d886"/>' +
      (opts.skyline || '') +
      '<path d="M0 ' + (h + 70) + ' C 300 ' + (h + 10) + ' 560 ' + (h + 40) + ' 820 ' + (h + 80) + ' S 1300 ' + (h + 20) + ' 1536 ' + (h + 50) + ' V1024 H0Z" fill="url(#' + id + 'rows)"/>' +
      /* a onda da logo Coamo atravessando a paisagem */
      '<path d="M-40 ' + (h + 132) + ' C 300 ' + (h + 22) + ' 700 ' + (h + 42) + ' 1000 ' + (h + 102) + ' S 1400 ' + (h + 22) + ' 1580 ' + (h - 78) + '" fill="none" stroke="#fff" stroke-width="12" opacity=".95"/>' +
      '<path d="M-40 ' + (h + 150) + ' C 300 ' + (h + 40) + ' 700 ' + (h + 60) + ' 1000 ' + (h + 120) + ' S 1400 ' + (h + 40) + ' 1580 ' + (h - 60) + ' L1580 ' + (h + 60) + ' C 1400 ' + (h + 190) + ' 1150 ' + (h + 250) + ' 900 ' + (h + 205) + ' S 300 ' + (h + 165) + ' -40 ' + (h + 260) + 'Z" fill="url(#' + id + 'wave)"/>' +
      '<path d="M0 ' + (h + 300) + ' C 380 ' + (h + 240) + ' 760 ' + (h + 270) + ' 1100 ' + (h + 300) + ' S 1400 ' + (h + 280) + ' 1536 ' + (h + 270) + ' V1024 H0Z" fill="url(#' + id + 'rows2)"/>' +
      '<rect y="' + (h + 360) + '" width="1536" height="' + (1024 - h - 360) + '" fill="#5d963f"/>';
  }
  function siloShape(x, y, w, h, fill, label) {
    var r = w / 2;
    return '<g>' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="url(#' + fill + ')" stroke="' + C.steel2 + '" stroke-width="3"/>' +
      '<path d="M' + (x - 6) + ' ' + y + ' L' + (x + r) + ' ' + (y - r * .55) + ' L' + (x + w + 6) + ' ' + y + 'Z" fill="#dfe6e9" stroke="' + C.steel2 + '" stroke-width="3" stroke-linejoin="round"/>' +
      [0.25, 0.5, 0.75].map(function (k) { return '<line x1="' + x + '" x2="' + (x + w) + '" y1="' + (y + h * k) + '" y2="' + (y + h * k) + '" stroke="' + C.steel2 + '" stroke-width="2" opacity=".7"/>'; }).join('') +
      (label ? '<text x="' + (x + r) + '" y="' + (y + h * .18) + '" text-anchor="middle" font-family="Montserrat, sans-serif" font-weight="800" font-size="' + (w * .2) + '" fill="' + C.deep + '">' + label + '</text>' : '') +
      '</g>';
  }
  function skyline(id, x, y, s) {
    /* armazém e silos da cooperativa ao fundo */
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" opacity=".95">' +
      siloShape(0, 40, 70, 150, id + "steel") + siloShape(84, 20, 80, 170, id + "steel") + siloShape(178, 40, 70, 150, id + "steel") +
      '<rect x="262" y="90" width="230" height="100" fill="#f4f7f5" stroke="' + C.steel2 + '" stroke-width="3"/>' +
      '<path d="M252 92 L377 40 L502 92Z" fill="' + C.leaf + '"/>' +
      '<rect x="300" y="130" width="40" height="60" fill="#dbe5df"/><rect x="360" y="130" width="40" height="60" fill="#dbe5df"/><rect x="420" y="130" width="40" height="60" fill="#dbe5df"/>' +
      '</g>';
  }

  /* ---------------------------------------------------------- cenários por jogo */
  function base(id, extra, opts) {
    return '<svg class="cg-banner__scene" viewBox="0 0 1536 1024" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' +
      defs(id) + sky(id, opts && opts.noSun) + land(id, opts) + (extra || '') + '</svg>';
  }
  function hero(id) {
    /* no banner principal o sol é o da própria logo */
    return base(id, '', { horizon: 640, noSun: true, skyline: skyline(id, 600, 548, .72) });
  }
  function area(id) {
    var boards = [
      ["Campo e agro", C.leaf, -1, 0], ["Tecnologia e dados", "#3c5fa8", 1, 1],
      ["Indústria e processos", "#d06a26", -1, 2], ["Pessoas e desenvolvimento", "#b13f6c", 1, 3]
    ];
    var g = '<g transform="translate(768 560)">' +
      '<rect x="-14" y="-40" width="28" height="430" rx="6" fill="' + C.wood + '"/>' +
      boards.map(function (b) {
        var y = b[3] * 74, dir = b[2], w = 330;
        var x0 = dir > 0 ? 6 : -6 - w;
        var tip = dir > 0 ? 'L' + (x0 + w + 34) + ' ' + (y + 31) + ' L' + (x0 + w) + ' ' + (y + 62) : 'L' + (x0 - 34) + ' ' + (y + 31) + ' L' + x0 + ' ' + (y + 62);
        var d = dir > 0
          ? 'M' + x0 + ' ' + y + ' L' + (x0 + w) + ' ' + y + ' ' + tip + ' L' + x0 + ' ' + (y + 62) + 'Z'
          : 'M' + (x0 + w) + ' ' + y + ' L' + x0 + ' ' + y + ' ' + tip + ' L' + (x0 + w) + ' ' + (y + 62) + 'Z';
        return '<path d="' + d + '" fill="' + b[1] + '" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>' +
          '<text x="' + (x0 + w / 2) + '" y="' + (y + 39) + '" text-anchor="middle" font-family="Montserrat, sans-serif" font-weight="800" font-size="23" fill="#fff">' + b[0] + '</text>';
      }).join('') + '</g>';
    return base(id, g, { horizon: 640, skyline: skyline(id, 1040, 520, .8) });
  }
  function card(x, y, rot, face) {
    var inner = face === "corn"
      ? '<rect x="-80" y="-105" width="160" height="210" rx="18" fill="#fff" stroke="' + C.sun1 + '" stroke-width="7"/>' +
        '<ellipse cx="0" cy="-8" rx="26" ry="62" fill="' + C.sun1 + '"/>' +
        [-40, -20, 0, 20, 40].map(function (k) { return '<line x1="-22" x2="22" y1="' + (k - 8) + '" y2="' + (k - 8) + '" stroke="#d9a51c" stroke-width="4"/>'; }).join('') +
        '<path d="M-6 50 C-50 20 -46 -30 -34 -60 C-20 -20 -10 20 -6 50Z" fill="' + C.leaf + '"/><path d="M6 50 C50 20 46 -30 34 -60 C20 -20 10 20 6 50Z" fill="#5f9c4c"/>'
      : face === "soy"
      ? '<rect x="-80" y="-105" width="160" height="210" rx="18" fill="#fff" stroke="' + C.sun1 + '" stroke-width="7"/>' +
        '<path d="M-48 46 C-20 74 30 70 50 30 C66 0 50 -46 28 -60 C10 -30 -20 -10 -44 6 C-62 20 -60 36 -48 46Z" fill="#7cb24a" stroke="' + C.deep + '" stroke-width="5"/>' +
        '<circle cx="-22" cy="28" r="17" fill="#ecdf86"/><circle cx="8" cy="10" r="17" fill="#ecdf86"/><circle cx="32" cy="-16" r="15" fill="#ecdf86"/>'
      : '<rect x="-80" y="-105" width="160" height="210" rx="18" fill="' + C.deep + '" stroke="#fff" stroke-width="7"/>' +
        '<path d="M-44 6 C-14 -26 26 -18 46 -6 C26 -38 -12 -40 -44 6Z" fill="' + C.lime + '"/><circle cx="26" cy="-30" r="16" fill="' + C.sun1 + '"/>';
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')"><rect x="-74" y="-95" width="160" height="210" rx="18" fill="rgba(0,0,0,.14)"/>' + inner + '</g>';
  }
  function memory(id) {
    var table = '<path d="M250 760 L1286 760 L1386 1024 L150 1024Z" fill="#c78b4f"/><path d="M250 760 L1286 760 L1296 784 L240 784Z" fill="#e0a868"/>';
    var cards = card(600, 845, -9, "back") + card(768, 830, 3, "corn") + card(936, 850, 10, "corn") + card(1110, 900, -4, "soy") + card(430, 905, 6, "back");
    return base(id, table + cards, { horizon: 600, skyline: skyline(id, 600, 455, .9) });
  }
  function stop(x, y, icon, n) {
    return '<g transform="translate(' + x + ' ' + y + ')">' +
      '<circle r="52" fill="#fff" stroke="' + C.deep + '" stroke-width="6"/>' + icon +
      '<circle cx="40" cy="-40" r="20" fill="' + C.sun1 + '" stroke="#fff" stroke-width="4"/>' +
      '<text x="40" y="-32" text-anchor="middle" font-family="Montserrat, sans-serif" font-weight="900" font-size="22" fill="' + C.deep + '">' + n + '</text></g>';
  }
  var ICON = {
    campo: '<path d="M0 30 V-4" stroke="' + C.leaf + '" stroke-width="7" stroke-linecap="round"/><path d="M0 0 C-30 -4 -34 -26 -30 -34 C-12 -32 0 -20 0 0Z" fill="' + C.lime + '"/><path d="M0 -6 C24 -14 30 -34 26 -40 C8 -38 -2 -24 0 -6Z" fill="' + C.leaf + '"/>',
    recebe: '<path d="M0 -30 V18 M-20 0 L0 22 L20 0" stroke="' + C.deep + '" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    silo: '<rect x="-20" y="-14" width="40" height="44" fill="' + C.steel2 + '"/><path d="M-24 -14 L0 -34 L24 -14Z" fill="' + C.deep + '"/>',
    gear: '<circle r="18" fill="none" stroke="' + C.deep + '" stroke-width="10" stroke-dasharray="9 5"/><circle r="22" fill="none" stroke="' + C.deep + '" stroke-width="6" stroke-dasharray="7 7"/><circle r="7" fill="' + C.deep + '"/>',
    truck: '<rect x="-32" y="-18" width="38" height="30" rx="4" fill="' + C.leaf + '"/><path d="M8 -8 H24 L32 4 V12 H8Z" fill="' + C.deep + '"/><circle cx="-20" cy="16" r="7" fill="#333"/><circle cx="20" cy="16" r="7" fill="#333"/>',
    globe: '<circle r="28" fill="#6fb3d8"/><path d="M-10 -24 C6 -14 -6 -2 6 6 C14 12 4 22 10 26 M-26 4 C-14 2 -12 14 -4 18" stroke="' + C.lime + '" stroke-width="8" fill="none" stroke-linecap="round"/>'
  };
  function chain(id) {
    var path = 'M360 900 C 450 820 520 930 620 880 S 760 800 860 850 S 1020 920 1180 820';
    var stops = [[410, 872, ICON.campo], [560, 900, ICON.recebe], [700, 848, ICON.silo], [840, 846, ICON.gear], [985, 892, ICON.truck], [1130, 836, ICON.globe]];
    var g = '<path d="' + path + '" stroke="#fff" stroke-width="38" fill="none" stroke-linecap="round" opacity=".9"/>' +
      '<path d="' + path + '" stroke="' + C.sun1 + '" stroke-width="10" fill="none" stroke-dasharray="26 22" stroke-linecap="round"/>' +
      stops.map(function (s, i) { return stop(s[0], s[1], s[2], i + 1); }).join('');
    return base(id, g, { horizon: 620, skyline: skyline(id, 900, 490, .85) });
  }
  function grain(id) {
    var belt = '<g transform="translate(430 700)">' +
      '<rect x="0" y="0" width="676" height="96" rx="48" fill="#30463a"/>' +
      '<rect x="18" y="14" width="640" height="56" rx="28" fill="#466553"/>' +
      [0, 1, 2, 3, 4, 5, 6, 7].map(function (k) { return '<circle cx="' + (48 + k * 83) + '" cy="82" r="10" fill="#1f2f27"/>'; }).join('') +
      grains() + '</g>';
    var crates = [["Soja", "#7cb24a"], ["Milho", C.sun1], ["Trigo", "#d8b26a"], ["Impurezas", "#9aa3a7"]].map(function (c, i) {
      var x = 430 + i * 172;
      return '<g transform="translate(' + x + ' 840)"><rect width="160" height="140" rx="14" fill="' + c[1] + '"/><rect y="0" width="160" height="30" rx="14" fill="rgba(255,255,255,.35)"/>' +
        '<rect x="12" y="66" width="136" height="46" rx="10" fill="rgba(255,255,255,.92)"/>' +
        '<text x="80" y="98" text-anchor="middle" font-family="Montserrat, sans-serif" font-weight="800" font-size="' + (c[0].length > 6 ? 21 : 24) + '" fill="' + C.deep + '">' + c[0] + '</text></g>';
    }).join('');
    return base(id, belt + crates, { horizon: 600, skyline: skyline(id, 620, 470, .85) });
  }
  function grains() {
    var out = '', pal = ["#e9dc8a", "#f2c23a", "#d9b46a", "#7b6a5a"];
    for (var i = 0; i < 26; i++) {
      var x = 50 + (i * 31.7) % 590, y = 26 + (i * 13) % 26, c = pal[i % 4];
      out += i % 4 === 3
        ? '<path d="M' + x + ' ' + (y + 6) + ' l10 -12 l12 6 l-4 14 l-14 2Z" fill="' + c + '"/>'
        : '<ellipse cx="' + x + '" cy="' + (y + 4) + '" rx="' + (i % 4 === 2 ? 7 : 11) + '" ry="' + (i % 4 === 2 ? 13 : 10) + '" fill="' + c + '" transform="rotate(' + (i * 37 % 60) + ' ' + x + ' ' + (y + 4) + ')"/>';
    }
    return out;
  }
  function silo(id) {
    var fills = [["#e9dc8a", .62, "A"], ["#f2c23a", .48, "B"], ["#d9b46a", .74, "C"], ["#8a6a4a", .36, "D"]];
    var g = fills.map(function (f, i) {
      var x = 478 + i * 150, y = 600, w = 120, h = 280;
      return '<g>' + siloShape(x, y, w, h, id + "steel") +
        '<rect x="' + (x + 26) + '" y="' + (y + 60) + '" width="68" height="196" rx="34" fill="#5f6b70" opacity=".25"/>' +
        '<clipPath id="' + id + 'win' + i + '"><rect x="' + (x + 26) + '" y="' + (y + 60) + '" width="68" height="196" rx="34"/></clipPath>' +
        '<rect clip-path="url(#' + id + 'win' + i + ')" x="' + (x + 26) + '" y="' + (y + 60 + 196 * (1 - f[1])) + '" width="68" height="' + (196 * f[1]) + '" fill="' + f[0] + '"/>' +
        '<circle cx="' + (x + 60) + '" cy="' + (y + 30) + '" r="22" fill="' + C.deep + '"/>' +
        '<text x="' + (x + 60) + '" y="' + (y + 39) + '" text-anchor="middle" font-family="Montserrat, sans-serif" font-weight="900" font-size="24" fill="#fff">' + f[2] + '</text></g>';
    }).join('');
    var truck = '<g transform="translate(1110 880)"><rect x="0" y="0" width="200" height="80" rx="10" fill="#fff" stroke="' + C.steel2 + '" stroke-width="4"/><path d="M14 40 C60 20 120 50 186 26" stroke="' + C.lime + '" stroke-width="10" fill="none"/>' +
      '<path d="M200 22 H252 L276 52 V80 H200Z" fill="' + C.leaf + '"/><circle cx="50" cy="86" r="18" fill="#333"/><circle cx="160" cy="86" r="18" fill="#333"/><circle cx="246" cy="86" r="18" fill="#333"/></g>';
    return base(id, g, { horizon: 600 });
  }

  /* ---------------------------------------------------------- montagem */
  var seq = 0;
  function build(img, B) {
    if (img.dataset.cgBanner) return;
    img.dataset.cgBanner = "1";
    var id = "cg" + (++seq) + "_";
    var root = document.createElement("span");
    root.className = "cg-banner cg-banner--" + B.key;
    root.setAttribute("aria-hidden", "true");
    var isHero = B.key === "hero";
    root.innerHTML = B.scene(id) +
      (isHero
        ? '<span class="cg-banner__copy cg-banner__copy--hero"><img class="cg-banner__logo" src="assets/coamo-games/logo-coamo-games.svg" alt=""><em>' + B.sub + '</em></span>' +
          '<span class="cg-bubble cg-bubble--left"></span><span class="cg-bubble cg-bubble--right"></span>'
        : '<span class="cg-banner__brand"><img src="assets/coamo-games/logo-coamo-games-mini.svg" alt=""></span>' +
          '<span class="cg-banner__copy"><strong>' + B.title + '</strong><em>' + B.sub + '</em></span>');
    [["left", B.left], ["right", B.right]].forEach(function (s) {
      var P = API.buildRig(s[1]);
      if (!P) return;
      var slot = document.createElement("span");
      slot.className = "cg-banner__mascot cg-banner__mascot--" + s[0];
      P.root.classList.add("coamo-rig--full");
      slot.appendChild(P.root);
      if (!img.closest("a, button")) {
        slot.classList.add("is-tappable");
        slot.addEventListener("pointerdown", function () {
          if (isHero) intro.tap(s[0]); else API.play(P.root, Math.random() < .5 ? "celebrate" : "wave");
        });
      }
      slot._rig = P.root;
      root.appendChild(slot);
    });
    var card = img.closest(".game-menu-card");
    if (card) card.addEventListener("pointerenter", function () {
      root.querySelectorAll(".coamo-rig").forEach(function (r, i) { setTimeout(function () { API.play(r, "wave"); }, i * 220); });
    });
    var parent = img.parentElement;
    if (getComputedStyle(parent).position === "static") parent.style.position = "relative";
    img.insertAdjacentElement("afterend", root);
    img.dataset.coamoOriginal = img.getAttribute("src");
    img.removeAttribute("srcset");
    img.src = PLACEHOLDER;
    img.classList.add("cg-banner-src");
    var redo = function () { place(img, root); };
    img.addEventListener("load", redo);
    if (window.ResizeObserver) { var ro = new ResizeObserver(redo); ro.observe(img); ro.observe(parent); }
    window.addEventListener("resize", redo);
    redo(); requestAnimationFrame(redo); setTimeout(redo, 400);
    API.watch(root);
    if (isHero) intro = heroIntro(root);
  }

  /* ---------------------------------------------------------- os mascotes se apresentam (banner principal) */
  var intro = { tap: function () {} };
  var HERO_SCRIPTS = [
    [["left", "Olá! Eu sou o Aroldinho!", "wave"], ["right", "E eu sou o Toninho!", "wave"],
     ["left", "Vamos jogar e descobrir a Coamo juntos?", "celebrate"], ["right", "Escolha um jogo aqui embaixo!", "talk"]],
    [["right", "Cada jogo mostra um pedacinho da Coamo.", "talk"], ["left", "Tem quiz, memória, esteira e silos!", "celebrate"],
     ["right", "Toque em um jogo para começar.", "wave"]]
  ];
  var TAP_LINES = {
    left: ["Eu sou o Aroldinho! Bora jogar?", "Opa! Escolhe um jogo aí!", "Aroldinho na área!"],
    right: ["Eu sou o Toninho. Prazer!", "Estou aqui para te guiar.", "Escolha um jogo e vamos juntos."]
  };
  function heroIntro(root) {
    var bub = { left: root.querySelector(".cg-bubble--left"), right: root.querySelector(".cg-bubble--right") };
    var rig = {
      left: root.querySelector(".cg-banner__mascot--left") && root.querySelector(".cg-banner__mascot--left")._rig,
      right: root.querySelector(".cg-banner__mascot--right") && root.querySelector(".cg-banner__mascot--right")._rig
    };
    var timers = [], typing = {}, round = 0, token = 0;
    function onScreen() {
      if (document.hidden || !root.isConnected) return false;
      var r = root.getBoundingClientRect();
      return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
    }
    function show(side, text, act) {
      var b = bub[side];
      if (!b) return;
      clearInterval(typing[side]);
      b.textContent = "";
      b.classList.remove("is-on"); void b.offsetWidth; b.classList.add("is-on");
      var i = 0;
      typing[side] = setInterval(function () {
        i += 2; b.textContent = text.slice(0, i);
        if (i >= text.length) { clearInterval(typing[side]); b.textContent = text; }
      }, 32);
      if (rig[side]) API.play(rig[side], act || "talk");
    }
    function hide(side) { if (bub[side]) bub[side].classList.remove("is-on"); }
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function run() {
      clear();
      var my = ++token;
      if (!onScreen()) { timers.push(setTimeout(run, 1500)); return; }
      var script = HERO_SCRIPTS[round % HERO_SCRIPTS.length], t = 600;
      round++;
      script.forEach(function (line, k) {
        timers.push(setTimeout(function () {
          if (my !== token) return;
          var other = line[0] === "left" ? "right" : "left";
          if (k > 0 && script[k - 1][0] === line[0]) hide(other);
          show(line[0], line[1], line[2]);
        }, t));
        t += Math.max(2300, 1100 + line[1].length * 48);
      });
      timers.push(setTimeout(function () { hide("left"); hide("right"); }, t + 2600));
      timers.push(setTimeout(run, t + 9000));
    }
    timers.push(setTimeout(run, 900));
    return {
      tap: function (side) {
        clear(); token++;
        show(side, TAP_LINES[side][Math.floor(Math.random() * TAP_LINES[side].length)], "celebrate");
        timers.push(setTimeout(function () { hide(side); }, 4200));
        timers.push(setTimeout(run, 6500));
      }
    };
  }
  /* mesmo encaixe usado pelos bonecos: cobre a área desenhada do <img> */
  function place(img, el) {
    var parent = img.parentElement;
    if (!parent || !img.isConnected) return;
    var bw = img.clientWidth, bh = img.clientHeight;
    if (!bw || !bh) { el.style.display = "none"; return; }
    var cs = getComputedStyle(img), fit = cs.objectFit || "fill", cw = bw, ch = bh;
    if (fit === "contain" || fit === "scale-down") { var s = Math.min(bw / W, bh / H); cw = W * s; ch = H * s; }
    else if (fit === "cover") { var s2 = Math.max(bw / W, bh / H); cw = W * s2; ch = H * s2; }
    var pos = (cs.objectPosition || "50% 50%").split(/\s+/);
    var px = function (v, free) { return /%$/.test(v) ? (parseFloat(v) / 100) * free : (parseFloat(v) || 0); };
    var ox = px(pos[0], bw - cw), oy = px(pos[1], bh - ch);
    var ir = img.getBoundingClientRect(), pr = parent.getBoundingClientRect();
    var k = ir.width / (img.offsetWidth || bw) || 1;
    el.style.display = "";
    el.style.left = (ir.left - pr.left - parent.clientLeft + (img.clientLeft + ox) * k) + "px";
    el.style.top = (ir.top - pr.top - parent.clientTop + (img.clientTop + oy) * k) + "px";
    el.style.width = (cw * k) + "px";
    el.style.height = (ch * k) + "px";
  }

  function scan(root) {
    (root || document).querySelectorAll("img").forEach(function (img) {
      var src = img.getAttribute("src") || "";
      var B = BANNERS[src.split("?")[0].split("/").pop()];
      if (B && /games\/v4[6-9]\//.test(src)) build(img, B);
    });
  }
  scan();
  new MutationObserver(function (list) {
    list.forEach(function (rec) {
      rec.addedNodes.forEach(function (n) { if (n.nodeType === 1 && !n.closest(".cg-banner")) scan(n.parentElement || n); });
    });
  }).observe(document.body, { childList: true, subtree: true });
})();
