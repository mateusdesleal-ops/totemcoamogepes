/* =========================================================
   COAMO GAMES — JORNADA DA SAFRA · VIDA NA UNIDADE (v1)
   Funcionários andando (uniforme, capacete), empilhadeira
   trabalhando e fila de caminhões na estrada.
   Tudo leve: funcionários em instâncias (5 chamadas de desenho).
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
  /* rotas (vai e volta) e grupinhos parados conversando */
  const ROUTES = [
    { pts: [[-26, -9.6], [-6, -9.6]], n: 2 },
    { pts: [[3, -16.6], [29, -16.6]], n: 2 },
    { pts: [[-38, 4.6], [-46, 4.6], [-46, -3]], n: 1 },
    { pts: [[15, -5], [31, -5], [31, 7]], n: 1 },
  ];
  const STAND = [[-31, -14, .9], [-29.8, -13.6, -2.2], [33, -12, 2.6]];
  const W = [];
  ROUTES.forEach(R => {
    const seg = [], len = []; let total = 0;
    for (let i = 0; i < R.pts.length - 1; i++) { const a = R.pts[i], b = R.pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push([a, b]); len.push(l); total += l; }
    for (let k = 0; k < R.n; k++) W.push({ seg, len, total, s: rnd() * total * 2, v: 1.15 + rnd() * .3, ph: rnd() * 6, walk: true, x: 0, z: 0, yaw: 0 });
  });
  STAND.forEach(([x, z, yaw]) => W.push({ walk: false, x, z, yaw, ph: rnd() * 6 }));
  const N = W.length;
  W.forEach((w, i) => { w.vest = i % 3 !== 2; w.k = .95 + rnd() * .09; w.look = 0; });
  const nVest = W.filter(w => w.vest).length;
  const mk = (geo, n) => { const m = new THREE.InstancedMesh(geo, mat, Math.max(1, n)); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; group.add(m); return m; };
  const I = {
    tv: mk(G.torsoVest, nVest), ts: mk(G.torsoShirt, N - nVest), head: mk(G.head, N),
    upper: mk(G.upper, N * 2), fore: mk(G.fore, N * 2), thigh: mk(G.thigh, N * 2), shin: mk(G.shin, N * 2), foot: mk(G.foot, N * 2),
  };
  if (N - nVest === 0) I.ts.count = 0;
  /* sombra de contato */
  const blobs = new THREE.InstancedMesh(new THREE.PlaneGeometry(.9, .9).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: TEX.blob, transparent: true, depthWrite: false }), N);
  blobs.frustumCulled = false; blobs.userData.noAO = true; group.add(blobs);

  const R = new THREE.Matrix4(), PEL = new THREE.Matrix4(), TOR = new THREE.Matrix4(), A1 = new THREE.Matrix4(), A2 = new THREE.Matrix4(), tmp = new THREE.Matrix4();
  const rot = (x, y, z, px = 0, py = 0, pz = 0) => tmp.makeRotationFromEuler(e.set(x, y, z, "YXZ")).setPosition(px, py, pz);
  function placeWorker(w, i, time, slot) {
    let ph = 0, gait = 0;
    if (w.walk) {
      /* posição ao longo da rota, indo e voltando; diminui o passo nas pontas para virar */
      const t2 = w.s % (w.total * 2), back = t2 > w.total; let d = back ? w.total * 2 - t2 : t2;
      let k = 0; while (k < w.seg.length - 1 && d > w.len[k]) { d -= w.len[k]; k++; }
      const [a, b] = w.seg[k], f = clamp(d / w.len[k], 0, 1);
      w.x = a[0] + (b[0] - a[0]) * f; w.z = a[1] + (b[1] - a[1]) * f;
      const dir = back ? -1 : 1, ty = Math.atan2((b[0] - a[0]) * dir, (b[1] - a[1]) * dir);
      let dy = ty - w.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
      w.yaw += dy * .12;
      ph = w.s / (.72 * w.k) * Math.PI + w.ph; gait = 1 - Math.min(1, Math.abs(dy) * 1.4) * .35;
    }
    const sinP = Math.sin(ph), cosP = Math.cos(ph);
    /* raiz */
    q.setFromEuler(e.set(0, w.yaw, 0, "XYZ")); R.compose(p.set(w.x, 0, w.z), q, sc.set(w.k, w.k, w.k));
    blobs.setMatrixAt(i, part.makeTranslation(w.x, .05, w.z));
    /* quadril: sobe e desce, balança e gira com o passo */
    const bob = w.walk ? -.035 * Math.cos(ph * 2) * gait : Math.sin(time * 1.6 + w.ph) * .004;
    const hipYaw = w.walk ? .14 * sinP * gait : Math.sin(time * .5 + w.ph) * .05;
    const sway = w.walk ? .02 * sinP : Math.sin(time * .45 + w.ph) * .015;
    PEL.copy(R).multiply(rot(0, hipYaw, -sway * 1.5, sway, DIM.hip + bob, 0));
    /* tronco: inclina para frente e gira ao contrário do quadril */
    const lean = w.walk ? .07 : .01, chestYaw = w.walk ? -.24 * sinP * gait : 0;
    TOR.copy(PEL).multiply(rot(lean, chestYaw, sway * 2.5));
    (w.vest ? I.tv : I.ts).setMatrixAt(slot, TOR);
    /* cabeça: estável, olha em volta quando parado */
    if (!w.walk) w.look = Math.sin(time * .35 + w.ph) * .5 + Math.sin(time * 1.1 + w.ph * 2) * .1;
    A1.copy(TOR).multiply(rot(-lean * .8 + (w.walk ? Math.sin(ph * 2) * .02 : Math.sin(time * 1.4 + w.ph) * .04), -chestYaw * .7 - hipYaw + w.look, -sway * 2, 0, DIM.neck, 0));
    I.head.setMatrixAt(i, A1);
    for (const s of [-1, 1]) {
      const j = i * 2 + (s > 0 ? 1 : 0), sp = s > 0 ? sinP : -sinP, cp = s > 0 ? cosP : -cosP;
      /* braços: balançam ao contrário das pernas, cotovelo dobra mais na frente */
      let ax, ez = 0, ex;
      if (w.walk) { ax = .42 * sp * gait; ex = -.25 - Math.max(0, -sp) * .45 * gait; }
      else {
        const talking = s > 0 && Math.sin(time * .4 + w.ph) > -.2;
        ax = talking ? -.35 + Math.sin(time * 2.2 + w.ph) * .15 : .05; ex = talking ? -1.2 + Math.sin(time * 3.1 + w.ph) * .25 : -.18;
      }
      A1.copy(TOR).multiply(rot(ax, 0, s * .1, s * DIM.shX, DIM.shY, 0)); I.upper.setMatrixAt(j, A1);
      A2.copy(A1).multiply(rot(ex, 0, ez, 0, -DIM.upper, 0)); I.fore.setMatrixAt(j, A2);
      /* pernas: coxa vai e volta, joelho dobra na fase de balanço, pé fica no chão */
      let th = 0, kn = .04, an = 0;
      if (w.walk) {
        th = -.46 * sp * gait;
        kn = (.08 + .85 * Math.pow(Math.max(0, cp), 1.6)) * gait;
        an = -(th + kn) * .85 + (sp < 0 ? -.12 * Math.max(0, -cp) : 0);
      } else if (s < 0) { th = -.04; kn = .1; an = -.06; }
      A1.copy(PEL).multiply(rot(th, 0, 0, s * .088, -.02, 0)); I.thigh.setMatrixAt(j, A1);
      A1.multiply(rot(kn, 0, 0, 0, -DIM.thigh, 0)); I.shin.setMatrixAt(j, A1);
      A1.multiply(rot(an, 0, 0, 0, -DIM.shin, 0)); I.foot.setMatrixAt(j, A1);
    }
  }
  const sc = new THREE.Vector3();

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
      let sv = 0, ss = 0;
      W.forEach((w, i) => { if (w.walk) w.s += w.v * dt; placeWorker(w, i, time, w.vest ? sv++ : ss++); });
      Object.values(I).concat([blobs]).forEach(m => { m.instanceMatrix.needsUpdate = true; });
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
