/* =========================================================
   COAMO GAMES — JORNADA DA SAFRA · MÁQUINAS 3D (v1)
   - Caminhão graneleiro (GLB) no lugar do caminhão procedural,
     com a placa da Coamo na caçamba.
   - Trator (plantio) e colheitadeira (colheita) andando pelas
     lavouras com dirigir(), soltando poeira leve.
   Se algum GLB não carregar, a cena segue com a geometria atual.
   ========================================================= */
import * as THREE from "three";
import { carregarModelo, dirigir, definirSombras } from "./modelos3d.v1.js?v=1.1";

/* placa branca com a logo da Coamo (identidade visual nas máquinas) */
export function placaCoamo() {
  const c = document.createElement("canvas"); c.width = 512; c.height = 192;
  const x = c.getContext("2d"), t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const draw = im => {
    x.clearRect(0, 0, 512, 192);
    x.fillStyle = "#ffffff"; x.beginPath(); x.roundRect(6, 6, 500, 180, 34); x.fill();
    x.strokeStyle = "#1d5fa8"; x.lineWidth = 8; x.beginPath(); x.roundRect(10, 10, 492, 172, 30); x.stroke();
    if (im) { const w = 420, h = w * im.height / im.width; x.drawImage(im, 256 - w / 2, 96 - h / 2, w, h); }
    t.needsUpdate = true;
  };
  draw(null);
  const im = new Image(); im.onload = () => draw(im); im.src = "assets/logo_verde.png";
  return t;
}

/* textura macia para a poeira */
function texPoeira() {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 2, 32, 32, 31);
  g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.5, "rgba(255,255,255,.45)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/* poeira: partículas que nascem atrás da máquina, sobem, crescem e somem */
function criarPoeira(scene, N, cor) {
  const pos = new Float32Array(N * 3), vida = new Float32Array(N), tam = new Float32Array(N), vel = new Float32Array(N * 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("vida", new THREE.BufferAttribute(vida, 1));
  g.setAttribute("tam", new THREE.BufferAttribute(tam, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { map: { value: texPoeira() }, cor: { value: new THREE.Color(cor) }, escala: { value: 600 } },
    vertexShader: `attribute float vida; attribute float tam; varying float vA; uniform float escala;
      void main(){ vA = vida; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv;
        gl_PointSize = tam * escala / max(1.0, -mv.z); }`,
    fragmentShader: `uniform sampler2D map; uniform vec3 cor; varying float vA;
      void main(){ float a = texture2D(map, gl_PointCoord).a * vA * .55; if (a < .01) discard; gl_FragColor = vec4(cor, a); }`,
    transparent: true, depthWrite: false, fog: false,
  });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.userData.noAO = true; pts.renderOrder = 2; scene.add(pts);
  let i0 = 0, acum = 0;
  return {
    pts,
    update(dt, origem, ativa) {
      if (ativa) {
        acum += dt * 14;
        while (acum >= 1) {
          acum -= 1; const i = i0; i0 = (i0 + 1) % N;
          pos[i * 3] = origem.x + (Math.random() - .5) * 1.4; pos[i * 3 + 1] = origem.y + .3; pos[i * 3 + 2] = origem.z + (Math.random() - .5) * 1.4;
          vel[i * 3] = (Math.random() - .5) * .8; vel[i * 3 + 1] = .5 + Math.random() * .6; vel[i * 3 + 2] = (Math.random() - .5) * .8;
          vida[i] = 1; tam[i] = .9 + Math.random() * .8;
        }
      }
      for (let i = 0; i < N; i++) {
        if (vida[i] <= 0) continue;
        vida[i] = Math.max(0, vida[i] - dt / 2.6);
        pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        tam[i] += dt * 1.6;
      }
      g.attributes.position.needsUpdate = g.attributes.vida.needsUpdate = g.attributes.tam.needsUpdate = true;
    },
  };
}

/* volta fechada dentro de uma lavoura (perto da borda virada para a unidade) */
function rotaLavoura(f, terrainH, { fw = .62, fd = .26, borda = .2 } = {}) {
  const c = Math.cos(f.r), s = Math.sin(f.r), hw = f.w * fw / 2, hd = f.d * fd / 2, cz = f.d / 2 - f.d * borda - hd;
  const local = [];
  const N = 10;
  for (let i = 0; i <= N; i++) local.push([-hw + 2 * hw * i / N, cz + hd]);
  for (let i = 1; i <= 3; i++) { const a = Math.PI / 2 - Math.PI * i / 4; local.push([hw + Math.cos(a) * hd * .9, cz + Math.sin(a) * hd]); }
  for (let i = 0; i <= N; i++) local.push([hw - 2 * hw * i / N, cz - hd]);
  for (let i = 1; i <= 3; i++) { const a = -Math.PI / 2 - Math.PI * i / 4; local.push([-hw + Math.cos(a) * hd * .9, cz + Math.sin(a) * hd]); }
  const pts = local.map(([lx, lz]) => { const wx = f.x + lx * c - lz * s, wz = f.z + lx * s + lz * c; return new THREE.Vector3(wx, terrainH(wx, wz) + .05, wz); });
  return new THREE.CatmullRomCurve3(pts, true, "centripetal");
}

export function createMaquinas(W) {
  const { scene, terrainH, FIELDS } = W;
  const placaTex = placaCoamo();
  const maquinas = [];
  let detalhe = "high", t0 = 0;

  /* ---------- caminhões: graneleiro (pátio) e basculante (frota da estrada) ---------- */
  const placaM = new THREE.MeshStandardMaterial({ map: placaTex, roughness: .5, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2 });
  [["caminhao", "base"], ["basculante", "basculante"]].forEach(([nome, variante]) => {
    carregarModelo(nome).then(ctl => {
      const proto = ctl.obj;
      /* placa da Coamo nas laterais da caçamba (caçamba fica na parte de trás: z negativo do modelo) */
      const box = new THREE.Box3().setFromObject(proto), sz = box.getSize(new THREE.Vector3());
      for (const sx of [-1, 1]) {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(sz.z * .36, sz.z * .135), placaM);
        p.position.set(sx * (sz.x / 2 + .03), sz.y * .58, box.min.z + sz.z * .3);
        p.rotation.y = sx * Math.PI / 2; proto.add(p);
      }
      W.setTruckModel(proto, variante);
    }).catch(e => console.warn(`[maquinas] ${nome} GLB indisponível, mantendo o procedural`, e));
  });

  /* ---------- trator (plantio, lavoura de soja) e colheitadeira (colheita, trigo) ---------- */
  const PLANO = [
    { nome: "trator", campo: 0, vel: 4.2, poeira: "#b48f63", rota: { fw: .55, fd: .22, borda: .12 } },
    { nome: "colheitadeira", campo: 1, vel: 3.2, poeira: "#d8c48a", rota: { fw: .5, fd: .22, borda: .12 } },
  ];
  PLANO.forEach((P, i) => {
    carregarModelo(P.nome).then(ctl => {
      const obj = ctl.obj; obj.userData.dynamic = true; obj.traverse(o => { if (o.isMesh) o.userData.noAO = false; });
      scene.add(obj);
      const rota = rotaLavoura(FIELDS[P.campo], terrainH, P.rota), comp = rota.getLength();
      const anda = dirigir(obj, rota, { vel: P.vel / comp, balanco: .05 });
      const poeira = criarPoeira(scene, 70, P.poeira);
      const L = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3()).z;
      maquinas.push({ P, obj, anda, poeira, L, fase: i * 37 });
      aplicarDetalhe();
    }).catch(e => console.warn(`[maquinas] ${P.nome} GLB indisponível`, e));
  });

  const tras = new THREE.Vector3(), fwd = new THREE.Vector3();
  function aplicarDetalhe() {
    definirSombras(detalhe !== "low");
    maquinas.forEach(m => {
      /* qualidade baixa: só o trator, sem sombra */
      const on = detalhe !== "low" || m.P.nome === "trator";
      m.obj.visible = on; m.poeira.pts.visible = on;
      m.obj.traverse(o => { if (o.isMesh) o.castShadow = detalhe !== "low"; });
    });
  }
  return {
    maquinas,
    setDetail(level) { detalhe = level; aplicarDetalhe(); },
    update(dt, time) {
      t0 = time;
      for (const m of maquinas) {
        if (!m.obj.visible) continue;
        m.anda(time + m.fase);
        m.obj.getWorldDirection(fwd);
        tras.copy(m.obj.position).addScaledVector(fwd, -m.L * .5);
        m.poeira.update(dt, tras, true);
      }
    },
  };
}
