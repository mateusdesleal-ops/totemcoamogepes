/* =========================================================
   COAMO GAMES — JORNADA DA SAFRA · VIDA NA UNIDADE (v1)
   Empilhadeira trabalhando (com operador) e fila de caminhões
   na estrada.
   ========================================================= */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const smooth = t => t * t * (3 - 2 * t);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* pinta todos os vértices de uma peça com uma cor (para juntar peças num só material) */
function paint(g, hex) {
  g = g.index ? g.toNonIndexed() : g;
  const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute("color", new THREE.BufferAttribute(a, 3));
  if (g.attributes.uv) g.deleteAttribute("uv");
  return g;
}
const at = (g, x, y, z) => { g.translate(x, y, z); return g; };

/* cor por altura (faixas do uniforme numa peça só) */
function bands(g, fn) {
  g = g.index ? g.toNonIndexed() : g;
  const P = g.attributes.position, a = new Float32Array(P.count * 3), c = new THREE.Color();
  for (let i = 0; i < P.count; i++) { c.set(fn(P.getY(i), P.getX(i), P.getZ(i))); a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute("color", new THREE.BufferAttribute(a, 3));
  if (g.attributes.uv) g.deleteAttribute("uv");
  return g;
}
const lathe = (pts, seg = 20) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

/* ---------- funcionário articulado (altura ~1,76 m): cada osso é uma peça ---------- */
const DIM = { hip: .92, thigh: .43, shin: .42, shX: .19, shY: .43, upper: .27, neck: .5 };
function workerGeometries(RB) {
  const PANTS = "#2a3552", BELT = "#1c1c1c", SHIRT = "#8fbbe8", VEST = "#c6d43c", REFL = "#d9dde0", SKIN = "#d39a72", HELMET = "#f5f6f2", BOOT = "#3a2c22", HAIR = "#3b2a20";
  /* tronco: quadril, cintura, peito e ombros arredondados */
  const torsoPts = [[0, -.1], [.15, -.1], [.165, -.03], [.158, .06], [.148, .15], [.163, .27], [.178, .36], [.172, .43], [.13, .48], [.06, .515], [0, .515]];
  const torsoGeo = () => { const g = lathe(torsoPts, 24); g.scale(1, 1, .64); return g; };
  const torsoVest = mergeGeometries([
    bands(torsoGeo(), y => y < .035 ? PANTS : y < .07 ? BELT : (y > .19 && y < .225) || (y > .32 && y < .355) ? REFL : y > .47 ? SHIRT : VEST),
    bands(new THREE.CylinderGeometry(.06, .065, .05, 14, 1, true).translate(0, .51, 0), () => SHIRT),
  ]);
  const torsoShirt = mergeGeometries([
    bands(torsoGeo(), y => y < .035 ? PANTS : y < .07 ? BELT : SHIRT),
    bands(new THREE.CylinderGeometry(.06, .065, .05, 14, 1, true).translate(0, .51, 0), () => SHIRT),
    bands(RB(.035, .03, .012, .006).translate(0, .053, .1), () => "#c9ced2"),                 /* fivela */
    bands(new THREE.BoxGeometry(.06, .07, .01).translate(.075, .37, .108), () => "#7aa6d6"),     /* bolso */
  ]);
  /* cabeça com capacete, cabelo, orelhas e nariz (dá direção ao rosto) */
  const head = mergeGeometries([
    bands(new THREE.CylinderGeometry(.048, .055, .1, 12).translate(0, .04, 0), () => SKIN),
    bands(new THREE.SphereGeometry(.1, 18, 14).scale(.92, 1.08, 1).translate(0, .14, .01), () => SKIN),
    bands(new THREE.SphereGeometry(.102, 16, 10, 0, Math.PI * 2, 0, Math.PI * .62).scale(.94, 1.06, 1).rotateX(-.5).translate(0, .15, -.004), () => HAIR),
    bands(new THREE.SphereGeometry(.022, 8, 6).scale(.5, 1, .8).translate(-.093, .135, 0), () => SKIN),
    bands(new THREE.SphereGeometry(.022, 8, 6).scale(.5, 1, .8).translate(.093, .135, 0), () => SKIN),
    bands(new THREE.SphereGeometry(.017, 8, 6).scale(.9, 1.1, 1).translate(0, .13, .1), () => "#c88b65"),
    bands(new THREE.SphereGeometry(.118, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, .82, 1.1).translate(0, .19, .005), () => HELMET),
    bands(new THREE.CylinderGeometry(.124, .124, .012, 22).scale(1, 1, 1.12).translate(0, .19, .006), () => HELMET),
    bands(new THREE.CylinderGeometry(.075, .075, .012, 16, 1, false, -Math.PI / 2, Math.PI).scale(1, 1, .9).translate(0, .188, .1), () => HELMET),
    bands(new THREE.BoxGeometry(.018, .02, .2).translate(0, .285, 0), () => "#e9eae6"),          /* nervura */
  ]);
  const upper = mergeGeometries([bands(new THREE.SphereGeometry(.068, 14, 10).scale(1, .92, .95), () => SHIRT), bands(new THREE.CapsuleGeometry(.056, .2, 4, 12).translate(0, -.13, 0), () => SHIRT)]);
  const fore = mergeGeometries([
    bands(new THREE.CapsuleGeometry(.046, .17, 4, 12).translate(0, -.11, 0), y => y < -.19 ? "#7fabd9" : SHIRT),
    bands(new THREE.SphereGeometry(.045, 12, 10).scale(.85, 1.15, .65).translate(0, -.27, .005), () => SKIN),
    bands(new THREE.CapsuleGeometry(.014, .03, 3, 6).rotateZ(.5).translate(.03, -.255, .02), () => SKIN),
  ]);
  const thigh = bands(lathe([[0, .02], [.094, 0], [.097, -.08], [.084, -.3], [.073, -.43], [0, -.45]], 16), () => PANTS);
  const shin = bands(lathe([[0, .02], [.074, 0], [.072, -.12], [.06, -.36], [.063, -.42], [0, -.43]], 16), () => PANTS);
  const foot = mergeGeometries([
    bands(RB(.12, .09, .21, .036, 3).translate(0, -.035, .04), () => BOOT),
    bands(new THREE.SphereGeometry(.055, 12, 8).scale(1, .7, 1.1).translate(0, -.045, .12), () => BOOT),
    bands(RB(.118, .02, .25, .008).translate(0, -.075, .055), () => "#151210"),
  ]);
  return { torsoVest, torsoShirt, head, upper, fore, thigh, shin, foot };
}

export function buildLife(o) {
  const { world, kit, buildTruck, rnd } = o;
  const { RB, CY, std, mergeGroup, TEX } = kit;
  const group = new THREE.Group(); group.name = "vida"; group.userData.dynamic = true; world.add(group);
  const m4 = new THREE.Matrix4(), part = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();

  /* ===================================================== funcionários */
  const G = workerGeometries(RB);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .7 });

  /* ===================================================== empilhadeira trabalhando */
  const fk = new THREE.Group(); fk.userData.dynamic = true; group.add(fk);
  const fkBody = new THREE.Group(); fk.add(fkBody);
  const add = (geo, m, x, y, z, parent) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; parent.add(me); return me; };
  const fy = std("forkYellow", { color: "#f2b705", roughness: .35, metalness: .3 }), dark = std("steelDark", { color: "#5d666b", roughness: .45, metalness: .8 });
  add(RB(1.4, .9, 2.2, .14, 3), fy, 0, .75, 0, fkBody);
  add(RB(1.3, .55, .6, .12), std("counter", { color: "#2d3132", roughness: .6, metalness: .4 }), 0, .92, -1.05, fkBody);
  add(RB(.6, .5, .6, .1), std("seat", { color: "#222", roughness: .7 }), 0, 1.45, -.3, fkBody);
  for (const x of [-.6, .6]) for (const z of [-.75, .55]) add(RB(.08, 1.7, .08, .03), dark, x, 2.05, z, fkBody);
  add(RB(1.35, .08, 1.45, .03), dark, 0, 2.92, -.1, fkBody);
  for (const x of [-.32, .32]) add(RB(.1, 2.3, .1, .03), dark, x, 1.3, 1.2, fkBody);
  for (const [x, z, r] of [[-.72, .7, .4], [.72, .7, .4], [-.72, -.75, .33], [.72, -.75, .33]]) { const w = add(CY(r, r, .3, 18), std("tire", { color: "#1b1d1c", roughness: .85 }), x, r, z, fkBody); w.rotation.z = Math.PI / 2; }
  /* operador */
  const op = new THREE.Mesh(G.torsoVest, mat); op.position.set(0, 1.8, -.25); op.castShadow = true; op.userData.keep = true; fkBody.add(op);
  const opHead = new THREE.Mesh(G.head, mat); opHead.position.set(0, 2.3, -.25); opHead.castShadow = true; opHead.userData.keep = true; fkBody.add(opHead);
  /* operador sentado: pernas dobradas, mãos no volante */
  const opPart = (geo, x, y, z, rx, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); m.castShadow = true; m.userData.keep = true; fkBody.add(m); return m; };
  for (const s of [-1, 1]) {
    opPart(G.thigh, s * .088, 1.78, -.25, -Math.PI / 2 + .1);
    opPart(G.shin, s * .1, 1.76, .17, -.15);
    opPart(G.foot, s * .1, 1.34, .23, 0);
    const up = opPart(G.upper, s * .19, 2.23, -.25, -.75, s * .12);
    opPart(G.fore, s * .17, 2.03, -.07, -1.45, -s * .2);
  }
  { const wheel = new THREE.Mesh(new THREE.TorusGeometry(.17, .025, 8, 20), std("tire", { color: "#1b1d1c", roughness: .85 })); wheel.position.set(0, 1.98, .26); wheel.rotation.x = -1.0; wheel.castShadow = true; fkBody.add(wheel);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .45, 8), dark); col.position.set(0, 1.78, .38); col.rotation.x = -.45; fkBody.add(col); }
  mergeGroup(fkBody);
  /* garfo com palete de sacaria (sobe e desce) */
  const forks = new THREE.Group(); forks.position.set(0, .12, 1.3); fk.add(forks);
  for (const x of [-.3, .3]) add(RB(.12, .05, 1.1, .02), dark, x, 0, .55, forks);
  add(RB(.8, .5, .08, .02), dark, 0, .25, 0, forks);
  const wood = std("wood", { color: "#a77b4f", roughness: .85 }), sack = std("sack", { color: "#efe6cf", roughness: .95 });
  add(RB(1.2, .12, 1.0, .02), wood, 0, .1, .6, forks);
  for (let k = 0; k < 6; k++) add(RB(.55, .26, .42, .11, 3), sack, -.29 + (k % 2) * .58, .3 + Math.floor(k / 2) * .25, .38 + (Math.floor(k / 2) % 2) * .1, forks);
  mergeGroup(forks);
  const FK = { x0: -28, x1: -6, z: -11.9, t: 0 };

  /* ===================================================== fila de caminhões na estrada */
  const traffic = [];
  const colors = ["#ffffff", "#c62828", "#2e7d32", "#ffffff", "#f2b400", "#455a64"];
  colors.forEach((c, i) => {
    const t = buildTruck(c); t.visible = false; group.add(t);
    if (i % 2) { t.userData.variante = "basculante"; t.userData.glbFrom = null; }
    t.userData.lane = i % 2 ? -1 : 1; t.userData.x = i % 2 ? -64 - (i >> 1) * 90 : -560 + (i >> 1) * 120; t.userData.v = 0; t.userData.state = "go";
    traffic.push(t);
  });
  const frustum = new THREE.Frustum(), pm = new THREE.Matrix4(), box = new THREE.Box3(), half = new THREE.Vector3(7, 2.5, 2);
  let pause = 0, trafficOn = true;
  function inView(x, z) { box.setFromCenterAndSize(p.set(x, 2, z), half.clone().multiplyScalar(2)); return frustum.intersectsBox(box); }

  function updateTraffic(dt, camera) {
    pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); frustum.setFromProjectionMatrix(pm);
    pause = Math.max(0, pause - dt);
    const show = trafficOn && pause <= 0;
    /* chegando (+x, faixa z=-6): para em fila antes do portão */
    const arriving = traffic.filter(t => t.userData.lane > 0).sort((a, b) => b.userData.x - a.userData.x);
    arriving.forEach((t, i) => {
      const u = t.userData, stop = i === 0 ? -68 : arriving[i - 1].userData.x - 15.5;
      const gap = stop - u.x, want = gap > 30 ? 9 : gap > 1 ? gap * .3 : 0;
      u.v += clamp(want - u.v, -6 * dt, 2.2 * dt); u.x += u.v * dt;
      /* o primeiro da fila "entra" na unidade quando ninguém está olhando */
      if (i === 0 && gap < 1 && (u.wait = (u.wait || 0) + dt) > 6 && !inView(u.x, -6)) { u.x = Math.min(-560, arriving[arriving.length - 1].userData.x - 120); u.v = 9; u.wait = 0; }
      t.position.set(u.x, 0, -6); t.rotation.y = 0; t.visible = show;
    });
    /* saindo (-x, faixa z=-10): some na neblina e volta ao portão fora da vista */
    traffic.filter(t => t.userData.lane < 0).forEach(t => {
      const u = t.userData;
      u.v = Math.min(11, u.v + 2 * dt); u.x -= u.v * dt;
      if (u.x < -600) { if (!inView(-64, -10)) { u.x = -64; u.v = 0; } else u.x = -600; }
      t.position.set(u.x, 0, -10); t.rotation.y = Math.PI; t.visible = show && u.x > -598;
    });
  }

  return {
    group,
    pauseTraffic(sec) { pause = Math.max(pause, sec); },
    setDetail(level) { trafficOn = level !== "low"; },
    update(dt, time, camera) {
      /* empilhadeira: anda, ergue o palete, volta de ré */
      FK.t += dt; const T = 24, t = FK.t % T;
      let x, lift, yaw = Math.PI / 2;
      if (t < 8) { x = FK.x0 + (FK.x1 - FK.x0) * smooth(t / 8); lift = .12; }
      else if (t < 12) { x = FK.x1; lift = .12 + smooth(clamp((t - 8) / 2, 0, 1)) * 1.4 - smooth(clamp((t - 10) / 2, 0, 1)) * 1.4; }
      else if (t < 20) { x = FK.x1 + (FK.x0 - FK.x1) * smooth((t - 12) / 8); lift = .12; }
      else { x = FK.x0; lift = .12 + Math.sin(clamp((t - 20) / 4, 0, 1) * Math.PI) * .5; }
      fk.position.set(x, 0, FK.z); fk.rotation.y = yaw; forks.position.y = lift;
      if (camera) updateTraffic(dt, camera);
    },
  };
}
