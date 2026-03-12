(() => {
  "use strict";

  const CONFIG = {
    // Modo apresentação
    inactivityMs: 25 * 1000,   // inicia após 25s sem clique/toque
    slideMs: 10 * 1000,        // troca de slide

    // Integração de vagas (Jobfeed/Selecty) – preencha quando colocar no ar
    jobfeed: {
      enabled: true, // API de vagas habilitada (via proxy /api/vagas)
      baseUrl: "",   // mesmo domínio do site
      endpoint: "/api/vagas", // endpoint do proxy (Vercel/GitHub + Vercel)
      token: "",
      app_id: "",
      secret: ""
    }
  };

  /* =========================
     Helpers
  ========================== */
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

  /* =========================
     NAV – Botão Apresentação
  ========================== */
  function wirePresentationButton(){
    const btn = document.getElementById("btnApresentacao");
    if(!btn) return;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      startPresentation("manual");
    });
  }

  /* =========================
     Modo Apresentação (Overlay)
  ========================== */
  let idleTimer = null;
  let slideTimer = null;
  let isPresentationActive = false;
  let currentSlide = 0;

  let SLIDES = [
    {
      title: "Cultura da Coamo",
      sub: "Princípios e valores que guiam o nosso jeito de fazer.",
      bg: "assets/img_cultura.jpg",
      pill: "Cultura"
    },
    {
      title: "Depoimento",
      sub: "A Coamo é uma Escola, uma segunda casa. Aqui aprendi muitas coisas, como ser um bom profissional, como é trabalhar em uma grande Empresa. São 40 anos de dedicação (primeiro e único emprego). Os princípios e valores da Coamo são muito nobres, valorizam as pessoas. Uma Cooperativa que sabe conciliar o Econômico e o Social, gerando benefícios para os Cooperados e para as Comunidades onde atua.",
      bg: "assets/depo_edivilson_bg.jpg",
      pill: "Depoimento",
      author: {
        name: "Edevilson Canali",
        role: "Supervisor de Soluções de Negócio",
        photo: "assets/depo_edivilson_avatar.jpg"
      }
    },
    {
      title: "Depoimento",
      sub: "Criar cultura e valores em uma empresa depende de exemplos, especialmente dos fundadores, cooperados e colaboradores. Na Coamo, essas pessoas orientam o constante crescimento, e fazer parte desse time com profissionais qualificados traz imensa gratidão. Aqui, somos motivados diariamente a superar obstáculos e alcançar os resultados esperados.",
      bg: "assets/depo_bruno_bg.jpg",
      pill: "Depoimento",
      author: {
        name: "Bruno Bortolini",
        role: "Assessor de Operações Portuárias",
        photo: "assets/depo_bruno_avatar.jpg"
      }
    },
    {
      title: "Carreira",
      sub: "Oportunidades, desenvolvimento e crescimento profissional.",
      bg: "assets/img_carreira.jpg",
      pill: "Carreira"
    },
    {
      title: "Bem‑estar",
      sub: "Qualidade de vida, saúde e um ambiente seguro para trabalhar.",
      bg: "assets/img_bemestar.jpg",
      pill: "Bem‑estar"
    }
  ];


  function ensureOverlay(){
    if(document.getElementById("presentationOverlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "presentationOverlay";
    overlay.className = "presentationOverlay";
    overlay.innerHTML = `
      <div class="presentationSlide" role="dialog" aria-modal="true">
        <div class="presentationSlide__bg" id="presentationBg"></div>
        <div class="presentationSlide__shade"></div>

        <div class="presentationSlide__content">
          <div class="presentationPill" id="presentationPill">Apresentação</div>
          <div class="presentationTitle" id="presentationTitle"></div>
          <div class="presentationSub" id="presentationSub"></div>

          <div class="presentationAuthor" id="presentationAuthor" hidden>
<div class="presentationAuthor__text">
              <div class="presentationAuthor__name" id="presentationAuthorName"></div>
              <div class="presentationAuthor__role" id="presentationAuthorRole"></div>
            </div>
          </div>
        </div>

        <div class="presentationFooter">
          <div class="presentationBrand"><img src="assets/logo.png" alt="Coamo"></div>
          <div class="presentationHint">Toque na tela para sair</div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // sair com toque/click
    overlay.addEventListener("pointerdown", () => stopPresentation());
    overlay.addEventListener("click", () => stopPresentation());
  }

  function renderSlide(i){
    const s = SLIDES[i % SLIDES.length];

    const overlayEl = document.getElementById("presentationOverlay");
    const bg = document.getElementById("presentationBg");
    const pill = document.getElementById("presentationPill");
    const title = document.getElementById("presentationTitle");
    const sub = document.getElementById("presentationSub");

    const author = document.getElementById("presentationAuthor");
    const authorName = document.getElementById("presentationAuthorName");
    const authorRole = document.getElementById("presentationAuthorRole");

    if(bg){
      bg.style.setProperty("--bg-url", `url("${s.bg}")`);
      let img = bg.querySelector("img.presentationSlide__photo");
      if(!img){
        img = document.createElement("img");
        img.className = "presentationSlide__photo";
        img.alt = "";
        img.loading = "eager";
        bg.appendChild(img);
      }
      img.src = s.bg;
      const slideEl = overlayEl ? overlayEl.querySelector(".presentationSlide") : null;
      img.onload = () => {
        const r = (img.naturalHeight && img.naturalWidth) ? (img.naturalHeight / img.naturalWidth) : 1;
        if(slideEl){
          slideEl.classList.toggle("is-portrait", r > 1.15);
        }
      };

    }
    if(pill) pill.textContent = s.pill || "Apresentação";
    if(title) title.textContent = s.title || "";
    if(sub) sub.textContent = s.sub || "";

    const hasAuthor = !!(s.author && (s.author.name || s.author.role || s.author.photo));
    if(author){
      author.hidden = !hasAuthor;
      if(hasAuthor){
        if(authorName) authorName.textContent = s.author.name || "";
        if(authorRole) authorRole.textContent = s.author.role || "";
      } else {
        if(authorName) authorName.textContent = "";
        if(authorRole) authorRole.textContent = "";
      }
    }
  }

  function startPresentation(source="idle"){
    ensureOverlay();
    const overlay = document.getElementById("presentationOverlay");
    if(!overlay) return;

    isPresentationActive = true;
    overlay.classList.add("is-active");

    currentSlide = clamp(currentSlide, 0, SLIDES.length-1);
    renderSlide(currentSlide);

    clearInterval(slideTimer);
    slideTimer = setInterval(() => {
      currentSlide = (currentSlide + 1) % SLIDES.length;
      renderSlide(currentSlide);
    }, CONFIG.slideMs);

    // enquanto apresenta, não fica rodando idle por trás
    clearTimeout(idleTimer);
  }

  function stopPresentation(){
    const overlay = document.getElementById("presentationOverlay");
    if(overlay) overlay.classList.remove("is-active");

    isPresentationActive = false;
    clearInterval(slideTimer);
    slideTimer = null;

    // rearmar idle
    armIdleTimer();
  }

  // IMPORTANTÍSSIMO: contar inatividade só por clique/toque
  function armIdleTimer(){
    clearTimeout(idleTimer);
    if(isPresentationActive) return;
    idleTimer = setTimeout(() => startPresentation("idle"), CONFIG.inactivityMs);
  }

  function wireIdle(){
    // reseta SOMENTE em clique/toque (não em mousemove)
    const reset = () => armIdleTimer();

    ["pointerdown", "touchstart", "mousedown", "click"].forEach(evt => {
      window.addEventListener(evt, reset, { passive: true });
    });

    // começar a contar assim que carregar
    armIdleTimer();
  }

  /* =========================
     Vagas (com fallback)
  ========================== */
  const FALLBACK_VACANCIES = [
    { id:"43061", title:"Mecânico Manutenção Veículos Pesados", location:"Campo Mourão, PR", group:"industria" },
    { id:"43062", title:"Vigilante", location:"Campo Mourão, PR", group:"industria" },
    { id:"43063", title:"Arquiteto(a) Corporativo de TI", location:"Campo Mourão, PR", group:"admin" },
    { id:"43064", title:"Estágio – Programa GeraTalentos", location:"Campo Mourão, PR", group:"admin" },
    { id:"43065", title:"Assistente de Distribuição", location:"Paranaguá, PR", group:"agro" },
  ];

  function groupLabel(group){
    if(group === "industria") return "Indústria";
    if(group === "admin") return "Administrativo / Corporativo";
    return "Campo / Agro";
  }

    const VACANCY_IMAGE_RULES = [
    { keys: ["veterin", "medico veterin", "medica veterin"], img: "assets/vaga_fotos/medico_a_veterinario_a.jpg" },
    { keys: ["ti", "tecnolog", "sistema", "software", "desenvolv", "program", "suporte", "infra", "devops", "dados", "data", "analista de sistemas"], img: "assets/vaga_fotos/vagas_de_ti.jpg" },
    { keys: ["mecan", "veicul", "oficina", "manutencao veicul", "mecanico de veiculos"], img: "assets/vaga_fotos/mecanico_de_veiculos.jpg" },
    { keys: ["vigilant", "seguranc", "portaria", "controlador de acesso"], img: "assets/vaga_fotos/vigilante.jpeg" },
    { keys: ["zelador", "zeladora", "limpeza", "higien", "copeir"], img: "assets/vaga_fotos/zeladora.jpg" },
    { keys: ["aprendiz", "jovem aprendiz"], img: "assets/vaga_fotos/aprendiz.jpg" },
    { keys: ["ajudant", "servicos gerais", "servico geral", "auxiliar de servicos", "ajudante de servicos"], img: "assets/vaga_fotos/ajudantes.jpg" },
    { keys: ["fiacao", "fiação", "eletric", "eletro", "cab", "fios"], img: "assets/vaga_fotos/vagas_com_a_palavra_de_fiacao.jpg" },
    { keys: ["agro", "campo", "fazenda", "lavour", "graos", "agric"], img: "assets/vaga_fotos/agro.jpg" },
  ];

  function _norm(str){
    return (str || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function getVacancyImage(v){
    const t = _norm(`${v?.title || ""} ${v?.group || ""} ${v?.location || ""}`);

    for(const rule of VACANCY_IMAGE_RULES){
      if(rule.keys.some(k => t.includes(_norm(k)))) return rule.img;
    }

    // fallback por grupo (imagens existentes no assets/)
    if(v.group === "industria") return "assets/img_industria.jpg";
    if(v.group === "admin") return "assets/img_admin.jpg";
    return "assets/img_agro.jpg";
  }

  function renderVagasList(list, meta={}) {
    const root = document.getElementById("vagasList");
    if(!root) return;

    root.innerHTML = "";

    list.forEach(v => {
      const el = document.createElement("div");
      el.className = "vagaItem";
      el.innerHTML = `
        <div class="vagaThumb"><img src="${getVacancyImage(v)}" alt=""></div>
        <div class="vagaBody">
          <h3 class="vagaTitle">${v.title}</h3>
          <div class="vagaLoc">📍 ${v.location}</div>
          <div class="vagaTags">
            <span class="vagaTag">${groupLabel(v.group)}</span>
            <span class="vagaTag">Cód. ${v.id}</span>
            ${meta.isFallback ? `<span class="vagaTag vagaTag--muted">Exemplo</span>` : ``}
          </div>
        </div>
      `;
      root.appendChild(el);
    });

    const countEl = document.getElementById("vagasCount");
    if(countEl){
      if(meta.note){
        countEl.textContent = meta.note;
      } else {
        countEl.textContent = `${list.length} vaga(s) encontrada(s)`;
      }
    }
  }

  function pickJobsArray(payload){
    if(Array.isArray(payload)) return payload;
    if(!payload || typeof payload !== "object") return [];

    const candidates = [
      payload.vacancies,
      payload.data,
      payload.jobs,
      payload.items,
      payload.results,
      payload.rows,
      payload.data?.vacancies,
      payload.data?.jobs,
      payload.data?.items,
      payload.payload?.vacancies,
      payload.payload?.jobs,
    ];

    for(const item of candidates){
      if(Array.isArray(item)) return item;
    }
    return [];
  }

  function guessGroup(job){
    const raw = String(
      job.group || job.area || job.department || job.category || job.segment || job.business_unit || "admin"
    ).toLowerCase();

    if(raw.includes("ind")) return "industria";
    if(raw.includes("agro") || raw.includes("campo") || raw.includes("fazenda")) return "agro";
    return "admin";
  }

  function normalizeVacancy(job, idx){
    return {
      id: String(job.id || job.code || job.vacancy_id || job.job_id || idx),
      title: String(job.title || job.name || job.position || job.job_title || "Vaga"),
      location: String(job.location || job.city || job.unit || job.workplace || job.address_city || [job.address_city, job.address_state].filter(Boolean).join(", ") || ""),
      group: guessGroup(job),
      raw: job,
    };
  }

  async function fetchVacanciesFromApi(){
    const jf = CONFIG.jobfeed;
    if(!jf || !jf.enabled || !jf.endpoint) return null;

    const base = jf.baseUrl ? jf.baseUrl.replace(/\/$/, "") : window.location.origin;
    const sep = jf.endpoint.includes("?") ? "&" : "?";
    const url = `${base}${jf.endpoint}${sep}all=1&per_page=100&_=${Date.now()}`;
    const headers = {};
    if(jf.token) headers["Authorization"] = `Bearer ${jf.token}`;

    const res = await fetch(url, { headers, cache: "no-store" });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const arr = pickJobsArray(data);
    const unique = new Map();

    arr.forEach((job, idx) => {
      const normalized = normalizeVacancy(job, idx);
      if(!unique.has(normalized.id)){
        unique.set(normalized.id, normalized);
      }
    });

    return Array.from(unique.values()).sort((a,b) => (a.title||"").localeCompare(b.title||"", "pt-BR"));
  }

  function applyVagasFilter(all){
    const qCargo = ($("#qCargo")?.value || "").trim().toLowerCase();
    const qCidade = ($("#qCidade")?.value || "").trim().toLowerCase();

    const out = all.filter(v => {
      const t = (v.title || "").toLowerCase();
      const loc = (v.location || "").toLowerCase();
      const okCargo = !qCargo || t.includes(qCargo);
      const okCidade = !qCidade || loc.includes(qCidade);
      return okCargo && okCidade;
    });

    renderVagasList(out, { isFallback: false });
  }

  async function initVagasPage(){
    const listEl = document.getElementById("vagasList");
    if(!listEl) return;

    // Estado inicial
    const countEl = document.getElementById("vagasCount");
    if(countEl) countEl.textContent = "Carregando vagas...";

    let all = null;

    try{
      all = await fetchVacanciesFromApi();
    } catch (err){
      all = null;
    }

    if(!all || !all.length){
      // Se estiver em file://, avisar que API precisa estar no ar (mas mostrar exemplo para UX)
      const isFile = location.protocol === "file:";
      const note = isFile
        ? "Vagas reais serão exibidas quando o site estiver no ar. (Mostrando exemplo)"
        : "Não foi possível carregar as vagas no momento. (Mostrando exemplo)";
      renderVagasList(FALLBACK_VACANCIES, { isFallback: true, note });
      all = FALLBACK_VACANCIES.slice();
    } else {
      renderVagasList(all, { isFallback: false });
    }

    $("#qCargo")?.addEventListener("input", () => applyVagasFilter(all));
    $("#qCidade")?.addEventListener("input", () => applyVagasFilter(all));
    applyVagasFilter(all);
  }


  /* =========================
     Apresentação – Vagas como slides
  ========================== */
  function vacancyToSlide(v, meta={}) {
    const group = v.group || "admin";
    const label = groupLabel(group);
    const isFallback = !!meta.isFallback;

    return {
      title: v.title || "Vaga",
      sub: `${v.location ? v.location + " • " : ""}${label} • Cód. ${v.id}${isFallback ? " • Exemplo" : ""}`,
      bg: getVacancyImage(v),
      pill: "Vaga"
    };
  }

  async function initPresentationVacancies(){
    // Carrega vagas (API se habilitada; senão fallback) para usar no slideshow
    let all = null;
    try{
      all = await fetchVacanciesFromApi();
    } catch (e){
      all = null;
    }

    let meta = { isFallback: false };
    if(!all || !all.length){
      all = FALLBACK_VACANCIES.slice();
      meta.isFallback = true;
    }

    const vacancySlides = all.map(v => vacancyToSlide(v, meta));

    // remover vagas inseridas anteriormente para evitar duplicação em reinicializações
    SLIDES = SLIDES.filter(s => s.pill !== "Vaga");
    if(!vacancySlides.length) return;

    // Inserir após o slide "Carreira" (mantém narrativa)
    const idxCarreira = SLIDES.findIndex(s => (s.pill || "").toLowerCase() === "carreira" || (s.title || "").toLowerCase() === "carreira");
    const insertAt = idxCarreira >= 0 ? idxCarreira + 1 : SLIDES.length;

    SLIDES.splice(insertAt, 0, ...vacancySlides);

    // Se a apresentação estiver ativa, garantir limites
    if(currentSlide >= SLIDES.length) currentSlide = 0;
  }

  /* =========================
     Boot
  ========================== */
  window.addEventListener("DOMContentLoaded", () => {
    wirePresentationButton();
    wireIdle();
    initPresentationVacancies();
    initVagasPage();
  });

  // Expor para debug/uso externo
  window.startPresentation = startPresentation;
  window.stopPresentation = stopPresentation;

})();