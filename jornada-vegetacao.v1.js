/* =========================================================
   COAMO GAMES — JORNADA DA SAFRA · VEGETAÇÃO (v1)
   Árvores com folhagem de verdade (cartões de folhas com normais
   suaves), grama em tufos e lavouras em fileiras, tudo balançando
   com o vento por um pequeno ajuste no shader.
   ========================================================= */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const windU = { uTime: { value: 0 }, uWind: { value: 1 } };

/* balanço do vento: desloca os vértices conforme a altura */
export function windify(mat, strength = .25, heightScale = .25, key = "w", byUv = false) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = windU.uTime; sh.uniforms.uWind = windU.uWind;
    sh.vertexShader = "uniform float uTime;\nuniform float uWind;\n" + sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
      vec4 wpW = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        wpW = instanceMatrix * wpW;
      #endif
      wpW = modelMatrix * wpW;
      float hW = ${byUv ? "uv.y" : "max(0.0, position.y)"} * ${heightScale.toFixed(3)};
      float phW = wpW.x * 0.11 + wpW.z * 0.09;
      float gust = 0.65 + 0.35 * sin(uTime * 0.37 + wpW.x * 0.013);
      transformed.x += sin(uTime * 1.7 + phW) * ${strength.toFixed(3)} * hW * uWind * gust;
      transformed.z += cos(uTime * 1.3 + phW * 1.4) * ${(strength * .6).toFixed(3)} * hW * uWind * gust;`);
  };
  mat.customProgramCacheKey = () => "wind-" + key + strength + heightScale + byUv;
  return mat;
}

function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }

/* textura de um cacho de folhas (com transparência) */
function leafTexture(rnd, hue) {
  const c = canvas(256, 256), x = c.getContext("2d");
  for (let k = 0; k < 70; k++) {
    const r = Math.sqrt(rnd()) * 104, a = rnd() * Math.PI * 2, cx = 128 + Math.cos(a) * r, cy = 128 + Math.sin(a) * r;
    const len = 20 + rnd() * 18, wid = len * (.42 + rnd() * .12), rot = rnd() * Math.PI * 2;
    const l = 30 + rnd() * 26 - r * .08, sat = 42 + rnd() * 18;
    x.save(); x.translate(cx, cy); x.rotate(rot);
    const g = x.createLinearGradient(0, -wid, 0, wid);
    g.addColorStop(0, `hsl(${hue + rnd() * 10},${sat}%,${l + 10}%)`); g.addColorStop(1, `hsl(${hue - 6 + rnd() * 8},${sat}%,${l - 6}%)`);
    x.fillStyle = g; x.beginPath(); x.ellipse(0, 0, len, wid, 0, 0, Math.PI * 2); x.fill();
    x.strokeStyle = `hsla(${hue},40%,${l + 18}%,.5)`; x.lineWidth = 1.2; x.beginPath(); x.moveTo(-len * .9, 0); x.lineTo(len * .9, 0); x.stroke();
    x.restore();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
/* textura de fileira de lavoura vista de lado */
function rowTexture(kind, rnd) {
  const c = canvas(512, 128), x = c.getContext("2d");
  if (kind === "soja") {
    for (let k = 0; k < 90; k++) {
      const cx = rnd() * 512, h = 60 + rnd() * 50, w = 10 + rnd() * 12, l = 26 + rnd() * 16;
      x.fillStyle = `hsl(${88 + rnd() * 18},${38 + rnd() * 16}%,${l}%)`;
      x.beginPath(); x.ellipse(cx, 128 - h * .55, w * 1.6, h * .55, 0, 0, Math.PI * 2); x.fill();
      for (let j = 0; j < 5; j++) { x.beginPath(); x.ellipse(cx + (rnd() - .5) * w * 3, 128 - h * (.3 + rnd() * .7), w * .9, w * .6, rnd() * 3, 0, Math.PI * 2); x.fillStyle = `hsl(${92 + rnd() * 14},${45}%,${l + 8}%)`; x.fill(); }
    }
  } else {
    for (let k = 0; k < 260; k++) {
      const cx = rnd() * 512, h = 70 + rnd() * 46, lean = (rnd() - .5) * 14;
      x.strokeStyle = `hsl(${40 + rnd() * 8},${55 + rnd() * 15}%,${50 + rnd() * 14}%)`; x.lineWidth = 2;
      x.beginPath(); x.moveTo(cx, 128); x.quadraticCurveTo(cx + lean * .5, 128 - h * .5, cx + lean, 128 - h); x.stroke();
      x.fillStyle = `hsl(${38 + rnd() * 8},${60}%,${46 + rnd() * 12}%)`;
      x.beginPath(); x.ellipse(cx + lean, 128 - h - 6, 3, 10, lean * .03, 0, Math.PI * 2); x.fill();
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}
function barkTexture(rnd) {
  const c = canvas(64, 256), x = c.getContext("2d");
  x.fillStyle = "#5c4430"; x.fillRect(0, 0, 64, 256);
  for (let k = 0; k < 60; k++) { x.strokeStyle = `rgba(${30 + rnd() * 30},${20 + rnd() * 20},${12},${.4 + rnd() * .4})`; x.lineWidth = 1 + rnd() * 2; const px = rnd() * 64; x.beginPath(); x.moveTo(px, 0); x.lineTo(px + (rnd() - .5) * 8, 256); x.stroke(); }
  for (let k = 0; k < 40; k++) { x.fillStyle = `rgba(150,130,100,${rnd() * .25})`; x.fillRect(rnd() * 64, rnd() * 256, 2 + rnd() * 6, 2 + rnd() * 10); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/* ---------- uma espécie de árvore: tronco com galhos + copa de cartões ---------- */
function treeSpecies(kind, rnd) {
  const trunkParts = [], cards = [];
  let H, clusters;
  if (kind === "eucalipto") {
    H = 11;
    trunkParts.push(new THREE.CylinderGeometry(.16, .3, H, 8).translate(0, H / 2, 0));
    clusters = []; for (let k = 0; k < 9; k++) clusters.push([(rnd() - .5) * 1.6, H * (.45 + k * .065), (rnd() - .5) * 1.6, 1.3 + rnd() * .5]);
  } else if (kind === "copa") {
    H = 4.2;
    trunkParts.push(new THREE.CylinderGeometry(.28, .45, H, 9).translate(0, H / 2, 0));
    clusters = [[0, H + 2.2, 0, 2.6]];
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + rnd() * .4, r = 2.2 + rnd() * .8; clusters.push([Math.cos(a) * r, H + 1.2 + rnd() * 1.6, Math.sin(a) * r, 1.8 + rnd() * .6]); }
  } else {
    H = 3.4;
    trunkParts.push(new THREE.CylinderGeometry(.22, .36, H, 8).translate(0, H / 2, 0));
    clusters = [[0, H + 1.8, 0, 2.1]];
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + rnd(), r = 1.5 + rnd() * .6; clusters.push([Math.cos(a) * r, H + 1 + rnd() * 1.4, Math.sin(a) * r, 1.5 + rnd() * .5]); }
  }
  /* galhos até os cachos */
  const up = new THREE.Vector3(0, 1, 0);
  clusters.forEach(([cx, cy, cz]) => {
    const from = new THREE.Vector3(0, Math.min(cy - 1, H * .85), 0), to = new THREE.Vector3(cx * .8, cy - .3, cz * .8);
    const len = from.distanceTo(to); if (len < .4) return;
    const b = new THREE.CylinderGeometry(.06, .12, len, 5); b.translate(0, len / 2, 0);
    b.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, to.clone().sub(from).normalize())); b.translate(from.x, from.y, from.z);
    trunkParts.push(b);
  });
  /* cartões de folhas com normal apontando para fora da copa (luz macia) */
  const center = new THREE.Vector3(0, kind === "eucalipto" ? H * .72 : H + 1.6, 0);
  clusters.forEach(([cx, cy, cz, r]) => {
    const n = kind === "eucalipto" ? 14 : 22;
    for (let k = 0; k < n; k++) {
      const s = 1.2 + rnd() * .9;
      const g = new THREE.PlaneGeometry(s, s);
      g.rotateX(rnd() * Math.PI); g.rotateY(rnd() * Math.PI * 2); g.rotateZ(rnd() * Math.PI);
      const dir = new THREE.Vector3().randomDirection().multiplyScalar(Math.cbrt(rnd()) * r * .8);
      g.translate(cx + dir.x, cy + dir.y * .75, cz + dir.z);
      const p = g.attributes.position, nrm = g.attributes.normal, v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) { v.set(p.getX(i), p.getY(i), p.getZ(i)).sub(center).normalize(); nrm.setXYZ(i, v.x, v.y * .9 + .25, v.z); }
      cards.push(g);
    }
  });
  const trunk = mergeGeometries(trunkParts.map(g => g.index ? g.toNonIndexed() : g));
  const crown = mergeGeometries(cards);
  return { trunk, crown, H };
}

export function buildVegetation(o) {
  const { world, terrainH, blocked, fields, rnd } = o;
  const group = new THREE.Group(); group.name = "vegetacao"; world.add(group);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3(), eu = new THREE.Euler(), col = new THREE.Color();

  /* ---------- árvores ---------- */
  const leafTex = [leafTexture(rnd, 105), leafTexture(rnd, 92), leafTexture(rnd, 118)];
  const bark = new THREE.MeshStandardMaterial({ map: barkTexture(rnd), roughness: .95 });
  const species = [treeSpecies("copa", rnd), treeSpecies("redonda", rnd), treeSpecies("eucalipto", rnd)];
  const spots = [[], [], []];
  let tries = 0;
  while (spots[0].length + spots[1].length < 230 && tries < 12000) {
    tries++;
    const a = rnd() * Math.PI * 2, r = 46 + Math.pow(rnd(), 1.5) * 170;
    const x = Math.cos(a) * r, z = Math.sin(a) * r - 14;
    if (blocked(x, z, 9)) continue;
    spots[rnd() < .45 ? 0 : 1].push([x, z, .75 + rnd() * .6, rnd() * 6]);
  }
  /* bosques: grupos mais densos perto das lavouras */
  for (let g = 0; g < 14; g++) {
    const a = rnd() * Math.PI * 2, r = 70 + rnd() * 160, gx = Math.cos(a) * r, gz = Math.sin(a) * r - 14;
    for (let k = 0; k < 9; k++) { const x = gx + (rnd() - .5) * 26, z = gz + (rnd() - .5) * 26; if (!blocked(x, z, 9)) spots[rnd() < .5 ? 0 : 1].push([x, z, .7 + rnd() * .5, rnd() * 6]); }
  }
  /* quebra-vento de eucaliptos atrás do armazém e ao longo da estrada */
  for (let x = -66; x < 66; x += 3.4) spots[2].push([x + (rnd() - .5), -43 - rnd() * 3, .85 + rnd() * .35, rnd() * 6]);
  for (let x = -260; x < -60; x += 3.8) if (rnd() < .8) spots[2].push([x, -16 - rnd() * 2, .8 + rnd() * .4, rnd() * 6]);
  const greens = [["#5f9548", "#6fa452", "#4f8740", "#7aac58"], ["#5a8f45", "#679e4c", "#4a7f3c", "#73a754"], ["#6e9a68", "#7aa373", "#628f60", "#86ad7d"]];
  species.forEach((sp, si) => {
    const list = spots[si]; if (!list.length) return;
    const trunks = new THREE.InstancedMesh(sp.trunk, bark, list.length);
    const leafMat = windify(new THREE.MeshStandardMaterial({ map: leafTex[si], alphaTest: .42, side: THREE.DoubleSide, roughness: .8, color: "#ffffff" }), si === 2 ? .05 : .045, 1, "leaf" + si);
    const crowns = new THREE.InstancedMesh(sp.crown, leafMat, list.length);
    list.forEach(([x, z, k, ry], i) => {
      q.setFromEuler(eu.set(0, ry, 0)); m4.compose(pos.set(x, terrainH(x, z) - .1, z), q, sc.set(k, k * (si === 2 ? 1 + rnd() * .3 : 1), k));
      trunks.setMatrixAt(i, m4); crowns.setMatrixAt(i, m4);
      crowns.setColorAt(i, col.set(greens[si][i % 4]).offsetHSL((rnd() - .5) * .02, 0, (rnd() - .5) * .06));
    });
    crowns.userData.noAO = true;
    trunks.castShadow = crowns.castShadow = true; crowns.receiveShadow = true; trunks.receiveShadow = true;
    group.add(trunks, crowns);
  });

  /* ---------- lavouras em fileiras ---------- */
  const rowTex = { soja: rowTexture("soja", rnd), trigo: rowTexture("trigo", rnd) };
  const rowMats = {
    soja: windify(new THREE.MeshStandardMaterial({ map: rowTex.soja, alphaTest: .4, side: THREE.DoubleSide, roughness: .9 }), .12, 1.2, "rowS", true),
    trigo: windify(new THREE.MeshStandardMaterial({ map: rowTex.trigo, alphaTest: .4, side: THREE.DoubleSide, roughness: .9 }), .2, 1.2, "rowT", true),
  };
  const rowGeos = { soja: [], trigo: [] };
  fields.forEach(f => {
    const kind = f.t === "wheat" ? "trigo" : "soja", H = kind === "soja" ? .75 : .95, gap = 1.25;
    const c = Math.cos(f.r), s = Math.sin(f.r);
    for (let z = -f.d / 2 + 1; z < f.d / 2 - 1; z += gap) {
      const segs = Math.max(2, Math.round(f.w / 12)), pts = [], uvs = [], idx = [];
      for (let k = 0; k <= segs; k++) {
        const lx = -f.w / 2 + 1 + (f.w - 2) * k / segs, wx = f.x + lx * c - z * s, wz = f.z + lx * s + z * c, y = terrainH(wx, wz) + .1;
        pts.push(wx, y, wz, wx, y + H, wz); const u = (lx + f.w / 2) / 6; uvs.push(u, 0, u, 1);
        if (k < segs) { const b = k * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx);
      /* normal virada para cima: a fileira recebe luz como planta, não como parede */
      g.setAttribute("normal", new THREE.Float32BufferAttribute(new Array(pts.length / 3).fill(0).flatMap(() => [0, 1, 0]), 3));
      rowGeos[kind].push(g);
    }
  });
  const rows = [];
  Object.entries(rowGeos).forEach(([k, list]) => {
    if (!list.length) return;
    /* altura local para o vento: copia y relativo à base */
    const merged = mergeGeometries(list);
    const me = new THREE.Mesh(merged, rowMats[k]); me.receiveShadow = true; me.castShadow = false; me.userData.dynamic = true; me.userData.noAO = true;
    group.add(me); rows.push(me);
  });

  /* ---------- grama em tufos ---------- */
  const blade = (() => {
    const parts = [];
    for (let b = 0; b < 7; b++) {
      const h = .35 + rnd() * .5, w = .05 + rnd() * .03, lean = (rnd() - .5) * .35, a = rnd() * Math.PI * 2, ox = (rnd() - .5) * .35, oz = (rnd() - .5) * .35;
      const pts = [-w, 0, 0, w, 0, 0, -w * .6 + lean * .4, h * .55, lean * .15, w * .6 + lean * .4, h * .55, lean * .15, lean, h, lean * .35];
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)); g.setIndex([0, 1, 2, 2, 1, 3, 2, 3, 4]);
      const c0 = new THREE.Color("#3d6a2c"), c1 = new THREE.Color("#8fbd5a").offsetHSL((rnd() - .5) * .04, 0, (rnd() - .5) * .08);
      g.setAttribute("color", new THREE.Float32BufferAttribute([...c0.toArray(), ...c0.toArray(), ...c0.clone().lerp(c1, .55).toArray(), ...c0.clone().lerp(c1, .55).toArray(), ...c1.toArray()], 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(new Array(5).fill(0).flatMap(() => [0, 1, 0]), 3));
      g.rotateY(a); g.translate(ox, 0, oz); parts.push(g);
    }
    return mergeGeometries(parts);
  })();
  const grassMat = windify(new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .9 }), .5, 1.6, "grass");
  const gSpots = [];
  const zones = o.grassZones;
  zones.forEach(zn => {
    for (let k = 0; k < zn.n; k++) {
      const x = zn.x + (rnd() - .5) * zn.w, z = zn.z + (rnd() - .5) * zn.d;
      if (blocked(x, z, 0, true)) continue;
      gSpots.push([x, z]);
    }
  });
  const grass = new THREE.InstancedMesh(blade, grassMat, gSpots.length);
  gSpots.forEach(([x, z], i) => { const k = .7 + rnd() * .7; q.setFromEuler(eu.set(0, rnd() * 6, 0)); m4.compose(pos.set(x, terrainH(x, z), z), q, sc.set(k, k * (.8 + rnd() * .5), k)); grass.setMatrixAt(i, m4); });
  grass.receiveShadow = true; grass.castShadow = false; grass.frustumCulled = false; grass.userData.dynamic = true; grass.userData.noAO = true;
  group.add(grass);

  return {
    group, grass, rows,
    setDetail(level) { grass.visible = level !== "low"; rows.forEach(r => { r.visible = level !== "low"; }); },
    update(time) { windU.uTime.value = time; },
  };
}
