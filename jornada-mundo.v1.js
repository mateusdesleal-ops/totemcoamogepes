/* =========================================================
   COAMO GAMES — JORNADA DA SAFRA · MUNDO 3D (v1)
   Texturas geradas em código (concreto, metal ondulado, borracha,
   lavoura), céu com reflexos, unidade de recebimento com silos,
   esteira industrial, caçambas com grãos de verdade e itens detalhados.
   ========================================================= */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { ICONS } from "./jornada-icones.v1.js";

/* ===================================================== utilidades */
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
export function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
export function noise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), u), lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v);
}
function fbm(x, y, o = 4) { let a = 0, f = 1, w = .5, n = 0; for (let i = 0; i < o; i++) { a += noise(x * f, y * f) * w; n += w; f *= 2.03; w *= .5; } return a / n; }
/* ruído que fecha nas bordas (textura repetível) */
function tnoise(x, y, p) { const a = noise(x, y), b = noise(x - p, y), c = noise(x, y - p), d = noise(x - p, y - p); const u = x / p, v = y / p; return lerp(lerp(a, b, u), lerp(c, d, u), v); }
function tfbm(x, y, p, o = 4) { let a = 0, f = 1, w = .5, n = 0; for (let i = 0; i < o; i++) { a += tnoise(x * f, y * f, p * f) * w; n += w; f *= 2; w *= .5; } return a / n; }

const rnd = (() => { let s = 1234567; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();

/* ===================================================== texturas em código */
function makeCanvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
function toTex(c, { repeat = [1, 1], srgb = true, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = aniso; if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
/* altura (0..1 por pixel) -> mapa de normais */
function normalFromHeight(H, w, h, strength = 2) {
  const c = makeCanvas(w, h), x = c.getContext("2d"), img = x.createImageData(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const l = H[j * w + ((i - 1 + w) % w)], r = H[j * w + ((i + 1) % w)], u = H[((j - 1 + h) % h) * w + i], d = H[((j + 1) % h) * w + i];
    let nx = (l - r) * strength, ny = (d - u) * strength, nz = 1; const k = 1 / Math.hypot(nx, ny, nz);
    const o = (j * w + i) * 4; img.data[o] = (nx * k * .5 + .5) * 255; img.data[o + 1] = (ny * k * .5 + .5) * 255; img.data[o + 2] = (nz * k * .5 + .5) * 255; img.data[o + 3] = 255;
  }
  x.putImageData(img, 0, 0); return c;
}
function pixels(w, h, fn) {
  const c = makeCanvas(w, h), x = c.getContext("2d"), img = x.createImageData(w, h), H = new Float32Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const r = fn(i, j), o = (j * w + i) * 4;
    img.data[o] = r[0]; img.data[o + 1] = r[1]; img.data[o + 2] = r[2]; img.data[o + 3] = r[4] == null ? 255 : r[4];
    H[j * w + i] = r[3] || 0;
  }
  x.putImageData(img, 0, 0);
  return { c, H, w, h };
}

const TEX = {};
function buildTextures() {
  /* concreto do pátio: placas, manchas, poros */
  {
    const S = 512, P = 8;
    const t = pixels(S, S, (i, j) => {
      const u = i / S * P, v = j / S * P;
      const n = tfbm(u * 2, v * 2, P * 2, 5), m = tfbm(u + 9, v + 3, P, 3), pore = hash(i, j);
      let g = 186 + (n - .5) * 22 - (m > .58 ? (m - .58) * 40 : 0) - (pore > .985 ? 18 : 0);
      const joint = (i % 256 < 2 || j % 256 < 2) ? 1 : 0;
      if (joint) g -= 55;
      const h = n * .6 + (pore > .985 ? -.3 : 0) - joint * .8;
      return [g * 1.0, g * .99, g * .94, h];
    });
    TEX.concrete = toTex(t.c); TEX.concreteN = toTex(normalFromHeight(t.H, S, S, 1.6), { srgb: false });
  }
  /* asfalto */
  {
    const S = 256, P = 8;
    const t = pixels(S, S, (i, j) => { const n = tfbm(i / S * P, j / S * P, P, 4), s = hash(i * 3, j * 7) > .93 ? 26 : 0; const g = 70 + (n - .5) * 22 + s; return [g, g * 1.02, g * 1.04, n + s / 100]; });
    TEX.asphalt = toTex(t.c); TEX.asphaltN = toTex(normalFromHeight(t.H, S, S, 1.2), { srgb: false });
  }
  /* metal ondulado (silos e galpão): só relevo + leve sujeira */
  {
    const W = 64, H2 = 256;
    const t = pixels(W, H2, (i, j) => {
      const wave = Math.sin(j / H2 * Math.PI * 2 * 8) * .5 + .5;
      const dirt = tfbm(i / W * 2, j / H2 * 8, 2, 3);
      const g = 228 - dirt * 26 - wave * 8;
      return [g, g * 1.005, g * 1.02, wave];
    });
    TEX.corrugN = toTex(normalFromHeight(t.H, W, H2, 3.2), { srgb: false });
    TEX.corrug = toTex(t.c);
    /* nervuras verticais (paredes do galpão / caçambas) */
    const v = pixels(H2, W, (i, j) => { const k = (i % 32) / 32, tr = k < .18 ? k / .18 : k < .5 ? 1 : k < .68 ? 1 - (k - .5) / .18 : 0; return [235, 236, 232, tr]; });
    TEX.ribN = toTex(normalFromHeight(v.H, H2, W, 2.4), { srgb: false });
  }
  /* borracha da esteira com taliscas em V */
  {
    const W = 256, H3 = 128;
    const t = pixels(W, H3, (i, j) => {
      const y = Math.abs(j - H3 / 2) / (H3 / 2), x = (i + y * 46) % 128;
      const cleat = (x > 40 && x < 54 && y < .86) ? 1 : 0;
      const n = tfbm(i / W * 6, j / H3 * 3, 6, 3);
      const edge = y > .92 ? 1 : 0;
      const g = 38 + n * 16 + cleat * 18 - edge * 10;
      return [g, g * 1.04, g * 1.02, cleat * .9 + n * .1];
    });
    TEX.belt = toTex(t.c); TEX.beltN = toTex(normalFromHeight(t.H, W, H3, 3), { srgb: false });
  }
  /* faixa de segurança amarela e preta */
  {
    const c = makeCanvas(256, 64), x = c.getContext("2d");
    x.fillStyle = "#f2c12e"; x.fillRect(0, 0, 256, 64);
    x.fillStyle = "#1e1f1e";
    for (let k = -64; k < 256 + 64; k += 48) { x.beginPath(); x.moveTo(k, 64); x.lineTo(k + 24, 64); x.lineTo(k + 88, 0); x.lineTo(k + 64, 0); x.fill(); }
    TEX.hazard = toTex(c);
  }
  /* lavoura vista de longe (fileiras) */
  {
    const S = 512, P = 4;
    const t = pixels(S, S, (i, j) => {
      const n = tfbm(i / S * P, j / S * P, P, 5), rows = Math.sin(i / S * Math.PI * 2 * 64) * .5 + .5;
      const r = 70 + n * 40 - rows * 18, g = 118 + n * 46 - rows * 22, b = 52 + n * 20 - rows * 10;
      return [r, g, b, rows * .5 + n * .5];
    });
    TEX.field = toTex(t.c); TEX.fieldN = toTex(normalFromHeight(t.H, S, S, 2), { srgb: false });
    const w = pixels(S, S, (i, j) => {
      const n = tfbm(i / S * P + 3, j / S * P, P, 5), rows = Math.sin(i / S * Math.PI * 2 * 64) * .5 + .5;
      return [196 + n * 40 - rows * 20, 160 + n * 34 - rows * 22, 78 + n * 20 - rows * 12, rows * .5 + n * .5];
    });
    TEX.wheat = toTex(w.c);
    const gr = pixels(S, S, (i, j) => { const n = tfbm(i / S * 8, j / S * 8, 8, 5), s = hash(i, j) * 16; return [82 + n * 40 + s, 128 + n * 46 + s, 60 + n * 18, n]; });
    TEX.grass = toTex(gr.c); TEX.grassN = toTex(normalFromHeight(gr.H, S, S, 1.2), { srgb: false });
  }
  /* nuvens pintadas */
  TEX.clouds = [0, 1, 2].map(seed => {
    const c = makeCanvas(512, 256), x = c.getContext("2d");
    for (let k = 0; k < 26; k++) {
      const cx = 90 + rnd() * 330, cy = 150 - Math.sin((cx - 90) / 330 * Math.PI) * (50 + rnd() * 30) + rnd() * 20, r = 34 + rnd() * 50;
      const g = x.createRadialGradient(cx, cy, r * .1, cx, cy, r);
      g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(.6, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
    }
    /* base levemente sombreada */
    const sh = x.createLinearGradient(0, 120, 0, 220); sh.addColorStop(0, "rgba(160,175,195,0)"); sh.addColorStop(1, "rgba(150,165,190,.55)");
    x.globalCompositeOperation = "source-atop"; x.fillStyle = sh; x.fillRect(0, 0, 512, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
  /* mancha de sombra suave (para objetos e pessoas) */
  {
    const c = makeCanvas(128, 128), x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, "rgba(0,0,0,.55)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    TEX.blob = new THREE.CanvasTexture(c);
  }
}

/* placas com texto (etiquetas, avisos, logo) */
function roundRect(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
function iconImage(type) {
  return new Promise(res => {
    const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null);
    im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(ICONS[type].replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" '));
  });
}
function plateTexture(draw, w = 512, h = 256) {
  const c = makeCanvas(w, h), x = c.getContext("2d"), t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const redraw = () => { x.clearRect(0, 0, w, h); draw(x, w, h); t.needsUpdate = true; };
  redraw(); if (document.fonts) document.fonts.ready.then(redraw);
  t.redraw = redraw; return t;
}

/* ===================================================== céu e luz */
export const SKIES = {
  dawn:    { top: "#3f6fb3", mid: "#f2a978", low: "#ffd29c", sun: "#ffbf73", hemi: "#ffd2a8", ground: "#57703f", light: 3.0, hemiI: .35, env: .55, elev: .12, az: 2.6, fog: "#efc39b", fogN: 60, fogF: 380, exp: 1.0 },
  overcast: { top: "#5f7894", mid: "#a3b3c1", low: "#c6ced4", sun: "#e9e6dc", hemi: "#c9d4df", ground: "#5b6b52", light: 1.7, hemiI: .55, env: .5, elev: .95, az: .8, fog: "#aab7c0", fogN: 70, fogF: 330, exp: 1.02 },
  storm:    { top: "#26303c", mid: "#4a5561", low: "#66707a", sun: "#aeb7c0", hemi: "#7b8794", ground: "#3a4639", light: .75, hemiI: .6, env: .32, elev: .95, az: .8, fog: "#545f69", fogN: 30, fogF: 190, exp: 1.12 },
  afternoon: { top: "#3378c6", mid: "#a6d0ee", low: "#efe5cf", sun: "#ffd9a0", hemi: "#d8e8f8", ground: "#6c8a4a", light: 3.3, hemiI: .42, env: .62, elev: .55, az: 1.35, fog: "#d6e2e6", fogN: 260, fogF: 1400, exp: 1.0 },
  sunset:    { top: "#33427a", mid: "#e9906a", low: "#ffc98a", sun: "#ffb067", hemi: "#ffcfa8", ground: "#5d6b44", light: 2.7, hemiI: .4, env: .55, elev: .16, az: 1.9, fog: "#e7b892", fogN: 90, fogF: 520, exp: 1.02 },
  night:     { top: "#040916", mid: "#0f1c3d", low: "#1e2b4d", sun: "#9db4ea", hemi: "#4a5e8e", ground: "#141c1c", light: .35, hemiI: .2, env: .12, elev: .9, az: .5, fog: "#121a33", fogN: 70, fogF: 480, exp: 1.05 },
  morning: { top: "#2b78cc", mid: "#9cccee", low: "#e6eff0", sun: "#ffe4b8", hemi: "#d6eaff", ground: "#6c8a4a", light: 3.8, hemiI: .38, env: .62, elev: .62, az: .95, fog: "#cfe3ec", fogN: 90, fogF: 520, exp: 1.0 },
};

export function createWorld(renderer) {
  buildTextures();
  const scene = new THREE.Scene();
  const tmp = new THREE.Color(), tmp2 = new THREE.Color();

  /* ---------- céu ---------- */
  const skyU = { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, low: { value: new THREE.Color() }, sunCol: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) } };
  const skyMat = new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: "varying vec3 vP; void main(){ vP = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }",
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 low; uniform vec3 sunCol; uniform vec3 sunDir; varying vec3 vP;
      void main(){ vec3 d = normalize(vP); float h = d.y;
        vec3 c = mix(mid, top, pow(smoothstep(0.0, 0.6, h), .8)); c = mix(low, c, smoothstep(-0.05, 0.16, h));
        float s = max(dot(d, normalize(sunDir)), 0.0);
        c += sunCol * (pow(s, 900.0) * 6.0 + pow(s, 60.0) * .35 + pow(s, 6.0) * .12);
        gl_FragColor = vec4(c, 1.0); }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(800, 48, 24), skyMat);
  sky.frustumCulled = false; sky.renderOrder = -10; sky.userData.noAO = true;
  scene.add(sky);
  scene.fog = new THREE.Fog("#cfe3ec", 90, 520);

  /* cena só com o céu, para gerar os reflexos (ambiente) */
  const envScene = new THREE.Scene();
  const envSky = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), skyMat); envScene.add(envSky);
  const envGround = new THREE.Mesh(new THREE.CircleGeometry(9, 32), new THREE.MeshBasicMaterial({ color: "#6f7f5a" }));
  envGround.rotation.x = -Math.PI / 2; envGround.position.y = -.4; envScene.add(envGround);
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envRT = null, lite = false;
  function refreshEnv() {
    if (lite) { scene.environment = null; return; }
    const rt = pmrem.fromScene(envScene, .02);
    if (envRT) envRT.dispose();
    envRT = rt; scene.environment = rt.texture;
  }
  /* modo leve (totens fracos): sem reflexos do céu, luz ambiente mais forte */
  function setLite(on) {
    lite = !!on;
    if (lite) scene.environment = null; else refreshEnv();
    sun.shadow.mapSize.set(lite ? 1024 : 2048, lite ? 1024 : 2048);
    if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    applySky(clamp(skyState.t / skyState.dur, 0, 1));
  }

  const hemi = new THREE.HemisphereLight("#d6eaff", "#6c8a4a", .45);
  const sun = new THREE.DirectionalLight("#fff0d2", 3.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 140 });
  sun.shadow.bias = -.00025; sun.shadow.normalBias = .025; sun.shadow.radius = 3;
  scene.add(hemi, sun, sun.target);

  const skyState = { from: SKIES.morning, to: SKIES.morning, t: 1, dur: 1, envDirty: true };
  function mixHex(a, b, t, out) { return out.set(a).lerp(tmp2.set(b), t); }
  function applySky(t) {
    const A = skyState.from, B = skyState.to;
    mixHex(A.top, B.top, t, skyU.top.value); mixHex(A.mid, B.mid, t, skyU.mid.value); mixHex(A.low, B.low, t, skyU.low.value);
    mixHex(A.sun, B.sun, t, skyU.sunCol.value);
    mixHex(A.hemi, B.hemi, t, hemi.color); mixHex(A.ground, B.ground, t, hemi.groundColor);
    mixHex(A.sun, B.sun, t, sun.color); mixHex(A.fog, B.fog, t, scene.fog.color);
    scene.fog.near = lerp(A.fogN, B.fogN, t); scene.fog.far = lerp(A.fogF, B.fogF, t);
    hemi.intensity = lerp(A.hemiI, B.hemiI, t) * (lite ? 2.6 : 1); sun.intensity = lerp(A.light, B.light, t);
    scene.environmentIntensity = lerp(A.env, B.env, t);
    renderer.toneMappingExposure = lerp(A.exp, B.exp, t);
    const elev = lerp(A.elev, B.elev, t), az = lerp(A.az, B.az, t);
    skyU.sunDir.value.set(Math.cos(elev) * Math.sin(az), Math.sin(elev), Math.cos(elev) * Math.cos(az)).normalize();
  }
  function current() {
    const A = skyState.from, B = skyState.to, t = clamp(skyState.t / skyState.dur, 0, 1), k = t * t * (3 - 2 * t), cur = {};
    for (const key of Object.keys(B)) cur[key] = typeof B[key] === "number" ? lerp(A[key], B[key], k) : "#" + mixHex(A[key], B[key], k, tmp).getHexString();
    return cur;
  }
  function setSky(name, dur = 0) {
    skyState.from = dur ? current() : SKIES[name];
    skyState.to = SKIES[name]; skyState.t = 0; skyState.dur = dur || .0001; skyState.envDirty = true;
  }
  setSky("morning"); applySky(1); refreshEnv();

  /* ---------- materiais ---------- */
  const M = {};
  const std = (key, o) => M[key] || (M[key] = new THREE.MeshStandardMaterial(o));
  const concrete = std("concrete", { map: TEX.concrete, normalMap: TEX.concreteN, roughness: .92, color: "#e9e6dc" });
  TEX.concrete.repeat.set(9, 7); TEX.concreteN.repeat.set(9, 7);
  const coamoGreen = std("blue", { color: "#1d5fa8", roughness: .42, metalness: .35 });
  const coamoGreenDark = std("blueDark", { color: "#164a85", roughness: .5, metalness: .3 });
  const steel = std("steel", { color: "#b8bfc3", roughness: .32, metalness: .85 });
  const steelDark = std("steelDark", { color: "#5d666b", roughness: .45, metalness: .8 });
  const galv = std("galv", { color: "#dde2e4", roughness: .3, metalness: .9, normalMap: TEX.corrugN, normalScale: new THREE.Vector2(1, 1.2) });
  const yellow = std("yellow", { color: "#f4c22e", roughness: .4, metalness: .2 });
  const rubber = std("rubber", { color: "#1c1e1d", roughness: .9 });
  const white = std("white", { color: "#f5f5f0", roughness: .55 });
  const glass = std("glass", { color: "#24414f", roughness: .08, metalness: .9 });

  const world = new THREE.Group(); scene.add(world);
  function add(geo, m, x = 0, y = 0, z = 0, parent = world, shadow = true) {
    const me = new THREE.Mesh(geo, m); me.position.set(x, y, z);
    me.castShadow = shadow; me.receiveShadow = true; parent.add(me); return me;
  }
  const RB = (w, h, d, r = .06, s = 3) => new RoundedBoxGeometry(w, h, d, s, Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001));
  const CY = (rt, rb, h, seg = 24, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);

  /* ===================================================== região (capítulo 3): estações e estradas */
  const STATIONS = {
    lavoura:      { x: -58, z: 160 },
    recebimento:  { x: -22, z: -8 },
    silos:        { x: 15, z: -24 },
    industria:    { x: 88, z: 32 },
    moinho:       { x: 84, z: 108 },
    distribuicao: { x: 8, z: 88 },
    mercado:      { x: -58, z: 78 },
    porto:        { x: 96, z: 178 },
  };
  const TABLE = { x: -44, z: 44 };
  const STAGE = { x: -18, z: 8 };
  const ROADS = [["lavoura", "recebimento"], ["recebimento", "silos"], ["silos", "industria"], ["silos", "moinho"], ["silos", "porto"], ["industria", "distribuicao"], ["moinho", "distribuicao"], ["distribuicao", "mercado"]];
  function nearStation(x, z, r) { for (const k in STATIONS) { const st = STATIONS[k]; if (Math.hypot(x - st.x, z - st.z) < r) return true; } return false; }
  function nearRoad(x, z, r) {
    for (const [a, b] of ROADS) {
      const A = STATIONS[a], B = STATIONS[b], dx = B.x - A.x, dz = B.z - A.z, L2 = dx * dx + dz * dz;
      const t = clamp(((x - A.x) * dx + (z - A.z) * dz) / L2, 0, 1), px = A.x + dx * t, pz = A.z + dz * t;
      if (Math.hypot(x - px, z - pz) < r) return true;
    }
    return false;
  }
  const SEA = { x0: 112, z0: 124 };
  function terrainH(x, z) {
    const sx = x - SEA.x0, sz = z - SEA.z0;
    if (sx > -8 && sz > -8) return -3.2 * clamp(Math.min(sx + 8, sz + 8) / 10, 0, 1) - .05;
    const dx = Math.max(0, -115 - x, x - 145), dz = Math.max(0, -70 - z, z - 220), k = clamp(Math.hypot(dx, dz) / 120, 0, 1);
    return k > 0 ? (fbm(x * .006 + 7, z * .006 + 3, 4) * 46 - 10) * k - .05 : -.05;
  }

  /* ===================================================== terreno */
  {
    /* grama/lavoura ao redor, com relevo suave longe do pátio */
    const g = new THREE.PlaneGeometry(1400, 1400, 160, 160); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      p.setY(i, terrainH(p.getX(i), p.getZ(i)));
    }
    g.computeVertexNormals();
    TEX.grass.repeat.set(70, 70); TEX.grassN.repeat.set(70, 70);
    add(g, new THREE.MeshStandardMaterial({ map: TEX.grass, normalMap: TEX.grassN, roughness: .95, color: "#cfe0b8" }), 0, 0, 0, world, false);
    /* talhões de lavoura (soja verde e trigo dourado) em faixas */
    const fields = [
      { x: -120, z: -120, w: 150, d: 110, r: .12, t: "field" }, { x: 60, z: -150, w: 170, d: 120, r: -.08, t: "wheat" },
      { x: 190, z: -40, w: 120, d: 160, r: .3, t: "field" }, { x: -210, z: 20, w: 120, d: 150, r: -.2, t: "wheat" },
      { x: -40, z: -260, w: 220, d: 110, r: .05, t: "field" }, { x: 210, z: -230, w: 160, d: 120, r: -.15, t: "wheat" },
    ];
    fields.forEach(f => {
      const geo = new THREE.PlaneGeometry(f.w, f.d, 24, 24); geo.rotateX(-Math.PI / 2);
      const pp = geo.attributes.position;
      for (let i = 0; i < pp.count; i++) {
        const lx = pp.getX(i), lz = pp.getZ(i), c = Math.cos(f.r), s = Math.sin(f.r);
        const wx = f.x + lx * c - lz * s, wz = f.z + lx * s + lz * c;
        pp.setY(i, terrainH(wx, wz) + .12);
      }
      geo.computeVertexNormals();
      const tex = (f.t === "wheat" ? TEX.wheat : TEX.field).clone(); tex.needsUpdate = true; tex.repeat.set(f.w / 40, f.d / 40);
      const m = add(geo, new THREE.MeshStandardMaterial({ map: tex, normalMap: TEX.fieldN, roughness: .95 }), 0, 0, 0, world, false);
      m.position.set(0, 0, 0); m.rotation.y = 0;
      /* posiciona girando os vértices já calculados em coordenadas do mundo */
      for (let i = 0; i < pp.count; i++) { const lx = pp.getX(i), lz = pp.getZ(i), c = Math.cos(f.r), s = Math.sin(f.r); pp.setX(i, f.x + lx * c - lz * s); pp.setZ(i, f.z + lx * s + lz * c); }
      pp.needsUpdate = true; geo.computeBoundingSphere();
    });
  }
  /* pátio de concreto, guias e estrada */
  {
    const yard = add(new THREE.BoxGeometry(84, .2, 60), concrete, -4, -.02, -14, world, false);
    yard.receiveShadow = true;
    const curb = std("curb", { color: "#d9d6cc", roughness: .8 });
    add(new THREE.BoxGeometry(84.6, .32, .5), curb, -4, .02, 16.2, world, false);
    TEX.asphalt.repeat.set(60, 2); TEX.asphaltN.repeat.set(60, 2);
    const asph = std("asphalt", { map: TEX.asphalt, normalMap: TEX.asphaltN, roughness: .9, color: "#bdbdbd" });
    add(new THREE.BoxGeometry(520, .16, 8), asph, -305, -.03, -8, world, false);
    const paint = std("paint", { color: "#f4f2ea", roughness: .6 }), paintY = std("paintY", { color: "#f3c331", roughness: .55 });
    for (let x = -560; x < -48; x += 10) add(new THREE.BoxGeometry(5, .02, .22), paintY, x, .06, -8, world, false);
    /* faixas no pátio */
    [[-26, -8, 40, .28], [-26, -3.8, 40, .2], [-26, -12.2, 40, .2]].forEach(([x, z, w, d]) => add(new THREE.BoxGeometry(w, .02, d), paint, x, .09, z, world, false));
    /* área de segurança amarela ao redor da esteira */
    const hz = std("hazardFloor", { map: TEX.hazard, roughness: .6 });
    TEX.hazard.repeat.set(10, 1);
    [[0, -3.25, 22, .5], [0, 4.6, 22, .5]].forEach(([x, z, w, d]) => add(new THREE.BoxGeometry(w, .02, d), hz, x, .09, z, world, false));
    /* balança de caminhões */
    const scaleM = std("scaleM", { color: "#7d8589", roughness: .5, metalness: .6, normalMap: TEX.ribN });
    add(RB(16, .22, 4.6, .08), scaleM, -24, .1, -8, world, false);
    add(RB(.9, 1.4, .9, .1), yellow, -15, .7, -10.9);
    add(RB(.9, 1.4, .9, .1), yellow, -33, .7, -10.9);
  }

  /* ===================================================== silos (bateria de 4) */
  const logoTex = new THREE.TextureLoader().load("assets/logo_verde.png", t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; });
  {
    const R = 3.1, Hs = 13, roofH = 2.7;
    TEX.corrugN.repeat.set(10, 7);
    const shell = new THREE.MeshStandardMaterial({ color: "#f1f4f6", roughness: .32, metalness: .72, normalMap: TEX.corrugN, normalScale: new THREE.Vector2(.9, .9) });
    const roofM = new THREE.MeshStandardMaterial({ color: "#d3d9dc", roughness: .3, metalness: .85 });
    const stiff = std("stiff", { color: "#aab3b8", roughness: .35, metalness: .85 });
    const xs = [5, 12, 19, 26];
    xs.forEach((x, i) => {
      const g = new THREE.Group(); g.position.set(x, 0, -24 - (i % 2) * .4); world.add(g);
      add(CY(R, R, Hs, 64, true), shell, 0, Hs / 2 + .6, 0, g).material.side = THREE.DoubleSide;
      add(CY(R + .18, R + .25, .7, 64), std("base", { color: "#bdbcb4", roughness: .9 }), 0, .35, 0, g);
      for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; add(new THREE.BoxGeometry(.12, Hs, .12), stiff, Math.cos(a) * (R + .05), Hs / 2 + .6, Math.sin(a) * (R + .05), g); }
      add(new THREE.ConeGeometry(R + .25, roofH, 64, 1, true), roofM, 0, Hs + .6 + roofH / 2, 0, g).material.side = THREE.DoubleSide;
      for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, rib = add(new THREE.BoxGeometry(.08, .08, R + .3), stiff, 0, 0, 0, g); rib.position.set(Math.cos(a) * (R / 2), Hs + .6 + roofH / 2 + .03, Math.sin(a) * (R / 2)); rib.lookAt(0, Hs + .6 + roofH + .3, 0); rib.rotateX(0); }
      add(CY(.55, .7, .9, 16), roofM, 0, Hs + roofH + 1, 0, g);
      add(CY(.3, .3, .5, 12), stiff, 0, Hs + roofH + 1.6, 0, g);
      /* escada em caracol */
      const stepM = std("step", { color: "#9aa3a7", metalness: .7, roughness: .45 });
      for (let k = 0; k < 44; k++) { const a = k * .16 + i, y = .8 + k * (Hs - .4) / 44; const s = add(new THREE.BoxGeometry(.9, .06, .32), stepM, Math.cos(a) * (R + .55), y, Math.sin(a) * (R + .55), g); s.rotation.y = -a; }
      /* logo Coamo no silo da frente */
      if (i === 1 || i === 3) {
        const logo = new THREE.Mesh(new THREE.CylinderGeometry(R + .03, R + .03, 2.3, 48, 1, true, -.62, 1.24), new THREE.MeshStandardMaterial({ map: logoTex, transparent: true, roughness: .5, metalness: .2 }));
        logo.position.y = Hs - 2.4; logo.rotation.y = Math.PI / 2 + .25; g.add(logo);
      }
    });
    /* torre do elevador em treliça */
    const tower = new THREE.Group(); tower.position.set(-1.5, 0, -26); world.add(tower);
    const TH = 25, tw = 2.8;
    for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) add(new THREE.BoxGeometry(.24, TH, .24), coamoGreenDark, x * tw / 2, TH / 2, z * tw / 2, tower);
    for (let y = 1.5; y < TH; y += 2.2) {
      add(new THREE.BoxGeometry(tw, .14, .14), coamoGreen, 0, y, tw / 2, tower); add(new THREE.BoxGeometry(tw, .14, .14), coamoGreen, 0, y, -tw / 2, tower);
      add(new THREE.BoxGeometry(.14, .14, tw), coamoGreen, tw / 2, y, 0, tower); add(new THREE.BoxGeometry(.14, .14, tw), coamoGreen, -tw / 2, y, 0, tower);
      const d1 = add(new THREE.BoxGeometry(.1, 2.9, .1), steel, 0, y + 1.1, tw / 2, tower); d1.rotation.z = .9;
      const d2 = add(new THREE.BoxGeometry(.1, 2.9, .1), steel, tw / 2, y + 1.1, 0, tower); d2.rotation.x = .9;
    }
    add(new THREE.BoxGeometry(1.2, TH, 1.2), galv, 0, TH / 2, 0, tower);
    add(RB(4.2, 3.4, 4.2, .1), std("towerHead", { color: "#eef0ec", roughness: .6, normalMap: TEX.ribN }), 0, TH + 1.7, 0, tower);
    add(new THREE.BoxGeometry(4.5, .3, 4.5), coamoGreen, 0, TH + 3.5, 0, tower);
    /* passarelas inclinadas até os silos */
    const top = V(-1.5, TH + .8, -26);
    xs.forEach((x, i) => {
      const end = V(x, Hs + roofH + 1, -24 - (i % 2) * .4), len = top.distanceTo(end);
      const b = add(new THREE.BoxGeometry(.6, .5, len), std("gallery", { color: "#9ea7ab", roughness: .45, metalness: .6, normalMap: TEX.ribN }), 0, 0, 0);
      b.position.lerpVectors(top, end, .5); b.lookAt(end);
      const r = add(new THREE.BoxGeometry(.12, .12, len), coamoGreen, 0, 0, 0); r.position.copy(b.position).add(V(0, -.42, 0)); r.lookAt(end.clone().add(V(0, -.42, 0)));
    });
  }

  /* ===================================================== armazém graneleiro */
  {
    const g = new THREE.Group(); g.position.set(-14, 0, -19); world.add(g);
    TEX.ribN.repeat.set(14, 2);
    const wall = new THREE.MeshStandardMaterial({ color: "#f1f2ee", roughness: .55, metalness: .25, normalMap: TEX.ribN });
    add(new THREE.BoxGeometry(22, 7, 11), wall, 0, 3.5, 0, g);
    add(new THREE.BoxGeometry(22.2, 1.4, 11.2), std("wallBand", { color: "#1d5fa8", roughness: .5, metalness: .25, normalMap: TEX.ribN }), 0, .7, 0, g);
    const roofShape = new THREE.Shape(); roofShape.moveTo(-6, 0); roofShape.lineTo(0, 3.1); roofShape.lineTo(6, 0); roofShape.lineTo(-6, 0);
    const roofG = new THREE.ExtrudeGeometry(roofShape, { depth: 22.8, bevelEnabled: false });
    const roofTex = TEX.corrugN.clone(); roofTex.needsUpdate = true; roofTex.repeat.set(1, 18); roofTex.rotation = Math.PI / 2;
    const roof = add(roofG, new THREE.MeshStandardMaterial({ color: "#2266b3", roughness: .4, metalness: .45, normalMap: roofTex }), -11.4, 7, 0, g);
    roof.rotation.y = Math.PI / 2;
    /* portões de enrolar */
    const doorTex = TEX.corrugN.clone(); doorTex.needsUpdate = true; doorTex.repeat.set(2, 4);
    const doorM = new THREE.MeshStandardMaterial({ color: "#c3c9cb", roughness: .35, metalness: .75, normalMap: doorTex });
    [-5.5, 5.5].forEach(x => { add(new THREE.BoxGeometry(4.4, 4.6, .12), doorM, x, 2.3, 5.52, g); add(new THREE.BoxGeometry(4.8, .5, .5), steelDark, x, 4.85, 5.6, g); });
    /* letreiro */
    add(RB(8, 2.1, .25, .08), white, 0, 5.7, 5.6, g);
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 2), new THREE.MeshStandardMaterial({ map: logoTex, transparent: true, roughness: .5 }));
    logo.position.set(0, 5.7, 5.75); g.add(logo);
    /* calhas e luminárias */
    add(new THREE.BoxGeometry(22.6, .25, .35), steel, 0, 7, 5.7, g);
    [-9, 0, 9].forEach(x => { add(new THREE.BoxGeometry(.7, .2, .5), steelDark, x, 6.3, 5.8, g); add(new THREE.BoxGeometry(.6, .05, .4), new THREE.MeshStandardMaterial({ color: "#fff8e0", emissive: "#fff3c8", emissiveIntensity: 1.2 }), x, 6.18, 5.85, g); });
  }

  /* ===================================================== escritório / guarita */
  {
    const g = new THREE.Group(); g.position.set(-33, 0, -1); world.add(g);
    add(RB(10, 4.4, 7, .08), std("office", { color: "#f4f1e8", roughness: .7 }), 0, 2.2, 0, g);
    add(new THREE.BoxGeometry(10.8, .45, 7.8), coamoGreen, 0, 4.55, 0, g);
    for (let x = -3.6; x <= 3.6; x += 2.4) { add(new THREE.BoxGeometry(1.7, 1.4, .1), glass, x, 2.6, 3.52, g); add(new THREE.BoxGeometry(1.9, .12, .2), white, x, 1.85, 3.56, g); }
    add(new THREE.BoxGeometry(1.4, 2.4, .1), glass, 4.4, 1.2, 3.52, g);
  }

  /* ===================================================== árvores e arbustos */
  {
    const leafGeo = (() => {
      const parts = [];
      for (let k = 0; k < 5; k++) {
        const s = new THREE.IcosahedronGeometry(1 + hash(k, 2) * .5, 1);
        const p = s.attributes.position;
        for (let i = 0; i < p.count; i++) { const n = 1 + (noise(p.getX(i) * 2.3 + k, p.getY(i) * 2.3 + p.getZ(i)) - .5) * .35; p.setXYZ(i, p.getX(i) * n, p.getY(i) * n * .85, p.getZ(i) * n); }
        s.translate((hash(k, 5) - .5) * 1.6, (hash(k, 7) - .2) * 1.1, (hash(k, 9) - .5) * 1.6);
        parts.push(s);
      }
      const m = mergeGeometries(parts.map(p => p.index ? p.toNonIndexed() : p)); m.computeVertexNormals(); return m;
    })();
    const trunkGeo = CY(.16, .3, 2.4, 8);
    trunkGeo.translate(0, 1.2, 0); leafGeo.translate(0, 3.2, 0);
    const N = 220;
    const trunks = new THREE.InstancedMesh(trunkGeo, std("trunk", { color: "#6b4a2f", roughness: .95 }), N);
    const leaves = new THREE.InstancedMesh(leafGeo, new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: .85 }), N);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), pos = new THREE.Vector3(), eu = new THREE.Euler();
    const greens = ["#3c7a35", "#4a8a3a", "#5a9a43", "#33692f", "#6aa24a"];
    let i = 0, tries = 0;
    while (i < N && tries < 9000) {
      tries++;
      const a = hash(tries, 3) * Math.PI * 2, r = 46 + Math.pow(hash(tries, 9), 1.6) * 150;
      const x = Math.cos(a) * r, z = Math.sin(a) * r - 14;
      if (z > 4 && Math.abs(x) < 70 && z < 40) continue;
      if (Math.abs(z + 8) < 8 && x < -40) continue;
      if (nearStation(x, z, 30) || nearRoad(x, z, 7) || (x > SEA.x0 - 14 && z > SEA.z0 - 14) || Math.hypot(x - TABLE.x, z - TABLE.z) < 24) continue;
      const k = .8 + hash(tries, 5) * .8;
      const y = terrainH(x, z);
      q.setFromEuler(eu.set(0, hash(tries, 7) * 6, 0));
      m4.compose(pos.set(x, y - .1, z), q, s.set(k, k, k)); trunks.setMatrixAt(i, m4); leaves.setMatrixAt(i, m4);
      leaves.setColorAt(i, tmp.set(greens[i % greens.length]).offsetHSL(0, 0, (hash(i, 4) - .5) * .06));
      i++;
    }
    /* fileira de árvores atrás do armazém (quebra-vento) */
    for (let x = -60; x < 60 && i < N; x += 4.2) {
      const z = -42 - hash(x, 1) * 3, k = 1 + hash(x, 2) * .5;
      q.setFromEuler(eu.set(0, hash(x, 3) * 6, 0));
      m4.compose(pos.set(x, 0, z), q, s.set(k, k * 1.3, k)); trunks.setMatrixAt(i, m4); leaves.setMatrixAt(i, m4);
      leaves.setColorAt(i, tmp.set(greens[(i + 2) % greens.length])); i++;
    }
    trunks.count = leaves.count = i;
    trunks.castShadow = leaves.castShadow = true; leaves.receiveShadow = true;
    world.add(trunks, leaves);
  }

  /* ===================================================== nuvens pintadas */
  const clouds = new THREE.Group(); scene.add(clouds);
  for (let i = 0; i < 16; i++) {
    const m = new THREE.SpriteMaterial({ map: TEX.clouds[i % 3], transparent: true, depthWrite: false, fog: false, opacity: .92 });
    const s = new THREE.Sprite(m);
    const w = 90 + hash(i, 4) * 90;
    s.scale.set(w, w / 2, 1);
    s.position.set(-420 + i * 56 + hash(i, 8) * 30, 70 + hash(i, 5) * 60, -280 - hash(i, 9) * 200);
    s.userData.v = 1.2 + hash(i, 11) * 1.4;
    clouds.add(s);
  }

  /* ===================================================== pássaros */
  const birds = new THREE.Group(); scene.add(birds);
  {
    const wingG = new THREE.BufferGeometry();
    wingG.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, -.9, .1, .35, -.1, 0, .25, 0, 0, 0, .9, .1, .35, .1, 0, .25], 3));
    wingG.computeVertexNormals();
    const bm = new THREE.MeshBasicMaterial({ color: "#2a3330", side: THREE.DoubleSide, fog: true });
    for (let i = 0; i < 7; i++) {
      const b = new THREE.Mesh(wingG.clone(), bm);
      b.position.set(-30 + i * 2.2 - (i % 2) * 1.2, 30 + (i % 3) * 1.4, -60 - i * 1.6);
      b.userData.ph = i * .7; b.scale.setScalar(1.4);
      birds.add(b);
    }
  }

  /* ===================================================== poeira dourada */
  const dust = (() => {
    const N = 220, g = new THREE.BufferGeometry(), p = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { p[i * 3] = (rnd() - .5) * 28; p[i * 3 + 1] = rnd() * 8; p[i * 3 + 2] = (rnd() - .5) * 20 - 3; }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    const c = makeCanvas(32, 32), x = c.getContext("2d"), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, "rgba(255,240,200,1)"); gr.addColorStop(1, "rgba(255,240,200,0)"); x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(c), color: "#ffeab0", size: .12, transparent: true, opacity: .75, depthWrite: false, blending: THREE.AdditiveBlending }));
    scene.add(pts); return pts;
  })();

  /* ===================================================== caminhões graneleiros */
  function buildTruck(color) {
    const g = new THREE.Group(); g.userData.dynamic = true;
    const paint = new THREE.MeshStandardMaterial({ color, roughness: .25, metalness: .35 });
    const chrome = std("chrome", { color: "#dfe3e5", roughness: .12, metalness: 1 });
    const tire = std("tire", { color: "#1b1d1c", roughness: .85 });
    const rim = std("rim", { color: "#c9ced0", roughness: .25, metalness: .9 });
    /* cabine */
    add(RB(2.6, 2.5, 2.6, .28, 4), paint, 4.6, 2.15, 0, g);
    add(RB(2.3, .9, 2.4, .2, 3), paint, 4.4, 3.65, 0, g);
    add(RB(.1, 1.0, 2.2, .04), glass, 5.92, 2.75, 0, g);
    add(RB(.12, .55, 2.0, .04), steelDark, 5.92, 1.45, 0, g);
    for (const z of [-.85, .85]) {
      add(RB(.1, .22, .4, .04), new THREE.MeshStandardMaterial({ color: "#fffbe8", emissive: "#fff2c0", emissiveIntensity: .6, roughness: .2 }), 5.95, 1.15, z, g);
      add(new THREE.BoxGeometry(.06, .5, .12), chrome, 5.6, 3, z * 1.62, g);
      add(RB(.3, .7, .9, .06), glass, 4.6, 2.7, z * 1.31, g);
    }
    add(RB(.4, .35, 2.7, .1), chrome, 6.0, .85, 0, g);
    add(new THREE.BoxGeometry(.08, .32, 2.6), std("stripe", { color: "#1d5fa8", roughness: .4 }), 5.97, 2.0, 0, g);
    add(CY(.12, .12, 2.6, 10), chrome, 3.25, 3.1, -1.1, g);
    /* chassi e carroceria graneleira */
    add(new THREE.BoxGeometry(11, .35, 1.6), steelDark, -.4, .95, 0, g);
    const bodyTex = TEX.ribN.clone(); bodyTex.needsUpdate = true; bodyTex.repeat.set(10, 1);
    const bodyM = new THREE.MeshStandardMaterial({ color: "#eceeea", roughness: .4, metalness: .45, normalMap: bodyTex });
    add(RB(8, 2.1, 2.6, .08), bodyM, -1.6, 2.25, 0, g);
    add(new THREE.BoxGeometry(8.1, .18, 2.7), paint, -1.6, 3.3, 0, g);
    const heap = add(new THREE.CylinderGeometry(1.15, 1.15, 7.6, 18, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: "#e0b54a", roughness: 1, normalMap: TEX.grassN }), -1.6, 3.25, 0, g);
    heap.rotation.set(0, 0, Math.PI / 2); heap.scale.set(.42, 1, 1); heap.rotation.x = Math.PI / 2; heap.rotation.z = Math.PI / 2;
    heap.rotation.set(-Math.PI / 2, 0, Math.PI / 2); heap.scale.set(1, 1, .45); g.userData.heap = heap;
    const wheels = [];
    [[4.6, 1.15], [4.6, -1.15], [.2, 1.15], [.2, -1.15], [-1.1, 1.15], [-1.1, -1.15], [-4.1, 1.15], [-4.1, -1.15], [-5.4, 1.15], [-5.4, -1.15]].forEach(([x, z]) => {
      const w = new THREE.Group(); w.position.set(x, .62, z); g.add(w);
      const t = add(CY(.62, .62, .5, 24), tire, 0, 0, 0, w); t.rotation.x = Math.PI / 2;
      const r = add(CY(.36, .36, .52, 16), rim, 0, 0, 0, w); r.rotation.x = Math.PI / 2;
      wheels.push(w);
    });
    /* sombra de contato */
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(13, 4), new THREE.MeshBasicMaterial({ map: TEX.blob, transparent: true, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2; blob.position.set(-.4, .1, 0); g.add(blob);
    g.userData.wheels = wheels;
    return g;
  }
  const trucks = [buildTruck("#ffffff"), buildTruck("#f2b400"), buildTruck("#1d5fa8")];
  trucks.forEach((t, i) => { t.userData.stopX = [-20, -36, -52][i]; t.position.set(t.userData.stopX, 0, -8); world.add(t); t.userData.t0 = -1; });
  function driveTrucks(now) { trucks.forEach((t, i) => { t.userData.t0 = now + i * 1.1; t.position.x = t.userData.stopX - 140; }); }
  function parkTrucks() { trucks.forEach(t => { t.userData.t0 = -1; t.position.x = t.userData.stopX; }); }
  function hideTrucks() { trucks.forEach(t => { t.userData.t0 = -1; t.position.x = t.userData.stopX - 220; }); }

  /* ===================================================== ESTEIRA */
  const play = new THREE.Group(); world.add(play);
  const BELT = { x0: -9.5, x1: 9.5, z: -1, y: 1.15, d: 2.5, spawnX: -8.9, endX: 8.6 };
  const L = BELT.x1 - BELT.x0, cx = (BELT.x0 + BELT.x1) / 2;
  TEX.belt.repeat.set(L / 2.4, 1); TEX.beltN.repeat.set(L / 2.4, 1);
  const beltMat = new THREE.MeshStandardMaterial({ map: TEX.belt, normalMap: TEX.beltN, normalScale: new THREE.Vector2(1.4, 1.4), roughness: .82, color: "#ffffff" });
  {
    const belt = add(new THREE.PlaneGeometry(L, BELT.d), beltMat, cx, BELT.y, BELT.z, play, false); belt.rotation.x = -Math.PI / 2;
    /* tambores nas pontas */
    for (const x of [BELT.x0, BELT.x1]) { const d = add(CY(.32, .32, BELT.d + .1, 28), steel, x, BELT.y - .32, BELT.z, play); d.rotation.x = Math.PI / 2; }
    /* longarinas em perfil U (azul Coamo) */
    const prof = new THREE.Shape(); prof.moveTo(0, 0); prof.lineTo(.22, 0); prof.lineTo(.22, .62); prof.lineTo(0, .62); prof.lineTo(0, .54); prof.lineTo(.14, .54); prof.lineTo(.14, .08); prof.lineTo(0, .08); prof.lineTo(0, 0);
    const profG = new THREE.ExtrudeGeometry(prof, { depth: L + .7, bevelEnabled: true, bevelSize: .015, bevelThickness: .015, bevelSegments: 2 });
    profG.rotateY(Math.PI / 2); profG.translate(BELT.x0 - .35, 0, 0);
    const p1 = add(profG, coamoGreen, 0, BELT.y - .58, BELT.z - BELT.d / 2 - .02, play); p1.scale.z = -1;
    add(profG.clone(), coamoGreen, 0, BELT.y - .58, BELT.z + BELT.d / 2 + .02, play);
    add(new THREE.BoxGeometry(L, .22, BELT.d - .2), std("beltUnder", { color: "#232625", roughness: .9 }), cx, BELT.y - .22, BELT.z, play);
    /* rolos de retorno embaixo */
    for (let x = BELT.x0 + .8; x < BELT.x1; x += 1.4) { const r = add(CY(.11, .11, BELT.d - .1, 12), steel, x, BELT.y - .5, BELT.z, play); r.rotation.x = Math.PI / 2; }
    /* pernas com mão-francesa e sapatas parafusadas */
    for (let x = BELT.x0 + .7; x < BELT.x1 + .1; x += 3.1) {
      for (const s of [-1, 1]) {
        const zz = BELT.z + s * (BELT.d / 2 - .05);
        add(RB(.18, BELT.y - .55, .18, .03), coamoGreenDark, x, (BELT.y - .55) / 2, zz, play);
        add(RB(.5, .06, .5, .02), steelDark, x, .03, zz, play);
        for (const [bx, bz] of [[-.17, -.17], [.17, -.17], [.17, .17], [-.17, .17]]) add(CY(.035, .035, .06, 6), steel, x + bx, .08, zz + bz, play, false);
      }
      const br = add(new THREE.BoxGeometry(.08, .08, BELT.d), coamoGreenDark, x, .35, BELT.z, play);
      const dg = add(new THREE.BoxGeometry(.07, 1.0, .07), steelDark, x + .35, .4, BELT.z - BELT.d / 2 + .05, play); dg.rotation.z = .6;
    }
    /* guarda-corpo amarelo atrás da esteira */
    const railZ = BELT.z - BELT.d / 2 - .45;
    for (let x = BELT.x0 + .5; x <= BELT.x1 - .3; x += 2.4) add(CY(.045, .045, 1.05, 10), yellow, x, BELT.y + .2, railZ, play);
    for (const h of [.55, 1.0]) { const r = add(CY(.05, .05, L - .6, 12), yellow, cx, BELT.y - .3 + h, railZ, play); r.rotation.z = Math.PI / 2; }
    /* abas de borracha laterais */
    add(new THREE.BoxGeometry(L - .4, .22, .05), rubber, cx, BELT.y + .1, BELT.z - BELT.d / 2 + .05, play);
    /* moega de entrada (funil) */
    const hop = new THREE.Group(); hop.position.set(BELT.x0 + .2, 0, BELT.z); play.add(hop);
    const funnel = new THREE.CylinderGeometry(1.9, .9, 2.0, 4, 1, true); funnel.rotateY(Math.PI / 4);
    add(funnel, new THREE.MeshStandardMaterial({ color: "#1d5fa8", roughness: .4, metalness: .4, side: THREE.DoubleSide }), -.3, 3.3, 0, hop).scale.set(.75, 1, 1.05);
    add(RB(1.5, .8, 1.8, .05), coamoGreenDark, -.3, 2.0, 0, hop);
    for (const [x, z] of [[-1.3, -1.25], [.7, -1.25], [-1.3, 1.25], [.7, 1.25]]) add(RB(.16, 4.4, .16, .03), steelDark, x - .3, 2.2, z, hop);
    const plate = add(new THREE.PlaneGeometry(1.8, .38), new THREE.MeshStandardMaterial({ map: TEX.hazard, roughness: .5 }), .2, 1.62, 0, hop); plate.rotation.y = Math.PI / 2;
    /* motor e redutor na saída */
    const mot = new THREE.Group(); mot.position.set(BELT.x1 + .5, 0, BELT.z + BELT.d / 2 + .6); play.add(mot);
    const motorM = std("motor", { color: "#3d6f9e", roughness: .35, metalness: .55, normalMap: TEX.ribN });
    const mm = add(CY(.42, .42, 1.1, 24), motorM, 0, BELT.y - .3, .3, mot); mm.rotation.x = Math.PI / 2;
    add(RB(.8, .8, .7, .08), std("gear", { color: "#3a3f42", roughness: .5, metalness: .6 }), 0, BELT.y - .3, -.35, mot);
    add(RB(1.0, .2, 1.6, .04), steelDark, 0, BELT.y - .78, 0, mot);
    /* botão de emergência */
    const eb = new THREE.Group(); eb.position.set(BELT.x0 + 1.8, 0, BELT.z + BELT.d / 2 + .5); play.add(eb);
    add(RB(.14, 1.0, .14, .02), steelDark, 0, .5, 0, eb);
    add(RB(.4, .4, .3, .05), yellow, 0, 1.15, 0, eb);
    add(CY(.12, .14, .12, 18), new THREE.MeshStandardMaterial({ color: "#d1281e", roughness: .3, emissive: "#600", emissiveIntensity: .2 }), 0, 1.15, .2, eb).rotation.x = Math.PI / 2;
    /* placa "Classificação" sobre a esteira */
    const signT = plateTexture((x, w, h) => {
      x.fillStyle = "#154d8f"; roundRect(x, 4, 4, w - 8, h - 8, 26); x.fill();
      x.strokeStyle = "#f3c331"; x.lineWidth = 8; roundRect(x, 14, 14, w - 28, h - 28, 20); x.stroke();
      x.fillStyle = "#ffffff"; x.font = "900 74px Montserrat, Arial, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText("CLASSIFICAÇÃO", w / 2, h / 2 - 22, w - 70);
      x.fillStyle = "#f3c331"; x.font = "800 34px Montserrat, Arial, sans-serif"; x.fillText("RECEBIMENTO DE GRÃOS", w / 2, h / 2 + 48, w - 90);
    }, 768, 256);
    const sg = new THREE.Group(); sg.position.set(0, 0, BELT.z - BELT.d / 2 - 1.3); play.add(sg);
    for (const x of [-3.2, 3.2]) add(RB(.16, 5.2, .16, .03), steelDark, x, 2.6, 0, sg);
    add(RB(6.9, 2.3, .12, .06), white, 0, 4.4, -.02, sg);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.7, 2.2), new THREE.MeshStandardMaterial({ map: signT, roughness: .5 }));
    sign.position.set(0, 4.4, .05); sg.add(sign);
  }

  const BELT_X1 = 9.5;
  /* ===================================================== cenário em volta da esteira */
  {
    /* logo da Coamo pintado no piso, à frente das caçambas */
    const floorLogo = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.55), new THREE.MeshStandardMaterial({ map: logoTex, transparent: true, opacity: .85, roughness: .75, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    floorLogo.rotation.x = -Math.PI / 2; floorLogo.position.set(0, .1, 7.4); floorLogo.userData.noAO = true; world.add(floorLogo);
    /* palete com sacaria */
    const pal = new THREE.Group(); pal.position.set(-8.4, 0, -5.4); pal.rotation.y = .25; world.add(pal);
    const wood = std("wood", { color: "#a77b4f", roughness: .85 });
    for (const z of [-.55, 0, .55]) add(new THREE.BoxGeometry(1.8, .12, .18), wood, 0, .06, z, pal);
    for (let x = -.75; x <= .75; x += .3) add(new THREE.BoxGeometry(.22, .05, 1.3), wood, x, .15, 0, pal);
    const sackM = std("sack", { color: "#efe6cf", roughness: .95, normalMap: TEX.grassN });
    for (let k = 0; k < 9; k++) {
      const sk = add(RB(.8, .32, .5, .14, 3), sackM, -.4 + (k % 2) * .8, .35 + Math.floor(k / 3) * .3, -.4 + (Math.floor(k / 2) % 2) * .8 * .5 + (k % 3) * .02, pal);
      sk.rotation.y = (k % 2) * Math.PI / 2 + (hash(k, 3) - .5) * .2;
    }
    /* empilhadeira */
    const fk = new THREE.Group(); fk.position.set(8.6, 0, -5.6); fk.rotation.y = -2.1; world.add(fk);
    const fy = std("forkYellow", { color: "#f2b705", roughness: .35, metalness: .3 });
    add(RB(1.4, .9, 2.2, .12, 3), fy, 0, .75, 0, fk);
    add(RB(1.3, .5, .6, .1), std("counter", { color: "#2d3132", roughness: .6, metalness: .4 }), 0, .9, -1.05, fk);
    add(RB(.6, .5, .6, .08), std("seat", { color: "#222", roughness: .7 }), 0, 1.45, -.3, fk);
    for (const x of [-.6, .6]) { add(new THREE.BoxGeometry(.08, 2.2, .08), steelDark, x, 2.1, -.45, fk); add(new THREE.BoxGeometry(.08, 2.2, .08), steelDark, x, 2.1, .55, fk); }
    add(new THREE.BoxGeometry(1.3, .08, 1.1), steelDark, 0, 3.2, .05, fk);
    for (const x of [-.6, .6]) { add(new THREE.BoxGeometry(.1, 1.8, .1), steelDark, x * .7, 1.1, 1.25, fk); add(new THREE.BoxGeometry(.12, .06, 1.1), steelDark, x * .5, .1, 1.8, fk); }
    for (const [x, z, r] of [[-.72, .7, .4], [.72, .7, .4], [-.72, -.75, .33], [.72, -.75, .33]]) { const w = add(CY(r, r, .3, 18), std("tire"), x, r, z, fk); w.rotation.z = Math.PI / 2; }
    /* cones e postes de luz */
    const cone = std("cone", { color: "#ef6b1f", roughness: .5 });
    for (const [x, z] of [[-11, 3.5], [11, 3.2], [-11.4, 5.4]]) { add(CY(.03, .22, .62, 16), cone, x, .35, z); add(RB(.5, .05, .5, .02), cone, x, .03, z); }
    for (const x of [-12.5, 12.5]) {
      add(CY(.09, .13, 7, 12), steel, x, 3.5, -3.6);
      const arm = add(new THREE.BoxGeometry(1.6, .1, .1), steel, x + (x < 0 ? .8 : -.8), 7, -3.6);
      add(RB(.7, .16, .4, .05), new THREE.MeshStandardMaterial({ color: "#fffbe8", emissive: "#fff3c8", emissiveIntensity: .8, roughness: .3 }), x + (x < 0 ? 1.5 : -1.5), 6.9, -3.6);
    }
    /* extintor no poste */
    const ext = new THREE.Group(); ext.position.set(BELT_X1 + 1.6, 0, -3.1); world.add(ext);
    add(RB(.12, 1.6, .12, .02), steelDark, 0, .8, 0, ext);
    add(CY(.13, .13, .55, 16), new THREE.MeshStandardMaterial({ color: "#c8231b", roughness: .3, metalness: .2 }), 0, .9, .16, ext);
    add(RB(.4, .4, .03, .02), new THREE.MeshStandardMaterial({ color: "#d42b1e", roughness: .5 }), 0, 1.5, .07, ext);
  }

  /* ===================================================== CAÇAMBAS com grãos */
  const BINS = [
    { type: "soja", label: "SOJA", color: "#2f8f50" },
    { type: "milho", label: "MILHO", color: "#e7a614" },
    { type: "trigo", label: "TRIGO", color: "#b8742a" },
    { type: "impureza", label: "IMPUREZAS", color: "#5b666c" },
  ];
  const BIN = { w: 2.36, gap: .3, z: 2.65, h: 1.3, d: 1.9 };
  const GRAIN = {
    soja: { geo: (() => { const g = new THREE.SphereGeometry(.062, 10, 8); g.scale(1, .82, .9); return g; })(), mat: new THREE.MeshStandardMaterial({ color: "#dcb661", roughness: .45 }) },
    milho: { geo: (() => { const g = new THREE.SphereGeometry(.06, 10, 8), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const t = (p.getZ(i) + .06) / .12; p.setX(i, p.getX(i) * (.5 + t * .8)); p.setY(i, p.getY(i) * (.45 + t * .3)); } g.computeVertexNormals(); return g; })(), mat: new THREE.MeshStandardMaterial({ color: "#f2b01e", roughness: .35 }) },
    trigo: { geo: (() => { const g = new THREE.SphereGeometry(.05, 8, 6); g.scale(.8, .7, 1.5); return g; })(), mat: new THREE.MeshStandardMaterial({ color: "#c98f3c", roughness: .5 }) },
    impureza: { geo: new THREE.IcosahedronGeometry(.085, 0), mat: new THREE.MeshStandardMaterial({ color: "#8a7a66", roughness: .95, flatShading: true }) },
  };
  const PILE_N = 520;
  const binObjs = BINS.map((b, i) => {
    const g = new THREE.Group(), x = (i - 1.5) * (BIN.w + BIN.gap);
    g.position.set(x, 0, BIN.z); g.userData.dynamic = true; play.add(g);
    const sideTex = TEX.ribN.clone(); sideTex.needsUpdate = true; sideTex.repeat.set(6, 1);
    const body = new THREE.MeshStandardMaterial({ color: b.color, roughness: .38, metalness: .35, normalMap: sideTex, normalScale: new THREE.Vector2(.8, .8) });
    const inner = new THREE.MeshStandardMaterial({ color: tmp.set(b.color).multiplyScalar(.5).getHex(), roughness: .8, metalness: .2 });
    const t = .1, w = BIN.w, h = BIN.h, d = BIN.d;
    add(RB(w, .14, d, .04), inner, 0, .32, 0, g);
    add(RB(w, h, t, .04), body, 0, h / 2 + .25, -d / 2 + t / 2, g);
    const front = add(RB(w, h * .85, t, .04), body, 0, h * .425 + .25, d / 2 - t / 2, g);
    add(RB(t, h, d, .04), body, -w / 2 + t / 2, h / 2 + .25, 0, g);
    add(RB(t, h, d, .04), body, w / 2 - t / 2, h / 2 + .25, 0, g);
    /* aro superior e cantos reforçados */
    const rimM = std("binRim", { color: "#e8ebe8", roughness: .3, metalness: .7 });
    add(RB(w + .08, .1, .16, .03), rimM, 0, h + .25, d / 2 - .06, g); add(RB(w + .08, .1, .16, .03), rimM, 0, h + .25, -d / 2 + .06, g);
    add(RB(.16, .1, d, .03), rimM, -w / 2 + .06, h + .25, 0, g); add(RB(.16, .1, d, .03), rimM, w / 2 - .06, h + .25, 0, g);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(RB(.16, h + .08, .16, .03), rimM, sx * (w / 2 - .02), h / 2 + .27, sz * (d / 2 - .02), g);
    /* base com encaixe de empilhadeira */
    add(RB(w, .25, d, .04), steelDark, 0, .125, 0, g);
    for (const sx of [-.55, .55]) add(new THREE.BoxGeometry(.5, .16, d + .02), new THREE.MeshBasicMaterial({ color: "#0d0f0e" }), sx, .13, 0, g, false);
    /* etiqueta esmaltada */
    let labImg = null;
    const labT = plateTexture((x, W, H) => {
      x.fillStyle = "#ffffff"; roundRect(x, 6, 6, W - 12, H - 12, 34); x.fill();
      x.lineWidth = 10; x.strokeStyle = b.color; roundRect(x, 12, 12, W - 24, H - 24, 28); x.stroke();
      if (labImg) x.drawImage(labImg, 30, 30, 196, 196);
      x.fillStyle = "#0f3a23"; x.font = "900 " + (b.label.length > 6 ? 54 : 72) + "px Montserrat, Arial, sans-serif"; x.textBaseline = "middle";
      x.fillText(b.label, 238, 134, 250);
    });
    iconImage(b.type).then(im => { labImg = im; labT.redraw(); });
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(w - .32, (w - .32) / 2), new THREE.MeshStandardMaterial({ map: labT, roughness: .25, metalness: .05 }));
    lab.position.set(0, .25 + h * .44, d / 2 + .01); g.add(lab);
    /* monte de grãos (instâncias reveladas aos poucos, de baixo para cima) */
    const G = GRAIN[b.type];
    const pile = new THREE.InstancedMesh(G.geo, G.mat, PILE_N);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), pos = new THREE.Vector3(), eu = new THREE.Euler();
    const pts = [];
    const rx = w / 2 - .16, rz = d / 2 - .16;
    for (let k = 0; k < PILE_N; k++) {
      const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd());
      const px = Math.cos(a) * rr * rx, pz = Math.sin(a) * rr * rz, rad = Math.hypot(px / rx, pz / rz);
      const hmax = (1 - rad) * .95 + .05;
      pts.push({ x: px, z: pz, y: .4 + rnd() * hmax * .95, r: rnd() });
    }
    pts.sort((p1, p2) => p1.y - p2.y);
    pts.forEach((p, k) => {
      q.setFromEuler(eu.set(p.r * 6, p.r * 9, p.r * 3));
      const sc = b.type === "impureza" ? .7 + p.r * .9 : .9 + p.r * .25;
      m4.compose(pos.set(p.x, p.y, p.z), q, s.set(sc, sc, sc)); pile.setMatrixAt(k, m4);
      if (b.type === "impureza") pile.setColorAt(k, tmp.set(["#8a7a66", "#6f6f6c", "#9d8a68", "#5e4b37"][k % 4]));
    });
    pile.count = 0; pile.frustumCulled = false; pile.castShadow = true; pile.receiveShadow = true;
    g.add(pile);
    /* sombra de contato */
    const blob = add(new THREE.PlaneGeometry(w + 1, d + 1), new THREE.MeshBasicMaterial({ map: TEX.blob, transparent: true, depthWrite: false, opacity: .8 }), 0, .1, 0, g, false);
    blob.rotation.x = -Math.PI / 2; blob.receiveShadow = false;
    const hit = new THREE.Mesh(new THREE.BoxGeometry(w + BIN.gap, h + 1.6, d + 1.2), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = h / 2 + .4; hit.userData.bin = i; g.add(hit);
    return { ...b, i, g, x, body, front, pile, hit, fill: 0, shown: 0, pulse: 0, bad: 0, grainColor: G.mat.color.getStyle() };
  });
  function setFill(b, f, instant) { b.fill = clamp(f, 0, 1); if (instant) b.pile.count = Math.round(b.fill * PILE_N); }
  function updateBins(dt) {
    binObjs.forEach(b => {
      const target = Math.round(b.fill * PILE_N);
      if (b.pile.count < target) b.pile.count = Math.min(target, b.pile.count + Math.ceil(dt * 260));
      else if (b.pile.count > target) b.pile.count = target;
    });
  }

  /* ---------- marcadores ---------- */
  const ringNext = new THREE.Mesh(new THREE.TorusGeometry(.8, .06, 10, 48), new THREE.MeshBasicMaterial({ color: "#ffd84a", transparent: true, opacity: .95, toneMapped: false }));
  ringNext.rotation.x = Math.PI / 2; ringNext.visible = false; ringNext.userData.dynamic = true; play.add(ringNext);
  const ringSel = new THREE.Mesh(new THREE.RingGeometry(.62, .95, 48), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: .85, side: THREE.DoubleSide, toneMapped: false }));
  ringSel.rotation.x = -Math.PI / 2; ringSel.visible = false; ringSel.userData.dynamic = true; play.add(ringSel);

  /* ===================================================== ITENS da esteira */
  const IM = {
    bean: new THREE.MeshStandardMaterial({ color: "#d9b25c", roughness: .42 }),
    soyBean: new THREE.MeshPhysicalMaterial({ color: "#dbb256", roughness: .35, clearcoat: .35, clearcoatRoughness: .4 }),
    hilumLight: new THREE.MeshStandardMaterial({ color: "#b98d58", roughness: .5 }),
    kernelBig: new THREE.MeshPhysicalMaterial({ vertexColors: true, color: "#ffffff", roughness: .3, clearcoat: .6, clearcoatRoughness: .25 }),
    germ: new THREE.MeshStandardMaterial({ color: "#f8e3a4", roughness: .45 }),
    tipCap: new THREE.MeshStandardMaterial({ color: "#8a5a2a", roughness: .7 }),
    hilum: new THREE.MeshStandardMaterial({ color: "#5c3a1d", roughness: .5 }),
    pod: new THREE.MeshStandardMaterial({ color: "#7d8f3a", roughness: .8 }),
    kernel: new THREE.MeshStandardMaterial({ color: "#f5bd1f", roughness: .35 }),
    cobCore: new THREE.MeshStandardMaterial({ color: "#e9d39a", roughness: .7 }),
    husk: new THREE.MeshStandardMaterial({ color: "#9fbe5a", roughness: .7, side: THREE.DoubleSide }),
    huskDry: new THREE.MeshStandardMaterial({ color: "#e3d39a", roughness: .8, side: THREE.DoubleSide }),
    silk: new THREE.MeshStandardMaterial({ color: "#b6713a", roughness: .8 }),
    wheat: new THREE.MeshStandardMaterial({ color: "#d9a64e", roughness: .5 }),
    awn: new THREE.MeshStandardMaterial({ color: "#e8c77c", roughness: .7 }),
    stem: new THREE.MeshStandardMaterial({ color: "#d8b46a", roughness: .7 }),
    twine: new THREE.MeshStandardMaterial({ color: "#7c5a35", roughness: .9 }),
    rock: new THREE.MeshStandardMaterial({ color: "#6f7270", roughness: .9, normalMap: TEX.concreteN }),
    dirt: new THREE.MeshStandardMaterial({ color: "#6e4f34", roughness: 1, normalMap: TEX.asphaltN }),
    twig: new THREE.MeshStandardMaterial({ color: "#6a4a2c", roughness: .9 }),
    leaf: new THREE.MeshStandardMaterial({ color: "#b07c3c", roughness: .85, side: THREE.DoubleSide }),
  };
  /* geometrias prontas (fundidas) para cada item, criadas uma vez */
  function displace(geo, amt, f = 3, seed = 0) {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 1 + (noise(x * f + seed, y * f + z * f) - .5) * amt; p.setXYZ(i, x * n, y * n, z * n); }
    geo.computeVertexNormals(); return geo;
  }
  const PROTO = {};
  /* SOJA: um grão grande, arredondado, com o hilo (a "cicatriz" marrom) na lateral */
  {
    const bean = new THREE.SphereGeometry(.4, 40, 28); bean.scale(1.1, .84, .95);
    const p = bean.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 1 + (noise(x * 3 + 2, y * 3 + z * 3) - .5) * .04; p.setXYZ(i, x * k, y * k, z * k); }
    bean.computeVertexNormals(); bean.translate(0, .34, 0);
    const hil = new THREE.SphereGeometry(.17, 20, 12); hil.scale(1.25, .32, .5);
    hil.translate(0, .34 + .3, .12); hil.rotateX(0);
    const hilLine = new THREE.SphereGeometry(.13, 16, 8); hilLine.scale(1.15, .12, .14); hilLine.translate(0, .34 + .335, .12);
    PROTO.soja = [[bean, IM.soyBean], [hil, IM.hilum], [hilLine, IM.hilumLight]];
  }
  /* MILHO: um grão grande em forma de dente (coroa larga, ponta estreita), germe claro e ponta escura */
  {
    const sh = new THREE.Shape();
    sh.moveTo(-.1, -.42); sh.quadraticCurveTo(0, -.5, .1, -.42);           /* ponta */
    sh.quadraticCurveTo(.3, -.12, .36, .2);                                 /* lateral direita */
    sh.quadraticCurveTo(.4, .42, .2, .46); sh.quadraticCurveTo(0, .5, -.2, .46); /* coroa */
    sh.quadraticCurveTo(-.4, .42, -.36, .2);
    sh.quadraticCurveTo(-.3, -.12, -.1, -.42);
    const k = new THREE.ExtrudeGeometry(sh, { depth: .16, bevelEnabled: true, bevelThickness: .09, bevelSize: .07, bevelSegments: 6, curveSegments: 24 });
    k.translate(0, 0, -.08);
    /* cor: coroa amarela, ponta alaranjada */
    const p = k.attributes.position, col = new Float32Array(p.count * 3), c1 = new THREE.Color("#f9cf3f"), c2 = new THREE.Color("#e2860f"), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const t = clamp((p.getY(i) + .45) / .95, 0, 1); c.copy(c2).lerp(c1, Math.pow(t, .8)); col.set([c.r, c.g, c.b], i * 3); }
    k.setAttribute("color", new THREE.BufferAttribute(col, 3));
    k.computeVertexNormals();
    k.rotateX(-Math.PI / 2); k.translate(0, .24, 0);                         /* deitado, face do germe para cima */
    const germ = new THREE.SphereGeometry(.15, 28, 16); germ.scale(.95, .2, 1.6); germ.translate(0, .24 + .17, .08);
    const tip = new THREE.SphereGeometry(.07, 16, 10); tip.scale(1.3, .9, .9); tip.translate(0, .24, .47);
    PROTO.milho = [[k, IM.kernelBig], [germ, IM.germ], [tip, IM.tipCap]];
  }
  /* TRIGO: feixe de 3 espigas com barbas, amarrado */
  {
    const grains = [], awns = [], stems = [];
    const gr = new THREE.SphereGeometry(.055, 8, 6); gr.scale(.75, 1.45, .75);
    const aw = new THREE.CylinderGeometry(.004, .004, .42, 3); aw.translate(0, .21, 0);
    [-.14, 0, .14].forEach((zz, e) => {
      const tilt = (e - 1) * .18, len = 9;
      for (let i = 0; i < len; i++) for (const s of [-1, 1]) {
        const g = gr.clone(); g.rotateZ(s * .5); g.translate(s * .055, i * .085, 0);
        g.rotateX(tilt); g.translate(0, 0, zz); grains.push(g);
        if (i > 1) { const a = aw.clone(); a.rotateZ(s * .35); a.translate(s * .09, i * .085 + .05, 0); a.rotateX(tilt); a.translate(0, 0, zz); awns.push(a); }
      }
      const st = new THREE.CylinderGeometry(.018, .022, .8, 6); st.translate(0, -.42, 0); st.rotateX(tilt); st.translate(0, 0, zz); stems.push(st);
    });
    const tie = new THREE.TorusGeometry(.12, .025, 6, 16); tie.rotateX(Math.PI / 2); tie.translate(0, -.45, 0);
    const xf = g => { g.rotateZ(-Math.PI / 2 + .05); g.translate(0, .26, 0); return g; };
    PROTO.trigo = [[xf(mergeGeometries(grains)), IM.wheat], [xf(mergeGeometries(awns)), IM.awn], [xf(mergeGeometries(stems)), IM.stem], [xf(tie), IM.twine]];
  }
  /* IMPUREZA: pedra, torrão, galho e folha seca */
  {
    const rock = displace(new THREE.IcosahedronGeometry(.36, 3), .55, 3.2, 4); rock.scale(1.1, .72, .95); rock.translate(-.16, .26, .02);
    const clod = displace(new THREE.IcosahedronGeometry(.2, 2), .7, 5, 9); clod.translate(.36, .16, .26);
    const clod2 = displace(new THREE.IcosahedronGeometry(.14, 2), .7, 5, 3); clod2.translate(.34, .12, -.3);
    const twig = new THREE.CylinderGeometry(.03, .045, 1.05, 6); twig.rotateZ(Math.PI / 2); twig.rotateY(.45); twig.translate(.05, .07, .05);
    const br = new THREE.CylinderGeometry(.02, .03, .35, 5); br.rotateZ(Math.PI / 2 - .6); br.translate(.32, .12, -.08);
    const ls = new THREE.Shape(); ls.moveTo(0, 0); ls.quadraticCurveTo(.26, .28, 0, .7); ls.quadraticCurveTo(-.26, .28, 0, 0);
    const leaf = new THREE.ShapeGeometry(ls, 8); const lp = leaf.attributes.position; for (let i = 0; i < lp.count; i++) lp.setZ(i, Math.sin(lp.getY(i) * 4) * .05 + Math.abs(lp.getX(i)) * .2); leaf.computeVertexNormals();
    leaf.rotateX(-Math.PI / 2 + .25); leaf.rotateY(.9); leaf.translate(-.42, .1, .3);
    PROTO.impureza = [[rock, IM.rock], [mergeGeometries([clod, clod2]), IM.dirt], [mergeGeometries([twig, br]), IM.twig], [leaf, IM.leaf]];
  }
  function makeItem(type) {
    const g = new THREE.Group();
    PROTO[type].forEach(([geo, m]) => { const me = new THREE.Mesh(geo, m); me.castShadow = true; me.receiveShadow = true; g.add(me); });
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: TEX.blob, transparent: true, depthWrite: false, opacity: .7 }));
    blob.rotation.x = -Math.PI / 2; blob.position.y = .02; g.add(blob); g.userData.blob = blob;
    g.children.forEach(c => { if (c !== blob) c.scale.setScalar(1.25); });
    return g;
  }
  const hitGeo = new THREE.SphereGeometry(.95, 8, 6), hitMat = new THREE.MeshBasicMaterial({ visible: false });

  /* ---------- partículas (grãos espirrando) ---------- */
  const sparks = [];
  function burst(pos, type, n = 16, up = 3.4) {
    const G = GRAIN[type] || GRAIN.soja;
    for (let i = 0; i < n; i++) {
      const s = new THREE.Mesh(G.geo, G.mat); s.position.copy(pos); s.castShadow = true;
      const a = Math.random() * Math.PI * 2, sp = .8 + Math.random() * 2;
      s.userData = { v: V(Math.cos(a) * sp, up + Math.random() * 2.4, Math.sin(a) * sp), life: .75 + Math.random() * .3, t: 0 };
      s.scale.setScalar(1.6 + Math.random());
      play.add(s); sparks.push(s);
    }
  }
  function updateSparks(dt) {
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i], u = s.userData; u.t += dt;
      u.v.y -= 13 * dt; s.position.addScaledVector(u.v, dt); s.rotation.x += dt * 9; s.rotation.y += dt * 6;
      if (s.position.y < .35) { s.position.y = .35; u.v.multiplyScalar(.3); u.v.y = Math.abs(u.v.y); }
      s.scale.setScalar(Math.max(.01, (1.6) * (1 - Math.pow(u.t / u.life, 3))));
      if (u.t >= u.life) { play.remove(s); sparks.splice(i, 1); }
    }
  }



  /* ===================================================== CAPÍTULO 2: silos com letra e nível, moega, caminhão, chuva */
  const SILO = { R: 3.1, Hs: 13, roofH: 2.7, xs: [5, 12, 19, 26] };
  const CAM2_DIR = new THREE.Vector3(.55, 0, 1).normalize();            /* de onde a câmera do capítulo 2 olha */
  const siloObjs = SILO.xs.map((x, i) => {
    const z = -24 - (i % 2) * .4, ang = Math.atan2(CAM2_DIR.x, CAM2_DIR.z);
    const g = new THREE.Group(); g.position.set(x, 0, z); g.userData.dynamic = true; world.add(g);
    const face = new THREE.Group(); face.rotation.y = ang; g.add(face);
    /* placa com a letra */
    const letter = String.fromCharCode(65 + i);
    const lt = plateTexture((c, W, H) => {
      c.fillStyle = "#1d5fa8"; c.beginPath(); c.arc(W / 2, H / 2, W / 2 - 8, 0, Math.PI * 2); c.fill();
      c.lineWidth = 14; c.strokeStyle = "#ffffff"; c.stroke();
      c.fillStyle = "#ffffff"; c.font = "900 170px Montserrat, Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(letter, W / 2, H / 2 + 8);
    }, 256, 256);
    const plaque = new THREE.Mesh(new THREE.CircleGeometry(1.25, 48), new THREE.MeshStandardMaterial({ map: lt, roughness: .4, metalness: .1 }));
    plaque.position.set(0, SILO.Hs - 1.1, SILO.R + .1); face.add(plaque);
    /* régua de nível (vidro + coluna de grão) */
    const GH = 8.2, gy = 1.6;
    add(RB(.95, GH + .3, .16, .06), std("gaugeFrame", { color: "#e9edf0", roughness: .3, metalness: .7 }), 0, gy + GH / 2, SILO.R + .08, face);
    add(new THREE.BoxGeometry(.7, GH, .1), new THREE.MeshStandardMaterial({ color: "#1b2a33", roughness: .15, metalness: .2 }), 0, gy + GH / 2, SILO.R + .17, face, false);
    const fillGeo = new THREE.BoxGeometry(.58, 1, .1); fillGeo.translate(0, .5, 0);
    const fillMat = new THREE.MeshStandardMaterial({ color: "#3fb36b", emissive: "#3fb36b", emissiveIntensity: .35, roughness: .4 });
    const fill = add(fillGeo, fillMat, 0, gy, SILO.R + .2, face, false); fill.scale.y = .01;
    for (const lv of [.28, .82]) add(new THREE.BoxGeometry(1.05, .07, .14), std("tick", { color: "#f3c331", roughness: .4 }), 0, gy + GH * lv, SILO.R + .2, face, false);
    /* área de toque */
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(SILO.R + .8, SILO.R + .8, SILO.Hs + 4, 12), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = (SILO.Hs + 4) / 2; hit.userData.silo = i; g.add(hit);
    return { i, letter, x, z, g, face, plaque, fill, fillMat, gauge: { GH, gy }, hit, level: 0, shown: 0, top: V(x, SILO.Hs + SILO.roofH + 1, z), pulse: 0, bad: 0 };
  });
  function setSiloLevel(s, v, instant) { s.level = clamp(v, 0, 100); if (instant) s.shown = s.level; }
  function updateSilos(dt) {
    siloObjs.forEach(s => {
      s.shown = lerp(s.shown, s.level, 1 - Math.pow(.02, dt));
      s.fill.scale.y = Math.max(.01, s.shown / 100 * s.gauge.GH);
      const lv = s.shown, col = lv > 94 ? "#e0483c" : lv > 82 ? "#f2b630" : lv < 28 ? "#7fa7c9" : "#3fb36b";
      s.fillMat.color.set(col); s.fillMat.emissive.set(col);
      if (s.pulse > 0) { s.pulse = Math.max(0, s.pulse - dt * 2); const k = Math.sin(s.pulse * Math.PI); s.g.scale.set(1 + k * .03, 1 + k * .02, 1 + k * .03); } else s.g.scale.set(1, 1, 1);
      if (s.bad > 0) { s.bad = Math.max(0, s.bad - dt * 2.4); s.g.position.x = s.x + Math.sin(s.bad * 40) * .18 * s.bad; s.plaque.material.emissive.setRGB(s.bad, 0, 0); }
      else { s.g.position.x = s.x; s.plaque.material.emissive.setRGB(0, 0, 0); }
    });
  }
  /* moega com grade e o caminhão que traz a carga */
  {
    const pit = new THREE.Group(); pit.position.set(-1.5, 0, -19.6); world.add(pit);
    add(RB(4.2, .14, 3.2, .04), std("pitFrame", { color: "#f3c331", roughness: .5 }), 0, .07, 0, pit, false);
    add(new THREE.BoxGeometry(3.6, .1, 2.6), new THREE.MeshStandardMaterial({ color: "#1d2224", roughness: .6, metalness: .6, normalMap: TEX.ribN }), 0, .12, 0, pit, false);
    add(RB(1.2, 2.2, 1.2, .05), std("pitBox", { color: "#1d5fa8", roughness: .45, metalness: .35 }), 0, 1.1, -4.8, pit);
  }
  const loadTruck = buildTruck("#ffffff");
  loadTruck.rotation.y = -Math.PI / 2; loadTruck.position.set(-1.5, 0, -14.1); world.add(loadTruck);
  const GRAIN_COLOR = { soja: "#dcb661", milho: "#f2a71b", trigo: "#c98f3c" };
  function setLoad(type) {
    const h = loadTruck.userData.heap; if (!h) return;
    h.material = h.material.clone(); h.material.color.set(GRAIN_COLOR[type] || "#e0b54a");
    loadTruck.userData.bounce = 1;
  }
  /* corrente de grãos: caminhão -> moega -> elevador -> passarela -> silo */
  const STREAM_N = 140;
  const streamMat = new THREE.MeshStandardMaterial({ color: "#f2b01e", roughness: .4, emissive: "#3a2a00", emissiveIntensity: .2 });
  const stream = new THREE.InstancedMesh(new THREE.SphereGeometry(.16, 8, 6), streamMat, STREAM_N);
  stream.frustumCulled = false; stream.count = STREAM_N; stream.userData.dynamic = true; scene.add(stream);
  const streams = [], tmpM = new THREE.Matrix4(), hidden = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let k = 0; k < STREAM_N; k++) stream.setMatrixAt(k, hidden);
  function pathFor(i) {
    const s = siloObjs[i];
    return [V(-1.5, 2.6, -18.4), V(-1.5, .4, -19.6), V(-1.5, 1.2, -25), V(-1.5, 25.6, -26), s.top.clone(), s.top.clone().add(V(0, -1.4, 0))];
  }
  function streamTo(i, type, onArrive) {
    const pts = pathFor(i), segs = []; let L = 0;
    for (let k = 1; k < pts.length; k++) { const d = pts[k].distanceTo(pts[k - 1]); segs.push(d); L += d; }
    streams.push({ pts, segs, L, t: 0, dur: 1.5, n: 26, onArrive, done: false, color: GRAIN_COLOR[type] || "#f2b01e" });
    streamMat.color.set(GRAIN_COLOR[type] || "#f2b01e");
  }
  const _v = new THREE.Vector3();
  function pointAt(st, u) {
    let d = clamp(u, 0, 1) * st.L;
    for (let k = 0; k < st.segs.length; k++) { if (d <= st.segs[k]) return _v.lerpVectors(st.pts[k], st.pts[k + 1], d / st.segs[k]); d -= st.segs[k]; }
    return _v.copy(st.pts[st.pts.length - 1]);
  }
  function updateStreams(dt) {
    let slot = 0;
    for (let j = streams.length - 1; j >= 0; j--) {
      const st = streams[j]; st.t += dt;
      for (let k = 0; k < st.n && slot < STREAM_N; k++) {
        const u = (st.t - k * .035) / st.dur;
        if (u <= 0 || u >= 1) continue;
        pointAt(st, u); tmpM.makeTranslation(_v.x + Math.sin(k * 7) * .12, _v.y, _v.z + Math.cos(k * 5) * .12); stream.setMatrixAt(slot++, tmpM);
      }
      if (!st.done && st.t >= st.dur * .92) { st.done = true; if (st.onArrive) st.onArrive(); }
      if (st.t > st.dur + st.n * .035) streams.splice(j, 1);
    }
    for (let k = slot; k < STREAM_N; k++) stream.setMatrixAt(k, hidden);
    stream.instanceMatrix.needsUpdate = true;
  }
  /* chuva */
  const RAIN_N = 2600, rainGeo = new THREE.BufferGeometry(), rp = new Float32Array(RAIN_N * 6);
  for (let k = 0; k < RAIN_N; k++) { const x = (rnd() - .5) * 90, y = rnd() * 40, z = (rnd() - .5) * 90; rp.set([x, y, z, x + .1, y - .9, z + .05], k * 6); }
  rainGeo.setAttribute("position", new THREE.BufferAttribute(rp, 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: "#c9dbea", transparent: true, opacity: 0, depthWrite: false }));
  rain.frustumCulled = false; rain.visible = false; rain.userData.dynamic = true; scene.add(rain);
  let rainLevel = 0, stormK = 0, nightK = 0;
  function setRain(v) { rainLevel = clamp(v, 0, 1); rain.visible = rainLevel > 0; }
  function setStorm(k) { stormK = clamp(k, 0, 1); }
  function setNight(k) { nightK = clamp(k, 0, 1); }
  function updateWeather(dt, camera) {
    if (rain.visible) {
      rain.material.opacity = lerp(rain.material.opacity, rainLevel * .6, 1 - Math.pow(.05, dt));
      const look = camera.userData.look || V(0, 0, 0); rain.position.set(look.x, 0, look.z);
      const a = rainGeo.attributes.position;
      for (let k = 0; k < RAIN_N; k++) {
        let y = a.getY(k * 2) - dt * 38; if (y < 0) y += 40;
        a.setY(k * 2, y); a.setY(k * 2 + 1, y - .9);
      }
      a.needsUpdate = true;
    }
    clouds.children.forEach(c => { const n = 1 - nightK * .72; c.material.color.setRGB((1 - stormK * .58) * n, (1 - stormK * .55) * n, (1 - stormK * .5) * (n + nightK * .12)); c.material.opacity = .92; });
  }

  /* ===================================================== junta as peças fixas (menos chamadas de desenho) */
  (function bakeStatic() {
    scene.updateMatrixWorld(true);
    const groups = new Map(), victims = [];
    world.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh || o.isSprite) return;
      for (let p = o; p; p = p.parent) if (p.userData && p.userData.dynamic) return;
      const m = o.material;
      if (!m || Array.isArray(m) || m.transparent || !o.visible) return;
      const key = m.uuid + (o.castShadow ? "s" : "n");
      let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      for (const a of Object.keys(geo.attributes)) if (!["position", "normal", "uv"].includes(a)) geo.deleteAttribute(a);
      if (!geo.attributes.uv) geo.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
      if (!geo.attributes.normal) geo.computeVertexNormals();
      geo.clearGroups();
      geo.applyMatrix4(o.matrixWorld);
      if (!groups.has(key)) groups.set(key, { m, cast: o.castShadow, geos: [] });
      groups.get(key).geos.push(geo); victims.push(o);
    });
    victims.forEach(o => o.parent.remove(o));
    groups.forEach(g => {
      const merged = mergeGeometries(g.geos);
      if (!merged) return;
      const me = new THREE.Mesh(merged, g.m); me.castShadow = g.cast; me.receiveShadow = true; me.matrixAutoUpdate = false;
      scene.add(me);
    });
  })();

  /* ===================================================== atualização por quadro */
  function update(dt, time, camera) {
    if (skyState.t < skyState.dur) {
      skyState.t += dt; const t = clamp(skyState.t / skyState.dur, 0, 1); applySky(t * t * (3 - 2 * t));
      if (t >= 1 && skyState.envDirty) { skyState.envDirty = false; refreshEnv(); }
    } else if (skyState.envDirty) { skyState.envDirty = false; refreshEnv(); }
    sky.position.copy(camera.position);
    clouds.children.forEach(c => { c.position.x += c.userData.v * dt; if (c.position.x > 520) c.position.x = -520; });
    birds.children.forEach((b, i) => {
      const ph = time * 7 + b.userData.ph, p = b.geometry.attributes.position, f = Math.sin(ph) * .35;
      p.setY(1, .1 + f); p.setY(4, .1 + f); p.needsUpdate = true;
      b.position.x += dt * 4.2; b.position.y += Math.sin(time * .6 + i) * dt * .3;
      if (b.position.x > 90) b.position.x = -90;
      b.rotation.y = -Math.PI / 2;
    });
    const dp = dust.geometry.attributes.position;
    for (let i = 0; i < dp.count; i++) { let y = dp.getY(i) + dt * .12; if (y > 8) y = 0; dp.setY(i, y); dp.setX(i, dp.getX(i) + Math.sin(time * .4 + i) * dt * .08); }
    dp.needsUpdate = true;
    trucks.forEach(t => {
      const u = t.userData; if (u.t0 < 0 || time < u.t0) return;
      const k = clamp((time - u.t0) / 9, 0, 1), e = 1 - Math.pow(1 - k, 3), x = u.stopX - 140 * (1 - e);
      const dx = x - t.position.x; t.position.x = x;
      u.wheels.forEach(w => { w.rotation.z -= dx / .62; });
      if (k >= 1) u.t0 = -1;
    });
    updateBins(dt);
    updateSparks(dt);
    updateSilos(dt);
    updateStreams(dt);
    updateWeather(dt, camera);
    if (loadTruck.userData.bounce > 0) { const u = loadTruck.userData; u.bounce = Math.max(0, u.bounce - dt * 2.5); u.heap.scale.y = 1 + Math.sin(u.bounce * Math.PI) * .25; }
    /* sombras acompanham o que a câmera olha */
    sun.target.position.set(camera.userData.look ? camera.userData.look.x : 0, 0, camera.userData.look ? camera.userData.look.z : 0);
    sun.position.copy(sun.target.position).addScaledVector(skyU.sunDir.value, sunDist);
  }
  let sunDist = 80;
  /* área coberta pelas sombras (maior na vista aérea do capítulo 3) */
  function setShadowArea(r) {
    const c = sun.shadow.camera; r = r || 18;
    c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.far = r > 40 ? 900 : 140; c.updateProjectionMatrix();
    sunDist = r > 40 ? 420 : 80; sun.shadow.normalBias = r > 40 ? .3 : .025; sun.shadow.bias = r > 40 ? -.0008 : -.00025;
  }

  return {
    scene, sun, setSky, refreshEnv, setLite, update,
    play, BELT, BIN, BINS, binObjs, beltTex: [TEX.belt, TEX.beltN], setFill,
    ringNext, ringSel, makeItem, hitGeo, hitMat, burst,
    trucks, driveTrucks, parkTrucks, hideTrucks,
    SILO, siloObjs, setSiloLevel, streamTo, setLoad, setRain, setStorm, setNight, loadTruck, CAM2_DIR,
    STATIONS, ROADS, SEA, TABLE, STAGE, terrainH, buildTruck, logoTex, GRAIN, world, setShadowArea,
    kit: { RB, CY, std, add, plateTexture, roundRect, iconImage, TEX, makeCanvas, toTex, normalFromHeight, pixels, hash, noise, fbm, rnd, clamp, lerp },
  };
}
