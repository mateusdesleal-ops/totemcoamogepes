/* =========================================================
   COAMO GAMES — JORNADA DA SAFRA (3D) · v1
   Cenários em 3D (three.js) com os mascotes desenhados por cima,
   como recortes. Modo Jornada (capítulos com história) e modo avulso.
   Textos da história: objeto STORY logo abaixo.
   ========================================================= */
import * as THREE from "./vendor/three.r169.module.min.js";
import { ICONS } from "./jornada-icones.v1.js";

/* ===================================================== HISTÓRIA */
const STORY = {
  prologue: [
    { who: "n", shot: "dawn",  text: "Amanhece em mais um dia de safra na Coamo." },
    { who: "t", shot: "hello", act: "wave", text: "Bom dia! Eu sou o Toninho. Seja bem-vindo ao seu primeiro dia na Coamo!" },
    { who: "a", shot: "hello", act: "celebrate", text: "E eu sou o Aroldinho! Hoje você vai viver uma safra inteira com a gente, do campo até a sua vaga." },
    { who: "n", shot: "trucks", text: "Os primeiros caminhões chegam à unidade, carregados com a produção dos cooperados." },
    { who: "t", shot: "yard", act: "think", text: "Tudo começa no recebimento. Antes de guardar, cada carga precisa ser classificada." },
    { who: "a", shot: "belt", act: "celebrate", text: "Soja, milho e trigo, cada um na sua caixa. Pedra, terra e palha vão para as impurezas. Bora?" },
  ],
  ch1: {
    kicker: "CAPÍTULO 1 · RECEBIMENTO",
    title: "A primeira carga",
    goal: "Separe tudo o que chega pela esteira antes que caia no fim da linha.",
    how: "Toque na caixa certa: o item com o anel amarelo vai para ela. Se preferir, toque antes em outro item para escolhê-lo.",
    lines: {
      start: ["t", "Calma e atenção: a qualidade começa aqui."],
      combo5: ["a", "Combo! Essa carga vai sair perfeita!"],
      combo10: ["t", "Que ritmo! Parece que já trabalha aqui há anos."],
      miss: ["t", "Opa, caixa errada! Confira o desenho da caixa."],
      escape: ["a", "Passou um! Fique de olho no fim da esteira."],
      phase2: ["a", "O movimento aumentou. Mais caminhões no pátio!"],
      truck: ["t", "Chegou um caminhão extra. Segura firme!"],
      last: ["a", "Últimos segundos! Vamos fechar bem essa carga."],
    },
    end: {
      3: [["t", "Classificação perfeita! Os cooperados vão ter orgulho dessa carga."], ["a", "Agora essa produção precisa ser bem guardada. Próxima parada: os silos!"]],
      2: [["t", "Muito bem! Quase tudo no lugar certo."], ["a", "Com mais um pouco de prática, vira especialista. Próxima parada: os silos!"]],
      1: [["t", "Foi corrido, né? A safra não espera, mas a gente aprende rápido."], ["a", "Dá para tentar de novo quando quiser. Próxima parada: os silos!"]],
      0: [["t", "A esteira venceu desta vez. Acontece até com os veteranos!"], ["a", "Respira, tenta de novo, e a carga sai perfeita."]],
    },
  },
};

const CHAPTERS = [
  { id: "ch1", n: 1, kicker: "RECEBIMENTO", title: "A primeira carga", text: "Classifique os grãos que chegam na esteira.", ready: true },
  { id: "ch2", n: 2, kicker: "ARMAZENAGEM", title: "Corrida contra a chuva", text: "Guarde cada produto no silo certo antes do temporal." },
  { id: "ch3", n: 3, kicker: "INDÚSTRIA", title: "Do grão ao mercado", text: "Acompanhe a carga até virar produto." },
  { id: "ch4", n: 4, kicker: "MEMÓRIA", title: "O arquivo da Coamo", text: "Cada par encontrado libera uma curiosidade." },
  { id: "ch5", n: 5, kicker: "FINAL", title: "Onde você brilha", text: "Descubra a área da Coamo que combina com você." },
];

const GAMES = [
  { id: "classificacao", label: "NOVO · 3D", title: "Desafio da Classificação", text: "Separe soja, milho, trigo e impurezas na esteira.", img: "assets/games/v48/classification_banner.webp", play: "ch1", isNew: true },
  { id: "silo", label: "ARCADE", title: "Silo em Equilíbrio", text: "Guarde cada produto no silo certo.", img: "assets/games/v48/silo_banner.webp", href: "jogo-silo.html" },
  { id: "memoria", label: "MEMÓRIA", title: "Desafio Coamo", text: "Encontre os pares e conheça curiosidades.", img: "assets/games/v48/memory_banner.webp", href: "jogo-memoria.html" },
  { id: "cadeia", label: "SEQUÊNCIA", title: "Monte a cadeia Coamo", text: "Do campo ao mercado, na ordem certa.", img: "assets/games/v48/chain_banner.webp", href: "jogo-cadeia.html" },
  { id: "quiz", label: "QUIZ", title: "Descubra sua área", text: "Veja qual área da Coamo combina com você.", img: "assets/games/v48/area_banner.webp", href: "jogo-area.html", noRank: true },
];

const WHO = { t: "Toninho", a: "Aroldinho", n: "Coamo" };

/* ===================================================== UTILIDADES */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const fmt = n => new Intl.NumberFormat("pt-BR").format(Math.round(n));
const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
const params = new URLSearchParams(location.search);
const store = {
  get(k, d) { try { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } },
  set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
  del(k) { try { sessionStorage.removeItem(k); } catch (_) {} },
};
function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function noise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), u), lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v);
}

/* ===================================================== SOM */
const Sound = (() => {
  const KEY = "coamoGamesSound";
  let on = true; try { on = localStorage.getItem(KEY) !== "off"; } catch (_) {}
  let ctx = null, master = null, musicGain = null, musicTimer = 0, musicOn = false;
  function ac() {
    try {
      if (!ctx) {
        const A = window.AudioContext || window.webkitAudioContext; if (!A) return null;
        ctx = new A(); master = ctx.createGain(); master.gain.value = on ? 1 : 0; master.connect(ctx.destination);
        musicGain = ctx.createGain(); musicGain.gain.value = .35; musicGain.connect(master);
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch (_) { return null; }
  }
  function note(f, start, dur, type = "sine", vol = .09, dest) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + start;
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + dur + .05);
  }
  const FX = {
    tap: () => note(620, 0, .06, "triangle", .06),
    select: () => { note(520, 0, .05, "triangle", .06); note(780, .035, .06, "triangle", .05); },
    whoosh: () => { const c = ac(); if (!c) return; const o = c.createOscillator(), g = c.createGain(), t = c.currentTime; o.type = "sine"; o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(900, t + .22); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.05, t + .05); g.gain.exponentialRampToValueAtTime(.0001, t + .25); o.connect(g); g.connect(master); o.start(t); o.stop(t + .3); },
    success: () => { note(660, 0, .1, "sine", .09); note(990, .07, .16, "sine", .08); },
    combo: () => { [784, 988, 1175].forEach((f, i) => note(f, i * .06, .14, "triangle", .07)); },
    error: () => { note(240, 0, .12, "sawtooth", .045); note(170, .1, .2, "sawtooth", .04); },
    fall: () => { const c = ac(); if (!c) return; const o = c.createOscillator(), g = c.createGain(), t = c.currentTime; o.type = "triangle"; o.frequency.setValueAtTime(500, t); o.frequency.exponentialRampToValueAtTime(110, t + .4); g.gain.setValueAtTime(.06, t); g.gain.exponentialRampToValueAtTime(.0001, t + .45); o.connect(g); g.connect(master); o.start(t); o.stop(t + .5); },
    phase: () => { note(440, 0, .1, "square", .035); note(660, .1, .1, "square", .035); note(880, .2, .22, "square", .035); },
    count: () => note(520, 0, .12, "square", .04),
    go: () => { note(784, 0, .1, "square", .045); note(1046, .08, .3, "square", .045); },
    star: i => note([784, 988, 1318][i] || 1318, 0, .3, "triangle", .1),
    win: () => [523, 659, 784, 1046].forEach((f, i) => note(f, i * .11, i === 3 ? .45 : .14, "triangle", .09)),
    type: () => note(1400 + Math.random() * 300, 0, .02, "square", .008),
  };
  /* trilha leve: acordes suaves + melodia em pentatônica */
  const CHORDS = [[261.6, 329.6, 392], [220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7]];
  const SCALE = [523.3, 587.3, 659.3, 784, 880, 1046.5];
  let bar = 0;
  function musicStep() {
    if (!musicOn) return;
    const c = ac(); if (!c) return;
    const ch = CHORDS[bar % 4];
    ch.forEach(f => note(f, 0, 2.3, "sine", .05, musicGain));
    note(ch[0] / 2, 0, 2.2, "triangle", .06, musicGain);
    for (let i = 0; i < 4; i++) if (Math.random() < .7) note(SCALE[Math.floor(Math.random() * SCALE.length)], i * .6 + .05, .35, "triangle", .028, musicGain);
    bar++;
    musicTimer = setTimeout(musicStep, 2400);
  }
  return {
    get on() { return on; },
    fx(name, a) { if (!on) return; if (!ac()) return; try { FX[name] && FX[name](a); } catch (_) {} },
    music(play) {
      if (play === musicOn) return;
      musicOn = play; clearTimeout(musicTimer);
      if (play && on && ac()) musicStep();
    },
    toggle() {
      on = !on; try { localStorage.setItem(KEY, on ? "on" : "off"); } catch (_) {}
      if (ac()) master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, .05);
      if (on && musicOn) { clearTimeout(musicTimer); musicStep(); }
      return on;
    },
    unlock() { ac(); },
  };
})();
function buzz(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (_) {} }

const V = (x, y, z) => new THREE.Vector3(x, y, z);

/* ===================================================== 3D: RENDERIZADOR */
const canvas = $("#jrCanvas");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  if (!renderer.getContext()) throw new Error("sem webgl");
} catch (e) {
  renderer = null;
}
if (!renderer) {
  $("#scrNo3d").hidden = false;
  throw new Error("WebGL indisponível");
}
let pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
renderer.setPixelRatio(pixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, .5, 900);
const clock = new THREE.Clock();

/* ---------- céu ---------- */
const SKIES = {
  dawn:    { top: "#4f7fc0", mid: "#f6b788", low: "#ffd9a8", sun: "#ffc27a", hemi: "#ffd7b0", ground: "#5f7a46", light: 2.1, hemiI: .9, elev: .13, az: 2.55, fog: "#f2c9a0" },
  morning: { top: "#3d8ed9", mid: "#a9d8f2", low: "#e9f4ea", sun: "#fff1d6", hemi: "#d8ecff", ground: "#6c8f4c", light: 2.6, hemiI: 1.15, elev: .72, az: .75, fog: "#cfe6ee" },
};
const skyU = {
  top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, low: { value: new THREE.Color() },
  sunCol: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) },
};
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(600, 32, 16),
  new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 low; uniform vec3 sunCol; uniform vec3 sunDir; varying vec3 vP;
      void main(){ vec3 d = normalize(vP); float h = d.y;
        vec3 c = mix(mid, top, smoothstep(0.02, 0.55, h)); c = mix(low, c, smoothstep(-0.04, 0.12, h));
        float s = max(dot(d, normalize(sunDir)), 0.0);
        c += sunCol * (pow(s, 600.0) * 2.2 + pow(s, 24.0) * 0.28 + pow(s, 4.0) * 0.08);
        gl_FragColor = vec4(c, 1.0); }`,
  })
);
sky.renderOrder = -1;
scene.add(sky);
scene.fog = new THREE.Fog("#cfe6ee", 70, 330);

const hemi = new THREE.HemisphereLight("#d8ecff", "#6c8f4c", 1.1);
scene.add(hemi);
const sun = new THREE.DirectionalLight("#fff1d6", 2.6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 120 });
sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
scene.add(sun, sun.target);

const skyState = { from: SKIES.morning, to: SKIES.morning, t: 1, dur: 1 };
const tmpC1 = new THREE.Color(), tmpC2 = new THREE.Color();
function mixHex(a, b, t, out) { return out.set(a).lerp(tmpC2.set(b), t); }
function applySky(t) {
  const A = skyState.from, B = skyState.to;
  mixHex(A.top, B.top, t, skyU.top.value); mixHex(A.mid, B.mid, t, skyU.mid.value); mixHex(A.low, B.low, t, skyU.low.value);
  mixHex(A.sun, B.sun, t, skyU.sunCol.value);
  mixHex(A.hemi, B.hemi, t, hemi.color); mixHex(A.ground, B.ground, t, hemi.groundColor);
  mixHex(A.sun, B.sun, t, sun.color); mixHex(A.fog, B.fog, t, scene.fog.color);
  hemi.intensity = lerp(A.hemiI, B.hemiI, t); sun.intensity = lerp(A.light, B.light, t);
  const elev = lerp(A.elev, B.elev, t), az = lerp(A.az, B.az, t);
  skyU.sunDir.value.set(Math.cos(elev) * Math.sin(az), Math.sin(elev), Math.cos(elev) * Math.cos(az)).normalize();
}
function setSky(name, dur = 0) {
  skyState.from = dur ? { ...skyState.to } : SKIES[name];
  if (dur) { /* congela a cor atual como ponto de partida */
    const cur = {}; const A = skyState.from, B = skyState.to, t = easeInOut(clamp(skyState.t / skyState.dur, 0, 1));
    for (const k of Object.keys(B)) cur[k] = typeof B[k] === "number" ? lerp(A[k], B[k], t) : "#" + mixHex(A[k], B[k], t, tmpC1).getHexString();
    skyState.from = cur;
  }
  skyState.to = SKIES[name]; skyState.t = 0; skyState.dur = dur || .0001;
}
setSky("morning");
applySky(1);

/* ===================================================== 3D: MUNDO */
const M = {}; /* materiais */
function mat(name, color, o = {}) { return M[name] || (M[name] = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .85, metalness: 0 }, o))); }
function box(w, h, d, m, x = 0, y = 0, z = 0, parent) {
  const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z);
  me.castShadow = true; me.receiveShadow = true; if (parent) parent.add(me); return me;
}
function cyl(rt, rb, h, seg, m, x = 0, y = 0, z = 0, parent) {
  const me = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); me.position.set(x, y, z);
  me.castShadow = true; me.receiveShadow = true; if (parent) parent.add(me); return me;
}
const world = new THREE.Group(); scene.add(world);

/* ---------- chão: lavouras em low poly ---------- */
(function buildGround() {
  const g = new THREE.PlaneGeometry(520, 520, 104, 104).toNonIndexed();
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, cols = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z + 10);
    const hill = noise(x * .018 + 7, z * .018 + 3) * 14 + noise(x * .05, z * .05) * 3;
    p.setY(i, (r > 46 ? hill * clamp((r - 46) / 70, 0, 1) : 0) - .02);
  }
  const PAL = { soy: ["#4c8a3c", "#56973f", "#467f37"], corn: ["#8cae47", "#97b84d", "#83a443"], wheat: ["#d8b45a", "#e1c06a", "#cfa94e"], grass: ["#6ea24f", "#79ab55", "#649746"] };
  for (let f = 0; f < p.count; f += 3) {
    const cx = (p.getX(f) + p.getX(f + 1) + p.getX(f + 2)) / 3, cz = (p.getZ(f) + p.getZ(f + 1) + p.getZ(f + 2)) / 3;
    const n = noise(cx * .02 + 40, cz * .02 + 11);
    const field = n > .62 ? PAL.wheat : n > .42 ? PAL.soy : n > .26 ? PAL.corn : PAL.grass;
    const c = tmpC1.set(field[Math.floor(hash(cx, cz) * 3)]);
    c.offsetHSL(0, 0, (hash(cz, cx) - .5) * .04);
    for (let k = 0; k < 3; k++) { cols[(f + k) * 3] = c.r; cols[(f + k) * 3 + 1] = c.g; cols[(f + k) * 3 + 2] = c.b; }
  }
  g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  g.computeVertexNormals();
  const ground = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
  ground.receiveShadow = true;
  world.add(ground);
})();

/* ---------- pátio, estrada e faixas ---------- */
(function buildYard() {
  const yard = new THREE.Mesh(new THREE.BoxGeometry(70, .12, 50), mat("concrete", "#c8c9c1", { roughness: .95 }));
  yard.position.set(-2, .02, -12); yard.receiveShadow = true; world.add(yard);
  const road = new THREE.Mesh(new THREE.BoxGeometry(260, .1, 7), mat("asphalt", "#55595a", { roughness: .95 }));
  road.position.set(-160, .02, -7.5); road.receiveShadow = true; world.add(road);
  const lane = mat("lane", "#f3c534", { roughness: .6 });
  for (let x = -280; x < -40; x += 8) { const l = new THREE.Mesh(new THREE.BoxGeometry(4, .02, .25), lane); l.position.set(x, .08, -7.5); world.add(l); }
  const white = mat("paint", "#f4f4ef", { roughness: .7 });
  [[-30, -7.5, 30, .3], [-15, -4, 30, .25], [-15, -11, 30, .25]].forEach(([x, z, w, d]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(w, .02, d), white); l.position.set(x, .09, z); world.add(l); });
  /* balança de caminhões */
  box(14, .16, 4.4, mat("scale", "#8d9295", { roughness: .6, metalness: .3 }), -20, .1, -7.5, world).castShadow = false;
})();

/* ---------- armazém com a marca ---------- */
(function buildWarehouse() {
  const g = new THREE.Group(); g.position.set(-10, 0, -17); world.add(g);
  const wall = mat("wall", "#eef0ea"), band = mat("coamoGreen", "#16703f", { roughness: .7 }), roofM = mat("roof", "#1f7d48", { roughness: .65, metalness: .15 });
  box(16, 6, 9, wall, 0, 3, 0, g);
  box(16.1, 1.1, 9.1, band, 0, .55, 0, g);
  const roofShape = new THREE.Shape(); roofShape.moveTo(-4.9, 0); roofShape.lineTo(0, 2.6); roofShape.lineTo(4.9, 0); roofShape.lineTo(-4.9, 0);
  const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, { depth: 16.6, bevelEnabled: false }), roofM);
  roof.rotation.y = Math.PI / 2; roof.position.set(-8.3, 6, 0); roof.castShadow = true; g.add(roof);
  /* portões */
  [-4.5, 4.5].forEach(x => { box(3.6, 3.8, .2, mat("door", "#9aa3a0", { metalness: .4, roughness: .5 }), x, 1.9, 4.56, g); });
  /* placa com o logo */
  const panel = box(6.6, 2, .16, mat("white", "#ffffff", { roughness: .5 }), 0, 4.7, 4.6, g);
  const tex = new THREE.TextureLoader().load("assets/logo_verde.png", t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; });
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.7), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: .6 }));
  logo.position.set(0, 4.7, 4.7); g.add(logo);
  panel.castShadow = false;
})();

/* ---------- silos, elevador e passarelas ---------- */
(function buildSilos() {
  const metal = mat("silo", "#dfe3e6", { metalness: .55, roughness: .38 });
  const ring = mat("siloRing", "#aeb5ba", { metalness: .6, roughness: .4 });
  const roofM = mat("siloRoof", "#c9cfd3", { metalness: .6, roughness: .35 });
  const xs = [4, 10, 16, 22];
  xs.forEach((x, i) => {
    const g = new THREE.Group(); g.position.set(x, 0, -21 - (i % 2) * .6); world.add(g);
    cyl(2.8, 2.8, 12, 28, metal, 0, 6, 0, g);
    for (let y = 1.2; y < 12; y += 1.6) { const r = new THREE.Mesh(new THREE.TorusGeometry(2.82, .06, 6, 32), ring); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); }
    cyl(.35, 2.95, 2.6, 28, roofM, 0, 13.3, 0, g);
    cyl(.5, .5, .7, 10, roofM, 0, 14.8, 0, g);
    box(.25, 12, .12, ring, 2.85, 6, 0, g); /* escada */
  });
  const tower = new THREE.Group(); tower.position.set(-1, 0, -24); world.add(tower);
  box(2.4, 22, 2.4, mat("tower", "#d5d9d4", { roughness: .7 }), 0, 11, 0, tower);
  box(3.6, 3, 3.6, mat("towerTop", "#16703f", { roughness: .6 }), 0, 23.5, 0, tower);
  const top = V(-1, 21.5, -24), bm = mat("bridge", "#8f989c", { metalness: .4, roughness: .5 });
  xs.forEach((x, i) => {
    const end = V(x, 14.9, -21 - (i % 2) * .6), len = top.distanceTo(end);
    const b = new THREE.Mesh(new THREE.BoxGeometry(.7, .5, len), bm);
    b.position.lerpVectors(top, end, .5); b.lookAt(end); b.castShadow = true; world.add(b);
  });
})();

/* ---------- escritório e casinhas ---------- */
(function buildOffice() {
  const g = new THREE.Group(); g.position.set(-27, 0, -2); world.add(g);
  box(9, 4.2, 6, mat("office", "#f3f1ea"), 0, 2.1, 0, g);
  box(9.4, .5, 6.4, mat("coamoGreen", "#16703f"), 0, 4.45, 0, g);
  for (let x = -3; x <= 3; x += 2) box(1.3, 1.2, .1, mat("glass", "#3b5d6e", { roughness: .2, metalness: .5 }), x, 2.6, 3.02, g);
})();

/* ---------- árvores (instanciadas) ---------- */
(function buildTrees() {
  const N = 140, trunkG = new THREE.CylinderGeometry(.18, .26, 1.6, 6), leafG = new THREE.IcosahedronGeometry(1.35, 0);
  const trunks = new THREE.InstancedMesh(trunkG, mat("trunk", "#7a5534"), N);
  const leaves = new THREE.InstancedMesh(leafG, new THREE.MeshStandardMaterial({ color: "#ffffff", flatShading: true, roughness: .9 }), N);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), pos = new THREE.Vector3();
  const greens = ["#3f7f3a", "#4d8f3f", "#5e9c45", "#356f33"];
  let i = 0, tries = 0;
  while (i < N && tries < 4000) {
    tries++;
    const a = hash(tries, 3) * Math.PI * 2, r = 38 + hash(tries, 9) * 90;
    const x = Math.cos(a) * r, z = Math.sin(a) * r - 12;
    if (z > -2 && Math.abs(x) < 60) continue;           /* deixa a frente livre para a câmera */
    if (Math.abs(z + 7.5) < 6 && x < -30) continue;     /* estrada */
    const k = .8 + hash(tries, 5) * .9, y = 0;
    q.setFromEuler(new THREE.Euler(0, hash(tries, 7) * 6, 0));
    m4.compose(pos.set(x, y + .8 * k, z), q, s.set(k, k, k)); trunks.setMatrixAt(i, m4);
    m4.compose(pos.set(x, y + 2.3 * k, z), q, s.set(k, k * 1.15, k)); leaves.setMatrixAt(i, m4);
    leaves.setColorAt(i, tmpC1.set(greens[i % 4]));
    i++;
  }
  trunks.count = leaves.count = i;
  trunks.castShadow = leaves.castShadow = true;
  world.add(trunks, leaves);
})();

/* ---------- morros ao longe e nuvens ---------- */
const clouds = new THREE.Group(); world.add(clouds);
(function buildFar() {
  const hillM = new THREE.MeshStandardMaterial({ color: "#7aa86a", flatShading: true, roughness: 1 });
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI * .95 + i / 15 * Math.PI * .9, r = 230 + hash(i, 2) * 60;
    const h = new THREE.Mesh(new THREE.IcosahedronGeometry(40 + hash(i, 4) * 30, 1), hillM);
    h.position.set(Math.cos(a) * r, -18, Math.sin(a) * r); h.scale.set(1.6, .45 + hash(i, 6) * .3, 1); world.add(h);
  }
  const cm = new THREE.MeshStandardMaterial({ color: "#ffffff", flatShading: true, roughness: 1, emissive: "#ffffff", emissiveIntensity: .25 });
  for (let i = 0; i < 12; i++) {
    const c = new THREE.Group();
    const n = 3 + Math.floor(hash(i, 1) * 3);
    for (let k = 0; k < n; k++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(3 + hash(i, k) * 2.5, 0), cm); b.position.set(k * 3.4 - n * 1.7, hash(k, i) * 1.5, hash(i + k, 3) * 2); c.add(b); }
    c.position.set(-160 + i * 30 + hash(i, 8) * 20, 45 + hash(i, 5) * 22, -120 - hash(i, 9) * 90);
    c.userData.v = .6 + hash(i, 11) * .8;
    clouds.add(c);
  }
})();

/* ---------- poeira dourada no ar ---------- */
const dust = (() => {
  const N = 160, g = new THREE.BufferGeometry(), p = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { p[i * 3] = (Math.random() - .5) * 26; p[i * 3 + 1] = Math.random() * 7; p[i * 3 + 2] = (Math.random() - .5) * 18 - 4; }
  g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: "#ffe7a6", size: .07, transparent: true, opacity: .7, depthWrite: false }));
  world.add(pts); return pts;
})();

/* ---------- caminhões ---------- */
function buildTruck(color) {
  const g = new THREE.Group();
  const cab = mat("cab_" + color, color, { roughness: .45, metalness: .2 });
  const dark = mat("tire", "#202322", { roughness: .9 }), hub = mat("hub", "#b7bcbe", { metalness: .6, roughness: .3 });
  box(2.4, 2.2, 2.5, cab, 4.4, 1.85, 0, g);
  box(.08, .9, 2.1, mat("windshield", "#2f4b5a", { roughness: .15, metalness: .6 }), 5.62, 2.3, 0, g);
  box(.1, .35, 2.52, mat("coamoGreen", "#16703f"), 5.6, 1.1, 0, g);
  box(9.2, .35, 2.2, mat("chassis", "#2d3230"), 0, .85, 0, g);
  const bed = box(6.6, 1.9, 2.5, mat("trailer", "#e9ecea", { roughness: .6 }), -.9, 2.0, 0, g);
  const heap = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 6.3, 12, 1, false, 0, Math.PI), mat("grainHeap", "#e3b94c", { roughness: 1 }));
  heap.rotation.z = Math.PI / 2; heap.rotation.y = 0; heap.scale.set(1, 1, .5); heap.position.set(-.9, 2.95, 0); g.add(heap);
  const wheels = [];
  [[4.4, 1.2], [4.4, -1.2], [-.4, 1.2], [-.4, -1.2], [-2.4, 1.2], [-2.4, -1.2], [-3.6, 1.2], [-3.6, -1.2]].forEach(([x, z]) => {
    const w = cyl(.55, .55, .45, 14, dark, x, .55, z, g); w.rotation.x = Math.PI / 2;
    const h = cyl(.28, .28, .47, 10, hub, 0, 0, 0); w.add(h);
    wheels.push(w);
  });
  g.userData.wheels = wheels;
  bed.castShadow = true;
  return g;
}
const trucks = [buildTruck("#ffffff"), buildTruck("#f3b300")];
trucks.forEach((t, i) => { t.position.set(-200 - i * 18, 0, -7.5); world.add(t); t.userData.stopX = -18 - i * 13; t.userData.t0 = -1; });
function driveTrucks(now) { trucks.forEach((t, i) => { t.userData.t0 = now + i * .9; t.position.x = t.userData.stopX - 110; }); }
function parkTrucks() { trucks.forEach(t => { t.userData.t0 = -1; t.position.x = t.userData.stopX; }); }

/* ===================================================== 3D: ESTEIRA E CAIXAS */
const play = new THREE.Group(); world.add(play);
const BELT = { x0: -9, x1: 9, z: -1, y: 1.05, d: 2.5, spawnX: -8.6, endX: 8.2 };
const BINS = [
  { type: "soja", label: "SOJA", color: "#2f8f50", grain: "#d9bd62" },
  { type: "milho", label: "MILHO", color: "#e6a817", grain: "#f2c230" },
  { type: "trigo", label: "TRIGO", color: "#b9772c", grain: "#ddb05a" },
  { type: "impureza", label: "IMPUREZAS", color: "#5f6a70", grain: "#7d7468" },
];
const BIN_W = 2.35, BIN_GAP = .32, BIN_Z = 2.55, BIN_H = 1.25, BIN_D = 1.9;

const beltTex = (() => {
  const c = document.createElement("canvas"); c.width = 256; c.height = 128;
  const x = c.getContext("2d");
  x.fillStyle = "#2a2e2c"; x.fillRect(0, 0, 256, 128);
  x.strokeStyle = "#3d4440"; x.lineWidth = 14; x.lineCap = "round";
  for (let i = 0; i < 2; i++) { const o = i * 128; x.beginPath(); x.moveTo(o + 30, 16); x.lineTo(o + 80, 64); x.lineTo(o + 30, 112); x.stroke(); }
  x.fillStyle = "#1c1f1e"; x.fillRect(0, 0, 256, 6); x.fillRect(0, 122, 256, 6);
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.repeat.set((BELT.x1 - BELT.x0) / 2.2, 1);
  return t;
})();
(function buildBelt() {
  const L = BELT.x1 - BELT.x0, cx = (BELT.x0 + BELT.x1) / 2;
  const belt = new THREE.Mesh(new THREE.PlaneGeometry(L, BELT.d), new THREE.MeshStandardMaterial({ map: beltTex, roughness: .9 }));
  belt.rotation.x = -Math.PI / 2; belt.position.set(cx, BELT.y, BELT.z); belt.receiveShadow = true; play.add(belt);
  const frameM = mat("frame", "#1d7a45", { roughness: .5, metalness: .25 }), steel = mat("steel", "#9aa1a4", { roughness: .45, metalness: .6 });
  box(L + .4, .45, .2, frameM, cx, BELT.y - .05, BELT.z - BELT.d / 2 - .1, play);
  box(L + .4, .45, .2, frameM, cx, BELT.y - .05, BELT.z + BELT.d / 2 + .1, play);
  box(L, .5, BELT.d, mat("under", "#2b2f2d"), cx, BELT.y - .3, BELT.z, play);
  for (let x = BELT.x0 + .6; x < BELT.x1; x += 2.6) {
    box(.2, BELT.y - .3, .2, steel, x, (BELT.y - .3) / 2, BELT.z - BELT.d / 2 + .1, play);
    box(.2, BELT.y - .3, .2, steel, x, (BELT.y - .3) / 2, BELT.z + BELT.d / 2 - .1, play);
  }
  /* boca de entrada (moega) */
  const hop = new THREE.Group(); hop.position.set(BELT.x0 - .2, 0, BELT.z); play.add(hop);
  box(1.6, 3.2, BELT.d + .9, mat("hopper", "#16703f", { roughness: .55, metalness: .2 }), -.3, 1.9, 0, hop);
  box(.12, 1.1, BELT.d - .2, mat("hole", "#121514"), .52, 1.55, 0, hop);
  /* proteções laterais amarelas */
  const yel = mat("yellow", "#f3c534", { roughness: .5 });
  box(L - 1, .12, .12, yel, cx + .5, BELT.y + .5, BELT.z - BELT.d / 2 - .1, play);
  for (let x = BELT.x0 + 1.4; x < BELT.x1; x += 3.2) box(.1, .5, .1, yel, x, BELT.y + .25, BELT.z - BELT.d / 2 - .1, play);
})();

function iconImage(type) {
  return new Promise(res => {
    const im = new Image();
    im.onload = () => res(im); im.onerror = () => res(null);
    im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(ICONS[type].replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" '));
  });
}
function labelTexture(b) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 256;
  const x = c.getContext("2d");
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const draw = im => {
    x.clearRect(0, 0, 512, 256);
    x.fillStyle = "#ffffff"; roundRect(x, 8, 8, 496, 240, 40); x.fill();
    x.lineWidth = 10; x.strokeStyle = b.color; roundRect(x, 8, 8, 496, 240, 40); x.stroke();
    if (im) x.drawImage(im, 26, 28, 200, 200);
    x.fillStyle = "#103a24"; x.font = "900 " + (b.label.length > 6 ? 54 : 70) + "px Montserrat, Arial, sans-serif"; x.textBaseline = "middle";
    x.fillText(b.label, 236, 132, 260);
    t.needsUpdate = true;
  };
  draw(null);
  iconImage(b.type).then(im => { draw(im); if (document.fonts) document.fonts.ready.then(() => draw(im)); });
  return t;
}
function roundRect(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }

const binObjs = BINS.map((b, i) => {
  const g = new THREE.Group();
  const x = (i - 1.5) * (BIN_W + BIN_GAP);
  g.position.set(x, 0, BIN_Z); play.add(g);
  const body = new THREE.MeshStandardMaterial({ color: b.color, roughness: .55, metalness: .1 });
  const inner = new THREE.MeshStandardMaterial({ color: tmpC1.set(b.color).multiplyScalar(.55).clone(), roughness: .9 });
  const t = .14;
  box(BIN_W, .16, BIN_D, inner, 0, .08, 0, g);
  box(BIN_W, BIN_H, t, body, 0, BIN_H / 2, -BIN_D / 2 + t / 2, g);
  const front = box(BIN_W, BIN_H, t, body, 0, BIN_H / 2, BIN_D / 2 - t / 2, g);
  box(t, BIN_H, BIN_D, body, -BIN_W / 2 + t / 2, BIN_H / 2, 0, g);
  box(t, BIN_H, BIN_D, body, BIN_W / 2 - t / 2, BIN_H / 2, 0, g);
  const rim = mat("rim", "#ffffff", { roughness: .4 });
  box(BIN_W + .06, .1, .2, rim, 0, BIN_H, BIN_D / 2 - .1, g);
  box(BIN_W + .06, .1, .2, rim, 0, BIN_H, -BIN_D / 2 + .1, g);
  /* etiqueta na frente, um pouco inclinada para a câmera */
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(BIN_W - .2, (BIN_W - .2) / 2), new THREE.MeshStandardMaterial({ map: labelTexture(b), roughness: .55, transparent: true }));
  lab.position.set(0, BIN_H * .52, BIN_D / 2 + .012); g.add(lab);
  /* monte de grãos que cresce */
  const heap = new THREE.Mesh(new THREE.ConeGeometry(BIN_W * .42, 1, 10, 1), new THREE.MeshStandardMaterial({ color: b.grain, roughness: 1, flatShading: true }));
  heap.scale.set(1, .01, BIN_D / BIN_W); heap.position.y = .16; heap.castShadow = false; heap.receiveShadow = true; g.add(heap);
  /* área de toque generosa */
  const hit = new THREE.Mesh(new THREE.BoxGeometry(BIN_W + BIN_GAP, BIN_H + 1.4, BIN_D + 1), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = BIN_H / 2 + .3; hit.userData.bin = i; g.add(hit);
  return { ...b, i, g, x, body, front, heap, hit, fill: 0, pulse: 0, bad: 0, baseColor: new THREE.Color(b.color) };
});

/* ---------- marcadores (próximo item / item escolhido) ---------- */
const ringNext = new THREE.Mesh(new THREE.TorusGeometry(.78, .07, 8, 40), new THREE.MeshBasicMaterial({ color: "#ffd84a", transparent: true, opacity: .95 }));
ringNext.rotation.x = Math.PI / 2; ringNext.visible = false; play.add(ringNext);
const ringSel = new THREE.Mesh(new THREE.RingGeometry(.62, .92, 40), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: .9, side: THREE.DoubleSide }));
ringSel.rotation.x = -Math.PI / 2; ringSel.visible = false; play.add(ringSel);

/* ===================================================== 3D: ITENS */
const IM = {
  soy: new THREE.MeshStandardMaterial({ color: "#e2c56c", roughness: .55 }),
  soyPod: new THREE.MeshStandardMaterial({ color: "#7aa64a", roughness: .7, flatShading: true }),
  corn: new THREE.MeshStandardMaterial({ color: "#f4c22c", roughness: .5, flatShading: true }),
  husk: new THREE.MeshStandardMaterial({ color: "#76ad46", roughness: .75, flatShading: true, side: THREE.DoubleSide }),
  wheat: new THREE.MeshStandardMaterial({ color: "#dcaa52", roughness: .6, flatShading: true }),
  stem: new THREE.MeshStandardMaterial({ color: "#b78a3d", roughness: .8 }),
  rock: new THREE.MeshStandardMaterial({ color: "#8d9599", roughness: .95, flatShading: true }),
  dirt: new THREE.MeshStandardMaterial({ color: "#7b5a3a", roughness: 1, flatShading: true }),
  leaf: new THREE.MeshStandardMaterial({ color: "#a0763a", roughness: .9, flatShading: true, side: THREE.DoubleSide }),
};
const GEO = {
  bean: new THREE.SphereGeometry(.2, 12, 8),
  pod: new THREE.CapsuleGeometry(.24, .9, 4, 10),
  cob: (() => { const g = new THREE.CylinderGeometry(.33, .25, 1.45, 12, 8); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = 1 - Math.pow(Math.abs(y) / .8, 3) * .35, bump = 1 + (hash(i, 3) - .5) * .12; p.setX(i, p.getX(i) * k * bump); p.setZ(i, p.getZ(i) * k * bump); } g.computeVertexNormals(); return g; })(),
  husk: (() => { const g = new THREE.ConeGeometry(.3, 1.2, 5, 1, true); g.translate(0, .45, 0); return g; })(),
  kernel: new THREE.IcosahedronGeometry(.13, 0),
  rock: (() => { const g = new THREE.DodecahedronGeometry(.48, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const k = .8 + hash(p.getX(i) * 9, p.getZ(i) * 7) * .35; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * .75, p.getZ(i) * k); } g.computeVertexNormals(); return g; })(),
  clod: new THREE.IcosahedronGeometry(.26, 0),
  stick: new THREE.CylinderGeometry(.05, .06, 1.2, 5),
  leaf: (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(.28, .3, 0, .75); s.quadraticCurveTo(-.28, .3, 0, 0); return new THREE.ShapeGeometry(s); })(),
};
function shade(m) { m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } }); return m; }
const MAKE = {
  soja() {
    const g = new THREE.Group();
    [[-.28, .12], [.3, -.08], [0, .3]].forEach(([x, z], i) => {
      const pod = new THREE.Mesh(GEO.pod, IM.soyPod); pod.rotation.z = Math.PI / 2; pod.rotation.y = i * 1.1 + .2; pod.position.set(x * .6, .26, z * .6); pod.scale.set(1, 1, .7); g.add(pod);
    });
    for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(GEO.bean, IM.soy); const a = i / 7 * Math.PI * 2; b.position.set(Math.cos(a) * .42, .2 + (i % 2) * .08, Math.sin(a) * .42); g.add(b); }
    const b = new THREE.Mesh(GEO.bean, IM.soy); b.position.set(0, .5, 0); g.add(b);
    return shade(g);
  },
  milho() {
    const g = new THREE.Group();
    const cob = new THREE.Mesh(GEO.cob, IM.corn); cob.rotation.z = Math.PI / 2; cob.position.y = .38; g.add(cob);
    [-.6, .6, 2.2].forEach((r, i) => { const h = new THREE.Mesh(GEO.husk, IM.husk); h.rotation.z = Math.PI / 2 + .1; h.rotation.x = r; h.position.set(.55, .38, 0); h.scale.set(1, 1 - i * .12, .5); g.add(h); });
    return shade(g);
  },
  trigo() {
    const g = new THREE.Group();
    [-.22, .05, .3].forEach((z, j) => {
      const ear = new THREE.Group(); ear.rotation.z = Math.PI / 2 - .05; ear.rotation.x = (j - 1) * .25; ear.position.set(-.1, .22 + (j === 1 ? .1 : 0), z);
      const st = new THREE.Mesh(GEO.stick, IM.stem); st.position.y = -.35; ear.add(st);
      for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { const k = new THREE.Mesh(GEO.kernel, IM.wheat); k.scale.set(.8, 1.5, .8); k.position.set(s * .1, .3 + i * .17, 0); k.rotation.z = s * -.4; ear.add(k); }
      const tip = new THREE.Mesh(GEO.kernel, IM.wheat); tip.scale.set(.8, 1.6, .8); tip.position.y = 1.35; ear.add(tip);
      g.add(ear);
    });
    g.scale.setScalar(.95);
    return shade(g);
  },
  impureza() {
    const g = new THREE.Group();
    const r = new THREE.Mesh(GEO.rock, IM.rock); r.position.set(-.15, .3, 0); r.rotation.set(.3, .5, .2); g.add(r);
    const c1 = new THREE.Mesh(GEO.clod, IM.dirt); c1.position.set(.45, .2, .25); g.add(c1);
    const c2 = new THREE.Mesh(GEO.clod, IM.dirt); c2.position.set(.38, .16, -.32); c2.scale.setScalar(.7); g.add(c2);
    const st = new THREE.Mesh(GEO.stick, IM.stem); st.rotation.z = Math.PI / 2; st.rotation.y = .5; st.position.set(.1, .12, .05); g.add(st);
    const lf = new THREE.Mesh(GEO.leaf, IM.leaf); lf.rotation.x = -Math.PI / 2 + .2; lf.rotation.z = .8; lf.position.set(-.5, .1, .3); g.add(lf);
    return shade(g);
  },
};
const hitGeo = new THREE.SphereGeometry(.95, 8, 6), hitMat = new THREE.MeshBasicMaterial({ visible: false });

/* ---------- partículas ---------- */
const sparks = [];
const sparkGeo = new THREE.IcosahedronGeometry(.08, 0);
function burst(pos, color, n = 14, up = 3.2) {
  const m = new THREE.MeshBasicMaterial({ color, transparent: true });
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(sparkGeo, m); s.position.copy(pos);
    const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 2.2;
    s.userData = { v: new THREE.Vector3(Math.cos(a) * sp, up + Math.random() * 2.5, Math.sin(a) * sp), life: .7 + Math.random() * .3, t: 0, m };
    s.scale.setScalar(.7 + Math.random() * 1.2);
    play.add(s); sparks.push(s);
  }
}
function updateSparks(dt) {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i], u = s.userData; u.t += dt;
    u.v.y -= 12 * dt; s.position.addScaledVector(u.v, dt); s.rotation.x += dt * 8;
    u.m.opacity = clamp(1 - u.t / u.life, 0, 1);
    if (u.t >= u.life) { play.remove(s); sparks.splice(i, 1); }
  }
}

/* ===================================================== CÂMERA */
const cam = { from: null, to: null, t: 0, dur: 1, pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 40, drift: null, shake: 0 };
function pose(pos, look, fov = 40, drift) { return { pos, look, fov, drift }; }
function shotPose(name) {
  const a = camera.aspect, portrait = a < .9;
  switch (name) {
    case "title": return pose(V(-6, portrait ? 9 : 7.5, portrait ? 36 : 26), V(4, portrait ? 6.5 : 5, -12), portrait ? 46 : 40, { orbit: true });
    case "dawn": return pose(V(-60, 24, 48), V(2, 9, -18), portrait ? 52 : 42, { to: V(-38, 15, 40), dur: 9 });
    case "hello": return pose(V(-4, 4.2, portrait ? 21 : 15), V(-2, 4.2, -10), portrait ? 50 : 42, { to: V(-1, 4.6, portrait ? 19 : 13.5), dur: 12 });
    case "trucks": return pose(V(-56, 6.5, 8), V(-30, 2, -8), portrait ? 56 : 44, { to: V(-48, 5.5, 6), dur: 8 });
    case "yard": return pose(V(-26, 9, 16), V(-6, 2, -8), portrait ? 54 : 42, { to: V(-20, 8, 15), dur: 8 });
    case "belt": return gamePose(true);
    case "map": return pose(V(26, 16, 34), V(4, 6, -14), portrait ? 50 : 40, { orbit: true });
    default: return gamePose();
  }
}
function gamePose(cine) {
  const a = camera.aspect, fov = 38, half = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const portrait = a < .9;
  const W = portrait ? 10.9 : 11.8;                       /* largura que precisa caber */
  const elev = THREE.MathUtils.degToRad(portrait ? 50 : 48);
  const dist = Math.max((W / 2) / (half * a), portrait ? 0 : 14.5);
  const look = V(0, .9, portrait ? -1.6 : .2);
  const pos = V(0, look.y + Math.sin(elev) * dist, look.z + Math.cos(elev) * dist);
  if (cine) pos.add(V(-1.5, 1.2, 2));
  return pose(pos, look, fov);
}
function camTo(p, dur = 1.6) {
  cam.from = { pos: cam.pos.clone(), look: cam.look.clone(), fov: cam.fov };
  cam.to = p; cam.t = 0; cam.dur = reduce ? .001 : dur; cam.driftT = 0;
}
function camSnap(p) { cam.pos.copy(p.pos); cam.look.copy(p.look); cam.fov = p.fov; cam.to = p; cam.from = null; cam.t = 1; cam.dur = 1; cam.driftT = 0; }
const _look = new THREE.Vector3();
function updateCamera(dt, time) {
  if (cam.from && cam.t < cam.dur) {
    cam.t += dt; const k = easeInOut(clamp(cam.t / cam.dur, 0, 1));
    cam.pos.lerpVectors(cam.from.pos, cam.to.pos, k); cam.look.lerpVectors(cam.from.look, cam.to.look, k); cam.fov = lerp(cam.from.fov, cam.to.fov, k);
    if (cam.t >= cam.dur) cam.from = null;
  } else if (cam.to && cam.to.drift) {
    const d = cam.to.drift;
    cam.driftT = (cam.driftT || 0) + dt;
    if (d.orbit) {
      const base = cam.to.pos, look = cam.to.look, ang = Math.sin(time * .06) * .32;
      const v = base.clone().sub(look); const r = Math.hypot(v.x, v.z), a0 = Math.atan2(v.x, v.z);
      cam.pos.set(look.x + Math.sin(a0 + ang) * r, base.y + Math.sin(time * .11) * .8, look.z + Math.cos(a0 + ang) * r);
      cam.look.copy(look);
    } else if (d.to) {
      const k = easeInOut(clamp(cam.driftT / d.dur, 0, 1));
      cam.pos.lerpVectors(cam.to.pos, d.to, k);
    }
  }
  camera.position.copy(cam.pos);
  if (cam.shake > 0) { cam.shake = Math.max(0, cam.shake - dt * 2.6); camera.position.x += (Math.random() - .5) * cam.shake * .35; camera.position.y += (Math.random() - .5) * cam.shake * .25; }
  if (Math.abs(camera.fov - cam.fov) > .01) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }
  camera.lookAt(_look.copy(cam.look));
  sky.position.copy(camera.position);
  /* sol acompanha a área visível, para as sombras ficarem nítidas */
  const tgt = cam.look;
  sun.target.position.set(tgt.x, 0, tgt.z);
  sun.position.copy(sun.target.position).addScaledVector(skyU.sunDir.value, 60);
}

/* projeção para a tela */
const _p = new THREE.Vector3();
function toScreen(v) {
  _p.copy(v).project(camera);
  return { x: (_p.x + 1) / 2 * innerWidth, y: (1 - _p.y) / 2 * innerHeight, behind: _p.z > 1 };
}

/* ===================================================== MASCOTES */
const Cast = (() => {
  const BASE = 520;
  const A = {
    t: { el: $("#jrToninho"), x: 0, y: 0, s: .3, tx: 0, ty: 0, ts: .3, on: false, anchor: null },
    a: { el: $("#jrAroldinho"), x: 0, y: 0, s: .3, tx: 0, ty: 0, ts: .3, on: false, anchor: null },
  };
  Object.values(A).forEach(o => { o.el.style.width = o.el.style.height = BASE + "px"; });
  let mode = "off", speaker = null, first = true;
  const WORLD = {
    game: { t: V(-4.7, 0, -4.4), a: V(4.7, 0, -4.4), h: 3.1 },
    hello: { t: V(-4.6, 0, 0), a: V(.6, 0, 0), h: 3.3 },
    yard: { t: V(-10.5, 0, -2.8), a: V(-6.8, 0, -2.4), h: 3.3 },
    title: { t: V(-3.2, 0, 3), a: V(3.6, 0, 3.4), h: 3.3 },
  };
  function stageTargets() {
    const W = innerWidth, H = innerHeight, cap = $("#jrCaption"), capH = cap && !cap.hidden ? cap.getBoundingClientRect().height : 0;
    const h = Math.min(H * .34, W * .52), by = H - capH - 8;
    A.t.tx = W * .2; A.t.ty = by; A.t.ts = h / BASE;
    A.a.tx = W * .8; A.a.ty = by; A.a.ts = h / BASE;
  }
  function worldTargets(set) {
    for (const k of ["t", "a"]) {
      const foot = toScreen(set[k]), head = toScreen(_head.copy(set[k]).add(V(0, set.h, 0)));
      A[k].tx = foot.x; A[k].ty = foot.y; A[k].ts = Math.max(.05, (foot.y - head.y) / (BASE * .96));
    }
  }
  const _head = new THREE.Vector3();
  return {
    set(m) {
      const wasOff = mode === "off";
      mode = m;
      const on = m !== "off";
      Object.values(A).forEach(o => { o.on = on; o.el.classList.toggle("is-on", on); });
      if (on && (wasOff || first)) { first = false; this.update(1, true); }
    },
    speak(who, act) {
      speaker = who;
      const o = A[who]; if (!o) return;
      try { window.CoamoMascots && window.CoamoMascots.play(o.el, act || "talk"); } catch (_) {}
    },
    act(who, name) { const o = A[who]; if (!o) return; try { window.CoamoMascots && window.CoamoMascots.play(o.el, name); } catch (_) {} },
    update(dt, snap) {
      if (mode === "off") return;
      if (mode === "stage") stageTargets(); else worldTargets(WORLD[mode] || WORLD.game);
      const k = snap ? 1 : 1 - Math.pow(.0005, dt);
      for (const key of ["t", "a"]) {
        const o = A[key];
        o.x = lerp(o.x, o.tx, k); o.y = lerp(o.y, o.ty, k); o.s = lerp(o.s, o.ts, k);
        const sp = mode === "stage" && speaker ? (speaker === key ? 1.04 : .96) : 1;
        o.el.style.transform = `translate(${(o.x - BASE / 2).toFixed(1)}px, ${(o.y - BASE).toFixed(1)}px) scale(${(o.s * sp).toFixed(4)})`;
        o.el.style.filter = mode === "stage" && speaker && speaker !== key && speaker !== "n" ? "brightness(.82) saturate(.9)" : "";
      }
    },
    screenPos(who) { const o = A[who]; return { x: o.x, y: o.y - BASE * o.s * .9 }; },
  };
})();

/* ===================================================== INTERFACE */
const UI = {
  screens: ["scrTitle", "scrMap", "scrGames", "scrRank", "scrChapter", "scrResult"],
  show(id) {
    this.screens.forEach(s => { const el = document.getElementById(s); if (el) el.hidden = s !== id; });
  },
  hideAll() { this.show(null); },
};
const hud = {
  el: $("#jrHud"), score: $("#hudScore"), time: $("#hudTime"), timeBar: $("#hudTimeBar"), lives: $("#hudLives"),
  combo: $("#hudCombo"), comboN: $("#hudComboN"), comboBar: $("#hudComboBar"), line: $("#hudLine"), lineT: 0,
  setScore(v) { this.score.textContent = fmt(v); bump(this.score); },
  setLives(n, max) { this.lives.innerHTML = "♥".repeat(Math.max(0, n)) + "<s>" + "♥".repeat(Math.max(0, max - n)) + "</s>"; },
  setCombo(n) { this.comboN.textContent = "x" + n; this.comboBar.style.width = Math.min(100, n * 10) + "%"; this.combo.classList.toggle("is-hot", n >= 5); },
  setTime(left, total) {
    const s = Math.ceil(left); this.time.textContent = "00:" + String(Math.max(0, s)).padStart(2, "0");
    this.timeBar.style.transform = `scaleX(${clamp(left / total, 0, 1)})`;
    this.time.parentElement.classList.toggle("is-low", left <= 10);
  },
  say(who, text, ms = 2600) {
    this.line.innerHTML = `<b>${WHO[who]}:</b> ${text}`; this.line.classList.add("is-on");
    clearTimeout(this.lineT); this.lineT = setTimeout(() => this.line.classList.remove("is-on"), ms);
    Cast.speak(who);
  },
};
function bump(el) { el.classList.remove("is-bump"); void el.offsetWidth; el.classList.add("is-bump"); }
function floater(x, y, text, cls = "") {
  const f = document.createElement("div"); f.className = "jr-float " + cls; f.textContent = text;
  f.style.left = x + "px"; f.style.top = y + "px"; $("#jrFloaters").appendChild(f);
  setTimeout(() => f.remove(), 1100);
}
function banner(title, small, alert) {
  const b = $("#jrBanner"); b.hidden = false; b.className = "jr-banner" + (alert ? " is-alert" : "");
  b.innerHTML = (small ? `<small>${small}</small>` : "") + title;
  void b.offsetWidth; b.style.animation = "none"; void b.offsetWidth; b.style.animation = "";
  clearTimeout(banner.t); banner.t = setTimeout(() => { b.hidden = true; }, 1950);
}
function flash() { const f = $("#jrFlash"); f.classList.remove("is-on"); void f.offsetWidth; f.classList.add("is-on"); }
function countdown() {
  return new Promise(done => {
    const box = $("#jrCount"); box.hidden = false;
    const steps = ["3", "2", "1", "Já!"]; let i = 0;
    (function next() {
      if (i >= steps.length) { box.hidden = true; box.innerHTML = ""; done(); return; }
      box.innerHTML = `<b class="${i === 3 ? "is-go" : ""}">${steps[i]}</b>`;
      Sound.fx(i === 3 ? "go" : "count");
      i++; setTimeout(next, i === 4 ? 600 : 750);
    })();
  });
}

/* ---------- legendas de cinema ---------- */
const Caption = (() => {
  const box = $("#jrCaption"), who = $("#jrCapWho"), txt = $("#jrCapText"), skipBtn = $("#jrSkip");
  let lines = [], idx = 0, typing = 0, full = "", shown = 0, onEnd = null, autoT = 0, onLine = null, active = false;
  function render() {
    const L = lines[idx];
    who.textContent = WHO[L.who]; who.className = "jr-caption__who" + (L.who === "a" ? " is-a" : L.who === "n" ? " is-n" : "");
    full = L.text; shown = 0; txt.textContent = "";
    if (onLine) onLine(L, idx);
    if (L.who !== "n") Cast.speak(L.who, L.act);
    clearInterval(typing); clearTimeout(autoT);
    typing = setInterval(() => {
      shown += 2; txt.textContent = full.slice(0, shown);
      if (shown % 6 === 0) Sound.fx("type");
      if (shown >= full.length) { clearInterval(typing); typing = 0; autoT = setTimeout(next, 3400 + full.length * 25); }
    }, reduce ? 1 : 33);
  }
  function next() {
    if (!active) return;
    if (typing) { clearInterval(typing); typing = 0; txt.textContent = full; clearTimeout(autoT); autoT = setTimeout(next, 3200 + full.length * 20); return; }
    idx++;
    if (idx >= lines.length) return end();
    render();
  }
  function end() {
    active = false; clearInterval(typing); clearTimeout(autoT);
    box.hidden = true; skipBtn.hidden = true; document.body.classList.remove("has-caption");
    const cb = onEnd; onEnd = null; if (cb) cb();
  }
  box.addEventListener("click", () => { Sound.fx("tap"); next(); });
  skipBtn.addEventListener("click", () => { Sound.fx("tap"); end(); });
  return {
    play(ls, opts = {}) {
      return new Promise(res => {
        lines = ls; idx = 0; onEnd = res; onLine = opts.onLine || null; active = true;
        box.hidden = false; skipBtn.hidden = !opts.skippable; document.body.classList.add("has-caption");
        render();
      });
    },
    get active() { return active; },
    stop() { if (active) { onEnd = null; end(); } },
  };
})();

/* ===================================================== JOGO: CAPÍTULO 1 */
const Ch1 = (() => {
  const TOTAL = 60, MAX_LIVES = 5;
  const PH = [
    { at: 0, speed: 1.45, spawn: 1.3, name: "Aquecimento" },
    { at: 20, speed: 2.05, spawn: 1.0, name: "Movimento" },
    { at: 40, speed: 2.7, spawn: .78, name: "Safra cheia" },
  ];
  const WEIGHTS = [["soja", .32], ["milho", .26], ["trigo", .22], ["impureza", .2]];
  let S = null;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();

  function reset() {
    if (S) S.items.forEach(it => play.remove(it.g));
    S = { running: false, t: 0, score: 0, lives: MAX_LIVES, combo: 0, best: 0, sorted: 0, attempts: 0, misses: 0, escapes: 0, items: [], spawnT: .2, phase: 0, sel: null, last: [], said: {}, truck: false, done: null };
    binObjs.forEach(b => { b.fill = 0; b.heap.scale.y = .01; });
    hud.setScore(0); hud.setLives(MAX_LIVES, MAX_LIVES); hud.setCombo(0); hud.setTime(TOTAL, TOTAL);
    ringNext.visible = ringSel.visible = false;
  }
  function pickType() {
    let r = Math.random(), t = "soja";
    for (const [k, w] of WEIGHTS) { if ((r -= w) <= 0) { t = k; break; } }
    if (S.last.length >= 2 && S.last[0] === t && S.last[1] === t) return pickType();
    S.last.unshift(t); S.last.length = Math.min(S.last.length, 3);
    return t;
  }
  function spawn() {
    const type = pickType(), g = MAKE[type]();
    g.position.set(BELT.spawnX, BELT.y, BELT.z + (Math.random() - .5) * .5);
    g.rotation.y = (Math.random() - .5) * .8;
    const hit = new THREE.Mesh(hitGeo, hitMat); hit.position.y = .3; g.add(hit);
    const it = { type, g, hit, state: "belt", t: 0, spin: (Math.random() - .5) * .6, wob: Math.random() * 6, lift: 0, scale: 0 };
    hit.userData.item = it;
    g.scale.setScalar(.01);
    play.add(g); S.items.push(it);
  }
  function front() {
    let best = null;
    for (const it of S.items) if (it.state === "belt" && it.g.position.x > -6.4 && (!best || it.g.position.x > best.g.position.x)) best = it;
    return best;
  }
  function select(it) {
    S.sel = S.sel === it ? null : it;
    Sound.fx("select");
  }
  function send(it, bin) {
    if (!it || it.state !== "belt") return;
    S.attempts++;
    it.state = "fly"; it.t = 0; it.bin = bin; it.from = it.g.position.clone();
    it.to = new THREE.Vector3(bin.x, BIN_H + .5, BIN_Z);
    it.ok = it.type === bin.type;
    if (S.sel === it) S.sel = null;
    Sound.fx("whoosh");
  }
  function land(it) {
    const bin = it.bin;
    if (it.ok) {
      const gain = 100 + Math.min(S.combo, 10) * 20;
      S.combo++; S.best = Math.max(S.best, S.combo); S.sorted++; S.score += gain;
      bin.fill = Math.min(1, bin.fill + .045); bin.pulse = 1;
      burst(V(bin.x, BIN_H + .2, BIN_Z), bin.grain, 14);
      play.remove(it.g); it.state = "gone";
      const p = toScreen(V(bin.x, BIN_H + 1.4, BIN_Z));
      floater(p.x, p.y, "+" + gain, S.combo >= 5 ? "is-gold" : "");
      hud.setScore(S.score); hud.setCombo(S.combo);
      Sound.fx(S.combo % 5 === 0 ? "combo" : "success"); buzz(15);
      if (S.combo === 5 && !S.said.c5) { S.said.c5 = 1; hud.say(...STORY.ch1.lines.combo5); Cast.act("a", "celebrate"); }
      else if (S.combo === 10 && !S.said.c10) { S.said.c10 = 1; hud.say(...STORY.ch1.lines.combo10); Cast.act("t", "celebrate"); }
      else if (S.combo > 0 && S.combo % 5 === 0) Cast.act(S.combo % 10 ? "a" : "t", "celebrate");
    } else {
      S.misses++; S.combo = 0; bin.bad = 1;
      it.state = "bounce"; it.t = 0; it.from = it.g.position.clone();
      it.to = V(bin.x + (Math.random() - .5) * 2, -.2, BIN_Z + 2.2);
      hud.setCombo(0);
      const p = toScreen(V(bin.x, BIN_H + 1.4, BIN_Z));
      floater(p.x, p.y, "Caixa errada", "is-bad");
      loseLife();
      Sound.fx("error"); buzz([40, 40, 40]); flash(); cam.shake = .6;
      Cast.act("t", "oops");
      if (!S.said.miss) { S.said.miss = 1; hud.say(...STORY.ch1.lines.miss); }
    }
  }
  function escape(it) {
    it.state = "fall"; it.t = 0; it.from = it.g.position.clone();
    S.escapes++; S.combo = 0; hud.setCombo(0);
    if (S.sel === it) S.sel = null;
    const p = toScreen(V(Math.min(it.g.position.x, 5), BELT.y + 1, BELT.z));
    floater(clamp(p.x, 80, innerWidth - 80), p.y, "Passou!", "is-bad");
    loseLife();
    Sound.fx("fall"); buzz(60); flash();
    Cast.act("a", "oops");
    if (!S.said.esc) { S.said.esc = 1; hud.say(...STORY.ch1.lines.escape); }
  }
  function loseLife() {
    S.lives--; hud.setLives(S.lives, MAX_LIVES);
    if (S.lives <= 0) finish(false);
  }
  function pointer(e) {
    if (!S || !S.running) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects([...S.items.filter(i => i.state === "belt").map(i => i.hit), ...binObjs.map(b => b.hit)], false);
    const h = hits[0];
    if (h && h.object.userData.item) { select(h.object.userData.item); return; }
    if (h && h.object.userData.bin != null) { send(S.sel || front(), binObjs[h.object.userData.bin]); return; }
    /* toque perto de um item (tela pequena) */
    let near = null, nd = 70;
    for (const it of S.items) { if (it.state !== "belt") continue; const p = toScreen(it.g.position); const d = Math.hypot(p.x - e.clientX, p.y - e.clientY); if (d < nd) { nd = d; near = it; } }
    if (near) select(near);
  }
  canvas.addEventListener("pointerdown", pointer);

  function update(dt) {
    if (!S) return;
    /* esteira anda mesmo fora do jogo (fica bonito no fundo) */
    const speed = S.running ? PH[S.phase].speed : 1.0;
    beltTex.offset.x -= dt * speed / 2.2;
    binObjs.forEach(b => {
      b.heap.scale.y = lerp(b.heap.scale.y, Math.max(.01, b.fill * 1.6), 1 - Math.pow(.01, dt));
      b.heap.position.y = .16;
      if (b.pulse > 0) { b.pulse = Math.max(0, b.pulse - dt * 2.6); const k = Math.sin(b.pulse * Math.PI); b.g.scale.set(1 + k * .06, 1 - k * .08 + k * .12, 1 + k * .06); }
      else b.g.scale.set(1, 1, 1);
      if (b.bad > 0) { b.bad = Math.max(0, b.bad - dt * 2.2); b.g.position.x = b.x + Math.sin(b.bad * 40) * .12 * b.bad; b.body.emissive.setRGB(b.bad * .8, 0, 0); }
      else { b.g.position.x = b.x; b.body.emissive.setRGB(0, 0, 0); }
    });
    if (!S.running) return;
    S.t += dt;
    const left = TOTAL - S.t;
    hud.setTime(left, TOTAL);
    const ph = PH.reduce((a, p, i) => S.t >= p.at ? i : a, 0);
    if (ph !== S.phase) {
      S.phase = ph;
      if (ph === 1) { banner("Movimento aumentando", "FASE 2"); Sound.fx("phase"); hud.say(...STORY.ch1.lines.phase2); Cast.act("a", "wave"); }
      if (ph === 2) { banner("Caminhão extra chegou!", "FASE 3 · SAFRA CHEIA", true); Sound.fx("phase"); hud.say(...STORY.ch1.lines.truck); Cast.act("t", "think"); S.spawnT = Math.min(S.spawnT, .25); }
    }
    if (left <= 10 && !S.said.last) { S.said.last = 1; hud.say(...STORY.ch1.lines.last); }
    if (left <= 0) { finish(true); return; }
    S.spawnT -= dt;
    const lastX = S.items.reduce((m, it) => it.state === "belt" ? Math.min(m, it.g.position.x) : m, 99);
    if (S.spawnT <= 0 && lastX > BELT.spawnX + 1.7) { spawn(); S.spawnT = PH[S.phase].spawn * (.85 + Math.random() * .3); }
    const sp = PH[S.phase].speed;
    for (let i = S.items.length - 1; i >= 0; i--) {
      const it = S.items[i], g = it.g;
      it.scale = Math.min(1, it.scale + dt * 3.5);
      if (it.state === "belt") {
        g.scale.setScalar(easeOut(it.scale));
        g.position.x += sp * dt;
        it.wob += dt * 3;
        g.rotation.y += it.spin * dt;
        const target = S.sel === it ? .55 : 0;
        it.lift = lerp(it.lift, target, 1 - Math.pow(.001, dt));
        g.position.y = BELT.y + it.lift + Math.abs(Math.sin(it.wob)) * .04;
        g.rotation.z = Math.sin(it.wob * .7) * .05;
        if (g.position.x > BELT.endX) escape(it);
      } else if (it.state === "fly") {
        it.t += dt / .42; const k = clamp(it.t, 0, 1);
        g.position.lerpVectors(it.from, it.to, easeInOut(k));
        g.position.y += Math.sin(k * Math.PI) * 2.2;
        g.rotation.x += dt * 9; g.scale.setScalar(1 - k * .25);
        if (k >= 1) land(it);
      } else if (it.state === "bounce") {
        it.t += dt / .6; const k = clamp(it.t, 0, 1);
        g.position.lerpVectors(it.from, it.to, k); g.position.y += Math.sin(k * Math.PI) * 1.6;
        g.rotation.z += dt * 10; g.scale.setScalar(Math.max(.01, .75 * (1 - k * k)));
        if (k >= 1) { play.remove(g); it.state = "gone"; }
      } else if (it.state === "fall") {
        it.t += dt / .7; const k = clamp(it.t, 0, 1);
        g.position.x = it.from.x + k * 1.6; g.position.y = it.from.y - k * k * 3.2;
        g.rotation.z -= dt * 6; g.scale.setScalar(Math.max(.01, 1 - k));
        if (k >= 1) { play.remove(g); it.state = "gone"; }
      }
      if (it.state === "gone") S.items.splice(i, 1);
    }
    /* marcadores */
    const nx = S.sel || front();
    if (nx && nx.state === "belt") {
      ringNext.visible = true; ringNext.position.set(nx.g.position.x, BELT.y + .04, nx.g.position.z);
      const k = 1 + Math.sin(performance.now() / 160) * .08; ringNext.scale.set(k, k, k);
      ringNext.material.color.set(S.sel ? "#ffffff" : "#ffd84a");
    } else ringNext.visible = false;
    ringSel.visible = !!S.sel;
    if (S.sel) ringSel.position.set(S.sel.g.position.x, BELT.y + .03, S.sel.g.position.z);
  }
  function stars() {
    const acc = S.attempts ? S.sorted / S.attempts * 100 : 0;
    if (S.lives <= 0) return 0;
    if (S.sorted >= 40 && acc >= 90) return 3;
    if (S.sorted >= 28 && acc >= 80) return 2;
    if (S.sorted >= 14) return 1;
    return 0;
  }
  function finish(timeUp) {
    if (!S.running) return;
    S.running = false;
    const acc = S.attempts ? Math.round(S.sorted / S.attempts * 100) : 0;
    const st = stars();
    S.done && S.done({ score: S.score, stars: st, sorted: S.sorted, accuracy: acc, best: S.best, misses: S.misses + S.escapes, seconds: Math.round(Math.min(S.t, TOTAL)), timeUp, phase: S.phase + 1 });
  }
  return {
    reset,
    update,
    start() { return new Promise(res => { S.done = res; S.running = true; S.spawnT = .1; hud.say(...STORY.ch1.lines.start); }); },
    get running() { return !!(S && S.running); },
    clearItems() { if (S) { S.items.forEach(it => play.remove(it.g)); S.items = []; } ringNext.visible = ringSel.visible = false; },
    /* testes automatizados */
    _state: () => S,
    _sendFront(correct = true) { const it = front(); if (!it) return false; const b = binObjs.find(x => (x.type === it.type) === correct) || binObjs[0]; send(it, b); return true; },
  };
})();
Ch1.reset();

/* ===================================================== FLUXO */
const Journey = {
  state: store.get("jrState", { stars: {}, scores: {}, seen: false }),
  save() { store.set("jrState", this.state); },
  clear() { this.state = { stars: {}, scores: {}, seen: false }; store.del("jrState"); },
  total() { return Object.values(this.state.scores).reduce((a, b) => a + b, 0); },
};
let mode = "title";         /* title | map | games | ranking | cutscene | chapter | play | result */
let playMode = "journey";   /* journey | solo */

function setMode(m) {
  mode = m;
  document.body.classList.toggle("is-playing", m === "play");
  hud.el.hidden = m !== "play";
  Sound.music(["title", "map", "games", "ranking"].includes(m));
}
function goTitle() {
  Caption.stop(); setMode("title"); UI.show("scrTitle");
  Ch1.clearItems(); setSky("morning", 1.5);
  camTo(shotPose("title"), 2.2);
  Cast.set("title");
  setTimeout(() => { if (mode === "title") { Cast.act("t", "wave"); setTimeout(() => Cast.act("a", "wave"), 500); } }, 900);
}
function goMap() {
  setMode("map"); UI.show("scrMap"); Cast.set("off");
  camTo(shotPose("map"), 2);
  renderMap();
}
function goGames() { setMode("games"); UI.show("scrGames"); Cast.set("off"); camTo(shotPose("map"), 2); renderGames(); }
function goRanking(game) { setMode("ranking"); UI.show("scrRank"); Cast.set("off"); camTo(shotPose("map"), 2); renderRanking(game || "classificacao"); }

function renderMap() {
  const st = Journey.state, list = $("#jrMap"); list.innerHTML = "";
  let current = CHAPTERS.find(c => c.ready && !st.stars[c.id] && st.stars[c.id] !== 0) || null;
  CHAPTERS.forEach(c => {
    const done = st.stars[c.id] != null, cur = current === c, locked = !c.ready;
    const li = document.createElement("li");
    li.className = "jr-node" + (done ? " is-done" : "") + (cur ? " is-current" : "") + (locked ? " is-locked" : "");
    const s = st.stars[c.id] || 0;
    li.innerHTML = `<span class="jr-node__dot">${done ? "✓" : c.n}</span>
      <span class="jr-node__txt"><small>CAPÍTULO ${c.n} · ${c.kicker}</small><strong>${c.title}</strong><span>${c.text}</span></span>
      ${locked ? `<span class="jr-node__soon">EM PRODUÇÃO</span>` : `<span class="jr-node__stars">${"<b>★</b>".repeat(s)}${"★".repeat(3 - s)}</span>`}`;
    list.appendChild(li);
  });
  $("#jrMapTotal").textContent = fmt(Journey.total());
  const btn = $("#jrMapPlay");
  if (current) { btn.textContent = `Jogar capítulo ${current.n}`; btn.dataset.ch = current.id; }
  else { btn.textContent = "Jogar o capítulo 1 de novo"; btn.dataset.ch = "ch1"; }
  $("#jrMapSub").textContent = current ? "Complete os capítulos e ganhe até 3 estrelas em cada um." : "Os próximos capítulos estão em produção. Enquanto isso, melhore suas estrelas!";
}
function renderGames() {
  const box = $("#jrGames"); box.innerHTML = "";
  GAMES.forEach(g => {
    const top = !g.noRank && window.CoamoLeaderboard && window.CoamoLeaderboard.top ? window.CoamoLeaderboard.top(g.id)[0] : null;
    const el = document.createElement(g.href ? "a" : "button");
    el.className = "jr-game" + (g.isNew ? " jr-game--new" : "");
    if (g.href) el.href = g.href; else { el.type = "button"; el.dataset.solo = g.play; }
    el.innerHTML = `<img src="${g.img}" alt=""><small>${g.label}</small><strong>${g.title}</strong><span>${g.text}</span>
      <em>${g.noRank ? "Sem ranking: aqui não tem certo ou errado" : top ? `Recorde: ${fmt(top.score)} pts · ${escapeHtml(top.name)}` : "Ranking aberto: seja o primeiro!"}</em>`;
    box.appendChild(el);
  });
}
function renderRanking(game) {
  $$("#jrRankTabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.rank === game ? "true" : "false"));
  $$("[data-ranking-list]").forEach(l => { l.hidden = l.dataset.rankingList !== game; });
  const t = $("#jrRankTitle"); t.dataset.rankingAdminTrigger = game;
  if (window.CoamoLeaderboard) window.CoamoLeaderboard.render(game);
}
function escapeHtml(s) { return String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

/* ---------- prólogo ---------- */
async function playPrologue() {
  setMode("cutscene"); UI.hideAll();
  Ch1.clearItems();
  setSky("dawn"); camSnap(shotPose("dawn")); Cast.set("off");
  trucks.forEach(t => { t.position.x = t.userData.stopX - 160; t.userData.t0 = -1; });
  setTimeout(() => { if (mode === "cutscene") setSky("morning", 14); }, 600);
  await Caption.play(STORY.prologue, {
    skippable: true,
    onLine(L) {
      if (L.shot && L.shot !== playPrologue.lastShot) {
        playPrologue.lastShot = L.shot;
        if (L.shot === "trucks") { driveTrucks(clock.elapsedTime); Cast.set("off"); }
        if (L.shot === "hello") Cast.set("stage");
        if (L.shot === "yard") { Cast.set("stage"); }
        if (L.shot === "belt") Cast.set("stage");
        camTo(shotPose(L.shot), L.shot === "hello" ? 3.2 : 2.6);
      }
    },
  });
  playPrologue.lastShot = null;
  setSky("morning", 1.2);
  parkTrucks();
  Journey.state.seen = true; Journey.save();
}

/* ---------- capítulo 1 ---------- */
async function runChapter1(solo) {
  playMode = solo ? "solo" : "journey";
  Caption.stop();
  if (!solo && !Journey.state.seen) await playPrologue();
  parkTrucks();
  setSky("morning", 1);
  Ch1.reset();
  setMode("chapter");
  camTo(gamePose(), 1.8);
  Cast.set("game");
  const c = STORY.ch1;
  $("#jrChKicker").textContent = solo ? "JOGO AVULSO · CLASSIFICAÇÃO" : c.kicker;
  $("#jrChTitle").textContent = solo ? "Desafio da Classificação" : c.title;
  $("#jrChGoal").textContent = c.goal;
  $("#jrChHow").textContent = c.how;
  $("#jrChLegend").innerHTML = BINS.map(b => `<li>${ICONS[b.type]}<span>${b.label[0] + b.label.slice(1).toLowerCase()}</span></li>`).join("");
  UI.show("scrChapter");
  await new Promise(res => { $("#jrChStart").onclick = () => { Sound.fx("tap"); res(); }; });
  UI.hideAll();
  setMode("play");
  await countdown();
  const r = await Ch1.start();
  setMode("result");
  ringNext.visible = ringSel.visible = false;
  Sound.fx(r.stars >= 2 ? "win" : "phase");
  setTimeout(() => Ch1.clearItems(), 900);
  if (!solo) {
    const best = Journey.state.scores.ch1 || 0;
    Journey.state.stars.ch1 = Math.max(Journey.state.stars.ch1 || 0, r.stars);
    Journey.state.scores.ch1 = Math.max(best, r.score);
    Journey.save();
    Cast.set("stage");
    camTo(shotPose("belt"), 2.2);
    await new Promise(res => setTimeout(res, 700));
    const lines = (STORY.ch1.end[r.stars] || STORY.ch1.end[1]).map(([who, text]) => ({ who, text, act: r.stars >= 2 ? "celebrate" : "think" }));
    await Caption.play(lines, { skippable: true });
  }
  showResult(r, solo);
}

function showResult(r, solo) {
  Cast.set("off");
  setMode("result");
  camTo(shotPose("map"), 2.4);
  UI.show("scrResult");
  const titles = ["A esteira venceu desta vez", "Carga classificada!", "Ótima classificação!", "Classificação perfeita!"];
  $("#jrResKicker").textContent = solo ? "DESAFIO DA CLASSIFICAÇÃO" : (r.stars > 0 ? "CAPÍTULO 1 CONCLUÍDO" : "CAPÍTULO 1");
  $("#jrResTitle").textContent = titles[r.stars];
  $("#jrResText").textContent = r.stars === 3 ? "Precisão de especialista. Os cooperados agradecem!" : r.stars === 2 ? "Quase tudo no lugar certo. Mais um pouco e chega às 3 estrelas." : r.stars === 1 ? "Você classificou a carga. Tente mais acertos seguidos para subir de nível." : "Tente de novo: comece pelo item com o anel amarelo.";
  const scoreEl = $("#jrResScore");
  const t0 = performance.now();
  (function count() { const k = Math.min(1, (performance.now() - t0) / 1100); scoreEl.textContent = fmt(r.score * easeOut(k)); if (k < 1) requestAnimationFrame(count); })();
  $("#jrResStats").innerHTML = `<div><b>${r.sorted}</b><small>itens certos</small></div><div><b>${r.accuracy}%</b><small>precisão</small></div><div><b>x${r.best}</b><small>melhor combo</small></div><div><b>${r.seconds}s</b><small>tempo</small></div>`;
  $$("#jrStars i").forEach((s, i) => { s.classList.remove("is-on"); if (i < r.stars) setTimeout(() => { s.classList.add("is-on"); Sound.fx("star", i); }, 500 + i * 380); });
  const acts = $("#jrResActions"); acts.innerHTML = "";
  const add = (label, cls, fn) => { const b = document.createElement("button"); b.type = "button"; b.className = "jr-btn " + cls; b.textContent = label; b.onclick = () => { Sound.fx("tap"); fn(); }; acts.appendChild(b); };
  if (solo) {
    add("Jogar de novo", "jr-btn--primary", () => runChapter1(true));
    add("Ver ranking", "jr-btn--soft", () => goRanking("classificacao"));
    add("Outros jogos", "jr-btn--soft", goGames);
  } else {
    add("Continuar a jornada", "jr-btn--primary", goMap);
    add("Jogar de novo", "jr-btn--soft", () => runChapter1(false));
  }
  /* ranking do evento: pede o nome se entrou no top 5 */
  setTimeout(() => {
    if (mode !== "result" || !window.CoamoLeaderboard || r.score <= 0) return;
    window.CoamoLeaderboard.maybeCapture("classificacao", { score: r.score, duration: r.seconds, accuracy: r.accuracy, phase: r.phase, stars: r.stars });
  }, 1900 + r.stars * 380);
}

/* ---------- botões e navegação ---------- */
document.addEventListener("click", e => {
  const go = e.target.closest("[data-go]");
  if (go) {
    Sound.fx("tap");
    const g = go.dataset.go;
    if (g === "journey") { Journey.state.seen ? goMap() : runChapter1(false); }
    else if (g === "games") goGames();
    else if (g === "ranking") goRanking();
    else if (g === "title") goTitle();
    return;
  }
  const solo = e.target.closest("[data-solo]");
  if (solo) { Sound.fx("tap"); runChapter1(true); return; }
  const tab = e.target.closest("[data-rank]");
  if (tab) { Sound.fx("tap"); renderRanking(tab.dataset.rank); }
});
$("#jrMapPlay").addEventListener("click", () => { Sound.fx("tap"); runChapter1(false); });

/* som */
const soundBtn = $("#jrSound");
function paintSound() {
  const on = Sound.on;
  soundBtn.setAttribute("aria-pressed", on ? "true" : "false");
  soundBtn.setAttribute("aria-label", on ? "Som ligado. Toque para desligar" : "Som desligado. Toque para ligar");
  soundBtn.innerHTML = on
    ? '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>'
    : '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
}
soundBtn.addEventListener("click", e => { e.stopPropagation(); Sound.toggle(); paintSound(); Sound.fx("tap"); });
paintSound();

/* inatividade: volta para a abertura e zera a jornada do visitante */
let lastInput = performance.now();
["pointerdown", "keydown"].forEach(ev => document.addEventListener(ev, () => { lastInput = performance.now(); Sound.unlock(); if (mode === "title" || mode === "map" || mode === "games" || mode === "ranking") Sound.music(true); }, { passive: true }));
setInterval(() => {
  const idle = (performance.now() - lastInput) / 1000;
  const overlayOpen = !!document.querySelector("#coamoRankingOverlay:not([hidden])");
  if (mode !== "title" && mode !== "play" && mode !== "cutscene" && !overlayOpen && idle > 100) { Journey.clear(); goTitle(); }
  if (mode === "cutscene" && idle > 150) { Journey.clear(); goTitle(); }
}, 5000);

/* ===================================================== LAÇO PRINCIPAL */
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  if (mode === "play" || mode === "chapter") camSnap(gamePose());
  else if (cam.to && cam.to.drift && cam.to.drift.orbit) camSnap(shotPose(mode === "title" ? "title" : "map"));
}
addEventListener("resize", resize);
resize();

const fpsEl = $("#jrFps"); const showFps = params.has("fps"); if (showFps) fpsEl.hidden = false;
let frames = 0, fpsT = 0, fps = 60, lowFor = 0;
function loop() {
  const dt = Math.min(clock.getDelta(), .1), time = clock.elapsedTime;
  if (skyState.t < skyState.dur) { skyState.t += dt; applySky(easeInOut(clamp(skyState.t / skyState.dur, 0, 1))); }
  clouds.children.forEach(c => { c.position.x += c.userData.v * dt; if (c.position.x > 220) c.position.x = -220; });
  const dp = dust.geometry.attributes.position;
  for (let i = 0; i < dp.count; i++) { let y = dp.getY(i) + dt * .15; if (y > 7) y = 0; dp.setY(i, y); dp.setX(i, dp.getX(i) + Math.sin(time * .5 + i) * dt * .1); }
  dp.needsUpdate = true;
  trucks.forEach(t => {
    const u = t.userData; if (u.t0 < 0 || time < u.t0) return;
    const k = clamp((time - u.t0) / 8, 0, 1), x = u.stopX - 110 * (1 - easeOut(k));
    const dx = x - t.position.x; t.position.x = x;
    u.wheels.forEach(w => { w.rotation.y -= dx / .55; });
    if (k >= 1) u.t0 = -1;
  });
  Ch1.update(dt);
  updateSparks(dt);
  updateCamera(dt, time);
  Cast.update(dt);
  renderer.render(scene, camera);
  /* qualidade automática: se o totem não aguentar, reduz a resolução */
  frames++; fpsT += dt;
  if (fpsT >= 1) {
    fps = frames / fpsT; frames = 0; fpsT = 0;
    if (fps < 38 && pixelRatio > 1) { lowFor++; if (lowFor >= 3) { pixelRatio = Math.max(1, pixelRatio - .25); renderer.setPixelRatio(pixelRatio); resize(); lowFor = 0; } } else lowFor = 0;
    if (showFps) fpsEl.textContent = `${fps.toFixed(0)} fps · res ${pixelRatio.toFixed(2)}\n${renderer.info.render.calls} draws · ${(renderer.info.render.triangles / 1000).toFixed(0)}k tri`;
  }
  requestAnimationFrame(loop);
}

/* ===================================================== INÍCIO */
document.fonts && document.fonts.ready.then(() => {});
camSnap(shotPose("title"));
const start = params.get("tela");
if (start === "jogo" || params.get("jogo") === "classificacao") runChapter1(true);
else if (start === "prologo") { Journey.clear(); runChapter1(false); }
else if (start === "mapa") goMap();
else if (start === "ranking") goRanking();
else if (start === "jogos") goGames();
else goTitle();
requestAnimationFrame(loop);

/* ganchos para testes automatizados */
window.__jr = { Ch1, Journey, Caption, get mode() { return mode; }, camera, renderer, goTitle, goMap, runChapter1, showResult, fps: () => fps };
