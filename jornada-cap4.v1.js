/* =========================================================
   COAMO GAMES — JORNADA DA SAFRA · CAPÍTULO 4 (v1)
   "O arquivo da Coamo": jogo da memória em 3D, numa mesa de
   madeira ao pôr do sol, com varal de lâmpadas. Cada par
   encontrado vai para a caixa do arquivo e revela uma curiosidade.
   ========================================================= */
import * as THREE from "three";

export const STORY4 = {
  intro: [
    { who: "n", shot: "tableWide", text: "Fim de tarde. O sol se põe atrás das lavouras." },
    { who: "a", shot: "tableStage", act: "wave", text: "Hora de abrir o arquivo da Coamo! Cada par de cartas guarda uma história." },
    { who: "t", shot: "tableStage", act: "talk", text: "Olhe bem no começo: as cartas aparecem por um instante. Depois, é memória!" },
  ],
  kicker: "CAPÍTULO 4 · MEMÓRIA",
  title: "O arquivo da Coamo",
  goal: "Encontre os 8 pares e descubra curiosidades sobre a Coamo.",
  how: "Toque em duas cartas. Se formarem par, elas vão para o arquivo. Quanto menos jogadas e mais rápido, mais pontos.",
  lines: {
    start: ["t", "Memorizou? Agora encontre os pares!"],
    miss: [["a", "Quase! Guarde onde elas estão."], ["t", "Essa não era. Agora você já sabe onde ela fica."], ["a", "Ops! Tenta lembrar das cartas que já viu."]],
    streak: ["a", "Pares seguidos! Que memória!"],
    half: ["t", "Metade do arquivo organizado!"],
    last: ["a", "Falta só um par!"],
    time: ["t", "Últimos segundos!"],
  },
  end: {
    3: [["t", "Memória de arquivista! Você conhece a Coamo de verdade."], ["a", "Já está escurecendo... Tem uma última surpresa esperando por você!"]],
    2: [["t", "Arquivo organizado! Muito bem."], ["a", "Agora a última parada: descobrir onde você brilha!"]],
    1: [["t", "Todos os pares encontrados. Com menos jogadas, vêm mais estrelas."], ["a", "Bora para a última parada!"]],
    0: [["t", "O arquivo ficou pela metade desta vez."], ["a", "Tente de novo: olhe bem as cartas no começo!"]],
  },
  result: {
    titles: ["O tempo acabou", "Arquivo organizado!", "Ótima memória!", "Memória de arquivista!"],
    texts: [
      "Dica: aproveite os segundos em que as cartas aparecem no começo.",
      "Todos os pares encontrados. Tente usar menos jogadas para subir de nível.",
      "Poucas jogadas e boas descobertas. Mais um pouco e chega às 3 estrelas.",
      "Quase sem errar: você conhece a Coamo de verdade!",
    ],
  },
};

const PAIRS = [
  { id: "u", a: { logo: "assets/logo_unicoamo_v12.webp", label: "Unicoamo" }, fact: "A Unicoamo conecta conhecimento técnico, prática, cultura e liderança para desenvolver as pessoas." },
  { id: "f", a: { logo: "assets/logo_fups_v11.webp", label: "FUPS" }, fact: "O FUPS é um plano de saúde de autogestão criado em 1993 para os funcionários do grupo Coamo." },
  { id: "s", a: { logo: "assets/logo_coamo_saude_v11.webp", label: "Coamo + Saúde" }, fact: "O Coamo + Saúde oferece atendimento digital, prático e acessível, para funcionários e aprendizes." },
  { id: "r", a: { logo: "assets/logo_arcam_v11.webp", label: "ARCAM" }, fact: "A ARCAM promove esporte, cultura, saúde e lazer para os funcionários." },
  { id: "func", a: { photo: "assets/industria_05.jpg", title: "+12 mil" }, b: { photo: "assets/industria_05.jpg", title: "funcionários" }, fact: "Mais de 12 mil funcionários fazem a Coamo acontecer todos os dias." },
  { id: "coop", a: { photo: "assets/img_cultura.jpg", title: "+32 mil" }, b: { photo: "assets/img_cultura.jpg", title: "cooperados" }, fact: "São mais de 32 mil cooperados, do campo até a indústria." },
  { id: "pr", a: { photo: "assets/estruturas/estrutura_campo_mourao_aerea.jpg", title: "A maior empresa", sub: "do Paraná" }, fact: "A Coamo é a maior empresa do Paraná." },
  { id: "latam", a: { photo: "assets/estruturas/estrutura_terminal_paranagua.jpg", title: "Maior cooperativa", sub: "agrícola da América Latina" }, fact: "A Coamo é a maior cooperativa agrícola da América Latina." },
];
const TOTAL = 90;

function loadImg(src) { return new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }); }

function buildTable(W) {
  const { RB, CY, std, TEX, makeCanvas, pixels, normalFromHeight, noise } = W.kit;
  const root = new THREE.Group(); root.name = "mesa";
  const add = (geo, m, x = 0, y = 0, z = 0, parent = root, shadow = true) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = shadow; me.receiveShadow = true; parent.add(me); return me; };
  /* madeira */
  const wood = pixels(512, 512, (i, j) => {
    const n = noise(i / 90, j / 9) * .7 + noise(i / 30, j / 3) * .3, ring = Math.sin((j / 512 * 40 + n * 6) * Math.PI) * .5 + .5;
    const r = 150 + ring * 40 + n * 30, g = 98 + ring * 26 + n * 18, b = 58 + ring * 14 + n * 8;
    const plank = j % 128 < 3 ? 1 : 0;
    return [r - plank * 60, g - plank * 45, b - plank * 30, ring * .4 + n * .4 - plank];
  });
  const woodT = new THREE.CanvasTexture(wood.c); woodT.colorSpace = THREE.SRGBColorSpace; woodT.wrapS = woodT.wrapT = THREE.RepeatWrapping; woodT.anisotropy = 8;
  const woodN = new THREE.CanvasTexture(normalFromHeight(wood.H, 512, 512, 2)); woodN.wrapS = woodN.wrapT = THREE.RepeatWrapping;
  const woodM = new THREE.MeshStandardMaterial({ map: woodT, normalMap: woodN, roughness: .55, metalness: 0 });
  const P = W.TABLE;
  const g = new THREE.Group(); g.position.set(P.x, 0, P.z); g.rotation.y = -Math.PI / 2; root.add(g);
  /* deque de madeira */
  const deckT = woodT.clone(); deckT.needsUpdate = true; deckT.repeat.set(3, 3);
  add(new THREE.BoxGeometry(26, .3, 24), new THREE.MeshStandardMaterial({ map: deckT, normalMap: woodN, roughness: .7, color: "#c9a27c" }), 0, .15, 0, g, false);
  /* mesa */
  add(RB(13, .5, 15.6, .12, 3), woodM, 0, 3.2, 0, g);
  for (const [x, z] of [[-5.8, -7], [5.8, -7], [-5.8, 7], [5.8, 7]]) add(RB(.5, 3, .5, .08), woodM, x, 1.5, z, g);
  /* tecido verde no centro (feltro) */
  const felt = add(RB(11.6, .06, 14.2, .03), new THREE.MeshStandardMaterial({ color: "#1d4f8f", roughness: .95 }), 0, 3.48, 0, g, false);
  /* caixa do arquivo */
  const crate = new THREE.Group(); crate.position.set(7.8, .3, 5.4); g.add(crate);
  const cw = new THREE.MeshStandardMaterial({ map: woodT, color: "#d9b38a", roughness: .6 });
  add(RB(3.2, .2, 3.6, .04), cw, 0, .1, 0, crate);
  for (const [x, z, w, d] of [[0, 1.7, 3.2, .2], [0, -1.7, 3.2, .2], [1.5, 0, .2, 3.6], [-1.5, 0, .2, 3.6]]) add(RB(w, 1.8, d, .04), cw, x, 1, z, crate);
  /* banquinhos e vasos */
  for (const [x, z] of [[-8.4, -3], [-8.4, 4]]) { add(CY(1, 1, .3, 20), woodM, x, 1.9, z, g); add(CY(.15, .15, 1.8, 8), woodM, x, .9, z, g); }
  for (const [x, z] of [[11, -10], [-11, -10], [11, 10.5]]) {
    add(CY(.9, .7, 1.3, 16), std("vase", { color: "#c96a3e", roughness: .7 }), x, .95, z, g);
    const b = add(new THREE.IcosahedronGeometry(1.3, 1), new THREE.MeshStandardMaterial({ color: "#4f8f3d", roughness: .9, flatShading: true }), x, 2.4, z, g);
  }
  /* varal de lâmpadas */
  const bulbs = [];
  const posts = [[-12, -11], [12, -11], [12, 11], [-12, 11]];
  posts.forEach(([x, z]) => add(CY(.14, .18, 9, 10), std("post", { color: "#3b3027", roughness: .8 }), x, 4.5, z, g));
  const bulbM = new THREE.MeshStandardMaterial({ color: "#fff3cf", emissive: "#ffcf7a", emissiveIntensity: 3.2, roughness: .3 });
  const wireM = new THREE.LineBasicMaterial({ color: "#2a2520" });
  for (let k = 0; k < 4; k++) {
    const A = posts[k], B = posts[(k + 1) % 4], pts = [];
    for (let i = 0; i <= 20; i++) { const t = i / 20, sag = Math.sin(t * Math.PI) * 1.4; pts.push(new THREE.Vector3(A[0] + (B[0] - A[0]) * t, 8.8 - sag, A[1] + (B[1] - A[1]) * t)); }
    const wire = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireM); g.add(wire);
    for (let i = 1; i < 20; i += 2) { const b = add(new THREE.SphereGeometry(.17, 10, 8), bulbM, pts[i].x, pts[i].y - .25, pts[i].z, g, false); bulbs.push(b); }
  }
  const glow = new THREE.PointLight("#ffc779", 0, 34, 1.6); glow.position.set(0, 8, 0); g.add(glow);
  W.scene.add(root);
  root.visible = false;
  return { root, table: g, top: 3.52, crate: crate.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 1.4, 0)), glow, bulbs };
}

export function createCh4(ctx) {
  const { W, camera, canvas, hud, Cast, Sound, buzz, banner, floater, flash, toScreen } = ctx;
  const T = buildTable(W);
  /* aviso de curiosidade */
  const fact = document.createElement("div"); fact.className = "jr-fact"; fact.hidden = true;
  fact.innerHTML = `<span class="jr-fact__img"></span><span class="jr-fact__txt"><small>CURIOSIDADE COAMO</small><p></p></span>`;
  document.body.appendChild(fact);
  let factT = 0;

  /* ---------- texturas das cartas ---------- */
  const CW = 2.1, CH = 2.8, GAP = .36;
  const backTex = (() => {
    const c = W.kit.makeCanvas(420, 560), x = c.getContext("2d");
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const draw = im => {
      const gr = x.createLinearGradient(0, 0, 420, 560); gr.addColorStop(0, "#2a74c6"); gr.addColorStop(1, "#123f78");
      x.fillStyle = gr; W.kit.roundRect(x, 0, 0, 420, 560, 34); x.fill();
      x.strokeStyle = "rgba(255,255,255,.85)"; x.lineWidth = 10; W.kit.roundRect(x, 18, 18, 384, 524, 24); x.stroke();
      x.strokeStyle = "rgba(255,255,255,.12)"; x.lineWidth = 2;
      for (let k = -560; k < 560; k += 28) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + 560, 560); x.stroke(); }
      if (im) { const w = 320, h = w * (im.height / im.width || .6); x.drawImage(im, 210 - w / 2, 280 - h / 2, w, h); }
      t.needsUpdate = true;
    };
    draw(null); loadImg("assets/coamo-games/logo-coamo-games-mini.svg").then(draw);
    return t;
  })();
  function faceTex(side) {
    const c = W.kit.makeCanvas(420, 560), x = c.getContext("2d");
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const draw = im => {
      x.clearRect(0, 0, 420, 560);
      x.fillStyle = "#ffffff"; W.kit.roundRect(x, 0, 0, 420, 560, 34); x.fill();
      if (side.logo) {
        if (im) { const s = Math.min(330 / im.width, 300 / im.height), w = im.width * s, h = im.height * s; x.drawImage(im, 210 - w / 2, 230 - h / 2, w, h); }
        x.fillStyle = "#0f3a23"; x.font = "900 44px Montserrat, Arial, sans-serif"; x.textAlign = "center"; x.fillText(side.label, 210, 500, 380);
      } else {
        x.save(); W.kit.roundRect(x, 16, 16, 388, 330, 24); x.clip();
        if (im) { const s = Math.max(388 / im.width, 330 / im.height), w = im.width * s, h = im.height * s; x.drawImage(im, 210 - w / 2, 181 - h / 2, w, h); }
        x.restore();
        x.fillStyle = "#0b4d2b"; x.textAlign = "center";
        x.font = `900 ${side.title.length > 10 ? 44 : 64}px Montserrat, Arial, sans-serif`; x.fillText(side.title, 210, side.sub ? 420 : 450, 390);
        if (side.sub) { x.font = "700 30px Montserrat, Arial, sans-serif"; x.fillStyle = "#3d6b52"; wrap(x, side.sub, 210, 470, 380, 36); }
      }
      x.strokeStyle = "#f6c731"; x.lineWidth = 10; W.kit.roundRect(x, 5, 5, 410, 550, 30); x.stroke();
      t.needsUpdate = true;
    };
    draw(null); loadImg(side.logo || side.photo).then(im => { draw(im); if (document.fonts) document.fonts.ready.then(() => draw(im)); });
    return t;
  }
  function wrap(x, text, cx, y, maxW, lh) {
    const words = text.split(" "); let line = "";
    for (const w of words) { const test = line ? line + " " + w : w; if (x.measureText(test).width > maxW && line) { x.fillText(line, cx, y); line = w; y += lh; } else line = test; }
    x.fillText(line, cx, y);
  }
  const faces = PAIRS.map(p => [faceTex(p.a), p.b ? faceTex(p.b) : null]);
  const cardGeo = new THREE.BoxGeometry(CW, .07, CH);
  const edgeM = new THREE.MeshStandardMaterial({ color: "#f3efe4", roughness: .5 });
  const backM = new THREE.MeshStandardMaterial({ map: backTex, roughness: .35, metalness: .05 });
  const planeGeo = new THREE.PlaneGeometry(CW - .02, CH - .02);
  const cards = [];
  for (let k = 0; k < 16; k++) {
    const g = new THREE.Group(); g.userData.dynamic = true;
    const body = new THREE.Mesh(cardGeo, edgeM); body.castShadow = true; body.receiveShadow = true; g.add(body);
    const back = new THREE.Mesh(planeGeo, backM); back.rotation.x = -Math.PI / 2; back.position.y = .04; g.add(back);
    const front = new THREE.Mesh(planeGeo, new THREE.MeshStandardMaterial({ roughness: .4 })); front.rotation.x = Math.PI / 2; front.rotation.z = Math.PI; front.position.y = -.04; g.add(front);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(CW + GAP, .6, CH + GAP), new THREE.MeshBasicMaterial({ visible: false })); hit.userData.card = k; g.add(hit);
    T.table.add(g);
    cards.push({ g, front, hit, k, pair: null, side: 0, state: "down", flip: 0, target: 0, home: new THREE.Vector3(), lift: 0, fly: null });
  }
  let S = null;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();

  function layout() {
    const order = [];
    PAIRS.forEach((p, i) => { order.push([i, 0], [i, 1]); });
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    cards.forEach((c, k) => {
      const [pi, side] = order[k]; c.pair = pi; c.side = side;
      c.front.material.map = faces[pi][side] || faces[pi][0]; c.front.material.needsUpdate = true;
      const col = k % 4, row = Math.floor(k / 4);
      c.home.set((col - 1.5) * (CW + GAP), T.top + .04, (row - 1.5) * (CH + GAP));
      c.g.position.copy(c.home); c.g.rotation.set(0, (Math.random() - .5) * .04, 0); c.g.scale.setScalar(1); c.g.visible = true;
      c.state = "down"; c.flip = 0; c.target = 0; c.fly = null; c.lift = 0;
    });
  }
  function reset() {
    S = { running: false, t: 0, score: 0, moves: 0, matches: 0, streak: 0, best: 0, open: [], lock: 0, done: null, said: {}, peek: 0 };
    layout();
    hud.setScore(0); hud.alt("JOGADAS", "0"); hud.setCombo(0); hud.setTime(TOTAL, TOTAL);
  }
  function showFact(p) {
    const side = p.a;
    fact.querySelector(".jr-fact__img").style.backgroundImage = `url("${side.logo || side.photo}")`;
    fact.querySelector(".jr-fact__img").classList.toggle("is-logo", !!side.logo);
    fact.querySelector("p").textContent = p.fact;
    fact.hidden = false; fact.classList.remove("is-in"); void fact.offsetWidth; fact.classList.add("is-in");
    factT = 4.2;
  }
  function open(c) {
    if (!S || !S.running || S.lock > 0 || S.peek > 0 || c.state !== "down" || S.open.length >= 2) return;
    c.state = "up"; c.target = 1; S.open.push(c);
    Sound.fx("select");
    if (S.open.length === 2) {
      S.moves++; hud.alt("JOGADAS", String(S.moves));
      const [a, b] = S.open;
      if (a.pair === b.pair) {
        S.matches++; S.streak++; S.best = Math.max(S.best, S.streak);
        const gain = 200 + Math.min(S.streak - 1, 6) * 60;
        S.score += gain; hud.setScore(S.score); hud.setCombo(S.streak);
        const p = toScreen(b.g.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 1, 0)));
        floater(p.x, p.y, "+" + gain, S.streak >= 3 ? "is-gold" : "");
        S.lock = .7;
        setTimeout(() => {
          Sound.fx("success"); buzz(18);
          [a, b].forEach((c2, i) => { c2.state = "gone"; c2.fly = { from: c2.g.position.clone(), t: -i * .12 }; });
          showFact(PAIRS[a.pair]);
          Cast.act(S.streak >= 2 ? "a" : "t", "celebrate");
          if (S.matches === 4 && !S.said.half) { S.said.half = 1; hud.say(...STORY4.lines.half); }
          else if (S.matches === 7) hud.say(...STORY4.lines.last);
          else if (S.streak >= 3 && !S.said.streak) { S.said.streak = 1; hud.say(...STORY4.lines.streak); }
          if (S.matches >= PAIRS.length) setTimeout(() => finish(true), 900);
        }, 450);
        S.open = [];
      } else {
        S.streak = 0; hud.setCombo(0); S.lock = 1.05;
        Sound.fx("error"); buzz([30, 30, 30]);
        const m = STORY4.lines.miss[Math.floor(Math.random() * STORY4.lines.miss.length)];
        if (S.moves % 2 === 0) hud.say(m[0], m[1], 2200);
        Cast.act("t", "oops");
        setTimeout(() => { a.state = "down"; a.target = 0; b.state = "down"; b.target = 0; S.open = []; }, 950);
      }
    }
  }
  function pointer(e) {
    if (!S || !S.running) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(cards.filter(c => c.state === "down").map(c => c.hit), false)[0];
    if (hit) open(cards[hit.object.userData.card]);
  }
  canvas.addEventListener("pointerdown", pointer);

  function update(dt, time) {
    if (factT > 0) { factT -= dt; if (factT <= 0) fact.hidden = true; }
    if (!T.root.visible) return;
    T.bulbs.forEach((b, i) => { b.material.emissiveIntensity = 2.6 + Math.sin(time * 2 + i) * .3; });
    cards.forEach(c => {
      if (c.fly) {
        c.fly.t += dt / .85; const k = Math.max(0, Math.min(1, c.fly.t));
        const to = T.table.worldToLocal(T.crate.clone());
        c.g.position.lerpVectors(c.fly.from, to, k * k * (3 - 2 * k)); c.g.position.y += Math.sin(k * Math.PI) * 2.6;
        c.g.rotation.y += dt * 4; c.g.scale.setScalar(1 - k * .55);
        if (k >= 1) { c.fly = null; c.g.visible = false; }
        return;
      }
      const sp = c.state === "up" || c.flip > .01 && c.target === 0 ? 1 : 1;
      c.flip += (c.target - c.flip) * Math.min(1, dt * 9 * sp);
      c.g.rotation.z = c.flip * Math.PI;
      c.g.position.y = c.home.y + Math.sin(c.flip * Math.PI) * .9 + (c.state === "up" ? .02 : 0);
    });
    if (!S || !S.running) return;
    if (S.lock > 0) S.lock -= dt;
    if (S.peek > 0) {
      S.peek -= dt;
      if (S.peek <= 0) { cards.forEach(c => { c.target = 0; }); hud.say(...STORY4.lines.start); Sound.fx("go"); }
      return;
    }
    S.t += dt;
    const left = TOTAL - S.t; hud.setTime(left, TOTAL);
    if (left <= 12 && !S.said.time) { S.said.time = 1; hud.say(...STORY4.lines.time); }
    if (left <= 0) finish(false);
  }
  function finish(all) {
    if (!S.running) return;
    S.running = false;
    if (all) S.score += Math.max(0, Math.round((TOTAL - S.t) * 20)) + Math.max(0, (24 - S.moves) * 40);
    let stars = 0;
    if (all) stars = S.moves <= 13 ? 3 : S.moves <= 19 ? 2 : 1;
    else if (S.matches >= 5) stars = 1;
    S.done && S.done({ score: Math.round(S.score), stars, matches: S.matches, moves: S.moves, best: S.best, accuracy: S.moves ? Math.round(S.matches / S.moves * 100) : 0, seconds: Math.round(Math.min(S.t, TOTAL)) });
  }
  return {
    reset, update, table: T,
    start() {
      return new Promise(res => {
        S.done = res; S.running = true; S.peek = 2.4;
        cards.forEach((c, i) => { setTimeout(() => { c.target = 1; Sound.fx("tap"); }, i * 35); });
        banner("Memorize!", "AS CARTAS VÃO VIRAR");
      });
    },
    get running() { return !!(S && S.running); },
    clear() { if (S) S.running = false; T.root.visible = false; T.glow.intensity = 0; fact.hidden = true; },
    show(on) { T.root.visible = on; T.glow.intensity = on ? 60 : 0; },
    _state: () => S,
    _cards: () => cards.map(c => ({ k: c.k, pair: c.pair, state: c.state })),
    _open: k => open(cards[k]),
  };
}
