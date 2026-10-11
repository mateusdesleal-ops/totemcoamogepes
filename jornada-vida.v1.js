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

/* ---------- peças do funcionário (altura ~1,75 m) ---------- */
function workerGeometries(RB) {
  const PANTS = "#27324c", SHIRT = "#8db8e6", SKIN = "#d9a27a", HELMET = "#f4f5f2", VEST = "#d9e34a", BOOT = "#2a2420";
  const body = mergeGeometries([
    paint(at(RB(.36, .2, .22, .07), 0, .93, 0), PANTS),
    paint(at(RB(.42, .48, .24, .1), 0, 1.24, 0), SHIRT),
    paint(at(RB(.43, .05, .25, .02), 0, 1.13, 0), VEST),             /* faixa refletiva */
    paint(at(RB(.43, .05, .25, .02), 0, 1.3, 0), VEST),
    paint(at(new THREE.CylinderGeometry(.055, .06, .08, 10), 0, 1.5, 0), SKIN),
    paint(at(new THREE.SphereGeometry(.11, 16, 12).scale(1, 1.1, 1), 0, 1.6, .005), SKIN),
    paint(at(new THREE.SphereGeometry(.13, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, .85, 1.08), 0, 1.65, 0), HELMET),
    paint(at(new THREE.CylinderGeometry(.15, .15, .018, 18).scale(1, 1, 1.12), 0, 1.655, .02), HELMET),
  ]);
  const legParts = [paint(new THREE.CapsuleGeometry(.075, .62, 4, 10).translate(0, -.38, 0), PANTS), paint(at(RB(.13, .1, .26, .04), 0, -.82, .05), BOOT)];
  const leg = mergeGeometries(legParts);
  const arm = mergeGeometries([paint(new THREE.CapsuleGeometry(.058, .44, 4, 10).translate(0, -.27, 0), SHIRT), paint(at(new THREE.SphereGeometry(.058, 10, 8), 0, -.55, 0), SKIN)]);
  return { body, leg, arm };
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
  const bodies = new THREE.InstancedMesh(G.body, mat, N), legs = new THREE.InstancedMesh(G.leg, mat, N * 2), arms = new THREE.InstancedMesh(G.arm, mat, N * 2);
  [bodies, legs, arms].forEach(m => { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; group.add(m); });
  /* sombra de contato */
  const blobs = new THREE.InstancedMesh(new THREE.PlaneGeometry(.9, .9).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: TEX.blob, transparent: true, depthWrite: false }), N);
  blobs.frustumCulled = false; blobs.userData.noAO = true; group.add(blobs);

  function placeWorker(w, i, time) {
    let swing = 0, bob = 0;
    if (w.walk) {
      /* posição ao longo da rota, indo e voltando */
      const t2 = w.s % (w.total * 2), back = t2 > w.total; let d = back ? w.total * 2 - t2 : t2;
      let k = 0; while (k < w.seg.length - 1 && d > w.len[k]) { d -= w.len[k]; k++; }
      const [a, b] = w.seg[k], f = clamp(d / w.len[k], 0, 1);
      w.x = a[0] + (b[0] - a[0]) * f; w.z = a[1] + (b[1] - a[1]) * f;
      const dir = back ? -1 : 1, ty = Math.atan2((b[0] - a[0]) * dir, (b[1] - a[1]) * dir);
      let dy = ty - w.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
      w.yaw += dy * .2;
      const ph = w.s * 4.6 + w.ph; swing = Math.sin(ph) * .55; bob = Math.abs(Math.cos(ph)) * .035;
    } else { swing = Math.sin(time * 1.3 + w.ph) * .05; }
    q.setFromEuler(e.set(0, w.yaw, 0));
    m4.compose(p.set(w.x, bob, w.z), q, one);
    bodies.setMatrixAt(i, m4);
    blobs.setMatrixAt(i, part.makeTranslation(w.x, .05, w.z));
    for (const s of [-1, 1]) {
      const j = i * 2 + (s > 0 ? 1 : 0);
      part.makeRotationX(swing * s).setPosition(s * .1, .9, 0); legs.setMatrixAt(j, m4.clone().multiply(part));
      const talk = !w.walk && s > 0 ? -.5 + Math.sin(time * 2.4 + w.ph) * .25 : 0;
      part.makeRotationFromEuler(e.set(-swing * s * .8 + talk, 0, s * .1)).setPosition(s * .26, 1.43, 0); arms.setMatrixAt(j, m4.clone().multiply(part));
    }
  }

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
  const op = new THREE.Mesh(G.body, mat); op.position.set(0, .45, -.25); op.scale.setScalar(.92); op.castShadow = true; op.userData.keep = true; fkBody.add(op);
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
      W.forEach((w, i) => { if (w.walk) w.s += w.v * dt; placeWorker(w, i, time); });
      [bodies, legs, arms, blobs].forEach(m => { m.instanceMatrix.needsUpdate = true; });
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
