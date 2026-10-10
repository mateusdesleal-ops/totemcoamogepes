/* =========================================================
   COAMO GAMES — JORNADA DA SAFRA · CAPÍTULO 2 (v1)
   "Corrida contra a chuva": cada carga vai para o silo certo.
   A primeira carga define o produto do silo (depois é memória),
   o nível não pode estourar e o temporal chega no fim do minuto.
   Mesmas regras do "Silo em Equilíbrio", agora em 3D.
   ========================================================= */
import * as THREE from "three";
import { ICONS } from "./jornada-icones.v1.js";

export const STORY2 = {
  intro: [
    { who: "n", shot: "siloWide", text: "Meio-dia. Nuvens escuras começam a se juntar no horizonte." },
    { who: "t", shot: "siloStage", act: "think", text: "Previsão de temporal em um minuto! Toda a carga do pátio precisa estar nos silos antes da chuva." },
    { who: "a", shot: "siloStage", act: "wave", text: "A primeira carga que entra em cada silo define o produto dele. Depois é memória: não dá para misturar!" },
    { who: "t", shot: "siloStage", act: "talk", text: "E fique de olho na régua de nível: silo cheio demais não recebe carga." },
  ],
  kicker: "CAPÍTULO 2 · ARMAZENAGEM",
  title: "Corrida contra a chuva",
  goal: "Guarde cada carga no silo certo antes que o temporal chegue.",
  how: "Toque no silo para enviar a carga. A primeira carga define o produto do silo: memorize! Errar o produto ou estourar o nível custa uma vida.",
  lines: {
    start: ["a", "A primeira carga de cada silo define o produto. Memorize!"],
    assign: ["t", "Silo {s} agora é de {p}. Guarde na memória!"],
    wrongProduct: ["t", "Esse silo já é de outro produto! Não pode misturar."],
    capacity: ["a", "Não coube! Olhe a régua de nível antes de enviar."],
    timeout: ["a", "A carga ficou esperando demais no pátio."],
    combo5: ["a", "Que memória! Combo de 5!"],
    combo10: ["t", "Dez seguidas! Parece armazenista de carreira."],
    expedition: ["t", "A expedição liberou espaço no Silo {s}."],
    rain: ["a", "Começou a chuviscar! Últimos segundos, rápido!"],
    halfway: ["t", "As nuvens estão chegando. Mantenha o ritmo!"],
  },
  end: {
    3: [["t", "Tudo guardado antes da chuva! Grão seco é grão de qualidade."], ["a", "Agora essa produção segue para a indústria. Próxima parada: do grão ao mercado!"]],
    2: [["t", "Quase tudo guardado a tempo. Muito bem!"], ["a", "Próxima parada: a indústria, onde o grão vira produto!"]],
    1: [["t", "Foi por pouco, mas a carga ficou protegida."], ["a", "Com mais memória dá para chegar às 3 estrelas. Próxima parada: a indústria!"]],
    0: [["t", "A chuva chegou antes da gente desta vez."], ["a", "Respira e tenta de novo: memória e calma resolvem."]],
  },
  result: {
    titles: ["A chuva venceu desta vez", "Carga protegida!", "Ótima armazenagem!", "Armazenagem perfeita!"],
    texts: [
      "Tente de novo: lembre qual produto foi para cada silo.",
      "A maior parte da carga ficou seca. Memorize os silos para subir de nível.",
      "Quase tudo no silo certo. Mais um pouco e chega às 3 estrelas.",
      "Memória de armazenista: tudo no lugar, antes do temporal!",
    ],
  },
};

const PRODUCTS = [
  { id: "soja", name: "Soja" },
  { id: "milho", name: "Milho" },
  { id: "trigo", name: "Trigo" },
];
const TOTAL = 60, MAX_LIVES = 5, IDEAL_MAX = 82;

export function createCh2(ctx) {
  const { W, camera, canvas, hud, Cast, Sound, buzz, banner, floater, flash, toScreen } = ctx;
  const L = STORY2.lines;
  const $ = s => document.querySelector(s);
  const loadEl = $("#jrLoad"), loadIcon = $("#jrLoadIcon"), loadName = $("#jrLoadName"), loadAmt = $("#jrLoadAmt"), loadBar = $("#jrLoadBar");
  const tagsBox = $("#jrSiloTags");
  const tags = W.siloObjs.map((s, i) => {
    const el = document.createElement("button");
    el.type = "button"; el.className = "jr-silo-tag";
    el.setAttribute("aria-label", "Silo " + s.letter);
    el.innerHTML = `<span class="jr-silo-tag__icon"></span><b>0%</b><small>LIVRE</small>`;
    el.addEventListener("click", e => { e.stopPropagation(); choose(i); });
    tagsBox.appendChild(el);
    return { el, b: el.querySelector("b"), small: el.querySelector("small"), icon: el.querySelector(".jr-silo-tag__icon"), revealT: 0 };
  });
  const fill = (tpl, o) => tpl.replace("{s}", o.s || "").replace("{p}", o.p || "");
  let S = null;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();

  function reset() {
    S = {
      running: false, t: 0, score: 0, lives: MAX_LIVES, combo: 0, best: 0, correct: 0, errors: 0, attempts: 0,
      silos: W.siloObjs.map(() => ({ product: null, level: 34 + Math.random() * 22, drain: .26 + Math.random() * .16, pending: 0 })),
      current: null, nextT: .6, said: {}, exps: [14, 30, 46], storm: 0, thunder: [47.5, 52.5, 57], done: null,
    };
    S.silos.forEach((s, i) => W.setSiloLevel(W.siloObjs[i], s.level, true));
    tags.forEach(t => { t.el.classList.remove("is-reveal", "is-warning", "is-danger"); t.revealT = 0; });
    hud.setScore(0); hud.setLives(MAX_LIVES, MAX_LIVES); hud.setCombo(0); hud.setTime(TOTAL, TOTAL);
    loadEl.hidden = true;
    W.setRain(0); W.setStorm(0);
  }
  function chooseProduct() {
    const assigned = new Set(S.silos.filter(s => s.product).map(s => s.product));
    const free = PRODUCTS.filter(p => !assigned.has(p.id));
    if (S.silos.some(s => !s.product) && free.length) return free[Math.floor(Math.random() * free.length)];
    return PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
  }
  function deadline() { const left = TOTAL - S.t; return left <= 15 ? 3.2 : left <= 30 ? 4.2 : left <= 45 ? 5.2 : 6.2; }
  function nextLoad() {
    if (S.silos.every(s => s.level >= 94)) S.silos.forEach(s => { s.level = Math.max(0, s.level - 16); });
    const p = chooseProduct();
    let amount = 8 + Math.floor(Math.random() * 9);
    const left = TOTAL - S.t; if (left <= 30) amount += 2; if (left <= 15) amount += 2;
    const elig = S.silos.filter(s => !s.product || s.product === p.id);
    if (!elig.some(s => s.level + amount <= 100)) elig.forEach(s => { s.level = Math.max(0, s.level - 12); });
    const d = deadline();
    S.current = { p, amount, deadline: d, left: d };
    loadIcon.innerHTML = ICONS[p.id]; loadName.textContent = p.name; loadAmt.textContent = "+" + amount + "%";
    loadEl.hidden = false; loadEl.classList.remove("is-new", "is-urgent"); void loadEl.offsetWidth; loadEl.classList.add("is-new");
    W.setLoad(p.id); Sound.fx("select");
  }
  function loseLife(msg, who) {
    S.lives--; S.errors++; S.combo = 0; S.score = Math.max(0, S.score - 120);
    hud.setLives(S.lives, MAX_LIVES); hud.setCombo(0); hud.setScore(S.score);
    if (msg) hud.say(msg[0], msg[1]);
    Cast.act(who || "t", "oops");
    Sound.fx("error"); buzz([40, 40, 40]); flash();
    if (S.lives <= 0) finish(false);
  }
  function choose(i) {
    if (!S || !S.running || !S.current) return;
    const silo = S.silos[i], so = W.siloObjs[i], c = S.current;
    S.attempts++;
    const pos = toScreen(so.top.clone().add(new THREE.Vector3(0, 1.5, 0)));
    if (silo.product && silo.product !== c.p.id) {
      so.bad = 1; S.current = null; loadEl.hidden = true;
      floater(pos.x, pos.y, "Produto errado", "is-bad");
      loseLife(L.wrongProduct, "t"); S.nextT = .9; return;
    }
    if (silo.level + c.amount > 100) {
      so.bad = 1; S.current = null; loadEl.hidden = true;
      floater(pos.x, pos.y, "Não coube", "is-bad");
      loseLife(L.capacity, "a"); S.nextT = .9; return;
    }
    const first = !silo.product;
    if (first) silo.product = c.p.id;
    silo.level = Math.min(100, silo.level + c.amount); silo.pending += c.amount;
    S.correct++; S.combo++; S.best = Math.max(S.best, S.combo);
    const gain = 120 + Math.min(S.combo, 10) * 18 + Math.round(c.left * 12) + (silo.level <= 75 ? 80 : silo.level <= 88 ? 40 : 0) + (first ? 40 : 0);
    S.score += gain;
    hud.setScore(S.score); hud.setCombo(S.combo);
    floater(pos.x, pos.y, "+" + gain, S.combo >= 5 ? "is-gold" : "");
    const amt = c.amount;
    W.streamTo(i, c.p.id, () => { silo.pending = Math.max(0, silo.pending - amt); so.pulse = 1; Sound.fx("success"); });
    Sound.fx("whoosh"); buzz(15);
    if (first) { reveal(i, c.p); hud.say(L.assign[0], fill(L.assign[1], { s: so.letter, p: c.p.name })); Cast.act("t", "wave"); }
    else if (S.combo === 5 && !S.said.c5) { S.said.c5 = 1; hud.say(...L.combo5); Cast.act("a", "celebrate"); }
    else if (S.combo === 10 && !S.said.c10) { S.said.c10 = 1; hud.say(...L.combo10); Cast.act("t", "celebrate"); }
    else if (S.combo % 5 === 0) { Sound.fx("combo"); Cast.act("a", "celebrate"); }
    S.current = null; loadEl.hidden = true;
    S.nextT = (TOTAL - S.t) <= 25 ? .35 : .55;
  }
  /* mostra o produto do silo por um instante (depois é memória) */
  function reveal(i, p) {
    const t = tags[i];
    t.icon.innerHTML = ICONS[p.id]; t.small.textContent = p.name.toUpperCase();
    t.el.classList.add("is-reveal"); t.revealT = 1.8;
  }
  function expedition() {
    const i = Math.floor(Math.random() * S.silos.length);
    S.silos[i].level = Math.max(0, S.silos[i].level - (10 + Math.floor(Math.random() * 10)));
    W.siloObjs[i].pulse = 1;
    hud.say(L.expedition[0], fill(L.expedition[1], { s: W.siloObjs[i].letter }));
    banner("Expedição: Silo " + W.siloObjs[i].letter + " liberou espaço", "CAMINHÕES SAINDO");
    Sound.fx("phase");
  }
  function pointer(e) {
    if (!S || !S.running) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(W.siloObjs.map(s => s.hit), false)[0];
    if (hit) choose(hit.object.userData.silo);
  }
  canvas.addEventListener("pointerdown", pointer);

  function placeTags(dt) {
    const show = !!(S && (S.running || S.showTags));
    tagsBox.hidden = !show;
    if (!show) return;
    W.siloObjs.forEach((so, i) => {
      const t = tags[i], s = S.silos[i];
      const a = Math.atan2(W.CAM2_DIR.x, W.CAM2_DIR.z);
      const p = toScreen(new THREE.Vector3(so.x + Math.sin(a) * (W.SILO.R + 1), 1.2, so.z + Math.cos(a) * (W.SILO.R + 1)));
      t.el.style.left = p.x + "px"; t.el.style.top = p.y + "px";
      const lv = Math.round(so.level);
      t.b.textContent = lv + "%";
      if (t.revealT > 0) { t.revealT -= dt; if (t.revealT <= 0) t.el.classList.remove("is-reveal"); }
      if (!t.el.classList.contains("is-reveal")) t.small.textContent = !s.product ? "LIVRE" : lv > 94 ? "CHEIO" : lv > IDEAL_MAX ? "ATENÇÃO" : "EM USO";
      t.el.classList.toggle("is-warning", lv > IDEAL_MAX && lv <= 94);
      t.el.classList.toggle("is-danger", lv > 94);
    });
  }
  function update(dt) {
    placeTags(dt);
    if (!S || !S.running) return;
    S.t += dt;
    const left = TOTAL - S.t;
    hud.setTime(left, TOTAL);
    S.silos.forEach((s, i) => { s.level = Math.max(0, s.level - s.drain * dt); W.setSiloLevel(W.siloObjs[i], s.level - s.pending); });
    if (S.silos.every(s => s.level <= 90)) S.score += 3 * dt;
    if (S.exps.length && S.t >= S.exps[0]) { S.exps.shift(); expedition(); }
    /* tempo fechando */
    const k = Math.min(1, Math.max(0, (S.t - 18) / 34));
    W.setStorm(k);
    if (S.t >= 22 && !S.said.half) { S.said.half = 1; ctx.setSky("overcast", 16); hud.say(...L.halfway); }
    if (S.t >= 44 && !S.said.rain) { S.said.rain = 1; ctx.setSky("storm", 10); hud.say(...L.rain); banner("Começou a chuva!", "ÚLTIMOS 15 SEGUNDOS", true); Cast.act("a", "oops"); }
    if (S.t >= 44) W.setRain(Math.min(1, (S.t - 44) / 8));
    if (S.thunder.length && S.t >= S.thunder[0]) { S.thunder.shift(); lightning(); }
    if (S.current) {
      S.current.left -= dt;
      loadBar.style.transform = `scaleX(${Math.max(0, S.current.left / S.current.deadline)})`;
      loadEl.classList.toggle("is-urgent", S.current.left <= 1.6);
      if (S.current.left <= 0) { S.current = null; loadEl.hidden = true; loseLife(L.timeout, "a"); S.nextT = .5; }
    } else if (S.running) {
      S.nextT -= dt;
      if (S.nextT <= 0) nextLoad();
    }
    if (left <= 0) finish(true);
  }
  function lightning() {
    const f = document.getElementById("jrFlash");
    f.classList.add("is-light"); f.classList.remove("is-on"); void f.offsetWidth; f.classList.add("is-on");
    setTimeout(() => f.classList.remove("is-light"), 600);
    Sound.fx("thunder");
  }
  function finish(survived) {
    if (!S.running) return;
    S.running = false; S.current = null; loadEl.hidden = true;
    const precision = S.attempts ? Math.round(S.correct / S.attempts * 100) : 0;
    let stars = 0;
    if (survived && precision >= 90 && S.best >= 6) stars = 3;
    else if (survived && precision >= 75) stars = 2;
    else if (survived && precision >= 55) stars = 1;
    S.done && S.done({ score: Math.round(S.score), stars, correct: S.correct, accuracy: precision, best: S.best, errors: S.errors, seconds: Math.round(Math.min(S.t, TOTAL)), survived });
  }
  return {
    reset, update,
    start() { return new Promise(res => { S.done = res; S.running = true; S.nextT = .3; hud.say(...L.start); }); },
    get running() { return !!(S && S.running); },
    clear() { if (S) { S.running = false; S.showTags = false; } loadEl.hidden = true; tagsBox.hidden = true; W.setRain(0); W.setStorm(0); },
    showTags(on) { if (S) S.showTags = on; },
    _state: () => S,
    _choose: i => choose(i),
    _right: () => { if (!S || !S.current) return -1; const p = S.current.p.id; let i = S.silos.findIndex(s => s.product === p && s.level + S.current.amount <= 100); if (i < 0) i = S.silos.findIndex(s => !s.product); return i; },
  };
}
