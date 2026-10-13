/* =========================================================
   COAMO — FILME INSTITUCIONAL (modo apresentação) · v1
   Tipografia animada com cortes secos, contadores, grades,
   faixas, fotos reais e a logo se montando no final.
   Números: Relatório Coamo 2025 + dados internos (frota,
   funcionários, indústrias). Toque em qualquer lugar = sair.
   ========================================================= */
(function () {
  "use strict";
  const C = { g9: "#03210f", g8: "#054d24", g7: "#0a6a33", g4: "#5db526", y: "#f5b301", y2: "#ffd23f", w: "#f6f5ef", k: "#0c110e" };
  const E = { out: "cubic-bezier(.16,1,.3,1)", io: "cubic-bezier(.75,0,.2,1)", snap: "cubic-bezier(.85,0,.15,1)", back: "cubic-bezier(.3,1.5,.5,1)" };
  const stage = document.getElementById("fmStage");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- palco escalado ---------- */
  function fit() {
    const s = Math.min(innerWidth / 1080, innerHeight / 1920);
    stage.style.transform = `scale(${s}) translate(-540px, -960px)`;
  }
  addEventListener("resize", fit); fit();

  /* ---------- utilidades ---------- */
  function el(tag, cls, html, parent, style) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    if (style) Object.assign(n.style, style);
    if (parent) parent.appendChild(n);
    return n;
  }
  const A = (node, frames, o) => node.animate(frames, Object.assign({ fill: "both", easing: E.out }, o));
  let timers = [];
  const later = (ms, fn) => { timers.push(setTimeout(fn, ms)); };

  /* texto que sobe letra por letra (cada linha com máscara) */
  function rise(parent, lines, o) {
    o = Object.assign({ x: 80, y: 700, size: 200, color: C.k, delay: 0, stagger: 38, dur: 700, from: "110%", align: "left", indent: [] }, o);
    const box = el("div", "fm-t", null, parent, { left: o.x + "px", top: o.y + "px", fontSize: o.size + "px", color: o.color, textAlign: o.align });
    if (o.align === "center") { box.style.left = "0"; box.style.right = "0"; }
    if (o.weight) box.style.fontWeight = o.weight;
    let k = 0;
    lines.forEach((line, li) => {
      const L = el("span", "fm-line", null, box);
      if (o.indent[li]) L.style.paddingLeft = o.indent[li] + "px";
      [...line].forEach(ch => {
        const c = el("span", "fm-ch", ch === " " ? "&nbsp;" : ch, L);
        if (o.colors && o.colors[li]) c.style.color = o.colors[li];
        A(c, [{ transform: `translateY(${o.from})` }, { transform: "translateY(0)" }], { duration: o.dur, delay: o.delay + k * o.stagger });
        k++;
      });
    });
    return box;
  }
  /* palavra com desfoque entrando de lado (sequência de conceitos) */
  function blurIn(parent, text, o) {
    const n = el("div", "fm-t", text, parent, { left: "0", right: "0", top: (o.y || 860) + "px", textAlign: "center", fontSize: (o.size || 150) + "px", color: o.color });
    A(n, [{ transform: "translateX(90px)", filter: "blur(18px)", opacity: 0 }, { transform: "translateX(0)", filter: "blur(0)", opacity: 1 }], { duration: 420, delay: o.delay || 0 });
    return n;
  }
  /* contador estilo odômetro */
  function odometer(parent, str, o) {
    o = Object.assign({ x: 80, y: 760, size: 260, color: C.k, dur: 1100, delay: 0 }, o);
    const box = el("div", "fm-odo", null, parent, { left: o.x + "px", top: o.y + "px", fontSize: o.size + "px", color: o.color });
    let d = 0;
    [...str].forEach(ch => {
      if (/\d/.test(ch)) {
        const col = el("span", "fm-odo__col", null, box), strip = el("span", "fm-odo__strip", null, col);
        const turns = 1 + (d % 2), n = turns * 10 + Number(ch);
        let h = ""; for (let t = 0; t <= n; t++) h += `<i>${t % 10}</i>`;
        strip.innerHTML = h;
        A(strip, [{ transform: "translateY(0)" }, { transform: `translateY(-${n}em)` }], { duration: o.dur + d * 110, delay: o.delay, easing: "cubic-bezier(.3,.05,.1,1)" });
        d++;
      } else {
        const c = el("span", "fm-odo__ch", ch === " " ? "&nbsp;" : ch, box);
        if (ch === " ") c.style.width = ".22em";
        A(c, [{ transform: "translateY(60%)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 500, delay: o.delay + 120 });
      }
    });
    return box;
  }
  function small(parent, html, o) {
    const n = el("div", "fm-small", html, parent, Object.assign({ color: o.color || C.k }, o.style));
    A(n, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: o.delay || 200 });
    return n;
  }
  /* círculo que cresce e "engole" a cena */
  function swallow(parent, at, color, x, y, dur = 520) {
    later(at, () => {
      const c = el("div", "fm-circle", null, parent, { left: x + "px", top: y + "px", background: color });
      A(c, [{ transform: "scale(0)" }, { transform: "scale(24)" }], { duration: dur, easing: "cubic-bezier(.6,0,.3,1)" });
    });
  }
  /* cortina de faixas verticais que revelam a foto */
  function curtain(parent, colors, o = {}) {
    const n = o.n || 6, w = 1080 / n;
    for (let i = 0; i < n; i++) {
      const b = el("div", "fm-bar", null, parent, { left: i * w - 1 + "px", width: w + 2 + "px", background: colors[i % colors.length], transformOrigin: o.up ? "50% 0" : "50% 100%" });
      A(b, [{ transform: "scaleY(1)" }, { transform: "scaleY(0)" }], { duration: 520, delay: 40 + i * 45, easing: E.snap });
    }
  }

  const IMG = {
    logoW: "assets/logo.png", logoG: "assets/logo_verde.png",
    campo: "assets/agro_01.jpg", unidade: "assets/estruturas/estrutura_unidade_aerea.jpg", ind: "assets/industria_03.jpg",
    ind2: "assets/industria_05.jpg", parque: "assets/estruturas/estrutura_campo_mourao_aerea.jpg", ti: "assets/admin_ti_v38.jpg",
    pessoas: "assets/img_cultura.jpg", milho: "assets/vaga_fotos/agro_2.jpg", truck: "assets/mission/coamo_truck_oficial.webp",
    sede: "assets/home_cover_v38.webp", vet: "assets/vaga_fotos/medico_a_veterinario_a.jpg",
    unicoamo: "assets/logo_unicoamo_v12.webp", qv: "assets/logo_qualidade_vida_v11.webp", saude: "assets/logo_coamo_saude_v11.webp",
    fups: "assets/logo_fups_v11.webp", arcam: "assets/logo_arcam_v11.webp", estagio: "assets/logo_programa_estagios_v12.webp",
  };

  /* ===================================================== CENAS */
  const S = [];
  const scene = (bg, d, run) => S.push({ bg, d, run });

  /* 1 · abertura: o nome cresce em frase */
  scene(C.w, 2700, sc => {
    const big = rise(sc, ["Coamo."], { y: 760, size: 250, color: C.g8, stagger: 55 });
    later(1050, () => {
      A(big, [{ transform: "none" }, { transform: "translateY(-300px) scale(.62)" }], { duration: 650, easing: E.io });
      big.style.transformOrigin = "0 0";
      rise(sc, ["Agroindustrial", "Cooperativa"], { y: 900, size: 112, color: C.g8, delay: 280, stagger: 22, indent: [70, 0] });
      small(sc, ".01", { delay: 700, style: { right: "70px", bottom: "80px", fontSize: "34px", fontWeight: 800 } });
      small(sc, "→", { delay: 700, style: { right: "70px", top: "620px", fontSize: "60px" } });
      small(sc, "Campo Mourão · Paraná · desde 1970", { delay: 900, style: { left: "84px", top: "1320px", color: C.g7 } });
    });
  });

  /* 2 · multiplicação em grade */
  scene(C.k, 1900, sc => {
    const grid = el("div", "fm-grid", null, sc);
    const looks = [[C.w, C.g8], [C.g8, C.w], [C.y, C.k], [C.k, C.y]];
    for (let i = 0; i < 16; i++) {
      const L = looks[(i + Math.floor(i / 4)) % 4], t = el("div", "fm-tile", `<b>Coamo<br><span style="color:${L[1] === C.w ? C.y2 : L[1]}">Agroin-<br>dustrial</span><br>Coope-<br>rativa</b><small>.0${(i % 9) + 1}</small>`, grid, { background: L[0], color: L[1] });
      if (i === 0) t.style.borderColor = "transparent";
    }
    A(grid, [{ transform: "scale(4)", offset: 0 }, { transform: "scale(4)", offset: .18 }, { transform: "scale(2)", offset: .45 }, { transform: "scale(2)", offset: .6 }, { transform: "scale(1)", offset: .9 }, { transform: "scale(1)" }], { duration: 1900, easing: E.snap });
  });

  /* 3 · palavra caindo letra por letra */
  scene(C.y, 1500, sc => {
    rise(sc, ["cooperar"], { y: 800, size: 196, color: C.k, align: "center", stagger: 60, dur: 620, from: "-120%" });
  });

  /* 4 · o sol nascendo com órbitas */
  scene(C.g9, 2100, sc => {
    const svg = el("div", null, `<svg viewBox="-500 -500 1000 1000" width="1000" height="1000" style="position:absolute;left:40px;top:460px">
      <g fill="none" stroke="rgba(255,210,63,.35)" stroke-width="3" stroke-dasharray="2 18" stroke-linecap="round">
        <circle r="200"/><circle r="300"/><circle r="400"/></g>
      <g class="orb"><circle cx="200" cy="0" r="16" fill="${C.y2}"/><circle cx="-300" cy="40" r="12" fill="${C.y2}"/><circle cx="60" cy="-395" r="20" fill="${C.y}"/><circle cx="-110" cy="290" r="10" fill="${C.y2}"/></g>
      <circle class="sun" r="110" fill="url(#sg)"/>
      <defs><radialGradient id="sg" cx=".35" cy=".3"><stop offset="0" stop-color="#ffe27a"/><stop offset=".55" stop-color="${C.y}"/><stop offset="1" stop-color="#f07f00"/></radialGradient></defs>
    </svg>`, sc);
    const orb = svg.querySelector(".orb"), sun = svg.querySelector(".sun");
    A(orb, [{ transform: "rotate(-90deg) scale(.4)", opacity: 0 }, { transform: "rotate(160deg) scale(1)", opacity: 1 }], { duration: 2000, easing: "cubic-bezier(.2,.7,.2,1)" });
    A(sun, [{ transform: "scale(0)" }, { transform: "scale(1)", offset: .3 }, { transform: "scale(.82)", offset: .75 }, { transform: "scale(1.35)" }], { duration: 2100, easing: E.out });
    rise(sc, ["Do campo"], { y: 1480, size: 96, color: C.w, align: "center", delay: 500, stagger: 30 });
  });

  /* 5 · busca digitando */
  scene(C.k, 2000, sc => {
    const bar = el("div", "fm-search", `<span class="fm-search__txt"><span class="t"></span><span class="fm-search__caret"></span></span><span class="fm-search__btn">•</span>`, sc);
    A(bar, [{ transform: "scale(.9)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 400 });
    const t = bar.querySelector(".t"), txt = "O que move a Coamo?", btn = bar.querySelector(".fm-search__btn");
    [...txt].forEach((ch, i) => later(250 + i * 55, () => { t.textContent = txt.slice(0, i + 1); }));
    later(1450, () => { btn.textContent = "→"; A(btn, [{ transform: "scale(1)" }, { transform: "scale(.82)" }, { transform: "scale(1.1)" }], { duration: 350 }); });
  });

  /* 6 · faixas diagonais com os produtos */
  scene(C.y, 2000, sc => {
    const words = ["Soja", "Milho", "Trigo", "Café", "Aveia", "Algodão"];
    const wrap = el("div", null, null, sc, { position: "absolute", inset: "-20%", transform: "rotate(-11deg)" });
    for (let r = 0; r < 12; r++) {
      const row = el("div", "fm-ticker", null, wrap, { top: 60 + r * 175 + "px", color: r % 2 ? "#fff" : C.k });
      let h = ""; for (let k = 0; k < 4; k++) words.forEach((w, i) => { h += `<span>${words[(i + r) % words.length]} <em>◆</em></span>`; });
      row.innerHTML = h;
      const dir = r % 2 ? 1 : -1;
      A(row, [{ transform: `translateX(${dir * -200}px)` }, { transform: `translateX(${dir * 380}px)` }], { duration: 2000, easing: "linear" });
    }
  });

  /* 7 · cartões inclinados: tudo o que a Coamo faz */
  scene(C.w, 2500, sc => {
    const items = ["Assistência técnica", "Recebimento da safra", "Classificação", "Armazenagem", "Insumos e sementes", "Indústrias", "Logística", "Exportação", "Tecnologia", "Pesquisa", "Gente", "Tudo em cooperação"];
    const grid = el("div", "fm-cards", null, sc);
    const looks = ["d", "w", "w", "y", "w", "d", "y", "w", "w", "d", "w", "y"];
    for (let r = 0; r < 3; r++) items.forEach((t, i) => {
      const c = el("div", `fm-card fm-card--${looks[(i + r * 3) % looks.length]}`, `<i>✓</i><span>${t}</span>`, grid);
      A(c, [{ transform: "translateY(60px) scale(.9)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 500, delay: 40 + ((i + r * 12) % 16) * 35, easing: E.back });
    });
    A(grid, [{ transform: "perspective(1600px) rotateX(28deg) rotateZ(-16deg) translateY(40px)" }, { transform: "perspective(1600px) rotateX(28deg) rotateZ(-16deg) translateY(-260px)" }], { duration: 2500, easing: "cubic-bezier(.3,0,.2,1)" });
  });

  /* 8 · contadores (os números da Coamo) */
  const counter = (bg, fg, num, label, sub, o = {}) => scene(bg, o.d || 1650, sc => {
    if (o.kicker) small(sc, o.kicker, { delay: 100, style: { left: "84px", top: (o.y || 700) - 80 + "px", fontSize: "30px", fontWeight: 800, letterSpacing: ".22em", color: o.kc || fg, opacity: .8 } });
    odometer(sc, num, { y: o.y || 700, size: o.size || 250, color: fg });
    const lab = el("div", "fm-label", label, sc, { left: "88px", top: (o.y || 700) + (o.size || 250) + 26 + "px", fontSize: (o.ls || 70) + "px", color: o.lc || fg, maxWidth: "900px" });
    A(lab, [{ transform: "translateY(30px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 500, delay: 380 });
    if (sub) { const s = el("div", "fm-sub", sub, sc, { left: "90px", top: (o.y || 700) + (o.size || 250) + 70 + (o.ls || 70) * (o.lines || 1) * 1.1 + "px", color: o.lc || fg, maxWidth: "900px" }); A(s, [{ opacity: 0 }, { opacity: .85 }], { duration: 500, delay: 700 }); }
  });
  counter(C.w, C.g8, "+32 mil", "cooperados", "Produtores do Paraná, Santa Catarina e Mato Grosso do Sul.", { kicker: "NOSSA FORÇA" });
  counter(C.k, C.y, "+12 mil", "funcionários", "Gente que faz a safra acontecer todos os dias.", { lc: "#fff" });
  counter(C.y, C.k, "R$ 28,7 bi", "de receita em 2025", null, { size: 186 });
  counter(C.g8, "#fff", "9,6 mi", "de toneladas de grãos recebidas em 2025", "2,7% de toda a produção de grãos do Brasil.", { kc: C.y2, kicker: "SAFRA", lines: 2, d: 1900 });
  counter(C.w, C.k, "+6 mi t", "de capacidade de armazenagem", "A maior estrutura de armazenagem do Brasil.", { lc: C.g8, lines: 2 });
  /* 3 contadores juntos */
  scene(C.y, 1900, sc => {
    [["118", "unidades"], ["76", "municípios"], ["3", "estados"]].forEach(([n, l], i) => {
      odometer(sc, n, { x: 80, y: 360 + i * 420, size: 250, color: C.k, delay: i * 160 });
      const lab = el("div", "fm-label", l, sc, { left: (n.length * 165 + 120) + "px", top: 360 + i * 420 + 120 + "px", fontSize: "76px", color: C.k });
      A(lab, [{ transform: "translateX(-30px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 450, delay: 300 + i * 160 });
    });
    small(sc, "PARANÁ · SANTA CATARINA · MATO GROSSO DO SUL", { delay: 800, style: { left: "84px", top: "1660px", fontSize: "28px", fontWeight: 800, letterSpacing: ".14em" } });
  });
  /* indústrias */
  scene(C.g8, 2600, sc => {
    odometer(sc, "12", { y: 250, size: 330, color: C.y2 });
    rise(sc, ["indústrias"], { x: 90, y: 600, size: 110, color: "#fff", delay: 250, stagger: 25 });
    const list = ["Esmagamento de soja", "Refino e envase de óleo", "Moinhos de trigo", "Margarinas", "Gorduras vegetais", "Torrefação de café", "Fábrica de rações", "Fiação de algodão"];
    list.forEach((t, i) => {
      const n = el("div", "fm-label", `<span style="color:${C.y2}">◆</span> ${t}`, sc, { left: "90px", top: 820 + i * 98 + "px", fontSize: "56px", color: "#fff", fontWeight: 700 });
      A(n, [{ transform: "translateX(-60px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 420, delay: 450 + i * 90 });
    });
  });
  scene(C.y, 2100, sc => {
    small(sc, "EM CONSTRUÇÃO", { delay: 50, style: { left: "84px", top: "560px", fontSize: "32px", fontWeight: 800, letterSpacing: ".24em" } });
    rise(sc, ["+2 novas", "indústrias"], { y: 640, size: 150, color: C.k, stagger: 24 });
    [["Etanol de milho", "Campo Mourão (PR)"], ["Biodiesel", "Paranaguá (PR)"]].forEach(([a, b], i) => {
      const n = el("div", "fm-label", `${a}<br><small style="font-size:40px;font-weight:700;opacity:.75">${b}</small>`, sc, { left: "90px", top: 1050 + i * 230 + "px", fontSize: "76px", color: C.k });
      A(n, [{ transform: "translateY(40px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 480, delay: 550 + i * 180 });
    });
  });
  counter(C.k, "#fff", "+2.670", "veículos e equipamentos próprios", "1.000 caminhões · 1.000 veículos leves · 670 máquinas pesadas", { lc: C.y2, lines: 2, d: 1900 });
  counter(C.w, C.g8, "3,7 mi t", "exportadas em 2025", "Pelos portos de Paranaguá (PR) e São Francisco do Sul (SC).", { lc: C.k, size: 230 });
  counter(C.g8, C.y2, "55 anos", "de cooperação", "Desde 1970, em Campo Mourão (PR).", { lc: "#fff" });

  /* 9 · conceitos em sequência rápida */
  [["Cooperação.", C.y, C.k], ["Confiança.", C.k, C.y], ["Qualidade.", C.w, C.g8], ["Inovação.", C.g8, "#fff"], ["Gente.", C.y, C.k]].forEach(([t, bg, fg]) =>
    scene(bg, 620, sc => { blurIn(sc, t, { color: fg, size: t.length > 9 ? 150 : 180 }); }));

  /* 10 · fotos reais com cortina */
  const photo = (src, kicker, title, pos, bars) => scene(C.k, 1250, sc => {
    const p = el("div", "fm-photo", null, sc, { backgroundImage: `url("${src}")`, backgroundPosition: pos || "center" });
    A(p, [{ transform: "scale(1.16)" }, { transform: "scale(1.02)" }], { duration: 1500, easing: "cubic-bezier(.2,.6,.2,1)" });
    const tag = el("div", "fm-tag", `<small>${kicker}</small>${title}`, sc);
    A(tag, [{ transform: "translateY(60px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 500, delay: 280 });
    curtain(sc, bars || [C.y, C.g8]);
  });
  photo(IMG.campo, "Campo", "Perto do<br>produtor", "55% 40%");
  photo(IMG.parque, "Armazenagem", "Cada grão<br>bem guardado", "45% 50%", [C.g8, C.w]);
  photo(IMG.unidade, "Indústria", "Valor que<br>se transforma", "40% 50%", [C.k, C.y]);
  photo(IMG.ind, "Gente", "Feita por<br>pessoas", "50% 40%", [C.w, C.g8]);
  photo(IMG.ti, "Tecnologia", "Uma operação<br>conectada", "70% 40%", [C.y, C.k]);
  photo(IMG.pessoas, "Cooperação", "Lado a lado<br>com o cooperado", "62% 35%", [C.g8, C.y]);
  /* caminhão passando */
  scene(C.w, 1500, sc => {
    const t = el("img", null, null, sc, { position: "absolute", left: "0", top: "760px", width: "1500px" }); t.src = IMG.truck;
    A(t, [{ transform: "translateX(-1600px)" }, { transform: "translateX(-200px)", offset: .55 }, { transform: "translateX(-120px)" }], { duration: 1500, easing: E.out });
    rise(sc, ["Logística", "que não para."], { y: 380, size: 110, color: C.g8, delay: 300, stagger: 18 });
  });

  /* 11 · cuidado com as pessoas: os programas */
  scene(C.w, 2800, sc => {
    rise(sc, ["Cuidado com", "quem faz."], { y: 330, size: 140, color: C.g8, stagger: 24 });
    const grid = el("div", "fm-logos", null, sc);
    [IMG.unicoamo, IMG.qv, IMG.saude, IMG.fups, IMG.arcam, IMG.estagio].forEach((src, i) => {
      const c = el("div", "fm-logo", `<img src="${src}" alt="">`, grid);
      A(c, [{ transform: "translateY(80px) scale(.85)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 520, delay: 450 + i * 110, easing: E.back });
    });
  });

  /* 12 · frase grande + círculo que engole */
  scene(C.k, 1500, sc => {
    rise(sc, ["Uma história", "de cooperação."], { y: 760, size: 128, color: C.y, stagger: 20 });
  });
  scene(C.y, 1700, sc => {
    const t = rise(sc, ["Do campo", "para o mundo."], { y: 760, size: 150, color: C.k, stagger: 16, dur: 500 });
    A(t, [{ transform: "translateX(40px)" }, { transform: "translateX(-420px)" }], { duration: 1700, easing: "cubic-bezier(.4,0,.6,1)" });
    swallow(sc, 1150, C.g9, 760, 1040, 560);
  });

  /* 13 · final: a logo se monta */
  scene(C.g9, 6200, sc => {
    /* quadradinhos piscando em volta */
    later(1900, () => {
      for (let i = 0; i < 36; i++) {
        const gx = Math.floor(Math.random() * 16), gy = Math.floor(Math.random() * 28);
        if (gx > 3 && gx < 13 && gy > 10 && gy < 18) continue;
        const p = el("div", "fm-pix", null, sc, { left: gx * 68 + "px", top: gy * 68 + "px", background: Math.random() < .3 ? C.y : "rgba(255,255,255,.85)" });
        A(p, [{ opacity: 0 }, { opacity: 1, offset: .2 }, { opacity: 1, offset: .6 }, { opacity: 0 }], { duration: 900, delay: Math.random() * 500, easing: "steps(4)" });
      }
    });
    const svg = el("div", null, `<svg viewBox="-300 -300 600 600" width="600" height="600" style="position:absolute;left:240px;top:560px;overflow:visible">
      <g fill="none" stroke="${C.y2}" stroke-width="10" stroke-linecap="round">
        <path class="a1" d="M -220 40 A 230 230 0 0 1 180 -150" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>
        <path class="a2" d="M 220 -20 A 230 230 0 0 1 -150 190" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" stroke="${C.g4}"/>
      </g>
      <circle class="d1" cx="-220" cy="40" r="16" fill="${C.y2}"/><circle class="d2" cx="220" cy="-20" r="12" fill="${C.g4}"/><circle class="d3" cx="0" cy="-260" r="10" fill="#fff"/>
      <circle class="sun" r="120" fill="${C.y}"/>
    </svg>`, sc);
    const q = s => svg.querySelector(s);
    A(q(".a1"), [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 900, delay: 200, easing: E.io });
    A(q(".a2"), [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 900, delay: 450, easing: E.io });
    ["d1", "d2", "d3"].forEach((d, i) => A(q("." + d), [{ transform: "scale(0)" }, { transform: "scale(1)" }], { duration: 400, delay: 150 + i * 200, easing: E.back }));
    A(q(".sun"), [{ transform: "scale(0)" }, { transform: "scale(1)", offset: .5 }, { transform: "scale(1)", offset: .8 }, { transform: "scale(.25)" }], { duration: 1900, delay: 500, easing: E.out });
    A(svg.firstElementChild, [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(1)", opacity: 1, offset: .75 }, { transform: "scale(.3)", opacity: 0 }], { duration: 2300, easing: E.io });
    /* logo da Coamo */
    const logo = el("img", null, null, sc, { position: "absolute", left: "140px", top: "700px", width: "800px" }); logo.src = IMG.logoW;
    A(logo, [{ transform: "scale(.6)", opacity: 0, filter: "blur(16px)" }, { transform: "none", opacity: 1, filter: "blur(0)" }], { duration: 800, delay: 2100 });
    const tag = el("div", "fm-t", "Uma história construída<br>em cooperação.", sc, { left: 0, right: 0, top: "1150px", textAlign: "center", fontSize: "52px", fontWeight: 700, letterSpacing: "-.01em", lineHeight: 1.2, color: "rgba(255,255,255,.85)", whiteSpace: "normal" });
    A(tag, [{ opacity: 0, transform: "translateY(20px)" }, { opacity: 1, transform: "none" }], { duration: 600, delay: 2700 });
    const cta = el("div", "fm-cta", "Toque na tela para explorar", sc);
    A(cta, [{ opacity: 0, transform: "translate(-50%, 30px)" }, { opacity: 1, transform: "translate(-50%, 0)" }], { duration: 600, delay: 3200 });
    later(3800, () => A(cta, [{ transform: "translate(-50%,0) scale(1)" }, { transform: "translate(-50%,0) scale(1.05)" }, { transform: "translate(-50%,0) scale(1)" }], { duration: 1200, iterations: 3, easing: "ease-in-out", fill: "none" }));
  });

  /* ===================================================== REPRODUÇÃO */
  let idx = 0, cur = null, nextT = 0;
  function play() {
    const sc = S[idx];
    timers.forEach(clearTimeout); timers = [];
    const node = el("section", "fm-scene", null, stage, { background: sc.bg });
    document.body.style.background = sc.bg;
    sc.run(node);
    if (cur) cur.remove();
    cur = node;
    idx = (idx + 1) % S.length;
    nextT = setTimeout(play, reduce ? Math.max(sc.d, 2500) : sc.d);
  }
  /* carrega as imagens antes de começar (sem buracos no meio do filme) */
  const preload = Object.values(IMG).map(src => new Promise(res => { const im = new Image(); im.onload = im.onerror = res; im.src = src; }));
  const fonts = document.fonts ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))]) : Promise.resolve();
  Promise.all([fonts, Promise.race([Promise.all(preload), new Promise(r => setTimeout(r, 6000))])]).then(() => {
    const p = new URLSearchParams(location.search).get("cena");
    if (p) idx = Math.max(0, Math.min(S.length - 1, Number(p)));
    play();
  });

  /* ---------- sair: qualquer toque volta ao site ---------- */
  let leaving = false;
  function leave() {
    if (leaving || new URLSearchParams(location.search).has("preview")) return;
    leaving = true; clearTimeout(nextT);
    location.href = "index.html?interactive=1";
  }
  ["pointerdown", "keydown"].forEach(ev => addEventListener(ev, leave, { passive: true }));
  window.__filme = { scenes: S, go(i) { clearTimeout(nextT); idx = i; play(); }, count: () => S.length };
})();
