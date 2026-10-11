/* =========================================================
   COAMO GAMES — JORNADA DA SAFRA · CAPÍTULO 3 (v1)
   "Do grão ao mercado": vista aérea da região. Cada carga sai da
   lavoura e o jogador escolhe a próxima parada até o destino final.
   Soja vira óleo na indústria, trigo vira farinha no moinho e
   parte do milho segue para exportação pelo porto.
   ========================================================= */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { ICONS } from "./jornada-icones.v1.js";

export const STORY3 = {
  intro: [
    { who: "n", shot: "regionWide", text: "Tarde de sol. Lá do alto dá para ver toda a região onde a Coamo atua." },
    { who: "t", shot: "regionStage", act: "talk", text: "A safra está guardada. Agora cada grão segue o seu caminho até virar produto e chegar às pessoas." },
    { who: "a", shot: "regionStage", act: "wave", text: "Você é quem traça a rota! Toque na próxima parada de cada carga. Cuidado: cada grão tem um destino diferente." },
  ],
  kicker: "CAPÍTULO 3 · INDÚSTRIA E LOGÍSTICA",
  title: "Do grão ao mercado",
  goal: "Leve três cargas da lavoura até o destino final, uma parada de cada vez.",
  how: "Toque na próxima parada da carga. A soja vira óleo na indústria, o trigo vira farinha no moinho e parte do milho segue pelo porto. Parada errada custa uma vida.",
  hints: {
    lavoura: "Depois da colheita, a carga vai para a unidade de recebimento.",
    recebimento: "Antes de seguir viagem, o grão precisa ser armazenado nos silos.",
    "silos:soja": "A soja vai para a indústria, onde vira óleo e farelo.",
    "silos:trigo": "O trigo vai para o moinho, onde vira farinha.",
    "silos:milho": "Parte do milho segue para exportação. Qual parada leva ao navio?",
    industria: "Os produtos prontos seguem para o centro de distribuição.",
    moinho: "A farinha pronta segue para o centro de distribuição.",
    distribuicao: "Do centro de distribuição, direto para o mercado.",
  },
  arrive: {
    recebimento: "Carga conferida e classificada no recebimento.",
    silos: "Grão bem guardado nos silos.",
    industria: "Na indústria, a soja vira óleo e farelo.",
    moinho: "No moinho, o trigo vira farinha.",
    distribuicao: "Centro de distribuição: produtos prontos para viajar.",
    mercado: "Chegou ao mercado! Da lavoura até a mesa das pessoas.",
    porto: "Embarque no porto: o milho segue para outros países.",
  },
  lines: {
    start: ["a", "Primeira carga saindo da lavoura. Para onde ela vai?"],
    wrong: ["t", "Essa parada ainda não. {hint}"],
    route: ["a", "Rota completa! Próxima carga!"],
    lastLife: ["t", "Última vida. Pense no caminho com calma."],
  },
  end: {
    3: [["t", "Três rotas perfeitas! Você conhece a cadeia de ponta a ponta."], ["a", "Fim de tarde chegando... Vamos visitar o arquivo da Coamo!"]],
    2: [["t", "Rotas completas, com poucos desvios. Muito bem!"], ["a", "Agora vem uma pausa: o arquivo da Coamo tem muitas histórias."]],
    1: [["t", "Você entregou carga ao destino. Com prática, as rotas ficam naturais."], ["a", "Próxima parada: o arquivo da Coamo!"]],
    0: [["t", "As rotas ficaram pela metade desta vez."], ["a", "Lembra: soja na indústria, trigo no moinho, milho no porto!"]],
  },
  result: {
    titles: ["As cargas ficaram no caminho", "Carga entregue!", "Ótimas rotas!", "Logística perfeita!"],
    texts: [
      "Dica: soja vai para a indústria, trigo para o moinho e o milho segue pelo porto.",
      "Você entregou carga ao destino. Tente errar menos paradas para subir de nível.",
      "Três rotas completas com poucos desvios. Mais um pouco e chega às 3 estrelas.",
      "Rotas sem erro: da lavoura até o mercado e o porto!",
    ],
  },
};

const NAMES = {
  lavoura: "Lavoura", recebimento: "Recebimento", silos: "Silos", industria: "Indústria de óleo",
  moinho: "Moinho de trigo", distribuicao: "Distribuição", mercado: "Mercado", porto: "Porto",
};
const PIN = {
  lavoura: '<path d="M24 42V18M24 26c-6 0-10-4-10-10 6 0 10 4 10 10Zm0-4c6 0 10-4 10-10-6 0-10 4-10 10Z" fill="#7cc35a" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>',
  recebimento: '<path d="M8 30h22v-9H8Zm22-6h6l4 5v6h-4M8 35h32" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><circle cx="14" cy="36" r="3" fill="#fff"/><circle cx="34" cy="36" r="3" fill="#fff"/>',
  silos: '<path d="M10 40V18l6-6 6 6v22M26 40V18l6-6 6 6v22" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>',
  industria: '<path d="M8 40V24l8 5v-5l8 5v-5l8 5V10h6v30Z" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M35 8c2-3 6-3 7-6" stroke="#fff" stroke-width="2.5" fill="none"/>',
  moinho: '<path d="M14 40V14h20v26M14 22h20M14 30h20M24 6v8" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M18 10l12-4" stroke="#f6c731" stroke-width="3"/>',
  distribuicao: '<path d="M6 22l18-10 18 10v18H6Z" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M14 40V28h20v12" fill="none" stroke="#fff" stroke-width="3"/>',
  mercado: '<path d="M8 12h4l5 18h18l4-12H14" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><circle cx="19" cy="37" r="3" fill="#fff"/><circle cx="33" cy="37" r="3" fill="#fff"/>',
  porto: '<path d="M6 30h36l-5 9H11ZM14 30V20h12v10M30 30v-6h6v6" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M4 43c4 2 8 2 12 0s8-2 12 0 8 2 12 0" stroke="#7cc4ff" stroke-width="2.5" fill="none"/>',
};
const ROUTES = {
  soja: ["lavoura", "recebimento", "silos", "industria", "distribuicao", "mercado"],
  trigo: ["lavoura", "recebimento", "silos", "moinho", "distribuicao", "mercado"],
  milho: ["lavoura", "recebimento", "silos", "porto"],
};
const PNAME = { soja: "Soja", trigo: "Trigo", milho: "Milho" };
const TOTAL = 80, MAX_LIVES = 5;

/* ===================================================== cenário da região */
function buildRegion(W) {
  const { RB, CY, std, plateTexture, roundRect, TEX } = W.kit;
  const root = new THREE.Group(); root.name = "regiao";
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const add = (geo, m, x = 0, y = 0, z = 0, parent = root, shadow = true) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = shadow; me.receiveShadow = true; parent.add(me); return me; };
  const blue = std("blue"), blueDark = std("blueDark"), white = std("white"), steel = std("steel"), steelDark = std("steelDark"), glass = std("glass"), yellow = std("yellow");
  const wallM = new THREE.MeshStandardMaterial({ color: "#f2f3ef", roughness: .55, metalness: .2, normalMap: TEX.ribN });
  const roofM = new THREE.MeshStandardMaterial({ color: "#2266b3", roughness: .4, metalness: .45 });
  const concrete = std("concrete");
  const S = W.STATIONS;
  const pad = (k, w, d) => { const st = S[k]; add(new THREE.BoxGeometry(w, .3, d), concrete, st.x, .05, st.z, root, false); };
  const sign = (text, w = 10, h = 2.6, col = "#1d5fa8") => {
    const t = plateTexture((c, Wd, H) => {
      c.fillStyle = col; roundRect(c, 4, 4, Wd - 8, H - 8, 22); c.fill();
      c.fillStyle = "#fff"; c.font = "900 92px Montserrat, Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(text, Wd / 2, H / 2 + 4, Wd - 50);
    }, 768, 200);
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: .5 }));
  };
  const gable = (w, d, h, m) => { const sh = new THREE.Shape(); sh.moveTo(-d / 2 - .4, 0); sh.lineTo(0, h); sh.lineTo(d / 2 + .4, 0); sh.lineTo(-d / 2 - .4, 0); const g = new THREE.ExtrudeGeometry(sh, { depth: w + .8, bevelEnabled: false }); g.rotateY(Math.PI / 2); g.translate(-(w + .8) / 2, 0, 0); return new THREE.Mesh(g, m); };
  const building = (x, z, w, h, d, ry = 0, roofH = 2.4) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; root.add(g);
    add(RB(w, h, d, .3, 3), wallM, 0, h / 2, 0, g);
    add(RB(w + .1, h * .14, d + .1, .3, 3), blue, 0, h * .07, 0, g);
    const r = gable(w, d, roofH, roofM); r.position.y = h; r.castShadow = true; g.add(r);
    return g;
  };

  /* ---------- lavoura: talhão de soja, colheitadeira, trator e casa ---------- */
  {
    const st = S.lavoura;
    const tex = TEX.field.clone(); tex.needsUpdate = true; tex.repeat.set(1.6, 1.2);
    add(new THREE.BoxGeometry(60, .3, 44), new THREE.MeshStandardMaterial({ map: tex, normalMap: TEX.fieldN, roughness: .95 }), st.x, .12, st.z, root, false);
    const wtex = TEX.wheat.clone(); wtex.needsUpdate = true; wtex.repeat.set(.5, 1.2);
    add(new THREE.BoxGeometry(18, .32, 44), new THREE.MeshStandardMaterial({ map: wtex, roughness: .95 }), st.x + 39, .12, st.z, root, false);
    /* colheitadeira */
    const cb = new THREE.Group(); cb.position.set(st.x + 8, 0, st.z - 4); cb.rotation.y = -.4; root.add(cb);
    const cy = new THREE.MeshStandardMaterial({ color: "#f2b705", roughness: .35, metalness: .3 });
    add(RB(7, 3.4, 4, .4), cy, 0, 2.6, 0, cb);
    add(RB(2.6, 2.4, 3, .3), cy, 2.4, 5.2, 0, cb);
    add(RB(2.2, 1.6, 2.6, .2), glass, 2.6, 5.4, 0, cb);
    add(RB(1.4, 1.2, 8.6, .2), new THREE.MeshStandardMaterial({ color: "#d9a10a", roughness: .4, metalness: .3 }), 5, 1.1, 0, cb);
    const tube = add(CY(.35, .35, 6, 12), steel, -1, 5.4, 3.2, cb); tube.rotation.x = 1.2;
    for (const [x, r] of [[2.2, 1.4], [-2.4, .9]]) for (const z of [-2.1, 2.1]) { const w = add(CY(r, r, .9, 20), std("tire"), x, r, z, cb); w.rotation.x = Math.PI / 2; }
    /* trator com carreta de grãos */
    const tr = new THREE.Group(); tr.position.set(st.x - 10, 0, st.z + 6); tr.rotation.y = .3; root.add(tr);
    const red = new THREE.MeshStandardMaterial({ color: "#b8322a", roughness: .35, metalness: .3 });
    add(RB(3.4, 1.6, 2, .2), red, 0, 1.8, 0, tr); add(RB(1.8, 1.8, 1.8, .2), glass, -.6, 3.4, 0, tr);
    for (const [x, r] of [[-1, 1.1], [1.3, .7]]) for (const z of [-1.2, 1.2]) { const w = add(CY(r, r, .6, 18), std("tire"), x, r, z, tr); w.rotation.x = Math.PI / 2; }
    add(RB(5, 2, 2.6, .2), new THREE.MeshStandardMaterial({ color: "#1d5fa8", roughness: .4, metalness: .3 }), -5.2, 2, 0, tr);
    /* casa do cooperado */
    const h = new THREE.Group(); h.position.set(st.x - 22, 0, st.z - 26); root.add(h);
    add(RB(8, 3.6, 6, .25, 3), std("houseWall", { color: "#f4efe3", roughness: .8 }), 0, 1.8, 0, h);
    const hr = gable(8, 6, 2.4, std("houseRoof", { color: "#a2522f", roughness: .7 })); hr.position.y = 3.6; h.add(hr);
  }
  /* ---------- indústria de óleo: prédio, tanques, colunas e chaminé ---------- */
  const steamOrigins = [];
  {
    const st = S.industria; pad("industria", 44, 38);
    building(st.x - 6, st.z - 4, 18, 13, 14, 0, 3);
    for (let k = 0; k < 4; k++) add(CY(3, 3, 9, 32), std("tank", { color: "#eef1f2", roughness: .3, metalness: .6 }), st.x + 10, 4.5, st.z - 12 + k * 7.4);
    for (let k = 0; k < 4; k++) add(new THREE.ConeGeometry(3.05, 1.2, 32), std("tankTop", { color: "#d8dee1", roughness: .3, metalness: .6 }), st.x + 10, 9.6, st.z - 12 + k * 7.4);
    for (const z of [-10, -6]) add(CY(1.1, 1.1, 22, 18), std("column", { color: "#d1d7da", roughness: .35, metalness: .7 }), st.x - 18, 11, st.z + z);
    add(CY(1.3, 1.6, 28, 20), std("chimney", { color: "#e5e8e3", roughness: .6 }), st.x - 12, 14, st.z + 10);
    for (let k = 0; k < 3; k++) add(new THREE.TorusGeometry(1.45, .18, 8, 24), std("chimneyBand", { color: "#c43b2f", roughness: .5 }), st.x - 12, 22 + k * 2, st.z + 10).rotation.x = Math.PI / 2;
    steamOrigins.push(V(st.x - 12, 28.5, st.z + 10));
    const pipe = add(CY(.5, .5, 16, 12), steel, st.x + 2, 7, st.z - 1); pipe.rotation.z = Math.PI / 2;
    const sg = sign("INDÚSTRIA", 12, 3.1); sg.position.set(st.x - 6, 10.5, st.z + 3.06); root.add(sg);
  }
  /* ---------- moinho de trigo ---------- */
  {
    const st = S.moinho; pad("moinho", 36, 32);
    building(st.x - 4, st.z, 14, 26, 11, 0, 3);
    for (let y = 4; y < 25; y += 3.2) for (let x = -5; x <= 5; x += 2.5) add(new THREE.BoxGeometry(1.4, 1.6, .1), glass, st.x - 4 + x, y, st.z + 5.56, root, false);
    for (let k = 0; k < 3; k++) { add(CY(2.6, 2.6, 13, 28), std("silo2", { color: "#eef1f3", roughness: .32, metalness: .7 }), st.x + 9, 6.5, st.z - 8 + k * 6); add(new THREE.ConeGeometry(2.7, 1.6, 28), std("tankTop"), st.x + 9, 13.8, st.z - 8 + k * 6); }
    const sg = sign("MOINHO", 10, 2.6); sg.position.set(st.x - 4, 22, st.z + 5.62); root.add(sg);
  }
  /* ---------- centro de distribuição ---------- */
  const parked = [];
  {
    const st = S.distribuicao; pad("distribuicao", 50, 34);
    building(st.x, st.z - 6, 36, 9, 16, 0, 2.8);
    for (let k = 0; k < 6; k++) add(new THREE.BoxGeometry(3.6, 4.4, .2), std("dock", { color: "#c3c9cb", roughness: .35, metalness: .7, normalMap: TEX.corrugN }), st.x - 15 + k * 6, 2.4, st.z + 2.1);
    for (const k of [0, 2, 4]) { const t = W.buildTruck(["#ffffff", "#f2b400", "#1d5fa8"][k / 2]); t.rotation.y = -Math.PI / 2; t.position.set(st.x - 15 + k * 6, 0, st.z + 9.5); t.userData.dynamic = true; root.add(t); parked.push(t); }
    const sg = sign("DISTRIBUIÇÃO", 14, 2.8); sg.position.set(st.x, 7.4, st.z + 2.06); root.add(sg);
  }
  /* ---------- mercado e casinhas ---------- */
  {
    const st = S.mercado; pad("mercado", 46, 36);
    const g = new THREE.Group(); g.position.set(st.x, 0, st.z - 6); root.add(g);
    add(RB(24, 7, 14, .35, 3), std("marketWall", { color: "#fbf8f1", roughness: .7 }), 0, 3.5, 0, g);
    add(RB(24.4, .8, 14.4, .3, 3), blue, 0, 7.2, 0, g);
    add(new THREE.BoxGeometry(18, 3.6, .2), glass, 0, 2, 7.05, g);
    const aw = plateTexture((c, Wd, H) => { for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? "#ffffff" : "#1d5fa8"; c.fillRect(i * Wd / 16, 0, Wd / 16, H); } }, 512, 64);
    const awn = add(new THREE.BoxGeometry(22, .2, 3), new THREE.MeshStandardMaterial({ map: aw, roughness: .7 }), 0, 4.6, 8.4, g); awn.rotation.x = .28;
    const sg = sign("MERCADO", 12, 3, "#e0742a"); sg.position.set(0, 9.6, 7.1); g.add(sg);
    add(RB(12.4, 3.4, .3, .12), std("signBack", { color: "#ffffff" }), 0, 9.6, 6.9, g);
    const carCols = ["#c0392b", "#2c3e50", "#ecf0f1", "#2980b9", "#7f8c8d"];
    for (let k = 0; k < 5; k++) { const c = add(RB(2, 1.2, 4, .35), std("car" + k, { color: carCols[k], roughness: .3, metalness: .5 }), st.x - 12 + k * 5.5, .8, st.z + 12); add(RB(1.7, .8, 2.2, .3), glass, st.x - 12 + k * 5.5, 1.7, st.z + 11.8); }
    for (let k = 0; k < 4; k++) {
      const hx = st.x - 34 + (k % 2) * 10, hz = st.z - 20 + Math.floor(k / 2) * 12;
      add(RB(6, 3.4, 6, .25, 3), std("houseWall"), hx, 1.7, hz);
      const hr = gable(6, 6, 2, std("houseRoof")); hr.position.set(hx, 3.4, hz); root.add(hr);
    }
  }
  /* ---------- porto: mar, píer, carregador e navio graneleiro ---------- */
  let water = null;
  {
    const st = S.porto; pad("porto", 34, 34);
    const wn = W.kit.pixels(256, 256, (i, j) => { const n = W.kit.noise(i / 18, j / 18) * .6 + W.kit.noise(i / 6 + 9, j / 6) * .4; return [40, 110, 160, n]; });
    const wnT = new THREE.CanvasTexture(W.kit.normalFromHeight(wn.H, 256, 256, 3)); wnT.wrapS = wnT.wrapT = THREE.RepeatWrapping; wnT.repeat.set(40, 40);
    water = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshStandardMaterial({ color: "#2a6f9f", roughness: .12, metalness: .25, normalMap: wnT, normalScale: new THREE.Vector2(.6, .6) }));
    water.rotation.x = -Math.PI / 2; water.position.set(W.SEA.x0 + 600, -.6, W.SEA.z0 + 600); water.receiveShadow = true; water.userData.dynamic = true; root.add(water);
    add(new THREE.BoxGeometry(60, 1.4, 9), std("pier", { color: "#cfccc2", roughness: .9 }), W.SEA.x0 + 20, .3, st.z + 2, root);
    for (let x = W.SEA.x0; x < W.SEA.x0 + 50; x += 6) add(CY(.5, .5, 4, 10), std("pile", { color: "#8d8a80", roughness: .9 }), x, -1.4, st.z + 6.2);
    /* armazém do porto */
    building(st.x - 4, st.z - 6, 22, 8, 12, 0, 3);
    /* carregador de navios */
    const gx = W.SEA.x0 + 26;
    for (const z of [-2, 2.5]) add(new THREE.BoxGeometry(1, 12, 1), yellow, gx, 6.8, st.z + z);
    add(new THREE.BoxGeometry(1.4, 1.4, 16), yellow, gx, 12.8, st.z + 6);
    const boom = add(new THREE.BoxGeometry(1.1, 1.1, 14), steel, gx, 11.5, st.z + 15); boom.rotation.x = .25;
    const conv = add(new THREE.BoxGeometry(1.2, 1, Math.hypot(gx - st.x - 4, 10)), steelDark, (gx + st.x) / 2, 8, st.z - 2); conv.lookAt(gx, 12, st.z);
    /* navio */
    const ship = new THREE.Group(); ship.position.set(W.SEA.x0 + 28, -.3, st.z + 19); ship.userData.dynamic = true; root.add(ship);
    const hs = new THREE.Shape(); hs.moveTo(-24, -4.6); hs.lineTo(20, -4.6); hs.quadraticCurveTo(27, -4.6, 29, 0); hs.quadraticCurveTo(27, 4.6, 20, 4.6); hs.lineTo(-24, 4.6); hs.lineTo(-24, -4.6);
    const hull = new THREE.ExtrudeGeometry(hs, { depth: 5, bevelEnabled: true, bevelThickness: .4, bevelSize: .4, bevelSegments: 2 }); hull.rotateX(-Math.PI / 2); hull.translate(0, -2, 0);
    add(hull, new THREE.MeshStandardMaterial({ color: "#8f2c24", roughness: .5, metalness: .2 }), 0, 0, 0, ship);
    add(RB(52, .8, 9.6, .3, 3), std("deck", { color: "#3d4a52", roughness: .7 }), 1, 3.4, 0, ship);
    for (let k = 0; k < 5; k++) add(RB(5.6, 1.2, 6.4, .2), new THREE.MeshStandardMaterial({ color: "#1d5fa8", roughness: .4, metalness: .3 }), -14 + k * 7.6, 4.3, 0, ship);
    add(RB(7, 7, 8.6, .3), white, -20, 7.4, 0, ship);
    add(RB(6, 1.6, 8.8, .2), glass, -20, 9.4, 0, ship);
    add(CY(.9, 1.1, 4, 14), std("funnel", { color: "#e0742a", roughness: .5 }), -22.5, 12.6, 0, ship);
    steamOrigins.push(V(W.SEA.x0 + 28 - 22.5, 14.5, st.z + 19));
    W.kit.mergeGroup(ship);
  }
  /* ---------- estradas ---------- */
  const asph = std("asphalt");
  const routeLines = {};
  const lineMat = new THREE.MeshBasicMaterial({ color: "#ffd84a", transparent: true, opacity: .95, toneMapped: false });
  W.ROADS.forEach(([a, b]) => {
    const A = S[a], B = S[b], dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz), ang = Math.atan2(dx, dz);
    const road = add(new THREE.BoxGeometry(5, .16, L), asph, (A.x + B.x) / 2, .04, (A.z + B.z) / 2, root, false); road.rotation.y = ang;
    for (let t = 6; t < L - 6; t += 7) { const d = add(new THREE.BoxGeometry(.3, .05, 3), std("paintY"), A.x + dx * t / L, .14, A.z + dz * t / L, root, false); d.rotation.y = ang; }
    const glow = new THREE.Mesh(new THREE.BoxGeometry(1.4, .1, L), lineMat.clone()); glow.position.set((A.x + B.x) / 2, .26, (A.z + B.z) / 2); glow.rotation.y = ang;
    glow.visible = false; glow.userData.dynamic = true; root.add(glow);
    routeLines[a + ">" + b] = routeLines[b + ">" + a] = glow;
  });
  /* ---------- fumaça (indústria e navio) ---------- */
  const steam = [];
  const puffTex = TEX.clouds[0];
  steamOrigins.forEach((o, si) => {
    for (let k = 0; k < 7; k++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false, opacity: .6, color: si ? "#9aa0a6" : "#ffffff" }));
      sp.userData = { o, t: k / 7 }; sp.userData.dynamic = true; root.add(sp); steam.push(sp);
    }
  });
  /* ---------- junta peças fixas (menos chamadas de desenho) ---------- */
  root.updateMatrixWorld(true);
  const groups = new Map(), victims = [];
  root.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh) return;
    for (let p = o; p; p = p.parent) if (p.userData && p.userData.dynamic) return;
    const m = o.material; if (!m || Array.isArray(m) || m.transparent) return;
    const key = m.uuid + (o.castShadow ? "s" : "n");
    let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const a of Object.keys(geo.attributes)) if (!["position", "normal", "uv"].includes(a)) geo.deleteAttribute(a);
    if (!geo.attributes.uv) geo.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    geo.clearGroups(); geo.applyMatrix4(o.matrixWorld);
    if (!groups.has(key)) groups.set(key, { m, cast: o.castShadow, geos: [] });
    groups.get(key).geos.push(geo); victims.push(o);
  });
  victims.forEach(o => o.parent.remove(o));
  groups.forEach(g => { const me = new THREE.Mesh(mergeGeometries(g.geos), g.m); me.castShadow = g.cast; me.receiveShadow = true; me.matrixAutoUpdate = false; root.add(me); });
  W.scene.add(root);
  return {
    root, routeLines, steam, water,
    update(dt, time) {
      steam.forEach(sp => {
        const u = sp.userData; u.t = (u.t + dt * .12) % 1;
        sp.position.set(u.o.x + u.t * 6, u.o.y + u.t * 16, u.o.z - u.t * 3);
        const s = 3 + u.t * 9; sp.scale.set(s, s * .6, 1); sp.material.opacity = .55 * (1 - u.t);
      });
      if (water) water.material.normalMap.offset.set(time * .004, time * .006);
    },
  };
}

/* ===================================================== jogo */
export function createCh3(ctx) {
  const { W, camera, canvas, hud, Cast, Sound, buzz, banner, floater, flash, toScreen } = ctx;
  const region = buildRegion(W);
  const $ = s => document.querySelector(s);
  /* etiquetas das estações */
  const box = document.createElement("div"); box.className = "jr-stations"; box.hidden = true; document.body.appendChild(box);
  const labels = {};
  Object.keys(W.STATIONS).forEach(k => {
    const el = document.createElement("button"); el.type = "button"; el.className = "jr-station"; el.dataset.st = k;
    el.innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true">${PIN[k]}</svg><span>${NAMES[k]}</span>`;
    el.addEventListener("click", e => { e.stopPropagation(); pick(k); });
    box.appendChild(el); labels[k] = el;
  });
  /* cartão da carga */
  const card = document.createElement("div"); card.className = "jr-mission"; card.hidden = true;
  card.innerHTML = `<span class="jr-mission__icon"></span><span class="jr-mission__txt"><small></small><strong></strong></span><ol class="jr-mission__dots"></ol><p class="jr-mission__ask">Para onde a carga vai agora?</p>`;
  document.body.appendChild(card);
  /* caminhão da rota */
  const truck = W.buildTruck("#ffffff"); truck.scale.setScalar(1.7); truck.visible = false; W.scene.add(truck);
  let S = null;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();

  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function reset() {
    S = { running: false, t: 0, score: 0, lives: MAX_LIVES, combo: 0, best: 0, errors: 0, correct: 0, routesDone: 0,
      order: ["soja", ...shuffle(["trigo", "milho"])], cargo: 0, step: 0, moving: null, askT: 0, done: null, said: {} };
    Object.values(region.routeLines).forEach(l => { l.visible = false; });
    Object.values(labels).forEach(l => l.classList.remove("is-current", "is-done", "is-bad", "is-next"));
    hud.setScore(0); hud.setLives(MAX_LIVES, MAX_LIVES); hud.setCombo(0); hud.setTime(TOTAL, TOTAL);
    placeTruck("lavoura", "recebimento");
    paintCard();
  }
  const product = () => S.order[S.cargo];
  const route = () => ROUTES[product()];
  const at = () => route()[S.step];
  function placeTruck(k, toward) {
    const A = W.STATIONS[k], B = W.STATIONS[toward || k];
    truck.position.set(A.x + 6, 0, A.z - 4); truck.rotation.y = Math.atan2(-(B.z - A.z), B.x - A.x);
    truck.visible = true;
    const h = truck.userData.heap; if (h) { h.material = h.material.clone(); h.material.color.set({ soja: "#dcb661", milho: "#f2a71b", trigo: "#c98f3c" }[product()]); }
  }
  function paintCard() {
    if (!S) return;
    const p = product(), r = route();
    card.querySelector(".jr-mission__icon").innerHTML = ICONS[p];
    card.querySelector("small").textContent = `CARGA ${S.cargo + 1} DE 3`;
    card.querySelector("strong").textContent = PNAME[p];
    card.querySelector(".jr-mission__dots").innerHTML = r.map((k, i) => `<li class="${i < S.step ? "is-done" : i === S.step ? "is-here" : ""}" title="${NAMES[k]}">${i <= S.step ? NAMES[k] : ""}</li>`).join("");
    Object.entries(labels).forEach(([k, el]) => { el.classList.toggle("is-current", k === at()); el.classList.toggle("is-done", r.indexOf(k) > -1 && r.indexOf(k) < S.step); });
  }
  function pick(k) {
    if (!S || !S.running || S.moving) return;
    const r = route(), cur = at(), next = r[S.step + 1];
    if (k === cur) return;
    const p = toScreen(new THREE.Vector3(W.STATIONS[k].x, 24, W.STATIONS[k].z));
    if (k !== next) {
      S.errors++; S.lives--; S.combo = 0;
      hud.setLives(S.lives, MAX_LIVES); hud.setCombo(0);
      const el = labels[k]; el.classList.remove("is-bad"); void el.offsetWidth; el.classList.add("is-bad");
      floater(p.x, p.y, "Ainda não", "is-bad");
      const hint = STORY3.hints[cur === "silos" ? "silos:" + product() : cur] || "";
      hud.say("t", STORY3.lines.wrong[1].replace("{hint}", hint), 4200);
      Cast.act("t", "think"); Sound.fx("error"); buzz([40, 40, 40]); flash();
      if (S.lives === 1 && !S.said.last) { S.said.last = 1; setTimeout(() => S && S.running && hud.say(...STORY3.lines.lastLife), 1800); }
      if (S.lives <= 0) finish(false);
      return;
    }
    S.correct++; S.combo++; S.best = Math.max(S.best, S.combo);
    const gain = 150 + Math.max(0, Math.round(100 - S.askT * 14)) + Math.min(S.combo, 10) * 20;
    S.score += gain; hud.setScore(S.score); hud.setCombo(S.combo);
    floater(p.x, p.y, "+" + gain, S.combo >= 5 ? "is-gold" : "");
    Sound.fx("whoosh"); buzz(15);
    const line = region.routeLines[cur + ">" + k];
    if (line) { line.visible = true; line.material.color.set({ soja: "#ffd84a", trigo: "#ffb35a", milho: "#7cd6ff" }[product()]); }
    const A = W.STATIONS[cur], B = W.STATIONS[k];
    S.moving = { from: new THREE.Vector3(A.x, 0, A.z), to: new THREE.Vector3(B.x, 0, B.z), t: 0, dur: Math.min(1.6, .5 + Math.hypot(B.x - A.x, B.z - A.z) / 120), k };
    truck.rotation.y = Math.atan2(-(B.z - A.z), B.x - A.x);
  }
  function arrive(k) {
    S.step++; S.askT = 0;
    Sound.fx("success");
    const msg = STORY3.arrive[k]; if (msg) hud.say(k === "porto" || k === "mercado" ? "a" : "t", msg, 3000);
    if (S.step >= route().length - 1) {
      S.routesDone++;
      S.score += 400; hud.setScore(S.score);
      banner(`Rota da ${PNAME[product()].toLowerCase()} completa!`, `CARGA ${S.cargo + 1} DE 3`);
      Sound.fx("combo"); Cast.act("a", "celebrate"); Cast.act("t", "celebrate");
      if (S.cargo >= 2) { setTimeout(() => finish(true), 1200); paintCard(); return; }
      S.pause = 1.6;
      setTimeout(() => {
        if (!S || !S.running) return;
        S.cargo++; S.step = 0;
        Object.values(region.routeLines).forEach(l => { l.visible = false; });
        Object.values(labels).forEach(l => l.classList.remove("is-done"));
        placeTruck("lavoura", "recebimento"); paintCard();
        hud.say("a", `Nova carga: ${PNAME[product()]}! Saindo da lavoura.`, 3000);
      }, 1500);
    }
    paintCard();
  }
  function pointer(e) {
    if (!S || !S.running) return;
    const r = canvas.getBoundingClientRect();
    /* toque perto de uma estação (pela tela) */
    let best = null, bd = 90;
    Object.keys(W.STATIONS).forEach(k => { const st = W.STATIONS[k], p = toScreen(new THREE.Vector3(st.x, 4, st.z)); const d = Math.hypot(p.x - e.clientX, p.y - e.clientY); if (d < bd) { bd = d; best = k; } });
    if (best) pick(best);
  }
  canvas.addEventListener("pointerdown", pointer);

  function placeLabels() {
    const show = !!(S && (S.running || S.showLabels));
    box.hidden = !show; card.hidden = !show;
    if (!show) return;
    Object.entries(labels).forEach(([k, el]) => {
      const st = W.STATIONS[k], p = toScreen(new THREE.Vector3(st.x, k === "silos" ? 22 : k === "moinho" ? 32 : 18, st.z));
      el.style.left = p.x + "px"; el.style.top = p.y + "px";
    });
  }
  function update(dt, time) {
    region.update(dt, time);
    placeLabels();
    if (!S || !S.running) return;
    S.t += dt; S.askT += dt;
    const left = TOTAL - S.t; hud.setTime(left, TOTAL);
    if (S.moving) {
      const m = S.moving; m.t += dt / m.dur; const k = Math.min(1, m.t), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      truck.position.lerpVectors(m.from, m.to, e);
      truck.userData.wheels.forEach(w => { w.rotation.z -= dt * 12; });
      if (k >= 1) { S.moving = null; arrive(m.k); }
    }
    if (left <= 0) finish(false);
  }
  function finish(all) {
    if (!S.running) return;
    S.running = false; S.moving = null;
    if (all) S.score += Math.max(0, Math.round((TOTAL - S.t) * 10));
    let stars = 0;
    if (S.routesDone >= 3) stars = S.errors <= 1 ? 3 : S.errors <= 3 ? 2 : 1;
    else if (S.routesDone >= 1) stars = 1;
    const att = S.correct + S.errors;
    S.done && S.done({ score: Math.round(S.score), stars, routes: S.routesDone, correct: S.correct, errors: S.errors, accuracy: att ? Math.round(S.correct / att * 100) : 0, best: S.best, seconds: Math.round(Math.min(S.t, TOTAL)) });
  }
  return {
    reset, update,
    start() { return new Promise(res => { S.done = res; S.running = true; hud.say(...STORY3.lines.start); }); },
    get running() { return !!(S && S.running); },
    clear() { if (S) { S.running = false; S.showLabels = false; } box.hidden = true; card.hidden = true; truck.visible = false; },
    showLabels(on) { if (S) S.showLabels = on; },
    _state: () => S,
    _next: () => (S ? route()[S.step + 1] : null),
    _pick: k => pick(k),
  };
}
