/* =========================================================
   COAMO GAMES — JORNADA DA SAFRA · CENÁRIO 3D (v1)
   Modelos GLB que enriquecem o cenário, sempre com a identidade
   visual da Coamo (estruturas em azul Coamo e placas com a logo):
   - pátio: estação de recebimento de grãos e sacaria no palete;
   - céu: pássaros batendo asas no lugar dos pássaros desenhados;
   - capítulo 2: nuvens de chuva com raio chegando com o temporal;
   - capítulo 3: navio graneleiro, armazém e silos no porto,
     colheitadeira e trator parados na lavoura.
   Os modelos carregam depois da abertura (sem atrasar a primeira tela).
   Se algum GLB falhar, fica a geometria procedural que já existe.
   ========================================================= */
import * as THREE from "three";
import { carregarModelo } from "./modelos3d.v1.js?v=1.1";
import { placaCoamo } from "./jornada-maquinas.v1.js?v=1.2";

export function createCenario3D(W, { regiao } = {}) {
  const { scene, world, STATIONS, SEA, terrainH } = W;
  const placaM = new THREE.MeshStandardMaterial({ map: placaCoamo(), roughness: .5, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2 });
  const estaticos = [];             /* recebem sombra conforme a qualidade */
  let detalhe = "high";

  const placa = (w, parent, x, y, z, ry = 0) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, w * .375), placaM);
    p.position.set(x, y, z); p.rotation.y = ry; parent.add(p); return p;
  };
  const tam = o => new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3());
  /* coloca uma cópia do modelo no mundo; ry gira o modelo (que olha para +z) */
  function colocar(nome, parent, x, z, ry = 0, y = null) {
    return carregarModelo(nome).then(ctl => {
      const o = ctl.obj; o.position.set(x, y == null ? terrainH(x, z) : y, z); o.rotation.y = ry;
      o.userData.dynamic = true; parent.add(o); estaticos.push(o); aplicarDetalhe();
      return o;
    });
  }
  const falhou = nome => e => console.warn(`[cenario3d] ${nome} GLB indisponível, mantendo o procedural`, e);

  /* ===================================================== pátio */
  function patio() {
    /* estação de recebimento (moega coberta + elevador), no fundo à esquerda do armazém */
    colocar("recebimento", world, -37, -32, 0, 0).then(o => {
      const s = tam(o); placa(s.x * .42, o, 0, s.y * .78, s.z / 2 + .25);
    }).catch(falhou("recebimento"));
    /* sacaria no palete, no começo do caminho da empilhadeira */
    [[-31.5, -14.2, .2], [-34.2, -14.4, -.15]].forEach(([x, z, r]) => colocar("sacaria", world, x, z, r, 0).catch(falhou("sacaria")));
  }

  /* ===================================================== pássaros */
  const bando = [];
  let bandoG = null;
  function passaros() {
    carregarModelo("passaro").then(base => {
      bandoG = new THREE.Group(); scene.add(bandoG);
      for (let i = 0; i < 7; i++) {
        const o = i ? base.obj.clone(true) : base.obj;
        o.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } });
        const g = new THREE.Group(); g.add(o); bandoG.add(g);
        g.position.set(-30 + i * 3 - (i % 2) * 1.6, 30 + (i % 3) * 1.6, -60 - i * 2.2);
        g.userData.ph = i * .9; g.userData.wing = o;
        bando.push(g);
      }
      if (W.birds) W.birds.visible = false;
      aplicarDetalhe();
    }).catch(falhou("passaro"));
  }

  /* ===================================================== nuvens de chuva (capítulo 2) */
  const nuvens = [];
  let raioT = 0;
  function nuvensChuva() {
    carregarModelo("nuvem-chuva").then(base => {
      /* partes: a maior é a nuvem; a segunda é o raio; as outras são gotas */
      const partes = []; base.obj.traverse(m => { if (m.isMesh) partes.push(m); });
      partes.sort((a, b) => b.geometry.attributes.position.count - a.geometry.attributes.position.count);
      const POS = [[-8, 26, -50, 1.3], [14, 29, -58, 1.5], [31, 25, -47, 1.2], [2, 33, -72, 1.6]];
      POS.forEach(([x, y, z, s], i) => {
        const o = base.obj.clone(true);
        const ms = []; o.traverse(m => { if (m.isMesh) ms.push(m); });
        ms.sort((a, b) => b.geometry.attributes.position.count - a.geometry.attributes.position.count);
        const corpo = ms[0], raio = ms[1], gotas = ms.slice(2);
        corpo.material = corpo.material.clone();
        raio.material = raio.material.clone(); raio.material.emissive = new THREE.Color("#fff2a0"); raio.material.emissiveIntensity = 0;
        raio.visible = false;
        ms.forEach(m => { m.castShadow = false; m.userData.noAO = true; });
        gotas.forEach(g => { g.userData.y0 = g.position.y; });
        const g = new THREE.Group(); g.add(o); g.visible = false; scene.add(g);
        nuvens.push({ g, corpo, raio, gotas, x, y, z, s, ph: i * 1.7 });
      });
      aplicarDetalhe();
    }).catch(falhou("nuvem-chuva"));
  }
  /* chamado pelo capítulo 2 a cada trovão */
  W.raio = () => { raioT = .5; };

  /* ===================================================== capítulo 3 */
  function regiaoCap3() {
    if (!regiao || !regiao.pecas) return;
    const P = regiao.pecas, root = regiao.root, st = STATIONS.porto;
    /* navio graneleiro: casco azul Coamo e a logo nos dois lados */
    if (P.navio) carregarModelo("navio").then(ctl => {
      const o = ctl.obj, s = tam(o);
      const g = new THREE.Group(); g.position.copy(P.navio.position); g.position.y = -2.2; g.rotation.y = Math.PI / 2;
      g.add(o); g.userData.dynamic = true; root.add(g); estaticos.push(o);
      for (const sx of [-1, 1]) placa(s.z * .2, o, sx * (s.x / 2 + .05), s.y * .2, s.z * .08, sx * Math.PI / 2);
      P.navio.visible = false; navio = g; aplicarDetalhe();
    }).catch(falhou("navio"));
    /* armazém do porto (porta virada para o mar) e dois silos do terminal */
    if (P.armazemPorto) carregarModelo("armazem").then(ctl => {
      const o = ctl.obj, s = tam(o), a = P.armazemPorto;
      o.position.set(a.position.x, 0, a.position.z); o.rotation.y = Math.PI / 2; o.userData.dynamic = true; root.add(o); estaticos.push(o);
      /* logo na lateral que fica de frente para a câmera */
      placa(s.z * .34, o, -s.x / 2 - .08, s.y * .5, 0, -Math.PI / 2);
      a.visible = false; aplicarDetalhe();
    }).catch(falhou("armazem"));
    [[st.x - 15, st.z - 20], [st.x - 4, st.z - 21]].forEach(([x, z], i) => colocar("silo", root, x, z, 0, .2).then(o => {
      const s = tam(o); placa(s.x * .55, o, 0, s.y * .55, s.z / 2 * .86 + .1, 0);
    }).catch(falhou("silo")));
    /* lavoura: colheitadeira verde e trator parados na beira do talhão */
    const trocar = (nome, alvo) => alvo && carregarModelo(nome).then(ctl => {
      const o = ctl.obj; o.position.set(alvo.position.x, 0, alvo.position.z); o.rotation.y = alvo.rotation.y + Math.PI / 2;
      o.userData.dynamic = true; root.add(o); estaticos.push(o); alvo.visible = false; aplicarDetalhe();
    }).catch(falhou(nome));
    trocar("colheitadeira-verde", P.colheitadeira);
    trocar("trator", P.trator);
  }
  let navio = null;

  function aplicarDetalhe() {
    const low = detalhe === "low";
    estaticos.forEach(o => o.traverse(m => { if (m.isMesh) m.castShadow = !low; }));
    bando.forEach((b, i) => { b.visible = !low || i < 4; });
    nuvens.forEach((n, i) => { n.on = !low || i < 2; });
  }

  /* carrega depois que a abertura estiver na tela */
  let iniciado = false;
  function iniciar() {
    if (iniciado) return; iniciado = true;
    patio(); passaros(); nuvensChuva(); regiaoCap3();
  }

  const cor = new THREE.Color();
  return {
    iniciar,
    setDetail(level) { detalhe = level; aplicarDetalhe(); },
    get prontos() { return { estaticos: estaticos.length, passaros: bando.length, nuvens: nuvens.length, navio: !!navio }; },
    update(dt, time) {
      /* pássaros: voam para +x batendo as asas (o modelo olha para +z) */
      /* no temporal os pássaros somem */
      if (bandoG) bandoG.visible = !(W.storm && W.storm() > .3);
      bando.forEach((b, i) => {
        if (!b.visible) return;
        const ph = time * 7 + b.userData.ph, f = Math.sin(ph);
        b.position.x += dt * 4.2; b.position.y += Math.sin(time * .6 + i) * dt * .3;
        if (b.position.x > 90) b.position.x = -90;
        b.rotation.set(0, Math.PI / 2, Math.sin(time * .8 + i) * .12);
        b.userData.wing.scale.set(.82 + f * .2, 1 - f * .1, 1);
        b.userData.wing.position.y = -f * .12;
      });
      /* nuvens de chuva: chegam com o temporal (escala e descida), escurecem e piscam com o raio */
      const k = W.storm ? W.storm() : 0;
      raioT = Math.max(0, raioT - dt);
      nuvens.forEach((n, i) => {
        const on = n.on !== false && k > .04;
        n.g.visible = on; if (!on) return;
        const e = Math.min(1, k * 1.25), s = n.s * (.35 + .65 * e);
        n.g.scale.setScalar(s);
        n.g.position.set(n.x + Math.sin(time * .15 + n.ph) * 3 - (1 - e) * 30, n.y + (1 - e) * 10, n.z);
        cor.setRGB(1 - k * .55, 1 - k * .53, 1 - k * .47); n.corpo.material.color.copy(cor);
        const pisca = raioT > 0 && (i % 2 === Math.floor(raioT * 20) % 2);
        n.raio.visible = k > .6 && (pisca || Math.sin(time * 1.3 + n.ph) > .985);
        n.raio.material.emissiveIntensity = pisca ? 2.4 : .8;
        n.gotas.forEach((g, j) => { g.visible = k > .55; g.position.y = g.userData.y0 - ((time * .9 + j * .37 + n.ph) % 1) * .15; });
      });
      if (navio) { navio.position.y = -2.2 + Math.sin(time * .7) * .12; navio.rotation.z = Math.sin(time * .5) * .012; }
    },
  };
}
