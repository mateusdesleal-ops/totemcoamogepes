/* =========================================================
   COAMO GAMES — JORNADA DA SAFRA (3D) · v1
   Cenários em 3D (three.js) com os mascotes desenhados por cima,
   como recortes. Modo Jornada (capítulos com história) e modo avulso.
   Textos da história: objeto STORY logo abaixo.
   ========================================================= */
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { ICONS } from "./jornada-icones.v1.js";
import { createWorld, V } from "./jornada-mundo.v1.js?v=2.0";
import { createCh2, STORY2 } from "./jornada-cap2.v1.js?v=1.6";
import { createCh3, STORY3 } from "./jornada-cap3.v1.js?v=2.0";
import { createCh4, STORY4 } from "./jornada-cap4.v1.js?v=1.6";
import { createCh5, STORY5, FOCUS } from "./jornada-cap5.v1.js?v=1.7";

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
  { id: "ch2", n: 2, kicker: "ARMAZENAGEM", title: "Corrida contra a chuva", text: "Guarde cada produto no silo certo antes do temporal.", ready: true },
  { id: "ch3", n: 3, kicker: "INDÚSTRIA E LOGÍSTICA", title: "Do grão ao mercado", text: "Trace a rota de cada carga até virar produto.", ready: true },
  { id: "ch4", n: 4, kicker: "MEMÓRIA", title: "O arquivo da Coamo", text: "Cada par encontrado libera uma curiosidade.", ready: true },
  { id: "ch5", n: 5, kicker: "FINAL", title: "Onde você brilha", text: "Descubra a área da Coamo que combina com você.", ready: true },
];

const GAMES = [
  { id: "classificacao", label: "NOVO · 3D", title: "Desafio da Classificação", text: "Separe soja, milho, trigo e impurezas na esteira.", img: "assets/jornada/capa-jornada.webp", play: "ch1", isNew: true },
  { id: "silo3d", label: "NOVO · 3D", title: "Corrida contra a chuva", text: "Guarde cada carga no silo certo antes do temporal.", img: "assets/jornada/capa-silo.webp", play: "ch2", isNew: true },
  { id: "memoria3d", label: "NOVO · 3D", title: "O arquivo da Coamo", text: "Jogo da memória com curiosidades sobre a Coamo.", img: "assets/jornada/capa-memoria.webp", play: "ch4", isNew: true },
  { id: "cadeia3d", label: "NOVO · 3D", title: "Do grão ao mercado", text: "Trace a rota da soja, do trigo e do milho até o destino.", img: "assets/jornada/capa-rotas.webp", play: "ch3", isNew: true },
  { id: "quiz", label: "NOVO · 3D · QUIZ", title: "Onde você brilha", text: "Descubra a área da Coamo que mais combina com você.", img: "assets/jornada/capa-quiz.webp", play: "ch5", isNew: true, noRank: true },
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
  let ctx = null, master = null, musicGain = null, musicTimer = 0, musicOn = false, unlocked = false;
  function ac() {
    if (!unlocked) return null;
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
    pop: () => { const c = ac(); if (!c) return; note(160 + Math.random() * 80, 0, .25, "triangle", .07); const len = Math.floor(c.sampleRate * .5), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4) * .6; const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); src.buffer = buf; f.type = "highpass"; f.frequency.value = 1800; g.gain.value = .25; src.connect(f); f.connect(g); g.connect(master); src.start(c.currentTime + .05); },
    thunder: () => {
      const c = ac(); if (!c) return;
      const len = Math.floor(c.sampleRate * 1.8), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
      const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      src.buffer = buf; f.type = "lowpass"; f.frequency.value = 420; g.gain.value = .55;
      src.connect(f); f.connect(g); g.connect(master); src.start();
    },
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
      if (play && on && unlocked && ac()) musicStep();
    },
    toggle() {
      on = !on; try { localStorage.setItem(KEY, on ? "on" : "off"); } catch (_) {}
      if (ac()) master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, .05);
      if (on && musicOn) { clearTimeout(musicTimer); musicStep(); }
      return on;
    },
    unlock() { if (unlocked) return; unlocked = true; if (ac() && musicOn && on) { clearTimeout(musicTimer); musicStep(); } },
  };
})();
function buzz(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (_) {} }

/* ===================================================== 3D: RENDERIZADOR E MUNDO */
const canvas = $("#jrCanvas");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance", stencil: false });
  if (!renderer.getContext()) throw new Error("sem webgl");
} catch (e) { renderer = null; }
if (!renderer) {
  /* sem 3D: abre a versão clássica do jogo pedido, ou a lista de jogos clássicos */
  const classic = { classificacao: "jogo-classificacao.html", silo: "jogo-silo.html", cadeia: "jogo-cadeia.html", memoria: "jogo-memoria.html", quiz: "jogo-area.html" }[params.get("jogo")];
  if (classic) location.replace(classic);
  $("#scrNo3d").hidden = false; throw new Error("WebGL indisponível");
}

/* qualidade: alta (oclusão de ambiente + brilho), média (brilho) ou baixa (sem pós) */
const QUALITY = ["low", "medium", "high"];
let quality = params.get("q") || (() => { try { return localStorage.getItem("coamoJrQuality"); } catch (_) { return null; } })() || "high";
if (!QUALITY.includes(quality)) quality = "high";
let pixelRatio = Math.min(window.devicePixelRatio || 1, quality === "high" ? 1.5 : 1.25);
renderer.setPixelRatio(pixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

const W = createWorld(renderer);
const scene = W.scene, play = W.play, BELT = W.BELT, BIN = W.BIN, BINS = W.BINS, binObjs = W.binObjs;
const ringNext = W.ringNext, ringSel = W.ringSel, hitGeo = W.hitGeo, hitMat = W.hitMat;
const camera = new THREE.PerspectiveCamera(40, 1, .4, 1600);
camera.userData.look = new THREE.Vector3();
const clock = new THREE.Clock();
const setSky = W.setSky;
const driveTrucks = t => W.driveTrucks(t), parkTrucks = () => W.parkTrucks(), trucks = W.trucks;

/* pós-processamento */
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, vignette: { value: .34 }, warmth: { value: .045 }, contrast: { value: 1.08 }, saturation: { value: 1.14 },
    sunPos: { value: new THREE.Vector2(.5, .5) }, sunK: { value: 0 }, aspect: { value: 1 }, flareCol: { value: new THREE.Color("#ffd9a0") } },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
  fragmentShader: `uniform sampler2D tDiffuse; uniform float vignette, warmth, contrast, saturation, sunK, aspect; uniform vec2 sunPos; uniform vec3 flareCol; varying vec2 vUv;
    float disc(vec2 p, vec2 c, float r, float soft){ vec2 d = (p - c) * vec2(aspect, 1.); return 1. - smoothstep(r * (1. - soft), r, length(d)); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv); vec3 col = c.rgb;
      col = (col - .5) * contrast + .5;
      float l = dot(col, vec3(.2126,.7152,.0722)); col = mix(vec3(l), col, saturation);
      col += vec3(warmth, warmth * .4, -warmth * .6);
      /* reflexo de lente: só aparece se o sol estiver visível (céu claro no ponto do sol) */
      if (sunK > .001) {
        float vis = 0.;
        for (int i = 0; i < 5; i++) { vec2 o = vec2(float(i - 2) * .006, float(i % 2) * .006 - .003); vec3 s = texture2D(tDiffuse, sunPos + o).rgb; vis += smoothstep(.82, .97, dot(s, vec3(.3333))); }
        vis = vis / 5. * sunK;
        if (vis > .001) {
          vec2 d = (vUv - sunPos) * vec2(aspect, 1.); float r = length(d);
          vec3 f = flareCol * (exp(-r * 9.) * .55 + exp(-r * 2.6) * .12);
          f += flareCol * exp(-abs(d.y) * 160.) * exp(-abs(d.x) * 2.2) * .22;                /* raio horizontal */
          vec2 axis = vec2(.5) - sunPos;
          f += vec3(.55, .75, 1.) * disc(vUv, sunPos + axis * .55, .035, .6) * .07;
          f += vec3(1., .85, .55) * disc(vUv, sunPos + axis * .95, .075, .25) * .05;
          f += vec3(.6, 1., .75) * disc(vUv, sunPos + axis * 1.3, .022, .5) * .09;
          f += vec3(1., .7, .5) * disc(vUv, sunPos + axis * 1.65, .12, .15) * .04;
          f += vec3(.7, .8, 1.) * (disc(vUv, sunPos + axis * 2., .19, .06) - disc(vUv, sunPos + axis * 2., .17, .2)) * .05;   /* anel */
          col += f * vis;
        }
      }
      vec2 d = vUv - .5; col *= 1. - vignette * smoothstep(.25, .85, length(d * vec2(1., 1.15)));
      gl_FragColor = vec4(clamp(col, 0., 1.), c.a); }`,
};
let composer = null, gtao = null, bloom = null, grade = null, bokeh = null;
function buildComposer() {
  if (composer) { composer.dispose && composer.dispose(); composer = null; }
  W.setLite(quality === "low");
  document.body.dataset.q = quality;
  if (quality === "low") return;
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
  composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(pixelRatio); composer.setSize(innerWidth, innerHeight);
  composer.addPass(new RenderPass(scene, camera));
  if (quality === "high") {
    gtao = new GTAOPass(scene, camera, innerWidth, innerHeight);
    gtao.updateGtaoMaterial({ radius: .9, distanceExponent: 1.4, thickness: 1.5, scale: 1.1, samples: 12 });
    gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
    gtao.blendIntensity = .85;
    /* o céu, nuvens e sombras de contato não entram no cálculo de oclusão */
    const ov = gtao.overrideVisibility.bind(gtao);
    gtao.overrideVisibility = function () {
      ov();
      scene.traverse(o => { if (o.userData.noAO || o.isSprite || (o.material && o.material.transparent && !o.isInstancedMesh)) o.visible = false; });
    };
    composer.addPass(gtao);
    /* profundidade de campo nas cenas da história (só na qualidade alta) */
    bokeh = new BokehPass(scene, camera, { focus: 30, aperture: .00006, maxblur: .006 });
    bokeh.enabled = false; composer.addPass(bokeh);
  } else bokeh = null;
  bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .28, .55, .92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  grade = new ShaderPass(GradeShader); composer.addPass(grade);
}
const _sun = new THREE.Vector3(), _fwd = new THREE.Vector3();
let dofK = 0;
function renderFrame(dt = 0) {
  if (grade) {
    /* posição do sol na tela para o reflexo de lente */
    const U = grade.uniforms; camera.getWorldDirection(_fwd);
    _sun.copy(W.sunDir).multiplyScalar(1000).add(camera.position).project(camera);
    const front = _fwd.dot(W.sunDir) > .15, edge = Math.max(Math.abs(_sun.x), Math.abs(_sun.y));
    U.sunPos.value.set(_sun.x * .5 + .5, _sun.y * .5 + .5); U.aspect.value = camera.aspect;
    U.sunK.value = front ? W.flareK() * (1 - THREE.MathUtils.smoothstep(edge, .85, 1.05)) : 0;
    U.flareCol.value.copy(W.sun.color);
  }
  if (bokeh) {
    dofK = lerp(dofK, (mode === "cutscene" || mode === "title") ? 1 : 0, 1 - Math.pow(.02, dt));
    bokeh.enabled = dofK > .02;
    if (bokeh.enabled) {
      const u = bokeh.uniforms; u.focus.value = camera.position.distanceTo(camera.userData.look || _fwd);
      u.aperture.value = .00006 * dofK; u.maxblur.value = .006 * dofK;
    }
  }
  if (composer) composer.render(); else renderer.render(scene, camera);
}

/* ===================================================== CÂMERA */
const cam = { from: null, to: null, t: 0, dur: 1, pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 40, drift: null, shake: 0 };
function pose(pos, look, fov = 40, drift) { return { pos, look, fov, drift }; }
function shotPose(name) {
  const a = camera.aspect, portrait = a < .9;
  switch (name) {
    case "title": {
      if (portrait) return pose(V(-6, 9, 36), V(4, 6.5, -12), 46, { orbit: true });
      /* tela deitada: câmera mais longe e mais alta, unidade inteira abaixo do título */
      const fov = 40, look = V(3, 4.5, -16), dir = V(-.34, .3, 1).normalize();
      const d = Math.max(44, 23 / (Math.tan(THREE.MathUtils.degToRad(fov / 2)) * Math.min(a, 1.8)));
      return pose(look.clone().addScaledVector(dir, d), look, fov, { orbit: true });
    }
    case "dawn": return pose(V(-60, 24, 48), V(2, 9, -18), portrait ? 52 : 42, { to: V(-38, 15, 40), dur: 9 });
    case "hello": return pose(V(-4, 4.2, portrait ? 21 : 15), V(-2, 4.2, -10), portrait ? 50 : 42, { to: V(-1, 4.6, portrait ? 19 : 13.5), dur: 12 });
    case "trucks": return pose(V(-56, 6.5, 8), V(-30, 2, -8), portrait ? 56 : 44, { to: V(-48, 5.5, 6), dur: 8 });
    case "yard": return pose(V(-26, 9, 16), V(-6, 2, -8), portrait ? 54 : 42, { to: V(-20, 8, 15), dur: 8 });
    case "belt": return gamePose(true);
    case "siloWide": return pose(V(44, 15, 24), V(12, 9, -24), portrait ? 54 : 42, { to: V(38, 13, 20), dur: 10 });
    case "siloStage": { const p = ch2Pose(); return pose(p.pos.clone().add(V(-3, -1, 4)), p.look.clone().add(V(0, -1.5, 0)), p.fov, { to: p.pos.clone().add(V(-1.5, -.5, 2)), dur: 12 }); }
    case "ch2": return ch2Pose();
    case "ch3": return regionPose();
    case "ch4": return tablePose();
    case "ch5": return stagePose();
    case "nightWide": return pose(V(-70, 20, 74), V(-2, 8, -14), portrait ? 56 : 44, { to: V(-58, 16, 64), dur: 12 });
    case "nightStage": { const p = stagePose(); return pose(p.pos.clone().add(V(4, 1, 6)), p.look.clone().add(V(0, 2, 0)), p.fov, null); }
    case "tableWide": { const T = W.TABLE; return pose(V(T.x - 30, 9, T.z - 26), V(T.x + 30, 6, T.z + 4), portrait ? 56 : 44, { to: V(T.x - 26, 8, T.z - 20), dur: 10 }); }
    case "tableStage": { const p = tablePose(); return pose(p.pos.clone().add(V(-4, -4, 0)), p.look.clone().add(V(6, 2, 0)), p.fov, null); }
    case "regionWide": return pose(V(-150, 40, 260), V(30, 4, 60), portrait ? 56 : 44, { to: V(-120, 50, 240), dur: 12 });
    case "regionStage": { const p = regionPose(); return pose(p.pos.clone().multiplyScalar(.82).add(p.look.clone().multiplyScalar(.18)), p.look, p.fov, null); }
    case "map": return portrait ? pose(V(26, 16, 34), V(4, 6, -14), 50, { orbit: true }) : pose(V(34, 20, 44), V(2, 4, -14), 40, { orbit: true });
    default: return gamePose();
  }
}
function stagePose() {
  const a = camera.aspect, portrait = a < .9, fov = portrait ? 50 : 40, half = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const S = W.STAGE, look = V(S.x, portrait ? 6.2 : 5.2, S.z);
  const d = Math.max(9 / (half * a), portrait ? 0 : 6.6 / half);
  const el = THREE.MathUtils.degToRad(portrait ? 9 : 10);
  return pose(V(look.x, look.y + Math.sin(el) * d, look.z + Math.cos(el) * d), look, fov);
}
function tablePose() {
  /* mesa vista de cima: as 16 cartas ocupam o meio da tela, sobra espaço embaixo para os mascotes */
  const a = camera.aspect, portrait = a < .9, fov = portrait ? 50 : 40, half = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const T = W.TABLE, el = THREE.MathUtils.degToRad(portrait ? 62 : 58);
  const look = V(T.x + (portrait ? -1.6 : -.6), 3.5, T.z);
  const Vh = portrait ? Math.max(18.8, 11 / (a * 2 * half) * 2 * half) : 14.6;
  const d = Math.max(Vh / (2 * half), (portrait ? 10.8 : 12) / (2 * half * a));
  return pose(V(look.x - Math.cos(el) * d, look.y + Math.sin(el) * d, look.z), look, fov);
}
function regionPose() {
  const a = camera.aspect, portrait = a < .9, fov = portrait ? 50 : 40, half = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const look = V(20, 0, portrait ? 100 : 82);
  const fitW = portrait ? 236 : 260;
  const d = Math.max((fitW / 2) / (half * a), portrait ? 0 : 136 / half);
  const el = THREE.MathUtils.degToRad(portrait ? 60 : 55);
  return pose(V(look.x, Math.sin(el) * d, look.z + Math.cos(el) * d), look, fov, { orbit: false });
}
function ch2Pose() {
  const a = camera.aspect, portrait = a < .9, fov = portrait ? 50 : 42;
  const look = V(15.5, portrait ? 9.5 : 7.5, -24.4);
  const dir = V(W.CAM2_DIR.x, portrait ? .3 : .26, W.CAM2_DIR.z).normalize();
  const half = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const d = Math.max(portrait ? 0 : 36, 15 / (half * Math.min(a, 1.7)));
  return pose(look.clone().addScaledVector(dir, d), look, fov);
}
function gamePose(cine) {
  const a = camera.aspect, portrait = a < .9, o = window.__gp || {};
  const fov = o.fov || (portrait ? 50 : 38), half = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const fitW = o.fitW || (portrait ? 11.4 : a > 1.15 ? 17.5 : 13);                 /* largura que precisa caber */
  const elev = THREE.MathUtils.degToRad(o.elev || (portrait ? 34 : 42));
  const dist = Math.max((fitW / 2) / (half * a), portrait ? 0 : 15.5);
  const look = V(0, o.lookY != null ? o.lookY : .9, o.lookZ != null ? o.lookZ : (portrait ? .5 : 1.4));
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
  camera.userData.look.copy(cam.look);
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
  Object.values(A).forEach(o => {
    o.el.style.width = BASE + "px"; o.el.style.height = BASE + "px";
    /* boneco articulado (rosto original), montado direto no palco */
    try {
      const P = window.CoamoMascots && window.CoamoMascots.buildRig(o.el.dataset.rig);
      if (P) { P.root.classList.add("coamo-rig--solo"); o.el.appendChild(P.root); }
    } catch (_) {}
  });
  let mode = "off", speaker = null, first = true;
  const WORLD = {
    game: { t: V(-2.7, 0, 7.6), a: V(2.7, 0, 7.6), h: 3.2 },
    gameWide: { t: V(-7.1, 0, 3.6), a: V(7.1, 0, 3.6), h: 3.3 },
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
  function titleTargets() {
    const W = innerWidth, H = innerHeight, menu = $(".jr-title__menu"), top = menu ? menu.getBoundingClientRect().top : H * .8;
    const h = Math.min(H * .2, W * .36);
    A.t.tx = W * .17; A.t.ty = top - 8; A.t.ts = h / BASE;
    A.a.tx = W * .83; A.a.ty = top - 8; A.a.ts = h / BASE;
  }
  function cornerTargets() {
    const W = innerWidth, H = innerHeight, load = $("#jrLoad"), h = Math.min(H * .2, W * .34);
    const by = H - (W < 700 ? 18 : 26);
    A.t.tx = W * .1 + h * .12; A.t.ty = by; A.t.ts = h / BASE;
    A.a.tx = W * .9 - h * .12; A.a.ty = by; A.a.ts = h / BASE;
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
      if (mode === "stage") stageTargets(); else if (mode === "title") titleTargets(); else if (mode === "corners") cornerTargets();
      else worldTargets(mode === "game" && camera.aspect > 1.15 ? WORLD.gameWide : (WORLD[mode] || WORLD.game));
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
  screens: ["scrTitle", "scrMap", "scrGames", "scrRank", "scrChapter", "scrResult", "scrBadge"],
  show(id) {
    this.screens.forEach(s => { const el = document.getElementById(s); if (el) el.hidden = s !== id; });
  },
  hideAll() { this.show(null); },
};
const hud = {
  el: $("#jrHud"), score: $("#hudScore"), time: $("#hudTime"), timeBar: $("#hudTimeBar"), lives: $("#hudLives"),
  combo: $("#hudCombo"), comboN: $("#hudComboN"), comboBar: $("#hudComboBar"), line: $("#hudLine"), lineT: 0,
  setScore(v) { this.score.textContent = fmt(v); bump(this.score); },
  alt(label, text) { this.lives.previousElementSibling.textContent = label; this.lives.textContent = text; this.lives.classList.remove("jr-hearts"); },
  resetAlt() { this.lives.previousElementSibling.textContent = "VIDAS"; this.lives.classList.add("jr-hearts"); },
  setLives(n, max) { this.resetAlt(); this.lives.innerHTML = "♥".repeat(Math.max(0, n)) + "<s>" + "♥".repeat(Math.max(0, max - n)) + "</s>"; },
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
    binObjs.forEach(b => { W.setFill(b, .18, true); });
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
    const type = pickType(), g = W.makeItem(type);
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
    it.to = new THREE.Vector3(bin.x, BIN.h + .7, BIN.z);
    it.ok = it.type === bin.type;
    if (S.sel === it) S.sel = null;
    Sound.fx("whoosh");
  }
  function land(it) {
    const bin = it.bin;
    if (it.ok) {
      const gain = 100 + Math.min(S.combo, 10) * 20;
      S.combo++; S.best = Math.max(S.best, S.combo); S.sorted++; S.score += gain;
      W.setFill(bin, bin.fill + .04); bin.pulse = 1;
      W.burst(V(bin.x, BIN.h + .5, BIN.z), bin.type, 14);
      play.remove(it.g); it.state = "gone";
      const p = toScreen(V(bin.x, BIN.h + 1.6, BIN.z));
      floater(p.x, p.y, "+" + gain, S.combo >= 5 ? "is-gold" : "");
      hud.setScore(S.score); hud.setCombo(S.combo);
      Sound.fx(S.combo % 5 === 0 ? "combo" : "success"); buzz(15);
      if (S.combo === 5 && !S.said.c5) { S.said.c5 = 1; hud.say(...STORY.ch1.lines.combo5); Cast.act("a", "celebrate"); }
      else if (S.combo === 10 && !S.said.c10) { S.said.c10 = 1; hud.say(...STORY.ch1.lines.combo10); Cast.act("t", "celebrate"); }
      else if (S.combo > 0 && S.combo % 5 === 0) Cast.act(S.combo % 10 ? "a" : "t", "celebrate");
    } else {
      S.misses++; S.combo = 0; bin.bad = 1;
      it.state = "bounce"; it.t = 0; it.from = it.g.position.clone();
      it.to = V(bin.x + (Math.random() - .5) * 2, -.2, BIN.z + 2.2);
      hud.setCombo(0);
      const p = toScreen(V(bin.x, BIN.h + 1.6, BIN.z));
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
    W.beltTex.forEach(t => { t.offset.x -= dt * speed / 2.4; });
    binObjs.forEach(b => {
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
    _demo() {
      const types = ["milho", "impureza", "soja", "trigo", "soja", "milho"];
      types.forEach((t, i) => { S.last = []; spawn(); const it = S.items[S.items.length - 1]; it.type = t; play.remove(it.g); it.g = W.makeItem(t); it.g.add(it.hit); it.g.position.set(-6.6 + i * 2.55, BELT.y, BELT.z + (i % 2 ? .25 : -.2)); it.g.rotation.y = i * .7; it.scale = 1; play.add(it.g); });
      binObjs.forEach((b, i) => { W.setFill(b, [.8, .65, .55, .4][i], true); });
      S.sel = null;
    },
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
  runToken++; clearChapters(null); setSky("morning", 1.5);
  camTo(shotPose("title"), 2.2);
  Cast.set("title");
  setTimeout(() => { if (mode === "title") { Cast.act("t", "wave"); setTimeout(() => Cast.act("a", "wave"), 500); } }, 900);
}
function goMap() {
  clearChapters(null);
  setMode("map"); UI.show("scrMap"); Cast.set("off");
  camTo(shotPose("map"), 2);
  renderMap();
}
function goGames() { clearChapters(null); setMode("games"); UI.show("scrGames"); Cast.set("off"); camTo(shotPose("map"), 2); renderGames(); }
function goRanking(game) { clearChapters(null); setMode("ranking"); UI.show("scrRank"); Cast.set("off"); camTo(shotPose("map"), 2); renderRanking(game || "classificacao"); }

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
  else { const lastReady = [...CHAPTERS].reverse().find(c => c.ready); btn.textContent = `Jogar o capítulo ${lastReady.n} de novo`; btn.dataset.ch = lastReady.id; }
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
  W.hideTrucks();
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

/* ---------- capítulos ---------- */
const Ch2 = createCh2({ W, camera, canvas, hud, Cast, Sound, buzz, banner, floater, flash, toScreen, setSky });
const CH = {
  ch1: {
    n: 1, engine: Ch1, rank: "classificacao",
    kicker: STORY.ch1.kicker, title: STORY.ch1.title, soloKicker: "JOGO AVULSO · CLASSIFICAÇÃO", soloTitle: "Desafio da Classificação",
    goal: STORY.ch1.goal, how: STORY.ch1.how,
    legend: () => BINS.map(b => `<li>${ICONS[b.type]}<span>${b.label[0] + b.label.slice(1).toLowerCase()}</span></li>`).join(""),
    setup() { clearChapters(Ch1); parkTrucks(); setSky("morning", 1); Ch1.reset(); camTo(gamePose(), 1.8); Cast.set("game"); },
    intro: () => (!Journey.state.seen ? playPrologue() : null),
    endShot: () => shotPose("belt"),
    end: STORY.ch1.end,
    after() { ringNext.visible = ringSel.visible = false; setTimeout(() => Ch1.clearItems(), 900); },
    result: {
      titles: ["A esteira venceu desta vez", "Carga classificada!", "Ótima classificação!", "Classificação perfeita!"],
      texts: ["Tente de novo: comece pelo item com o anel amarelo.", "Você classificou a carga. Tente mais acertos seguidos para subir de nível.", "Quase tudo no lugar certo. Mais um pouco e chega às 3 estrelas.", "Precisão de especialista. Os cooperados agradecem!"],
      soloKicker: "DESAFIO DA CLASSIFICAÇÃO",
      stats: r => `<div><b>${r.sorted}</b><small>itens certos</small></div><div><b>${r.accuracy}%</b><small>precisão</small></div><div><b>x${r.best}</b><small>melhor combo</small></div><div><b>${r.seconds}s</b><small>tempo</small></div>`,
      entry: r => ({ score: r.score, duration: r.seconds, accuracy: r.accuracy, phase: r.phase, stars: r.stars }),
    },
  },
  ch2: {
    n: 2, engine: Ch2, rank: "silo3d",
    kicker: STORY2.kicker, title: STORY2.title, soloKicker: "JOGO AVULSO · SILOS", soloTitle: "Corrida contra a chuva",
    goal: STORY2.goal, how: STORY2.how,
    legend: () => ["soja", "milho", "trigo"].map(t => `<li>${ICONS[t]}<span>${t[0].toUpperCase() + t.slice(1)}</span></li>`).join("") +
      `<li><svg viewBox="0 0 48 48" aria-hidden="true"><rect x="17" y="4" width="14" height="40" rx="4" fill="#1b2a33" stroke="#e9edf0" stroke-width="3"/><rect x="20" y="20" width="8" height="21" rx="2" fill="#3fb36b"/><rect x="14" y="14" width="20" height="3" fill="#f3c331"/></svg><span>Nível</span></li>`,
    setup() { clearChapters(Ch2); parkTrucks(); setSky("morning", 1); Ch2.reset(); camTo(shotPose("ch2"), 2); Cast.set("corners"); Ch2.showTags(true); },
    intro: () => playIntro(STORY2.intro),
    endShot: () => shotPose("siloStage"),
    end: STORY2.end,
    after() { setTimeout(() => { Ch2.clear(); }, 400); },
    result: {
      titles: STORY2.result.titles, texts: STORY2.result.texts, soloKicker: "CORRIDA CONTRA A CHUVA",
      stats: r => `<div><b>${r.correct}</b><small>cargas guardadas</small></div><div><b>${r.accuracy}%</b><small>precisão</small></div><div><b>x${r.best}</b><small>melhor combo</small></div><div><b>${r.errors}</b><small>erros</small></div>`,
      entry: r => ({ score: r.score, duration: r.seconds, accuracy: r.accuracy, stars: r.stars, combo: r.best }),
    },
  },
};

const Ch3 = createCh3({ W, camera, canvas, hud, Cast, Sound, buzz, banner, floater, flash, toScreen, setSky });
CH.ch3 = {
  n: 3, engine: Ch3, rank: "cadeia3d",
  kicker: STORY3.kicker, title: STORY3.title, soloKicker: "JOGO AVULSO · ROTAS", soloTitle: "Do grão ao mercado",
  goal: STORY3.goal, how: STORY3.how,
  legend: () => ["soja", "trigo", "milho"].map(t => `<li>${ICONS[t]}<span>${{ soja: "Soja → óleo", trigo: "Trigo → farinha", milho: "Milho → porto" }[t]}</span></li>`).join(""),
  setup() { clearChapters(Ch3); setSky("afternoon", 1.2); W.setShadowArea(150); Ch3.reset(); camTo(shotPose("ch3"), 2.4); Cast.set("corners"); Ch3.showLabels(true); },
  intro: () => { setSky("afternoon", 1.5); W.setShadowArea(150); return playIntro(STORY3.intro); },
  endShot: () => shotPose("regionStage"),
  end: STORY3.end,
  after() { setTimeout(() => Ch3.clear(), 400); },
  result: {
    titles: STORY3.result.titles, texts: STORY3.result.texts, soloKicker: "DO GRÃO AO MERCADO",
    stats: r => `<div><b>${r.routes}/3</b><small>rotas completas</small></div><div><b>${r.accuracy}%</b><small>precisão</small></div><div><b>x${r.best}</b><small>melhor combo</small></div><div><b>${r.errors}</b><small>paradas erradas</small></div>`,
    entry: r => ({ score: r.score, duration: r.seconds, accuracy: r.accuracy, stars: r.stars }),
  },
};
const Ch4 = createCh4({ W, camera, canvas, hud, Cast, Sound, buzz, banner, floater, flash, toScreen, setSky });
CH.ch4 = {
  n: 4, engine: Ch4, rank: "memoria3d",
  kicker: STORY4.kicker, title: STORY4.title, soloKicker: "JOGO AVULSO · MEMÓRIA", soloTitle: "O arquivo da Coamo",
  goal: STORY4.goal, how: STORY4.how,
  legend: () => ["assets/logo_unicoamo_v12.webp", "assets/logo_fups_v11.webp", "assets/logo_coamo_saude_v11.webp", "assets/logo_arcam_v11.webp"].map(src => `<li><img src="${src}" alt="" style="width:calc(var(--u)*3.2);height:calc(var(--u)*3.2);object-fit:contain;background:#fff;border-radius:10px;padding:4px"></li>`).join(""),
  setup() { clearChapters(Ch4); setSky("sunset", 1.2); Ch4.show(true); Ch4.reset(); camTo(shotPose("ch4"), 2.2); Cast.set("corners"); },
  intro: () => { clearChapters(Ch4); setSky("sunset", 1.5); Ch4.show(true); Ch4.reset(); return playIntro(STORY4.intro); },
  endShot: () => shotPose("tableStage"),
  end: STORY4.end,
  after() { setTimeout(() => Ch4.clear(), 400); },
  result: {
    titles: STORY4.result.titles, texts: STORY4.result.texts, soloKicker: "O ARQUIVO DA COAMO",
    stats: r => `<div><b>${r.matches}/8</b><small>pares</small></div><div><b>${r.moves}</b><small>jogadas</small></div><div><b>x${r.best}</b><small>pares seguidos</small></div><div><b>${r.seconds}s</b><small>tempo</small></div>`,
    entry: r => ({ score: r.score, duration: r.seconds, accuracy: r.accuracy, stars: r.stars }),
  },
};
const Ch5 = createCh5({ W, camera, canvas, hud, Cast, Sound, buzz, banner, floater, toScreen, setSky });
CH.ch5 = {
  n: 5, engine: Ch5, rank: null,
  kicker: STORY5.kicker, title: STORY5.title, soloKicker: "QUIZ · ONDE VOCÊ BRILHA", soloTitle: "Onde você brilha",
  goal: STORY5.goal, how: STORY5.how,
  legend: () => ["campo", "industria", "tecnologia", "pessoas"].map(k => `<li><img src="${Ch5.AREAS[k].photo}" alt="" style="width:calc(var(--u)*3.4);height:calc(var(--u)*3.4);object-fit:cover;object-position:${(FOCUS[Ch5.AREAS[k].photo] || [.5, .4]).map(v => v * 100 + "%").join(" ")};border-radius:12px"><span>${Ch5.AREAS[k].title.split(" &")[0]}</span></li>`).join(""),
  setup() { clearChapters(Ch5); setSky("night", 1.2); Ch5.show(true); Ch5.reset(); camTo(shotPose("ch5"), 2.2); Cast.set("corners"); },
  intro: () => { clearChapters(Ch5); setSky("night", 2); Ch5.show(true); Ch5.reset(); return playIntro(STORY5.intro); },
  endShot: () => shotPose("nightStage"),
  end: r => [{ who: "t", text: `Você brilha em ${r.areaTitle}!`, act: "celebrate" }, { who: "a", text: r.areaText, act: "celebrate" }],
  after() { },
  noHud: false,
  onFinish: (r, solo) => showBadge(r, solo),
};
/* limpa os outros capítulos ao trocar de cena */
function clearChapters(keep) {
  [Ch1, Ch2, Ch3, Ch4, Ch5].forEach(e => { if (e === keep) return; if (e.clear) e.clear(); if (e.clearItems) e.clearItems(); });
  if (keep !== Ch3) W.setShadowArea();
}

/* cena de abertura de um capítulo (falas + câmera) */
async function playIntro(lines) {
  setMode("cutscene"); UI.hideAll();
  let last = null;
  await Caption.play(lines, {
    skippable: true,
    onLine(L) {
      if (L.shot && L.shot !== last) {
        last = L.shot;
        const wide = /Wide$/.test(L.shot);
        Cast.set(wide ? "off" : "stage");
        if (wide) camSnap(shotPose(L.shot)); else camTo(shotPose(L.shot), 2.6);
      }
    },
  });
}

let runToken = 0, activeChapter = "ch1";
function currentPose() { return activeChapter === "ch1" ? gamePose() : shotPose(activeChapter); }
async function runChapter(id, solo) {
  const def = CH[id]; if (!def) return;
  const token = ++runToken; activeChapter = id;
  playMode = solo ? "solo" : "journey";
  Caption.stop();
  clearChapters(def.engine);
  if (!solo && def.intro) { const p = def.intro(); if (p) await p; }
  if (token !== runToken) return;
  setMode("chapter");
  def.setup();
  $("#jrChKicker").textContent = solo ? def.soloKicker : def.kicker;
  $("#jrChTitle").textContent = solo ? def.soloTitle : def.title;
  $("#jrChGoal").textContent = def.goal;
  $("#jrChHow").textContent = def.how;
  $("#jrChLegend").innerHTML = def.legend();
  UI.show("scrChapter");
  await new Promise(res => { $("#jrChStart").onclick = () => { Sound.fx("tap"); res(); }; });
  if (token !== runToken) return;
  UI.hideAll();
  setMode("play");
  await countdown();
  const r = await def.engine.start();
  if (token !== runToken) return;
  setMode("result");
  Sound.fx(r.stars >= 2 ? "win" : "phase");
  if (!solo) {
    Journey.state.stars[id] = Math.max(Journey.state.stars[id] || 0, r.stars);
    Journey.state.scores[id] = Math.max(Journey.state.scores[id] || 0, r.score);
    Journey.save();
    Cast.set("stage");
    camTo(def.endShot(), 2.2);
    await new Promise(res => setTimeout(res, 700));
    const lines = typeof def.end === "function" ? def.end(r) : (def.end[r.stars] || def.end[1]).map(([who, text]) => ({ who, text, act: r.stars >= 2 ? "celebrate" : "think" }));
    await Caption.play(lines, { skippable: true });
  }
  if (token !== runToken) return;
  def.after();
  if (def.onFinish) def.onFinish(r, solo); else showResult(r, solo, id);
}
const runChapter1 = solo => runChapter("ch1", solo);

/* ---------- crachá final ---------- */
function showBadge(r, solo) {
  Cast.set("off");
  setMode("result");
  camTo(shotPose("nightWide"), 3);
  Ch5.celebrate(solo ? 5 : 9);
  UI.show("scrBadge");
  const st = Journey.state, chs = ["ch1", "ch2", "ch3", "ch4"];
  const complete = !solo && chs.every(c => st.stars[c] != null);
  $("#jrBadgeKicker").textContent = solo ? "SEU PERFIL NA COAMO" : complete ? "JORNADA DA SAFRA CONCLUÍDA" : "CAPÍTULO 5 CONCLUÍDO";
  $("#jrBadgePhoto").style.backgroundImage = `url("${r.photo}")`;
  const f = FOCUS[r.photo] || [.5, .4]; $("#jrBadgePhoto").style.backgroundPosition = `${f[0] * 100}% ${f[1] * 100}%`;
  $("#jrBadgeArea").textContent = r.areaTitle;
  $("#jrBadgeText").textContent = r.areaText;
  $("#jrBadgeSecond").textContent = r.second ? `Também combina com você: ${r.second}` : "";
  const stars = chs.reduce((a, c) => a + (st.stars[c] || 0), 0), total = Journey.total();
  $("#jrBadgeStats").innerHTML = solo ? "" : `<div><b>${stars}/12</b><small>estrelas</small></div><div><b>${chs.filter(c => st.stars[c] != null).length + 1}/5</b><small>capítulos</small></div><div><b>${fmt(total)}</b><small>pontos</small></div>`;
  const acts = $("#jrBadgeActions"); acts.innerHTML = "";
  const add = (label, cls, fn) => { const b = document.createElement("button"); b.type = "button"; b.className = "jr-btn " + cls; b.textContent = label; b.onclick = () => { Sound.fx("tap"); fn(); }; acts.appendChild(b); };
  add("Ver vagas abertas", "jr-btn--primary", () => { location.href = "vagas.html"; });
  if (solo) { add("Jogar de novo", "jr-btn--soft", () => runChapter("ch5", true)); add("Outros jogos", "jr-btn--soft", goGames); }
  else { add("Ranking", "jr-btn--soft", () => goRanking("jornada")); add("Menu", "jr-btn--soft", () => { Journey.clear(); goTitle(); }); }
  if (complete) setTimeout(() => {
    if (!window.CoamoLeaderboard || !document.querySelector("#scrBadge:not([hidden])")) return;
    window.CoamoLeaderboard.maybeCapture("jornada", { score: total, stars, duration: null, accuracy: null });
  }, 3200);
}

function showResult(r, solo, id = "ch1") {
  const def = CH[id];
  Cast.set("off");
  setMode("result");
  camTo(shotPose("map"), 2.4);
  UI.show("scrResult");
  $("#jrResKicker").textContent = solo ? def.result.soloKicker : (r.stars > 0 ? `CAPÍTULO ${def.n} CONCLUÍDO` : `CAPÍTULO ${def.n}`);
  $("#jrResTitle").textContent = def.result.titles[r.stars];
  $("#jrResText").textContent = def.result.texts[r.stars];
  const scoreEl = $("#jrResScore");
  const t0 = performance.now();
  (function count() { const k = Math.min(1, (performance.now() - t0) / 1100); scoreEl.textContent = fmt(r.score * easeOut(k)); if (k < 1) requestAnimationFrame(count); })();
  $("#jrResStats").innerHTML = def.result.stats(r);
  $$("#jrStars i").forEach((s, i) => { s.classList.remove("is-on"); if (i < r.stars) setTimeout(() => { s.classList.add("is-on"); Sound.fx("star", i); }, 500 + i * 380); });
  const acts = $("#jrResActions"); acts.innerHTML = "";
  const add = (label, cls, fn) => { const b = document.createElement("button"); b.type = "button"; b.className = "jr-btn " + cls; b.textContent = label; b.onclick = () => { Sound.fx("tap"); fn(); }; acts.appendChild(b); };
  if (solo) {
    add("Jogar de novo", "jr-btn--primary", () => runChapter(id, true));
    add("Ver ranking", "jr-btn--soft", () => goRanking(def.rank));
    add("Outros jogos", "jr-btn--soft", goGames);
  } else {
    const next = CHAPTERS[CHAPTERS.findIndex(c => c.id === id) + 1];
    if (next && next.ready) add(`Próximo capítulo`, "jr-btn--primary", () => runChapter(next.id, false));
    add("Mapa da safra", next ? "jr-btn--soft" : "jr-btn--primary", goMap);
    add("Jogar de novo", "jr-btn--soft", () => runChapter(id, false));
  }
  /* ranking do evento: pede o nome se entrou no top 5 */
  setTimeout(() => {
    if (mode !== "result" || !window.CoamoLeaderboard || r.score <= 0) return;
    window.CoamoLeaderboard.maybeCapture(def.rank, def.result.entry(r));
  }, 1900 + r.stars * 380);
}

/* ---------- botões e navegação ---------- */
document.addEventListener("click", e => {
  const go = e.target.closest("[data-go]");
  if (go) {
    Sound.fx("tap");
    const g = go.dataset.go;
    if (g === "journey") { Journey.state.seen ? goMap() : runChapter("ch1", false); }
    else if (g === "games") goGames();
    else if (g === "ranking") goRanking();
    else if (g === "title") goTitle();
    return;
  }
  const solo = e.target.closest("[data-solo]");
  if (solo) { Sound.fx("tap"); runChapter(solo.dataset.solo, true); return; }
  const tab = e.target.closest("[data-rank]");
  if (tab) { Sound.fx("tap"); renderRanking(tab.dataset.rank); }
});
$("#jrMapPlay").addEventListener("click", e => { Sound.fx("tap"); runChapter(e.currentTarget.dataset.ch || "ch1", false); });

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
  if (composer) composer.setSize(w, h);
  if (mode === "play" || mode === "chapter") camSnap(currentPose());
  else if (cam.to && cam.to.drift && cam.to.drift.orbit) camSnap(shotPose(mode === "title" ? "title" : "map"));
}
addEventListener("resize", resize);
resize();
buildComposer();

const fpsEl = $("#jrFps"); const showFps = params.has("fps"); if (showFps) fpsEl.hidden = false;
let frames = 0, fpsT = 0, fps = 60, lowFor = 0, fpsWall = performance.now();
function setQuality(q) {
  quality = q; try { localStorage.setItem("coamoJrQuality", q); } catch (_) {}
  pixelRatio = Math.min(window.devicePixelRatio || 1, q === "high" ? 1.5 : q === "medium" ? 1.25 : 1);
  renderer.setPixelRatio(pixelRatio); resize(); buildComposer();
}
function loop() {
  const dt = Math.min(clock.getDelta(), .1), time = clock.elapsedTime;
  Ch1.update(dt);
  Ch2.update(dt);
  Ch3.update(dt, time);
  Ch4.update(dt, time);
  Ch5.update(dt, time);
  updateCamera(dt, time);
  W.update(dt, time, camera);
  Cast.update(dt);
  renderFrame(dt);
  /* qualidade automática: se o totem não aguentar, alivia os efeitos */
  frames++;
  const nowW = performance.now();
  if (nowW - fpsWall >= 1000) {
    fps = frames / ((nowW - fpsWall) / 1000); frames = 0; fpsWall = nowW;
    if (!params.has("q") && fps < 40 && time > 4) {
      lowFor++;
      if (lowFor >= 3) { lowFor = 0; if (quality === "high") setQuality("medium"); else if (quality === "medium") setQuality("low"); }
    } else lowFor = 0;
    if (showFps) fpsEl.textContent = `${fps.toFixed(0)} fps · ${quality} · res ${pixelRatio.toFixed(2)}\n${renderer.info.render.calls} draws · ${(renderer.info.render.triangles / 1000).toFixed(0)}k tri`;
  }
  requestAnimationFrame(loop);
}

/* ===================================================== INÍCIO */
document.fonts && document.fonts.ready.then(() => {});
camSnap(shotPose("title"));
const start = params.get("tela");
if (params.get("jogo") === "silo" || start === "silo") runChapter("ch2", true);
else if (start === "cap2") runChapter("ch2", false);
else if (params.get("jogo") === "cadeia" || start === "cadeia") runChapter("ch3", true);
else if (start === "cap3") runChapter("ch3", false);
else if (params.get("jogo") === "memoria" || start === "memoria") runChapter("ch4", true);
else if (start === "cap4") runChapter("ch4", false);
else if (params.get("jogo") === "quiz" || start === "quiz") runChapter("ch5", true);
else if (start === "cap5") runChapter("ch5", false);
else if (start === "jogo" || params.get("jogo") === "classificacao") runChapter1(true);
else if (start === "prologo") { Journey.clear(); runChapter1(false); }
else if (start === "mapa") goMap();
else if (start === "ranking") goRanking();
else if (start === "jogos") goGames();
else goTitle();
requestAnimationFrame(loop);

/* ganchos para testes automatizados */
window.__jr = { showBadge, Ch5, Ch4, Ch3, Ch2, runChapter, shot: n => camSnap(shotPose(n)), snap: () => camSnap(mode === "title" ? shotPose("title") : currentPose()), W, setQuality, Ch1, Journey, Caption, get mode() { return mode; }, camera, renderer, goTitle, goMap, runChapter1, showResult, fps: () => fps };
