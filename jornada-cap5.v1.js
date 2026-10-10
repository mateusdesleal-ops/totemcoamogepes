/* =========================================================
   COAMO GAMES — JORNADA DA SAFRA · CAPÍTULO 5 (v1)
   "Onde você brilha": à noite, três painéis iluminados no pátio
   mostram as opções de cada pergunta. No fim, a área que mais
   combina com o visitante aparece no painel central, com fogos
   sobre os silos, e o visitante recebe o crachá da jornada.
   ========================================================= */
import * as THREE from "three";

export const STORY5 = {
  intro: [
    { who: "n", shot: "nightWide", text: "A noite chegou. As luzes da unidade se acendem." },
    { who: "t", shot: "nightStage", act: "talk", text: "Você passou pelo campo, pelos silos, pela indústria e pelo arquivo. Falta descobrir uma coisa..." },
    { who: "a", shot: "nightStage", act: "celebrate", text: "Onde VOCÊ brilha na Coamo! Responda com o coração: não existe resposta errada." },
  ],
  kicker: "CAPÍTULO 5 · FINAL",
  title: "Onde você brilha",
  goal: "Responda 6 perguntas e descubra a área da Coamo que mais combina com você.",
  how: "Toque no painel que mais combina com você. Aqui não tem certo ou errado: vale o seu jeito.",
  reactions: [["a", "Boa escolha!"], ["t", "Gostei! Isso diz muito sobre você."], ["a", "Anotado!"], ["t", "Interessante..."], ["a", "Hmm, já estou imaginando a sua área!"], ["t", "Última resposta!"]],
};

const AREAS = {
  campo: { title: "Campo & Cooperado", text: "Você tem afinidade com relacionamento, orientação e proximidade com a produção. Na Coamo, essa área conecta conhecimento técnico e cooperados.", photo: "assets/agro_01.jpg" },
  operacoes: { title: "Armazenagem & Operações", text: "Seu perfil combina com ambientes dinâmicos, processos e execução: recebimento, movimentação, conservação e expedição.", photo: "assets/vaga_fotos/ajudantes.jpg" },
  industria: { title: "Indústria & Produção", text: "Você se identifica com produção, qualidade, manutenção e eficiência. A indústria transforma matéria-prima em novos produtos.", photo: "assets/industria_01.jpg" },
  tecnologia: { title: "Tecnologia & Dados", text: "Seu perfil aponta para soluções digitais, análise e inovação. A tecnologia mantém uma grande operação conectada.", photo: "assets/vaga_fotos/outra_opcao_vaga_de_ti.jpg" },
  gestao: { title: "Gestão & Áreas Corporativas", text: "Você tem afinidade com planejamento, análise e organização. Essa estrutura sustenta as decisões do negócio.", photo: "assets/vaga_fotos/vagas_de_ti.jpg" },
  pessoas: { title: "Pessoas & Desenvolvimento", text: "Seu perfil combina com relações humanas, cuidado e desenvolvimento. Um universo importante para a cultura e o crescimento.", photo: "assets/img_carreira.jpg" },
};
const QUESTIONS = [
  { q: "Em qual ambiente você mais se imagina trabalhando?", o: [["Próximo ao campo e ao produtor", "campo", { campo: 3 }], ["Em uma operação dinâmica", "operacoes", { operacoes: 2, industria: 1 }], ["Com análise, gestão ou pessoas", "gestao", { gestao: 2, pessoas: 1 }]] },
  { q: "Qual atividade parece mais interessante?", o: [["Orientar e gerar relacionamento", "campo", { campo: 2, pessoas: 1 }], ["Resolver problemas com tecnologia", "tecnologia", { tecnologia: 3 }], ["Acompanhar produção e qualidade", "industria", { industria: 2, operacoes: 1 }]] },
  { q: "O que mais chama sua atenção em um trabalho?", o: [["Organização e ritmo da operação", "operacoes", { operacoes: 2, industria: 1 }], ["Aprender e desenvolver pessoas", "pessoas", { pessoas: 3 }], ["Planejamento e estratégia", "gestao", { gestao: 3 }]] },
  { q: "Qual frase combina mais com você?", o: [["Gosto de ver o resultado prático do que faço", "industria", { industria: 2, operacoes: 1 }], ["Gosto de conectar sistemas, dados e soluções", "tecnologia", { tecnologia: 3 }], ["Gosto de estar perto das pessoas", "pessoas", { pessoas: 2, campo: 1 }]] },
  { q: "Qual cenário desperta mais interesse?", o: [["Lavoura, produção e assistência", "campo", { campo: 3 }], ["Silos, recebimento e movimentação", "operacoes", { operacoes: 3 }], ["Projetos, números e decisões", "gestao", { gestao: 3 }]] },
  { q: "Escolha a área que mais desperta curiosidade.", o: [["Tecnologia e dados", "tecnologia", { tecnologia: 3 }], ["Indústria e processos", "industria", { industria: 3 }], ["Pessoas e desenvolvimento", "pessoas", { pessoas: 3 }]] },
];

function loadImg(src) { return new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }); }
const imgCache = {};
function img(src) { return imgCache[src] || (imgCache[src] = loadImg(src)); }

export function createCh5(ctx) {
  const { W, camera, canvas, hud, Cast, Sound, buzz, banner, floater, toScreen } = ctx;
  const { RB, CY, std, makeCanvas, roundRect } = W.kit;
  const STAGE = W.STAGE;
  const root = new THREE.Group(); root.visible = false; W.scene.add(root);
  const add = (geo, m, x = 0, y = 0, z = 0, parent = root, shadow = true) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = shadow; me.receiveShadow = true; parent.add(me); return me; };
  const PW = 4.4, PH = 6.6;

  /* ---------- palco: painéis, luzes, estrelas ---------- */
  const frameM = new THREE.MeshStandardMaterial({ color: "#f4f6f8", roughness: .3, metalness: .5 });
  const glowM = () => new THREE.MeshStandardMaterial({ color: "#1d5fa8", emissive: "#2f86ff", emissiveIntensity: 1.2, roughness: .4 });
  function panelTex() {
    const c = makeCanvas(512, 768), t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.canvas2 = c; return t;
  }
  async function paintPanel(t, label, photo, kicker) {
    const c = t.canvas2, x = c.getContext("2d");
    const im = photo ? await img(photo) : null;
    x.fillStyle = "#0b2a4a"; x.fillRect(0, 0, 512, 768);
    if (im) { x.save(); roundRect(x, 20, 20, 472, 470, 26); x.clip(); const s = Math.max(472 / im.width, 470 / im.height); x.drawImage(im, 256 - im.width * s / 2, 255 - im.height * s / 2, im.width * s, im.height * s); x.restore(); }
    const gr = x.createLinearGradient(0, 380, 0, 768); gr.addColorStop(0, "rgba(11,42,74,0)"); gr.addColorStop(.3, "#0b2a4a"); x.fillStyle = gr; x.fillRect(0, 380, 512, 388);
    if (kicker) { x.fillStyle = "#f6c731"; x.font = "800 26px Montserrat, Arial, sans-serif"; x.textAlign = "center"; x.fillText(kicker, 256, 548); }
    x.fillStyle = "#ffffff"; x.font = `900 ${label.length > 30 ? 40 : 46}px Montserrat, Arial, sans-serif`; x.textAlign = "center";
    const words = label.split(" "); let line = "", y = kicker ? 610 : 580; const lines = [];
    for (const w of words) { const test = line ? line + " " + w : w; if (x.measureText(test).width > 440 && line) { lines.push(line); line = w; } else line = test; }
    lines.push(line);
    lines.slice(0, 3).forEach((l, i) => x.fillText(l, 256, y + i * 54));
    t.needsUpdate = true;
  }
  const panels = [-1, 0, 1].map(i => {
    const g = new THREE.Group(); g.position.set(STAGE.x + i * (PW + 1.2), 0, STAGE.z); g.userData.dynamic = true; root.add(g);
    const flip = new THREE.Group(); flip.position.y = 1.4 + PH / 2; g.add(flip);
    add(RB(PW + .4, PH + .4, .35, .12), frameM, 0, 0, 0, flip);
    const tex = panelTex();
    const face = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshStandardMaterial({ map: tex, emissive: "#ffffff", emissiveMap: tex, emissiveIntensity: .55, roughness: .4 }));
    face.position.z = .19; flip.add(face);
    const strip = add(RB(PW + .5, .22, .4, .08), glowM(), 0, -PH / 2 - .35, 0, flip, false);
    add(CY(1.4, 1.6, .35, 24), std("standBase", { color: "#1d2a35", roughness: .5, metalness: .5 }), 0, .18, 0, g);
    add(RB(.5, 1.5, .5, .06), frameM, 0, .9, 0, g);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(PW + 1, PH + 2.4, 2), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 1.4 + PH / 2; hit.userData.panel = i + 1; g.add(hit);
    return { g, flip, face, tex, strip, hit, i: i + 1, rot: 0, rotTo: 0, y: 0, yTo: 0, sel: 0, fade: 1 };
  });
  /* grande painel da revelação */
  const big = (() => {
    const g = new THREE.Group(); g.position.set(STAGE.x, -12, STAGE.z - 2.5); g.userData.dynamic = true; root.add(g);
    add(RB(9, 10.4, .5, .2), frameM, 0, 7.4, 0, g);
    const tex = panelTex();
    const face = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 9.8), new THREE.MeshStandardMaterial({ map: tex, emissive: "#ffffff", emissiveMap: tex, emissiveIntensity: .6 }));
    face.position.set(0, 7.4, .26); g.add(face);
    add(RB(9.4, .36, .6, .1), new THREE.MeshStandardMaterial({ color: "#f6c731", emissive: "#f6c731", emissiveIntensity: 1.6 }), 0, 2.1, 0, g, false);
    return { g, tex, y: -12, yTo: -12 };
  })();
  /* luzes do palco e dos silos */
  const lights = [];
  const l1 = new THREE.PointLight("#bcd7ff", 0, 40, 1.4); l1.position.set(STAGE.x, 12, STAGE.z + 8); root.add(l1); lights.push([l1, 260]);
  const l2 = new THREE.PointLight("#ffd29a", 0, 30, 1.6); l2.position.set(STAGE.x - 9, 5, STAGE.z + 4); root.add(l2); lights.push([l2, 90]);
  const l3 = new THREE.PointLight("#ffd29a", 0, 30, 1.6); l3.position.set(STAGE.x + 9, 5, STAGE.z + 4); root.add(l3); lights.push([l3, 90]);
  const spot = new THREE.SpotLight("#d9e8ff", 0, 120, .45, .8, 1.4); spot.position.set(15, 1, 2); spot.target.position.set(15, 10, -24); root.add(spot, spot.target); lights.push([spot, 900]);
  /* estrelas */
  const stars = (() => {
    const N = 900, g = new THREE.BufferGeometry(), p = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const a = Math.random() * Math.PI * 2, e = .12 + Math.random() * 1.3, r = 700; p.set([Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r], i * 3); }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    const s = new THREE.Points(g, new THREE.PointsMaterial({ color: "#ffffff", size: 1.6, sizeAttenuation: false, transparent: true, opacity: .9, fog: false, depthWrite: false }));
    s.frustumCulled = false; s.visible = false; W.scene.add(s); return s;
  })();
  /* fogos de artifício */
  const fw = [];
  const sparkTex = (() => { const c = makeCanvas(64, 64), x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.3, "rgba(255,255,255,.8)"); gr.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const FWC = ["#f6c731", "#2f86ff", "#5be37a", "#ff6b5b", "#ffffff", "#c48bff"];
  function firework(at) {
    const N = 140, g = new THREE.BufferGeometry(), p = new Float32Array(N * 3), v = [];
    const col = FWC[Math.floor(Math.random() * FWC.length)], o = at || new THREE.Vector3(STAGE.x + (Math.random() - .5) * 60, 22 + Math.random() * 16, -30 - Math.random() * 20);
    for (let i = 0; i < N; i++) { p.set([o.x, o.y, o.z], i * 3); const d = new THREE.Vector3().randomDirection().multiplyScalar(9 + Math.random() * 6); v.push(d); }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    const m = new THREE.PointsMaterial({ map: sparkTex, color: col, size: 1.4, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false });
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; W.scene.add(pts);
    fw.push({ pts, v, t: 0, life: 2.2 }); Sound.fx("pop");
  }
  function updateFireworks(dt) {
    for (let k = fw.length - 1; k >= 0; k--) {
      const f = fw[k], a = f.pts.geometry.attributes.position; f.t += dt;
      for (let i = 0; i < f.v.length; i++) { const d = f.v[i]; d.y -= 6 * dt; d.multiplyScalar(1 - dt * 1.2); a.setXYZ(i, a.getX(i) + d.x * dt, a.getY(i) + d.y * dt, a.getZ(i) + d.z * dt); }
      a.needsUpdate = true; f.pts.material.opacity = Math.max(0, 1 - f.t / f.life);
      if (f.t >= f.life) { W.scene.remove(f.pts); f.pts.geometry.dispose(); f.pts.material.dispose(); fw.splice(k, 1); }
    }
  }

  /* ---------- DOM: pergunta e crachá ---------- */
  const qbox = document.createElement("div"); qbox.className = "jr-question"; qbox.hidden = true;
  qbox.innerHTML = `<small></small><h3></h3><ol class="jr-question__dots"></ol>`;
  document.body.appendChild(qbox);

  let S = null, fwT = 0;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function reset() {
    S = { running: false, step: 0, scores: {}, picks: [], lock: 0, done: null, revealing: false };
    big.yTo = -12; big.g.position.y = -12;
    panels.forEach(p => { p.rot = p.rotTo = 0; p.y = p.yTo = 0; p.sel = 0; });
    paintQuestion(true);
  }
  function paintQuestion(instant) {
    const q = QUESTIONS[S.step];
    qbox.querySelector("small").textContent = `PERGUNTA ${S.step + 1} DE ${QUESTIONS.length}`;
    qbox.querySelector("h3").textContent = q.q;
    qbox.querySelector(".jr-question__dots").innerHTML = QUESTIONS.map((_, i) => `<li class="${i < S.step ? "is-done" : i === S.step ? "is-here" : ""}"></li>`).join("");
    q.o.forEach((o, i) => paintPanel(panels[i].tex, o[0], AREAS[o[1]].photo));
    if (!instant) { qbox.classList.remove("is-in"); void qbox.offsetWidth; qbox.classList.add("is-in"); }
  }
  function choose(i) {
    if (!S || !S.running || S.lock > 0 || S.revealing) return;
    const q = QUESTIONS[S.step], o = q.o[i];
    Object.entries(o[2]).forEach(([k, v]) => { S.scores[k] = (S.scores[k] || 0) + v; });
    S.picks.push(o[1]);
    panels.forEach((p, j) => { p.sel = j === i ? 1 : -1; });
    Sound.fx("success"); buzz(15);
    const r = STORY5.reactions[S.step]; hud.say(r[0], r[1], 1800); Cast.act(r[0], "celebrate");
    S.lock = 1.3;
    setTimeout(() => {
      if (!S || !S.running) return;
      S.step++;
      if (S.step >= QUESTIONS.length) { reveal(); return; }
      panels.forEach(p => { p.rotTo += Math.PI * 2; p.sel = 0; });
      Sound.fx("whoosh");
      setTimeout(() => S && S.running && paintQuestion(), 260);
    }, 900);
  }
  function winner() {
    const order = Object.entries(S.scores).sort((a, b) => b[1] - a[1] || S.picks.lastIndexOf(b[0]) - S.picks.lastIndexOf(a[0]));
    return { first: order[0][0], second: order[1] ? order[1][0] : null, pts: order };
  }
  async function reveal() {
    S.revealing = true; qbox.hidden = true;
    const w = winner(), A = AREAS[w.first];
    panels.forEach(p => { p.yTo = -9; });
    await paintPanel(big.tex, A.title, A.photo, "VOCÊ BRILHA EM");
    big.yTo = 0;
    banner(A.title, "SUA ÁREA NA COAMO");
    Sound.fx("win");
    fwT = .2;
    setTimeout(() => {
      S.running = false;
      S.done && S.done({ score: 600, stars: 3, area: w.first, areaTitle: A.title, areaText: A.text, second: w.second ? AREAS[w.second].title : "", photo: A.photo, seconds: 0, accuracy: 100 });
    }, 2600);
  }
  function pointer(e) {
    if (!S || !S.running) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(panels.map(p => p.hit), false)[0];
    if (hit) choose(hit.object.userData.panel);
  }
  canvas.addEventListener("pointerdown", pointer);

  function update(dt, time) {
    updateFireworks(dt);
    if (fwT > 0) { fwT -= dt; if (fwT <= 0) { firework(); fwT = .35 + Math.random() * .7; if (!root.visible) fwT = 0; } }
    if (!root.visible) return;
    panels.forEach((p, i) => {
      p.rot += (p.rotTo - p.rot) * Math.min(1, dt * 5);
      p.flip.rotation.y = p.rot;
      const targetY = p.yTo + (p.sel > 0 ? .8 : p.sel < 0 ? -.6 : Math.sin(time * 1.4 + i) * .08);
      p.y += (targetY - p.y) * Math.min(1, dt * 5); p.g.position.y = p.y;
      p.strip.material.emissiveIntensity = p.sel > 0 ? 3.4 : 1 + Math.sin(time * 2 + i) * .25;
      p.strip.material.emissive.set(p.sel > 0 ? "#f6c731" : "#2f86ff");
      p.face.material.emissiveIntensity = p.sel < 0 ? .2 : .55;
    });
    big.y += (big.yTo - big.y) * Math.min(1, dt * 2.6); big.g.position.y = big.y;
    if (S) S.lock = Math.max(0, S.lock - dt);
  }
  function show(on) {
    W.setStorm(0); W.setNight(on ? 1 : 0);
    root.visible = on; stars.visible = on; qbox.hidden = !on || !(S && S.running);
    lights.forEach(([l, I]) => { l.intensity = on ? I : 0; });
    if (!on) fwT = 0;
  }
  return {
    reset, update, show,
    start() { return new Promise(res => { S.done = res; S.running = true; qbox.hidden = false; qbox.classList.add("is-in"); hud.say("t", "Primeira pergunta. Vale o seu jeito!", 2400); }); },
    get running() { return !!(S && S.running); },
    clear() { if (S) S.running = false; show(false); qbox.hidden = true; },
    celebrate(sec = 6) { fwT = .1; setTimeout(() => { fwT = 0; }, sec * 1000); },
    _state: () => S,
    _choose: i => choose(i),
    AREAS,
  };
}
