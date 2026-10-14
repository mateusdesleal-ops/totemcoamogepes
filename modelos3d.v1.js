/* =========================================================
   COAMO GAMES — MODELOS 3D (GLB gerados no Tripo) · v1
   Carrega, normaliza, posiciona e anima os modelos .glb na cena
   three.js da Jornada da Safra. Usa o mesmo import map "three".

   Máquinas e cenário (trator, colheitadeiras, caminhões, navio, armazém,
   silo, recebimento, sacaria, pássaro, nuvem de chuva) são malhas estáticas: o movimento
   é feito por código (percurso, balanço, poeira).

   Arquivos otimizados para o totem: texturas WebP 1024 px, índices 16 bits,
   ~0,8–0,9 MB cada.
   ========================================================= */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";

const BASE = "./assets/modelos3d/";

/* altura (unidades da cena) após normalizar — escala dos cenários da Jornada */
export const MODELOS = {
  trator:        { file: "trator.glb?v=1",              altura: 3.4 },
  colheitadeira: { file: "colheitadeira.glb?v=1",       altura: 4.8 },
  caminhao:      { file: "caminhao-graneleiro.glb?v=2", altura: 4.4 },
  /* cenário (identidade Coamo: verdes das estruturas trocados pelo azul Coamo) */
  basculante:            { file: "basculante.glb?v=1",          altura: 4.4 },
  "colheitadeira-verde": { file: "colheitadeira-verde.glb?v=1", altura: 4.8 },
  navio:                 { file: "navio.glb?v=1",               altura: 21 },
  armazem:               { file: "armazem.glb?v=1",             altura: 10 },
  silo:                  { file: "silo.glb?v=1",                altura: 11 },
  recebimento:           { file: "recebimento.glb?v=1",         altura: 9 },
  sacaria:               { file: "sacaria.glb?v=1",             altura: 1.5 },
  passaro:               { file: "passaro.glb?v=1",             altura: 1.5 },
  "nuvem-chuva":         { file: "nuvem-chuva.glb?v=1",         altura: 9 },
};

/* nomes em português -> nome do clipe no arquivo */
const APELIDOS = { ocioso: "idle", caminhar: "walk", dar_tchau_02: "wave_goodbye", dar_tchau: "wave_goodbye", viva: "cheer" };

const loader = new GLTFLoader();
const cache = new Map(); // nome -> Promise<{ root, clips }>
let sombras = true;
/** qualidade baixa: sem sombras nos GLB */
export function definirSombras(on) { sombras = !!on; }

function preparar(root, alturaAlvo) {
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = sombras;
      o.receiveShadow = true;
      o.frustumCulled = !o.isSkinnedMesh; // skinned: evita sumir ao animar
      if (o.material?.map) { o.material.map.colorSpace = THREE.SRGBColorSpace; o.material.map.anisotropy = 4; }
      if (o.material) { o.material.envMapIntensity = .8; }
    }
  });
  const box = new THREE.Box3().setFromObject(root);
  const s = alturaAlvo / (box.getSize(new THREE.Vector3()).y || 1);
  root.scale.setScalar(s);
  box.setFromObject(root);
  const c = box.getCenter(new THREE.Vector3());
  root.position.set(-c.x, -box.min.y, -c.z); // pé no chão, centralizado
  const wrap = new THREE.Group();
  wrap.add(root);
  return wrap;
}

function base(nome) {
  const def = MODELOS[nome];
  if (!def) throw new Error("Modelo desconhecido: " + nome);
  if (!cache.has(nome)) {
    cache.set(nome, loader.loadAsync(BASE + def.file).then((g) => ({
      root: preparar(g.scene, def.altura),
      clips: g.animations || [],
    })));
  }
  return cache.get(nome);
}

/**
 * Devolve um objeto pronto para a cena. Para mascotes, inclui um controlador:
 *   const ton = await carregarModelo("toninho");
 *   scene.add(ton.obj);
 *   ton.tocar("dar_tchau_02");        // troca suave (crossfade)
 *   ton.tocar("viva", { umaVez: true, depois: "ocioso" });
 *   // no loop: ton.update(delta)
 */
export async function carregarModelo(nome) {
  const { root, clips } = await base(nome);
  const obj = MODELOS[nome].animado ? cloneSkinned(root) : root.clone(true);
  obj.name = "glb-" + nome;
  const ctl = { obj, nome, clips: clips.map((c) => c.name), update() {}, tocar() {}, atual: null };
  if (clips.length) {
    const mixer = new THREE.AnimationMixer(obj);
    const acoes = Object.fromEntries(clips.map((c) => [c.name, mixer.clipAction(c)]));
    const achar = (n) => {
      const alvo = (APELIDOS[n] || n).toLowerCase();
      return acoes[n] || acoes[Object.keys(acoes).find((k) => k.toLowerCase().includes(alvo))];
    };
    let atual = null, fimAtual = null;
    ctl.tocar = (n, { umaVez = false, depois = null, fade = 0.3 } = {}) => {
      const a = achar(n);
      if (!a) return console.warn(`[${nome}] clipe não encontrado: ${n}`, ctl.clips);
      if (fimAtual) { mixer.removeEventListener("finished", fimAtual); fimAtual = null; }
      if (a === atual && !umaVez) return;
      a.reset();
      a.setLoop(umaVez ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
      a.clampWhenFinished = umaVez;
      a.enabled = true; a.setEffectiveWeight(1);
      if (atual && atual !== a) atual.crossFadeTo(a, fade, false);
      a.play();
      atual = a; ctl.atual = n;
      if (umaVez && depois) {
        fimAtual = (e) => { if (e.action === a) { mixer.removeEventListener("finished", fimAtual); fimAtual = null; ctl.tocar(depois); } };
        mixer.addEventListener("finished", fimAtual);
      }
    };
    ctl.update = (dt) => mixer.update(dt);
    ctl.tocar("ocioso");
  }
  return ctl;
}

export function preCarregar(nomes = Object.keys(MODELOS)) {
  return Promise.all(nomes.map((n) => base(n).catch((e) => console.warn(e))));
}

/**
 * Máquina andando por um percurso (sem rodas separadas):
 *   const rota = new THREE.CatmullRomCurve3([...pontos], true);
 *   const anda = dirigir(trator.obj, rota, { vel: 0.04 });
 *   // no loop: anda(t)  (t em segundos)
 */
export function dirigir(obj, curva, { vel = 0.05, balanco = 0.025 } = {}) {
  const p = new THREE.Vector3(), alvo = new THREE.Vector3();
  return (t) => {
    const u = ((t * vel) % 1 + 1) % 1;
    curva.getPointAt(u, p);
    curva.getPointAt((u + 0.002) % 1, alvo);
    obj.position.copy(p);
    obj.lookAt(alvo.x, p.y, alvo.z);
    const corpo = obj.children[0];
    corpo.position.y = Math.abs(Math.sin(t * 9)) * balanco;  // trepidação
    corpo.rotation.z = Math.sin(t * 6) * balanco * 0.6;       // ginga lateral
  };
}

/** Andar do mascote por um percurso, já trocando ocioso <-> caminhar. */
export function passear(ctl, curva, { vel = 0.03 } = {}) {
  const anda = dirigir(ctl.obj, curva, { vel, balanco: 0 });
  let andando = false;
  return (t, mover = true) => {
    if (mover !== andando) { ctl.tocar(mover ? "caminhar" : "ocioso"); andando = mover; }
    if (mover) anda(t);
  };
}
