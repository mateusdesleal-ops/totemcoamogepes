(() => {
  "use strict";

  const STORAGE_KEY = "coamoTotemSettingsV2";
  const DEFAULT_SETTINGS = {
    slideSeconds: 9,
    inactivitySeconds: 60,
    raffleEnabled: true,
    autoPresentation: true,
  };

  const API_ENDPOINT = "/api/vagas";
  const page = document.body?.dataset?.page || "";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return { ...DEFAULT_SETTINGS, ...saved };
    } catch (_) {
      return { ...DEFAULT_SETTINGS };
    }
  }

  let settings = loadSettings();

  function saveSettings(next) {
    settings = { ...settings, ...next };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (_) {}
    applyFeatureFlags();
    resetIdleTimers();
  }

  function applyFeatureFlags() {
    $$('[data-feature="raffle"]').forEach(el => {
      el.classList.toggle("is-feature-hidden", !settings.raffleEnabled);
    });
    if (page === "raffle" && !settings.raffleEnabled) {
      window.location.replace("index.html?interactive=1");
    }
  }

  function normalizeText(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function firstUseful(...values) {
    for (const value of values) {
      if (value === null || value === undefined) continue;
      if (typeof value === "string" || typeof value === "number") {
        const str = String(value).trim();
        if (str && str !== "[object Object]") return str;
      }
    }
    return "";
  }

  /* =========================
     VAGAS / SELECTY
  ========================== */
  const PREVIEW_VACANCIES = [
    { id: "43061", title: "Mecânico de Manutenção", location: "Campo Mourão, PR", group: "industria" },
    { id: "43062", title: "Vigilante", location: "Campo Mourão, PR", group: "industria" },
    { id: "43063", title: "Profissional de Tecnologia da Informação", location: "Campo Mourão, PR", group: "admin" },
    { id: "43064", title: "Estágio", location: "Campo Mourão, PR", group: "admin" },
    { id: "43065", title: "Assistente Operacional", location: "Paranaguá, PR", group: "agro" },
    { id: "43066", title: "Classificador de Produtos Agrícolas", location: "Ibiporã, PR", group: "agro" },
  ];

  const VACANCY_IMAGE_RULES = [
    { keys: ["veterin"], img: "assets/vaga_fotos/medico_a_veterinario_a.jpg" },
    { keys: ["tecnolog", "sistema", "software", "desenvolv", "program", "suporte", "infra", "devops", "dados", "ti"], img: "assets/vaga_fotos/vagas_de_ti.jpg" },
    { keys: ["mecan", "veicul", "oficina", "manutencao"], img: "assets/vaga_fotos/mecanico_de_veiculos.jpg" },
    { keys: ["vigilant", "seguranc", "portaria", "controlador de acesso"], img: "assets/vaga_fotos/vigilante.jpeg" },
    { keys: ["zelador", "limpeza", "higien", "copeir"], img: "assets/vaga_fotos/zeladora.jpg" },
    { keys: ["aprendiz", "jovem aprendiz", "estagio", "estagiario"], img: "assets/vaga_fotos/aprendiz.jpg" },
    { keys: ["ajudant", "servicos gerais", "auxiliar de servicos"], img: "assets/vaga_fotos/ajudantes.jpg" },
    { keys: ["fiacao", "eletric", "eletro", "cabos", "fios"], img: "assets/vaga_fotos/vagas_com_a_palavra_de_fiacao.jpg" },
    { keys: ["agro", "campo", "fazenda", "lavour", "graos", "agric", "classificador", "maquinista"], img: "assets/vaga_fotos/agro.jpg" },
  ];

  function pickJobsArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];
    const candidates = [
      payload.vacancies, payload.data, payload.jobs, payload.items, payload.results, payload.rows,
      payload.data?.vacancies, payload.data?.jobs, payload.data?.items,
      payload.payload?.vacancies, payload.payload?.jobs,
    ];
    return candidates.find(Array.isArray) || [];
  }

  function getLocation(job) {
    const loc = job?.location;
    if (typeof loc === "string" && loc.trim()) return loc.trim();
    if (loc && typeof loc === "object") {
      const city = firstUseful(loc.city, loc.name, loc.locality);
      const state = firstUseful(loc.state, loc.state_code, loc.uf);
      if (city || state) return [city, state].filter(Boolean).join(", ");
    }

    const city = firstUseful(
      job?.city, job?.address_city, job?.work_city, job?.municipality,
      job?.workplace_city, job?.unit_city, job?.cidade
    );
    const state = firstUseful(job?.state, job?.state_code, job?.uf, job?.address_state, job?.estado);
    if (city || state) return [city, state].filter(Boolean).join(", ");

    return firstUseful(job?.unit, job?.workplace, job?.address, job?.local);
  }

  function guessGroup(job) {
    const raw = normalizeText([
      job?.group, job?.area, job?.department, job?.category, job?.segment,
      job?.business_unit, job?.title, job?.name, job?.position
    ].filter(Boolean).join(" "));
    if (/industr|produc|manutenc|mecan|eletric|operador/.test(raw)) return "industria";
    if (/agro|campo|fazenda|agric|grao|cereal|classific|maquinista/.test(raw)) return "agro";
    return "admin";
  }

  function normalizeVacancy(job, idx) {
    return {
      id: firstUseful(job?.id, job?.code, job?.vacancy_id, job?.job_id, job?.codigo, idx + 1),
      title: firstUseful(job?.title, job?.name, job?.position, job?.job_title, job?.cargo, "Oportunidade"),
      location: getLocation(job) || "Localidade a consultar",
      group: guessGroup(job),
      raw: job,
    };
  }

  function groupLabel(group) {
    if (group === "industria") return "Indústria";
    if (group === "agro") return "Campo / Agro";
    return "Administrativo / Corporativo";
  }

  function getVacancyImage(v) {
    const text = normalizeText(`${v?.title || ""} ${v?.group || ""} ${v?.location || ""}`);
    for (const rule of VACANCY_IMAGE_RULES) {
      if (rule.keys.some(key => text.includes(normalizeText(key)))) return rule.img;
    }
    if (v?.group === "industria") return "assets/img_industria.jpg";
    if (v?.group === "agro") return "assets/img_agro.jpg";
    return "assets/img_admin.jpg";
  }

  const vacancyApiState = { status: "idle", error: "", count: 0 };

  async function fetchVacancies({ bustCache = false } = {}) {
    vacancyApiState.status = "loading";
    vacancyApiState.error = "";

    const suffix = bustCache ? `?all=1&per_page=100&_=${Date.now()}` : "?all=1&per_page=100";
    const res = await fetch(API_ENDPOINT + suffix, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    const raw = await res.text();
    let payload = null;
    try { payload = raw ? JSON.parse(raw) : null; } catch (_) {}

    if (!res.ok) {
      const detail = firstUseful(payload?.detail, payload?.error, raw, `HTTP ${res.status}`);
      const err = new Error(detail || `HTTP ${res.status}`);
      err.status = res.status;
      err.code = payload?.code || "VACANCY_API_ERROR";
      vacancyApiState.status = "error";
      vacancyApiState.error = err.message;
      throw err;
    }

    const jobs = pickJobsArray(payload);
    const unique = new Map();
    jobs.forEach((job, idx) => {
      const v = normalizeVacancy(job, idx);
      const key = String(v.id || `${v.title}|${v.location}`);
      if (!unique.has(key)) unique.set(key, v);
    });

    const result = Array.from(unique.values());
    vacancyApiState.status = "ok";
    vacancyApiState.count = result.length;
    vacancyApiState.error = "";
    return result;
  }

  function isLocalPreview() {
    return location.protocol === "file:" || ["localhost", "127.0.0.1"].includes(location.hostname);
  }

  let vacancyCachePromise = null;
  function getVacanciesCached() {
    if (!vacancyCachePromise) {
      vacancyCachePromise = fetchVacancies().catch(err => {
        if (isLocalPreview()) {
          vacancyApiState.status = "preview";
          vacancyApiState.error = err?.message || "API indisponível em ambiente local";
          return PREVIEW_VACANCIES.slice();
        }
        return [];
      });
    }
    return vacancyCachePromise;
  }

  function resetVacancyCache() {
    vacancyCachePromise = null;
  }

  function buildCityOptions(vacancies) {
    const select = $("#qCidade");
    if (!select) return;
    const cities = [...new Set(vacancies.map(v => v.location).filter(Boolean))]
      .sort((a,b) => a.localeCompare(b, "pt-BR"));
    cities.forEach(city => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      select.appendChild(option);
    });
  }

  function renderVacancies(list, total, isPreview = false) {
    const root = $("#vagasList");
    const count = $("#vagasCount");
    const status = $("#vagasStatus");
    if (!root) return;

    root.innerHTML = "";
    if (!list.length) {
      root.innerHTML = `<div class="vacancy-empty"><strong>Nenhuma vaga encontrada.</strong><span>Tente remover um dos filtros ou escaneie o QR Code para consultar o portal completo.</span></div>`;
    } else {
      list.forEach(v => {
        const item = document.createElement("article");
        item.className = "vagaItem";
        item.innerHTML = `
          <div class="vagaThumb"><img src="${escapeHtml(getVacancyImage(v))}" alt=""></div>
          <div class="vagaBody">
            <h3 class="vagaTitle">${escapeHtml(v.title)}</h3>
            <div class="vagaLoc">📍 ${escapeHtml(v.location)}</div>
            <div class="vagaTags">
              <span class="vagaTag">${escapeHtml(groupLabel(v.group))}</span>
              ${v.id ? `<span class="vagaTag">Cód. ${escapeHtml(v.id)}</span>` : ""}
              ${isPreview ? `<span class="vagaTag vagaTag--muted">Prévia</span>` : ""}
            </div>
          </div>`;
        root.appendChild(item);
      });
    }

    if (count) count.textContent = `${list.length} de ${total} oportunidade${total === 1 ? "" : "s"}`;
    if (status) {
      status.textContent = isPreview
        ? "Prévia local: as vagas reais serão carregadas quando o projeto estiver publicado na Vercel."
        : `${total} oportunidade${total === 1 ? "" : "s"} disponível${total === 1 ? "" : "is"} no momento.`;
    }
  }

  async function initVacanciesPage() {
    if (page !== "vagas") return;
    const root = $("#vagasList");
    if (!root) return;

    root.innerHTML = `<div class="vacancy-empty"><strong>Carregando oportunidades…</strong><span>Aguarde um instante.</span></div>`;
    const vacancies = await getVacanciesCached();
    const preview = isLocalPreview();

    if (!vacancies.length) {
      const count = $("#vagasCount");
      const status = $("#vagasStatus");
      const apiOk = vacancyApiState.status === "ok";
      if (count) count.textContent = apiOk ? "0 oportunidades" : "Integração indisponível";
      if (status) {
        status.textContent = apiOk
          ? "A integração está funcionando, mas não há oportunidades abertas retornadas pela Selecty neste momento."
          : "Não foi possível consultar a Selecty agora. No painel oculto do totem você pode testar a integração e ver o motivo técnico.";
      }
      root.innerHTML = apiOk
        ? `<div class="vacancy-empty"><strong>Nenhuma oportunidade aberta neste momento.</strong><span>O portal será atualizado automaticamente quando novas vagas forem publicadas.</span></div>`
        : `<div class="vacancy-empty vacancy-empty--error"><strong>Não foi possível carregar as oportunidades.</strong><span>O QR Code continua disponível para acesso direto ao portal. Para diagnóstico, mantenha o logo da Coamo pressionado por 3 segundos.</span><button class="btn btn--soft" id="retryVacancies" type="button">Tentar novamente</button></div>`;
      $("#retryVacancies")?.addEventListener("click", async () => {
        resetVacancyCache();
        initVacanciesPage();
      });
      return;
    }

    buildCityOptions(vacancies);
    const cargo = $("#qCargo");
    const city = $("#qCidade");
    const clear = $("#clearFilters");

    const apply = () => {
      const q = normalizeText(cargo?.value || "");
      const c = city?.value || "";
      const filtered = vacancies.filter(v => {
        const okCargo = !q || normalizeText(v.title).includes(q);
        const okCity = !c || v.location === c;
        return okCargo && okCity;
      });
      renderVacancies(filtered, vacancies.length, preview);
    };

    cargo?.addEventListener("input", apply);
    city?.addEventListener("change", apply);
    clear?.addEventListener("click", () => {
      if (cargo) cargo.value = "";
      if (city) city.value = "";
      apply();
      cargo?.focus();
    });
    apply();
  }

  /* =========================
     PRESENTATION MODE
  ========================== */
  const BASE_SLIDES = [
    {
      pill: "Coamo",
      title: "Uma história construída em cooperação.",
      sub: "Diferentes profissões, conhecimentos e experiências se conectam todos os dias para fazer uma grande operação acontecer.",
      bg: "assets/img_cultura.jpg",
      position: "center 40%",
    },
    {
      pill: "Campo & Cooperado",
      title: "Onde a relação com o produtor acontece.",
      sub: "Assistência técnica, atendimento, orientação e atividades ligadas à produção aproximam conhecimento, cooperado e resultado.",
      bg: "assets/agro_01.jpg",
      position: "center 48%",
      metric: { value: "+400", label: "Agrônomos e Veterinários" },
    },
    {
      pill: "Armazenagem & Operações",
      title: "Onde cada safra exige precisão.",
      sub: "Recebimento, classificação, movimentação, conservação e expedição conectam pessoas, equipamentos e processos.",
      bg: "assets/industria_03.jpg",
      position: "center 46%",
    },
    {
      pill: "Indústria & Qualidade",
      title: "Onde matéria-prima ganha novas possibilidades.",
      sub: "Produção, manutenção, controle de qualidade, segurança e eficiência fazem parte de uma operação industrial de grande escala.",
      bg: "assets/industria_01.jpg",
      position: "center 42%",
    },
    {
      pill: "Tecnologia & Dados",
      title: "Tecnologia por trás de uma operação que não para.",
      sub: "Sistemas, infraestrutura, dados, automação e soluções digitais dão suporte às decisões e aos processos do negócio.",
      bg: "assets/admin_04.jpg",
      position: "center 45%",
    },
    {
      pill: "Gestão & Áreas Corporativas",
      title: "Estrutura para transformar estratégia em execução.",
      sub: "Pessoas, finanças, engenharia, jurídico, comunicação, planejamento e outras especialidades sustentam a operação.",
      bg: "assets/admin_01.jpg",
      position: "center 42%",
    },
    {
      pill: "Trajetórias",
      title: "Carreiras são construídas com o tempo.",
      sub: "Conhecimento, experiência e novas responsabilidades fazem parte de uma trajetória profissional que continua evoluindo.",
      bg: "assets/depo_edivilson_bg.jpg",
      position: "center 42%",
      author: { name: "Edevilson Canali", role: "Supervisor de Soluções de Negócio", photo: "assets/depo_edivilson_avatar.jpg" },
    },
    {
      pill: "Oportunidades",
      title: "Seu próximo passo pode começar aqui.",
      sub: "Toque na tela para explorar as oportunidades ou continue pelo celular usando o QR Code.",
      bg: "assets/img_carreira.jpg",
      position: "center 42%",
      qr: true,
    },
  ];

  let slides = BASE_SLIDES.slice();
  let slideIndex = 0;
  let slideTimer = null;
  let presentationActive = false;

  function buildPresentationOverlay() {
    if ($("#presentationOverlay")) return;
    const overlay = document.createElement("section");
    overlay.id = "presentationOverlay";
    overlay.className = "presentation-overlay";
    overlay.setAttribute("aria-label", "Modo apresentação");
    overlay.innerHTML = `
      <div class="presentation-bg"><img class="presentation-photo" id="presentationPhoto" src="" alt=""></div>
      <div class="presentation-shade"></div>
      <div class="presentation-top">
        <div class="presentation-logo"><img src="assets/logo.png" alt="Coamo"></div>
        <div class="presentation-counter" id="presentationCounter">01 / 08</div>
      </div>
      <div class="presentation-content">
        <div class="presentation-pill" id="presentationPill"></div>
        <div class="presentation-title" id="presentationTitle"></div>
        <div class="presentation-sub" id="presentationSub"></div>
        <div class="presentation-metric" id="presentationMetric" hidden><strong id="presentationMetricValue"></strong><span id="presentationMetricLabel"></span></div>
        <div class="presentation-author" id="presentationAuthor" hidden>
          <img id="presentationAuthorPhoto" src="" alt="">
          <div><strong id="presentationAuthorName"></strong><span id="presentationAuthorRole"></span></div>
        </div>
      </div>
      <div class="presentation-qr" id="presentationQr">
        <img src="assets/qr-selecty.png" alt="QR Code para oportunidades">
        <strong>Conheça as oportunidades</strong>
        <span>Aponte a câmera do celular para continuar.</span>
      </div>
      <div class="presentation-bottom">
        <div class="presentation-progress" id="presentationProgress"></div>
        <div class="presentation-hint"><span>Toque na tela</span> para explorar <b>→</b></div>
      </div>`;
    document.body.appendChild(overlay);

    overlay.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      stopPresentation(true);
    }, { passive: false });
  }

  function renderProgress() {
    const root = $("#presentationProgress");
    if (!root) return;
    root.style.setProperty("--slide-duration", `${Math.max(5, Number(settings.slideSeconds) || 9)}s`);
    root.innerHTML = slides.map((_, i) => `<i class="${i === slideIndex ? "is-active" : ""}"></i>`).join("");
    const counter = $("#presentationCounter");
    if (counter) counter.textContent = `${String(slideIndex + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
  }

  function renderSlide(index) {
    const s = slides[index % slides.length];
    const overlay = $("#presentationOverlay");
    const photo = $("#presentationPhoto");
    if (!overlay || !photo || !s) return;

    photo.src = s.bg;
    photo.style.objectPosition = s.position || "center center";
    photo.onload = () => {
      const ratio = photo.naturalWidth && photo.naturalHeight ? photo.naturalHeight / photo.naturalWidth : 0;
      overlay.classList.toggle("is-portrait", ratio > 1.15);
    };

    $("#presentationPill").textContent = s.pill || "Coamo";
    $("#presentationTitle").textContent = s.title || "";
    $("#presentationSub").textContent = s.sub || "";

    const metric = $("#presentationMetric");
    if (s.metric) {
      metric.hidden = false;
      $("#presentationMetricValue").textContent = s.metric.value || "";
      $("#presentationMetricLabel").textContent = s.metric.label || "";
    } else {
      metric.hidden = true;
    }

    const author = $("#presentationAuthor");
    if (s.author) {
      author.hidden = false;
      $("#presentationAuthorPhoto").src = s.author.photo || "";
      $("#presentationAuthorName").textContent = s.author.name || "";
      $("#presentationAuthorRole").textContent = s.author.role || "";
    } else {
      author.hidden = true;
    }

    const qr = $("#presentationQr");
    qr.classList.toggle("is-visible", !!s.qr);
    overlay.classList.toggle("presentation-cta", !!s.qr);

    photo.style.animation = "none";
    void photo.offsetWidth;
    photo.style.animation = "";
    renderProgress();
  }

  async function enrichPresentationWithVacancies() {
    const vacancies = await getVacanciesCached();
    if (!vacancies.length) return;
    const vacancySlides = vacancies.slice(0, 4).map(v => ({
      pill: "Oportunidade em destaque",
      title: v.title,
      sub: `${v.location} • ${groupLabel(v.group)}${v.id ? ` • Cód. ${v.id}` : ""}`,
      bg: getVacancyImage(v),
    }));
    slides = [...BASE_SLIDES.slice(0, -1), ...vacancySlides.slice(0, 3), BASE_SLIDES[BASE_SLIDES.length - 1]];
    if (presentationActive) {
      if (slideIndex >= slides.length) slideIndex = 0;
      renderProgress();
    }
  }

  function startPresentation(source = "manual") {
    if (page !== "home") {
      window.location.href = "index.html?present=1";
      return;
    }
    buildPresentationOverlay();
    resetSensitiveData();
    presentationActive = true;
    slideIndex = 0;
    const overlay = $("#presentationOverlay");
    overlay.classList.add("is-active");
    renderSlide(slideIndex);
    clearInterval(slideTimer);
    slideTimer = setInterval(() => {
      slideIndex = (slideIndex + 1) % slides.length;
      renderSlide(slideIndex);
    }, Math.max(5, Number(settings.slideSeconds) || 9) * 1000);
    clearIdleTimers();
    if (source === "manual") {
      try { history.replaceState(null, "", "index.html?present=1"); } catch (_) {}
    }
  }

  function stopPresentation(userInitiated = false) {
    const overlay = $("#presentationOverlay");
    overlay?.classList.remove("is-active");
    presentationActive = false;
    clearInterval(slideTimer);
    slideTimer = null;
    if (userInitiated) {
      try { history.replaceState(null, "", "index.html?interactive=1"); } catch (_) {}
    }
    resetIdleTimers();
  }

  function initPresentationButtons() {
    $$(".js-start-presentation").forEach(btn => btn.addEventListener("click", startPresentation));
  }

  function maybeAutoStartPresentation() {
    if (page !== "home") return;
    const params = new URLSearchParams(location.search);
    const interactive = params.get("interactive") === "1";
    const forcePresent = params.get("present") === "1";
    if (forcePresent || (settings.autoPresentation && !interactive)) {
      window.setTimeout(() => startPresentation(forcePresent ? "idle" : "auto"), 300);
    }
  }

  /* =========================
     IDLE / KIOSK RESET
  ========================== */
  let warningTimer = null;
  let idleTimer = null;
  let countdownTimer = null;

  function buildIdleWarning() {
    if ($("#idleWarning")) return;
    const el = document.createElement("div");
    el.id = "idleWarning";
    el.className = "idle-warning";
    el.innerHTML = `<div><strong>Retornando à apresentação em <b id="idleCountdown">10</b>s</strong><span>Toque em continuar para permanecer nesta tela.</span></div><button type="button" id="idleContinue">Continuar</button>`;
    document.body.appendChild(el);
    $("#idleContinue")?.addEventListener("click", resetIdleTimers);
  }

  function clearIdleTimers() {
    clearTimeout(warningTimer);
    clearTimeout(idleTimer);
    clearInterval(countdownTimer);
    warningTimer = idleTimer = countdownTimer = null;
    $("#idleWarning")?.classList.remove("is-visible");
  }

  function showIdleWarning(seconds = 10) {
    buildIdleWarning();
    const warning = $("#idleWarning");
    const count = $("#idleCountdown");
    let remaining = seconds;
    if (count) count.textContent = remaining;
    warning?.classList.add("is-visible");
    clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      remaining -= 1;
      if (count) count.textContent = Math.max(0, remaining);
      if (remaining <= 0) clearInterval(countdownTimer);
    }, 1000);
  }

  function resetSensitiveData() {
    const form = $("#sorteioForm");
    if (form) {
      try { form.reset(); } catch (_) {}
      $("#sorteioSuccess")?.classList.remove("is-visible");
    }
    if ($("#qCargo")) $("#qCargo").value = "";
    if ($("#qCidade")) $("#qCidade").value = "";
  }

  function returnToPresentation() {
    clearIdleTimers();
    resetSensitiveData();
    if (page === "home") startPresentation("idle");
    else window.location.replace("index.html?present=1");
  }

  function resetIdleTimers() {
    if (presentationActive) return;
    clearIdleTimers();
    const total = Math.max(30, Number(settings.inactivitySeconds) || 60);
    const warningAt = Math.max(1, total - 10);
    warningTimer = setTimeout(() => showIdleWarning(10), warningAt * 1000);
    idleTimer = setTimeout(returnToPresentation, total * 1000);
  }

  function initIdleTracking() {
    ["pointerdown", "touchstart", "keydown"].forEach(evt => {
      window.addEventListener(evt, () => {
        if (!presentationActive) resetIdleTimers();
      }, { passive: true });
    });
    resetIdleTimers();
  }

  /* =========================
     RAFFLE FORM
  ========================== */
  function initRaffleForm() {
    const form = $("#sorteioForm");
    const phone = $("#sorteioTel");
    const success = $("#sorteioSuccess");
    if (!form) return;

    function maskPhone(value) {
      const d = String(value || "").replace(/\D/g, "").slice(0, 11);
      if (d.length <= 2) return d;
      if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
      if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
      return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
    }

    phone?.addEventListener("input", () => { phone.value = maskPhone(phone.value); });
    form.addEventListener("submit", () => {
      success?.classList.remove("is-visible");
      window.setTimeout(() => {
        success?.classList.add("is-visible");
        try { form.reset(); } catch (_) {}
        resetIdleTimers();
      }, 800);
    });
  }

  function vacancyApiStatusText() {
    if (vacancyApiState.status === "ok") return `Conectado à Selecty • ${vacancyApiState.count} vaga(s) recebida(s)`;
    if (vacancyApiState.status === "loading") return "Testando integração…";
    if (vacancyApiState.status === "preview") return "Prévia local • a API real funciona somente publicada na Vercel";
    if (vacancyApiState.status === "error") return vacancyApiState.error || "Falha na integração";
    return "Ainda não testado nesta sessão";
  }

  function updateAdminApiStatus() {
    const el = $("#adminApiStatus");
    if (!el) return;
    el.textContent = vacancyApiStatusText();
    el.dataset.state = vacancyApiState.status;
  }

  async function testVacancyIntegration() {
    const btn = $("#adminTestApi");
    if (btn) { btn.disabled = true; btn.textContent = "Testando…"; }
    vacancyApiState.status = "loading";
    updateAdminApiStatus();
    try {
      resetVacancyCache();
      const vacancies = await fetchVacancies({ bustCache: true });
      vacancyApiState.status = "ok";
      vacancyApiState.count = vacancies.length;
    } catch (err) {
      vacancyApiState.status = "error";
      vacancyApiState.error = err?.message || "Falha na integração";
    } finally {
      updateAdminApiStatus();
      if (btn) { btn.disabled = false; btn.textContent = "Testar agora"; }
    }
  }

  /* =========================
     HIDDEN ADMIN PANEL
  ========================== */
  let adminPressTimer = null;
  let adminOpenedByPress = false;

  function buildAdminModal() {
    if ($("#adminModal")) return;
    const modal = document.createElement("div");
    modal.id = "adminModal";
    modal.className = "admin-modal";
    modal.innerHTML = `
      <section class="admin-card" role="dialog" aria-modal="true" aria-label="Configurações do totem">
        <div class="admin-card__head">
          <div><h2>Configurações do totem</h2><p>Estas preferências ficam salvas apenas neste navegador.</p></div>
          <button type="button" class="admin-close" id="adminClose" aria-label="Fechar">×</button>
        </div>
        <div class="admin-grid">
          <label class="admin-field"><span>Tempo de cada slide</span><input id="adminSlideSeconds" type="number" min="5" max="30" step="1"></label>
          <label class="admin-field"><span>Retorno por inatividade</span><input id="adminIdleSeconds" type="number" min="30" max="300" step="5"></label>
          <label class="admin-field"><span>Sorteio</span><select id="adminRaffle"><option value="1">Exibir</option><option value="0">Ocultar</option></select></label>
          <label class="admin-field"><span>Apresentação ao abrir</span><select id="adminAuto"><option value="1">Ativar</option><option value="0">Desativar</option></select></label>
        </div>
        <div class="admin-api-panel">
          <div><strong>Integração de vagas</strong><span id="adminApiStatus">Ainda não testado nesta sessão</span></div>
          <button type="button" class="btn btn--soft" id="adminTestApi">Testar agora</button>
        </div>
        <p class="admin-note">Para abrir este painel novamente, mantenha o logo da Coamo pressionado por aproximadamente 3 segundos.</p>
        <div class="admin-actions"><button type="button" class="btn btn--soft" id="adminCancel">Cancelar</button><button type="button" class="btn btn--primary" id="adminSave">Salvar</button></div>
      </section>`;
    document.body.appendChild(modal);

    const close = () => modal.classList.remove("is-open");
    $("#adminClose")?.addEventListener("click", close);
    $("#adminCancel")?.addEventListener("click", close);
    modal.addEventListener("pointerdown", e => { if (e.target === modal) close(); });
    $("#adminSave")?.addEventListener("click", () => {
      saveSettings({
        slideSeconds: Math.min(30, Math.max(5, Number($("#adminSlideSeconds")?.value) || 9)),
        inactivitySeconds: Math.min(300, Math.max(30, Number($("#adminIdleSeconds")?.value) || 60)),
        raffleEnabled: $("#adminRaffle")?.value !== "0",
        autoPresentation: $("#adminAuto")?.value !== "0",
      });
      close();
    });
    $("#adminTestApi")?.addEventListener("click", testVacancyIntegration);
  }

  function openAdmin() {
    buildAdminModal();
    $("#adminSlideSeconds").value = settings.slideSeconds;
    $("#adminIdleSeconds").value = settings.inactivitySeconds;
    $("#adminRaffle").value = settings.raffleEnabled ? "1" : "0";
    $("#adminAuto").value = settings.autoPresentation ? "1" : "0";
    updateAdminApiStatus();
    $("#adminModal")?.classList.add("is-open");
  }

  function initAdminTrigger() {
    $$(".js-admin-trigger").forEach(trigger => {
      const cancel = () => { clearTimeout(adminPressTimer); adminPressTimer = null; };
      trigger.addEventListener("pointerdown", () => {
        adminOpenedByPress = false;
        cancel();
        adminPressTimer = setTimeout(() => {
          adminOpenedByPress = true;
          openAdmin();
        }, 2600);
      });
      trigger.addEventListener("pointerup", cancel);
      trigger.addEventListener("pointercancel", cancel);
      trigger.addEventListener("pointerleave", cancel);
      trigger.addEventListener("click", e => {
        if (adminOpenedByPress) {
          e.preventDefault();
          adminOpenedByPress = false;
        }
      });
    });
  }

  /* =========================
     BOOT
  ========================== */
  window.addEventListener("DOMContentLoaded", () => {
    applyFeatureFlags();
    initPresentationButtons();
    initAdminTrigger();
    initRaffleForm();
    initVacanciesPage();
    initIdleTracking();
    enrichPresentationWithVacancies();
    maybeAutoStartPresentation();
  });

  window.startPresentation = startPresentation;
  window.stopPresentation = stopPresentation;
})();
