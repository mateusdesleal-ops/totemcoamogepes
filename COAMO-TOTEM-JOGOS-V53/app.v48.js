(() => {
  "use strict";
  function syncTotemViewportMode(){
    const portrait = window.innerHeight > window.innerWidth && window.innerWidth <= 1250;
    document.documentElement.classList.toggle("is-totem-portrait", portrait);
  }
  syncTotemViewportMode();
  window.addEventListener("resize", syncTotemViewportMode, { passive:true });

  document.documentElement.dataset.totemBuild = "v53-games-pwa";

  const STORAGE_KEY = "coamoTotemSettingsV3";
  const BUILD_VERSION = "v53-games-pwa";
  const GAME_ACCESS_MIGRATION_KEY = "coamoGamesAccessV53";
  const DEFAULT_SETTINGS = {
    slideSeconds: 9,
    inactivitySeconds: 60,
    raffleEnabled: true,
    autoPresentation: true,
    showInternship: true,
    showInternshipLogo: true,
    showUnicoamo: true,
    showQualityOfLife: true,
    showCoamoSaude: true,
    showFups: true,
    showArcam: true,
    gamesEnabled: true,
    gameProfileEnabled: true,
    gameMemoryEnabled: true,
    gameChainEnabled: true,
    gameGrainEnabled: true,
  };

  const API_ENDPOINT = "/api/vagas";
  const page = document.body?.dataset?.page || "";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const loaded = { ...DEFAULT_SETTINGS, ...saved, showInternshipLogo: true };

      // V53: corrige totens que ficaram com jogos antigos desativados no localStorage.
      // A migração roda somente uma vez neste equipamento; depois o painel volta a
      // controlar normalmente as opções.
      try {
        if (localStorage.getItem(GAME_ACCESS_MIGRATION_KEY) !== BUILD_VERSION) {
          loaded.gamesEnabled = true;
          loaded.gameProfileEnabled = true;
          loaded.gameMemoryEnabled = true;
          loaded.gameChainEnabled = true;
          loaded.gameGrainEnabled = true;
          localStorage.setItem(GAME_ACCESS_MIGRATION_KEY, BUILD_VERSION);
        }
      } catch (_) {}

      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded)); } catch (_) {}
      return loaded;
    } catch (_) {
      return { ...DEFAULT_SETTINGS, showInternshipLogo: true };
    }
  }

  let settings = loadSettings();

  function saveSettings(next) {
    settings = { ...settings, ...next, showInternshipLogo: true };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (_) {}
    applyFeatureFlags();
    resetIdleTimers();
    refreshPresentationSlides();
  }

  function applyFeatureFlags() {
    $$('[data-feature="raffle"]').forEach(el => {
      el.classList.toggle("is-feature-hidden", !settings.raffleEnabled);
    });
    $$('[data-feature="games"]').forEach(el => {
      el.classList.toggle("is-feature-hidden", !settings.gamesEnabled);
    });
    $$('[data-feature="game-profile"]').forEach(el => {
      el.classList.toggle("is-feature-hidden", !settings.gameProfileEnabled || !settings.gamesEnabled);
    });
    $$('[data-feature="game-memory"]').forEach(el => {
      el.classList.toggle("is-feature-hidden", !settings.gameMemoryEnabled || !settings.gamesEnabled);
    });
    $$('[data-feature="game-chain"]').forEach(el => {
      el.classList.toggle("is-feature-hidden", !settings.gameChainEnabled || !settings.gamesEnabled);
    });
    $$('[data-feature="game-grain"]').forEach(el => {
      el.classList.toggle("is-feature-hidden", !settings.gameGrainEnabled || !settings.gamesEnabled);
    });
    if (page === "raffle" && !settings.raffleEnabled) {
      window.location.replace("index.html?interactive=1");
    }
    if ((page === "games" || page.startsWith("game-")) && !settings.gamesEnabled) {
      window.location.replace("index.html?interactive=1");
    }
    if (page === "game-profile" && !settings.gameProfileEnabled) window.location.replace("jogos.html");
    if (page === "game-memory" && !settings.gameMemoryEnabled) window.location.replace("jogos.html");
    if (page === "game-chain" && !settings.gameChainEnabled) window.location.replace("jogos.html");
    if (page === "game-grain" && !settings.gameGrainEnabled) window.location.replace("jogos.html");
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

  // As imagens das vagas são escolhidas a partir do conteúdo publicado na Selecty.
  // A classificação usa título, área, descrição e requisitos. Quando não existe
  // correspondência confiável com uma função, usamos uma estrutura real da Coamo
  // — preferencialmente da mesma localidade — em vez de uma foto de pessoa sem relação.
  const VACANCY_PHOTO_PROFILES = [
    {
      id: "veterinaria",
      images: ["assets/vaga_fotos/veterinaria_real.jpg", "assets/vaga_fotos/medico_a_veterinario_a.jpg"],
      strong: ["medico veterinario", "medica veterinaria", "veterinario", "veterinaria", "zootecnista"],
      context: ["sanidade animal", "saude animal", "pecuaria", "rebanho", "atendimento veterinario"],
    },
    {
      id: "engenharia_eletrica",
      images: ["assets/vaga_fotos/engenheiro_eletricista.jpg"],
      strong: ["engenheiro eletricista", "engenheira eletricista", "engenharia eletrica", "estagiario em engenharia eletrica", "estagiaria em engenharia eletrica"],
      context: ["projetos eletricos", "instalacoes eletricas", "subestacao", "painel eletrico", "energia eletrica", "comandos eletricos"],
    },
    {
      id: "eletrica",
      images: ["assets/vaga_fotos/vagas_com_a_palavra_de_fiacao.jpg", "assets/industria_04.jpg", "assets/vaga_fotos/aprendiz_eletromecanica.jpg"],
      strong: ["eletricista", "eletrica", "eletromecanico", "eletromecanica", "eletrotecnico", "eletrotecnica"],
      context: ["fiacao", "cabos", "painel eletrico", "instalacao eletrica", "comandos eletricos", "manutencao eletrica"],
    },
    {
      id: "ti",
      images: ["assets/vaga_fotos/ti_infraestrutura.jpg", "assets/vaga_fotos/vagas_de_ti.jpg", "assets/vaga_fotos/outra_opcao_vaga_de_ti.jpg"],
      strong: ["tecnologia da informacao", "analista de sistemas", "desenvolvedor", "desenvolvedora", "programador", "programadora", "software", "devops", "infraestrutura de ti"],
      context: ["sistemas", "banco de dados", "rede de computadores", "suporte tecnico", "ciberseguranca", "dados", "automacao", "erp", "sql", "api", "servidor"],
    },
    {
      id: "mecanica",
      images: ["assets/vaga_fotos/mecanico_de_veiculos.jpg"],
      strong: ["mecanico", "mecanica", "mecanico de manutencao", "mecanico de veiculos", "mecanico automotivo"],
      context: ["oficina", "motor", "manutencao mecanica", "veiculos", "caminhoes", "frota", "lubrificacao"],
    },
    {
      id: "laboratorio",
      images: ["assets/vaga_fotos/sementes_laboratorio.jpg"],
      strong: ["laboratorista", "analista de laboratorio", "tecnico de laboratorio", "tecnica de laboratorio", "sementes"],
      context: ["laboratorio", "analises", "amostras", "germinacao", "qualidade de sementes", "controle laboratorial"],
    },
    {
      id: "ambiental",
      images: ["assets/vaga_fotos/engenharia_ambiental.jpg"],
      strong: ["engenheiro ambiental", "engenheira ambiental", "engenharia ambiental", "analista ambiental", "meio ambiente"],
      context: ["licenciamento ambiental", "gestao ambiental", "residuos", "efluentes", "sustentabilidade"],
    },
    {
      id: "seguranca",
      images: ["assets/vaga_fotos/vigilante.jpeg"],
      strong: ["vigilante", "seguranca patrimonial", "controlador de acesso", "porteiro", "portaria"],
      context: ["controle de acesso", "rondas", "patrimonio", "vigilancia", "seguranca"],
    },
    {
      id: "limpeza",
      images: ["assets/vaga_fotos/zeladora.jpg"],
      strong: ["zelador", "zeladora", "auxiliar de limpeza", "servicos de limpeza"],
      context: ["higienizacao", "limpeza", "conservacao de ambientes", "sanitizacao"],
    },
    {
      id: "aprendizagem",
      images: ["assets/vaga_fotos/aprendiz.jpg", "assets/vaga_fotos/aprendiz_eletromecanica.jpg"],
      strong: ["jovem aprendiz", "aprendiz", "estagiario", "estagiaria", "estagio"],
      context: ["programa de aprendizagem", "primeiro emprego", "formacao profissional"],
    },
    {
      id: "operacional",
      images: ["assets/vaga_fotos/ajudantes.jpg", "assets/vaga_fotos/adm_operacional.jpg"],
      strong: ["ajudante de servicos gerais", "ajudante de armazenista", "ajudante de maquinista", "auxiliar de servicos gerais", "movimentador de mercadorias", "assistente operacional"],
      context: ["carga e descarga", "movimentacao de mercadorias", "apoio operacional", "limpeza operacional", "armazenagem", "controle operacional"],
    },
    {
      id: "agro",
      images: ["assets/vaga_fotos/agro.jpg", "assets/vaga_fotos/agro_2.jpg", "assets/vaga_fotos/agro_4.jpg"],
      strong: ["agronomo", "agronoma", "engenheiro agronomo", "engenheira agronoma", "classificador de produtos agricolas", "maquinista de cereais", "tecnico agricola", "tecnica agricola"],
      context: ["lavoura", "cooperado", "assistencia tecnica", "producao agricola", "agricultura", "graos", "cereais", "soja", "milho", "trigo", "recebimento de graos", "classificacao de graos", "armazenagem de graos", "secagem de graos"],
    },
    {
      id: "industria",
      images: ["assets/industria_01.jpg", "assets/industria_03.jpg", "assets/industria_05.jpg"],
      strong: ["operador industrial", "operadora industrial", "operador de producao", "operadora de producao", "tecnico de producao", "tecnica de producao", "assistente de utilidades"],
      context: ["processo industrial", "linha de producao", "industria", "controle de processo", "qualidade industrial", "equipamentos industriais", "utilidades", "vapor", "caldeira", "ar comprimido", "tratamento de agua"],
    },
  ];

  const COAMO_STRUCTURE_IMAGES = [
    "assets/estruturas/estrutura_campo_mourao_aerea.jpg",
    "assets/estruturas/estrutura_unidade_aerea.jpg",
    "assets/estruturas/estrutura_parque_industrial.jpg",
    "assets/estruturas/estrutura_industria_dourados.jpg",
    "assets/estruturas/estrutura_terminal_paranagua.jpg",
    "assets/estruturas/estrutura_industrial_predio.jpg",
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

  function htmlToPlainText(value) {
    return String(value ?? "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  function vacancyPublishedText(job) {
    // Campos documentados pelo Jobfeed da Selecty. A descrição e os requisitos
    // publicados no portal têm prioridade para classificar a imagem.
    const title = htmlToPlainText(firstUseful(job?.occupation, job?.title, job?.name, job?.position, job?.job_title, job?.cargo));
    const area = htmlToPlainText(firstUseful(job?.actingArea, job?.acting_area, job?.area, job?.department, job?.category));
    const description = htmlToPlainText(firstUseful(job?.description, job?.activities, job?.job_description, job?.descricao));
    const requirements = htmlToPlainText(firstUseful(job?.requirements, job?.qualification, job?.qualifications, job?.requisitos));
    const employer = htmlToPlainText(firstUseful(job?.employerDescription, job?.employer_description));
    return {
      title: normalizeText(title),
      area: normalizeText(area),
      description: normalizeText(description),
      requirements: normalizeText(requirements),
      employer: normalizeText(employer),
      combined: normalizeText([title, area, description, requirements, employer].filter(Boolean).join(" ")),
    };
  }

  function stableHash(value) {
    const str = String(value ?? "");
    let h = 2166136261;
    for (let i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function pickStructureFallback(job, stableKey = "") {
    const location = normalizeText(getLocation(job));
    if (location.includes("paranagua")) return "assets/estruturas/estrutura_terminal_paranagua.jpg";
    if (location.includes("campo mourao")) return "assets/estruturas/estrutura_parque_industrial.jpg";
    if (location.includes("dourados")) return "assets/estruturas/estrutura_industria_dourados.jpg";

    const published = vacancyPublishedText(job);
    const seed = `${stableKey}|${location}|${published.title}|${published.area}`;
    return COAMO_STRUCTURE_IMAGES[stableHash(seed) % COAMO_STRUCTURE_IMAGES.length];
  }

  function scorePhotoProfile(profile, published) {
    let score = 0;
    for (const key of profile.strong) {
      const k = normalizeText(key);
      if (published.title.includes(k)) score += 9;
      if (published.area.includes(k)) score += 6;
      if (published.description.includes(k)) score += 5;
      if (published.requirements.includes(k)) score += 4;
    }
    for (const key of profile.context) {
      const k = normalizeText(key);
      if (published.title.includes(k)) score += 5;
      if (published.area.includes(k)) score += 4;
      if (published.description.includes(k)) score += 2.5;
      if (published.requirements.includes(k)) score += 2;
    }
    return score;
  }

  function classifyVacancyPhoto(job, stableKey = "") {
    const published = vacancyPublishedText(job);
    let best = null;
    for (const profile of VACANCY_PHOTO_PROFILES) {
      const score = scorePhotoProfile(profile, published);
      if (!best || score > best.score) best = { profile, score };
    }

    // Limiar deliberadamente conservador. Se não houver relação segura com uma
    // função, usamos uma estrutura real da Coamo, evitando associar pessoas a cargos errados.
    if (!best || best.score < 6) {
      return {
        image: pickStructureFallback(job, stableKey),
        profile: "estrutura",
        score: best?.score || 0,
        basedOnDescription: !!published.description,
        fallback: true,
      };
    }

    const images = best.profile.images || [];
    const image = images.length
      ? images[stableHash(`${stableKey}|${published.title}|${best.profile.id}`) % images.length]
      : "";
    return { image, profile: best.profile.id, score: best.score, basedOnDescription: !!published.description };
  }

  function normalizeVacancy(job, idx) {
    const id = firstUseful(job?.id, job?.code, job?.vacancy_id, job?.job_id, job?.codigo, idx + 1);
    const title = firstUseful(job?.occupation, job?.title, job?.name, job?.position, job?.job_title, job?.cargo, "Oportunidade");
    const photo = classifyVacancyPhoto(job, id || title);
    const description = htmlToPlainText(firstUseful(job?.description, job?.activities, job?.job_description, job?.descricao, job?.summary, job?.resumo));
    return {
      id,
      title,
      location: getLocation(job) || "Localidade a consultar",
      group: guessGroup(job),
      description,
      photo,
      raw: job,
    };
  }

  function groupLabel(group) {
    if (group === "industria") return "Indústria";
    if (group === "agro") return "Campo / Agro";
    return "Administrativo / Corporativo";
  }

  function getVacancyImage(v) {
    return v?.photo?.image || "";
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
      root.innerHTML = `<div class="vacancy-empty"><strong>Nenhuma vaga encontrada.</strong><span>Tente remover um dos filtros para consultar todas as oportunidades disponíveis.</span></div>`;
    } else {
      list.forEach(v => {
        const item = document.createElement("article");
        item.className = "vagaItem vagaItem--textOnly";
        const description = String(v.description || "").trim();
        const descriptionHtml = description
          ? `<p class="vagaDescription">${escapeHtml(description.length > 180 ? description.slice(0, 177).trim() + "…" : description)}</p>`
          : `<p class="vagaDescription vagaDescription--muted">Consulte os detalhes completos da oportunidade no portal de vagas.</p>`;
        item.innerHTML = `
          <div class="vagaBody">
            <div class="vagaTopline">
              <span class="vagaTag">${escapeHtml(groupLabel(v.group))}</span>
              ${v.id ? `<span class="vagaTag vagaTag--muted">Cód. ${escapeHtml(v.id)}</span>` : ""}
            </div>
            <h3 class="vagaTitle">${escapeHtml(v.title)}</h3>
            <div class="vagaLoc">📍 ${escapeHtml(v.location)}</div>
            ${descriptionHtml}
            ${isPreview ? `<div class="vagaPreviewLabel">Prévia local</div>` : ""}
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
        : `<div class="vacancy-empty vacancy-empty--error"><strong>Não foi possível carregar as oportunidades.</strong><span>Para diagnóstico, mantenha o logo da Coamo pressionado por 3 segundos.</span><button class="btn btn--soft" id="retryVacancies" type="button">Tentar novamente</button></div>`;
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
      id: "coamo",
      pill: "Coamo",
      title: "Uma história construída em cooperação.",
      sub: "Diferentes profissões, conhecimentos e experiências se conectam todos os dias para fazer uma grande operação acontecer.",
      bg: "assets/img_cultura.jpg",
      position: "62% 30%",
    },
    {
      id: "campo",
      pill: "Campo & Cooperado",
      title: "Onde a relação com o produtor acontece.",
      sub: "Assistência técnica, atendimento, orientação e atividades ligadas à produção aproximam conhecimento, cooperado e resultado.",
      bg: "assets/agro_01.jpg",
      position: "56% 38%",
      metric: { value: "+400", label: "Agrônomos e Veterinários" },
    },
    {
      id: "operacoes",
      pill: "Armazenagem & Operações",
      title: "Onde cada safra exige precisão.",
      sub: "Recebimento, classificação, movimentação, conservação e expedição conectam pessoas, equipamentos e processos.",
      bg: "assets/industria_03.jpg",
      position: "50% 45%",
    },
    {
      id: "industria",
      pill: "Indústria & Qualidade",
      title: "Onde matéria-prima ganha novas possibilidades.",
      sub: "Produção, manutenção, controle de qualidade, segurança e eficiência fazem parte de uma operação industrial de grande escala.",
      bg: "assets/industria_01.jpg",
      position: "42% 42%",
    },
    {
      id: "tecnologia",
      pill: "Tecnologia & Dados",
      title: "Tecnologia por trás de uma operação que não para.",
      sub: "Sistemas, infraestrutura, dados, automação e soluções digitais dão suporte às decisões e aos processos do negócio.",
      bg: "assets/admin_ti_v38.jpg",
      position: "74% 34%",
    },
    {
      id: "gestao",
      pill: "Gestão & Áreas Corporativas",
      title: "Estrutura para transformar estratégia em execução.",
      sub: "Pessoas, finanças, engenharia, jurídico, comunicação, planejamento e outras especialidades sustentam a operação.",
      bg: "assets/admin_01.jpg",
      position: "54% 26%",
    },
    {
      id: "unicoamo",
      feature: "showUnicoamo",
      institutional: true,
      pill: "Desenvolvimento de Pessoas",
      title: "Conhecimento que une, cultura que transforma.",
      sub: "A Unicoamo fortalece o compromisso da Coamo com o desenvolvimento contínuo das pessoas, conectando conhecimento técnico, experiência prática, cultura organizacional e liderança para preparar profissionais para os desafios de hoje e do futuro.",
      brand: "assets/logo_unicoamo_v12.png",
      tags: ["Conhecimento técnico", "Experiência prática", "Cultura", "Liderança"],
    },
    {
      id: "qualidade-vida",
      feature: "showQualityOfLife",
      institutional: true,
      pill: "Qualidade de Vida",
      title: "Cuidado integral com as pessoas.",
      sub: "O Programa Qualidade de Vida promove ações estruturadas de saúde, valorização, engajamento e desenvolvimento emocional, reforçando o bem-estar, o pertencimento e a construção de ambientes de trabalho mais saudáveis.",
      brand: "assets/logo_qualidade_vida_v11.png",
      metric: { value: "4", label: "pilares de cuidado e bem-estar" },
      tags: ["Saúde integral", "Valorização e reconhecimento", "Engajamento social", "Cultura de saúde e maturidade emocional"],
    },
    {
      id: "coamo-saude",
      feature: "showCoamoSaude",
      institutional: true,
      pill: "Coamo + Saúde",
      title: "Cuidado disponível quando você precisa.",
      sub: "O Coamo + Saúde oferece atendimento digital de forma prática e acessível para funcionários e aprendizes, com serviços de saúde e cuidado disponíveis para apoiar o bem-estar no dia a dia.",
      brand: "assets/logo_coamo_saude_v11.png",
      metric: { value: "24/7", label: "atendimento médico e suporte de enfermagem" },
      tags: ["Médico clínico geral", "Psicologia", "Enfermagem", "Nutrição", "Educador físico", "Gestantes", "Segunda opinião médica"],
    },
    {
      id: "fups",
      feature: "showFups",
      institutional: true,
      pill: "Proteção à Saúde",
      title: "FUPS: proteção à saúde para quem faz parte da Coamo.",
      sub: "O FUPS é a Associação Fundo de Proteção à Saúde, um plano de saúde de autogestão criado em 1993 para atender exclusivamente os funcionários do grupo Coamo.",
      brand: "assets/logo_fups_v11.png",
      tags: ["Autogestão", "Saúde", "Funcionários do grupo Coamo"],
    },
    {
      id: "arcam",
      feature: "showArcam",
      institutional: true,
      pill: "Esporte, cultura, saúde e lazer",
      title: "Integração e bem-estar além do trabalho.",
      sub: "A ARCAM contribui para a qualidade de vida dos funcionários por meio de iniciativas voltadas ao esporte, à cultura, à saúde e ao lazer, fortalecendo vínculos e momentos de convivência.",
      brand: "assets/logo_arcam_v11.png",
      tags: ["Esporte", "Cultura", "Saúde", "Lazer"],
    },
    {
      id: "estagio",
      feature: "showInternship",
      institutional: true,
      pill: "Programa de Estágio",
      title: "111 oportunidades para começar uma trajetória na Coamo.",
      sub: "O Programa de Estágio conecta aprendizado acadêmico, experiência prática e desenvolvimento profissional, criando oportunidades para estudantes de diferentes áreas construírem sua trajetória na Coamo.",
      brand: "assets/logo_programa_estagios_v12.png",
      brandFallbackImage: "assets/logo_programa_estagios_v11.png",
      brandFallback: "Programa de Estágio",
      metric: { value: "111", label: "vagas de estágio" },
      tags: ["Engenharias", "Agronomia", "Veterinária", "Saúde", "Psicologia", "Tecnologia", "Alimentos", "Biotecnologia"],
    },
    {
      id: "estagio-formacoes",
      feature: "showInternship",
      institutional: true,
      pill: "Programa de Estágio",
      title: "Formações que encontram espaço na Coamo.",
      sub: "Há oportunidades para estudantes de Engenharias, Agronomia, Medicina Veterinária, Fisioterapia, Fonoaudiologia, Enfermagem, Psicologia, Tecnologia, Alimentos, Bioprocessos e Biotecnologia, entre outras formações ligadas ao desenvolvimento das operações e dos negócios da Coamo.",
      brand: "assets/logo_programa_estagios_v12.png",
      brandFallbackImage: "assets/logo_programa_estagios_v11.png",
      brandFallback: "Programa de Estágio",
      tags: ["Engenharias", "Agronomia", "Veterinária", "Saúde", "Psicologia", "Tecnologia", "Alimentos", "Biotecnologia"],
    },

  ];

  function isSlideEnabled(slide) {
    return !slide.feature || settings[slide.feature] !== false;
  }

  function getEnabledBaseSlides() {
    return BASE_SLIDES.filter(isSlideEnabled);
  }

  let slides = getEnabledBaseSlides();
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
      <div id="presentationBrandStage" hidden>
        <img id="presentationBrandImage" src="" alt="">
        <div id="presentationBrandFallback" hidden></div>
      </div>
      <div class="presentation-top">
        <div class="presentation-logo"><img src="assets/logo_verde.png" alt="Coamo"></div>
        <div class="presentation-counter" id="presentationCounter">01 / 08</div>
      </div>
      <div class="presentation-content">
        <div class="presentation-pill" id="presentationPill"></div>
        <div class="presentation-title" id="presentationTitle"></div>
        <div class="presentation-sub" id="presentationSub"></div>
        <div class="presentation-tags" id="presentationTags" hidden></div>
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

    const institutional = !!s.institutional;
    overlay.classList.toggle("is-institutional", institutional);
    overlay.classList.remove("is-portrait");
    overlay.dataset.slideMode = institutional ? "institutional" : "photo";
    overlay.dataset.slideId = s.id || "";

    const topLogo = $(".presentation-logo img");
    if (topLogo) topLogo.src = institutional ? "assets/logo_verde.png" : "assets/logo_verde.png";

    const photoLayer = $(".presentation-bg");
    const shadeLayer = $(".presentation-shade");
    if (institutional) {
      // Slides de programas internos NÃO usam fotografia. Escondemos a camada
      // inteira por JS, além do CSS, para não depender de cache/estilo anterior.
      if (photoLayer) { photoLayer.hidden = true; photoLayer.style.display = "none"; }
      if (shadeLayer) { shadeLayer.hidden = true; shadeLayer.style.display = "none"; }
      photo.removeAttribute("src");
      photo.style.display = "none";
      photo.style.animation = "none";
      photo.style.backgroundImage = "none";
    } else {
      if (photoLayer) { photoLayer.hidden = false; photoLayer.style.display = "block"; }
      if (shadeLayer) { shadeLayer.hidden = false; shadeLayer.style.display = "block"; }
      photo.style.display = "block";
      photo.src = s.bg || "";
      photo.style.objectPosition = s.position || "center center";
      photo.onload = () => {
        const ratio = photo.naturalWidth && photo.naturalHeight ? photo.naturalHeight / photo.naturalWidth : 0;
        overlay.classList.toggle("is-portrait", ratio > 1.15);
      };
    }

    $("#presentationPill").textContent = s.pill || "Coamo";
    $("#presentationTitle").textContent = s.title || "";
    $("#presentationSub").textContent = s.sub || "";

    const brandStage = $("#presentationBrandStage");
    const brandImage = $("#presentationBrandImage");
    const brandFallback = $("#presentationBrandFallback");
    const showBrand = !!s.brand;
    if (brandStage && brandImage && brandFallback && institutional) {
      brandStage.hidden = false;
      brandStage.style.display = "flex";

      // V51: sempre limpa o estado do slide anterior antes de trocar a marca.
      brandImage.onload = null;
      brandImage.onerror = null;
      brandImage.style.display = "none";
      brandImage.removeAttribute("src");
      brandFallback.hidden = true;
      brandFallback.style.display = "none";
      brandFallback.textContent = "";

      if (showBrand) {
        let triedFallbackImage = false;
        brandImage.alt = s.pill || "Marca";
        brandImage.style.display = "block";

        brandImage.onerror = () => {
          if (!triedFallbackImage && s.brandFallbackImage) {
            triedFallbackImage = true;
            brandImage.src = s.brandFallbackImage + "?v=51.0";
            return;
          }
          brandImage.onerror = null;
          brandImage.style.display = "none";
          brandImage.removeAttribute("src");
          brandFallback.hidden = false;
          brandFallback.style.display = "flex";
          brandFallback.textContent = s.brandFallback || s.pill || "Coamo";
        };

        brandImage.onload = () => {
          brandFallback.hidden = true;
          brandFallback.style.display = "none";
          brandFallback.textContent = "";
        };

        brandImage.src = s.brand + "?v=51.0";
      } else {
        brandFallback.hidden = false;
        brandFallback.style.display = "flex";
        brandFallback.textContent = s.brandFallback || s.pill || "Coamo";
      }
    } else if (brandStage && brandImage && brandFallback) {
      brandStage.hidden = true;
      brandStage.style.display = "none";
      brandImage.onload = null;
      brandImage.onerror = null;
      brandImage.style.display = "none";
      brandImage.removeAttribute("src");
      brandFallback.hidden = true;
      brandFallback.style.display = "none";
      brandFallback.textContent = "";
    }

    const tags = $("#presentationTags");
    if (tags && Array.isArray(s.tags) && s.tags.length) {
      tags.hidden = false;
      tags.style.display = "flex";
      tags.innerHTML = s.tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join("");
    } else if (tags) {
      tags.hidden = true;
      tags.style.display = "none";
      tags.innerHTML = "";
    }

    const metric = $("#presentationMetric");
    if (s.metric) {
      metric.hidden = false;
      metric.style.display = "flex";
      $("#presentationMetricValue").textContent = s.metric.value || "";
      $("#presentationMetricLabel").textContent = s.metric.label || "";
    } else {
      metric.hidden = true;
      metric.style.display = "none";
    }

    const author = $("#presentationAuthor");
    if (s.author) {
      author.hidden = false;
      author.style.display = "flex";
      const authorPhoto = $("#presentationAuthorPhoto");
      if (authorPhoto) {
        authorPhoto.hidden = true;
        authorPhoto.style.display = "none";
        authorPhoto.onload = () => {
          authorPhoto.hidden = false;
          authorPhoto.style.display = "block";
        };
        authorPhoto.onerror = () => {
          authorPhoto.hidden = true;
          authorPhoto.style.display = "none";
          authorPhoto.removeAttribute("src");
        };
        if (s.author.photo) authorPhoto.src = s.author.photo;
        else authorPhoto.removeAttribute("src");
      }
      $("#presentationAuthorName").textContent = s.author.name || "";
      $("#presentationAuthorRole").textContent = s.author.role || "";
    } else {
      author.hidden = true;
      author.style.display = "none";
      const authorPhoto = $("#presentationAuthorPhoto");
      if (authorPhoto) {
        authorPhoto.hidden = true;
        authorPhoto.style.display = "none";
        authorPhoto.removeAttribute("src");
      }
    }

    const qr = $("#presentationQr");
    qr.classList.toggle("is-visible", !!s.qr);
    overlay.classList.toggle("presentation-cta", !!s.qr);

    if (!institutional) {
      photo.style.animation = "none";
      void photo.offsetWidth;
      photo.style.animation = "";
    }
    renderProgress();
  }

  async function refreshPresentationSlides() {
    // O modo apresentação é exclusivamente institucional.
    // As vagas permanecem somente na página Vagas.
    slides = getEnabledBaseSlides();
    if (!slides.length) slides = BASE_SLIDES.filter(s => !s.feature).slice(0, 1);
    if (presentationActive) {
      if (slideIndex >= slides.length) slideIndex = 0;
      renderSlide(slideIndex);
    }
  }

  async function enrichPresentationWithVacancies() {
    // Mantido por compatibilidade: não inclui vagas na apresentação.
    return refreshPresentationSlides();
  }

  function startPresentation(source = "manual") {
    if (page !== "home") {
      window.location.href = "index.html?present=1";
      return;
    }
    buildPresentationOverlay();
    resetSensitiveData();
    presentationActive = true;
    const requestedSlideId = new URLSearchParams(location.search).get("slide");
    const requestedSlideIndex = requestedSlideId ? slides.findIndex(item => item.id === requestedSlideId) : -1;
    slideIndex = requestedSlideIndex >= 0 ? requestedSlideIndex : 0;
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
     JOGOS COAMO — V18
  ========================== */
  let gamesMemoryTimer = null;

  const PROFILE_AREAS = {
    campo: { title: "Campo & Cooperado", text: "Você demonstra afinidade com relacionamento, orientação e proximidade com a produção. Na Coamo, essa área conecta conhecimento técnico e cooperados.", image: "assets/quiz/v46/campo.png", icon: "🌾", accent: "campo" },
    operacoes: { title: "Armazenagem & Operações", text: "Seu perfil combina com ambientes dinâmicos, processos e execução. Essa área conecta recebimento, movimentação, conservação e expedição.", image: "assets/quiz/v46/operacao.png", icon: "🏗", accent: "operacoes" },
    industria: { title: "Indústria & Produção", text: "Você se identifica com produção, qualidade, manutenção e eficiência. A indústria transforma matéria-prima em novas possibilidades.", image: "assets/quiz/v46/operacao.png", icon: "⚙", accent: "industria" },
    tecnologia: { title: "Tecnologia & Dados", text: "Seu perfil aponta para soluções digitais, análise e inovação. Na Coamo, a tecnologia ajuda uma grande operação a continuar conectada.", image: "assets/quiz/v46/tecnologia.png", icon: "💻", accent: "tecnologia" },
    gestao: { title: "Gestão & Áreas Corporativas", text: "Você demonstra afinidade com planejamento, análise, organização e suporte à operação. Essa estrutura sustenta as decisões do negócio.", image: "assets/quiz/v46/gestao.png", icon: "👥", accent: "gestao" },
    pessoas: { title: "Pessoas & Desenvolvimento", text: "Seu perfil combina com relações humanas, cuidado, desenvolvimento e apoio às pessoas. É um universo importante para fortalecer cultura e crescimento.", image: "assets/quiz/v46/pessoas.png", icon: "🤝", accent: "pessoas" },
  };

  const PROFILE_QUESTIONS = [
    { question: "Em qual ambiente você mais se imagina trabalhando?", options: [
      { label: "Próximo ao campo e ao produtor", primary: "campo", scores: { campo: 3 } },
      { label: "Em uma operação dinâmica", primary: "operacoes", scores: { operacoes: 2, industria: 1 } },
      { label: "Com análise, gestão ou pessoas", primary: "gestao", scores: { gestao: 2, pessoas: 1 } },
    ]},
    { question: "Qual atividade parece mais interessante para você?", options: [
      { label: "Orientar e gerar relacionamento", primary: "campo", scores: { campo: 2, pessoas: 1 } },
      { label: "Resolver problemas com tecnologia", primary: "tecnologia", scores: { tecnologia: 3 } },
      { label: "Acompanhar produção e qualidade", primary: "industria", scores: { industria: 2, operacoes: 1 } },
    ]},
    { question: "O que mais chama sua atenção em um trabalho?", options: [
      { label: "Organização e ritmo da operação", primary: "operacoes", scores: { operacoes: 2, industria: 1 } },
      { label: "Aprendizado e desenvolvimento de pessoas", primary: "pessoas", scores: { pessoas: 3 } },
      { label: "Planejamento e estratégia", primary: "gestao", scores: { gestao: 3 } },
    ]},
    { question: "Qual frase combina mais com você?", options: [
      { label: "Gosto de ver o resultado prático do que faço", primary: "industria", scores: { industria: 2, operacoes: 1 } },
      { label: "Gosto de conectar sistemas, dados e soluções", primary: "tecnologia", scores: { tecnologia: 3 } },
      { label: "Gosto de estar próximo das pessoas", primary: "pessoas", scores: { pessoas: 2, campo: 1 } },
    ]},
    { question: "Qual cenário desperta mais interesse?", options: [
      { label: "Lavoura, produção e assistência", primary: "campo", scores: { campo: 3 } },
      { label: "Silos, recebimento e movimentação", primary: "operacoes", scores: { operacoes: 3 } },
      { label: "Projetos, números e decisões", primary: "gestao", scores: { gestao: 3 } },
    ]},
    { question: "Escolha a área que mais desperta curiosidade.", options: [
      { label: "Tecnologia e dados", primary: "tecnologia", scores: { tecnologia: 3 } },
      { label: "Indústria e processos", primary: "industria", scores: { industria: 3 } },
      { label: "Pessoas e desenvolvimento", primary: "pessoas", scores: { pessoas: 3 } },
    ]},
  ];

  const MEMORY_BASE_CARDS = [
    { pairId: "u", type: "logo", image: "assets/logo_unicoamo_v12.png", label: "Unicoamo" },
    { pairId: "u", type: "logo", image: "assets/logo_unicoamo_v12.png", label: "Unicoamo" },
    { pairId: "f", type: "logo", image: "assets/logo_fups_v11.png", label: "FUPS" },
    { pairId: "f", type: "logo", image: "assets/logo_fups_v11.png", label: "FUPS" },
    { pairId: "s", type: "logo", image: "assets/logo_coamo_saude_v11.png", label: "Coamo + Saúde" },
    { pairId: "s", type: "logo", image: "assets/logo_coamo_saude_v11.png", label: "Coamo + Saúde" },
    { pairId: "a", type: "logo", image: "assets/logo_arcam_v11.png", label: "ARCAM" },
    { pairId: "a", type: "logo", image: "assets/logo_arcam_v11.png", label: "ARCAM" },
    { pairId: "func", type: "fact", image: "assets/img_carreira.jpg", title: "+12 mil", subtitle: "" },
    { pairId: "func", type: "fact", image: "assets/img_carreira.jpg", title: "funcionários", subtitle: "" },
    { pairId: "coop", type: "fact", image: "assets/agro_01.jpg", title: "+32 mil", subtitle: "" },
    { pairId: "coop", type: "fact", image: "assets/agro_01.jpg", title: "cooperados", subtitle: "" },
    { pairId: "pr", type: "fact", image: "assets/mission/scene_storage.webp", title: "A maior empresa", subtitle: "do Paraná" },
    { pairId: "pr", type: "fact", image: "assets/mission/scene_arrival.webp", title: "A maior empresa", subtitle: "do Paraná" },
    { pairId: "latam", type: "fact", image: "assets/mission/scene_logistics.webp", title: "A maior cooperativa agrícola", subtitle: "da América Latina" },
    { pairId: "latam", type: "fact", image: "assets/mission/scene_logistics.webp", title: "A maior cooperativa agrícola", subtitle: "da América Latina" },
  ];

  const CHAIN_STEPS = [
    { id: "campo", title: "Campo", text: "Origem da produção e relacionamento com o cooperado.", image: "assets/agro_01.jpg", icon: "🌾", theme: "campo" },
    { id: "recebimento", title: "Recebimento", text: "Chegada, conferência e início do fluxo operacional.", image: "assets/mission/scene_arrival.webp", icon: "⬇", theme: "recebimento" },
    { id: "armazenagem", title: "Armazenagem", text: "Conservação, controle e organização dos produtos.", image: "assets/estruturas/estrutura_parque_industrial.jpg", icon: "◫", theme: "armazenagem" },
    { id: "industria", title: "Indústria", text: "Transformação da matéria-prima em novos produtos.", image: "assets/industria_05.jpg", icon: "⚙", theme: "industria" },
    { id: "logistica", title: "Logística", text: "Movimentação e conexão entre unidades e mercados.", image: "assets/vaga_fotos/mecanico_de_veiculos.jpg", icon: "🚚", theme: "logistica" },
    { id: "mercado", title: "Mercado", text: "Entrega final e presença no Brasil e no exterior.", image: "assets/mission/scene_logistics.webp", icon: "🌎", theme: "mercado" },
  ];

  function shuffle(list) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function playGameTone(kind = "tap") {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const map = { tap: [520, .045], flip: [650, .055], success: [880, .11], error: [210, .13] };
      const [freq, dur] = map[kind] || map.tap;
      osc.type = kind === "error" ? "square" : "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.08, ctx.currentTime + .01);
      gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + dur);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + dur + .02);
      window.setTimeout(() => ctx.close?.(), 260);
    } catch (_) {}
  }

  function burstConfetti() {
    const host = $("#gameConfetti");
    if (!host) return;
    host.innerHTML = "";
    const colors = ["#0b4d2b", "#19864a", "#f3b300", "#ffd95a", "#ffffff"];
    for (let i = 0; i < 42; i += 1) {
      const bit = document.createElement("i");
      bit.style.setProperty("--x", `${10 + Math.random() * 80}vw`);
      bit.style.setProperty("--dx", `${-110 + Math.random() * 220}px`);
      bit.style.setProperty("--r", `${Math.random() * 540}deg`);
      bit.style.setProperty("--d", `${.6 + Math.random() * .8}s`);
      bit.style.background = colors[i % colors.length];
      host.appendChild(bit);
    }
    host.classList.remove("is-bursting");
    void host.offsetWidth;
    host.classList.add("is-bursting");
    window.setTimeout(() => { host.classList.remove("is-bursting"); host.innerHTML = ""; }, 1700);
  }

  function pulseMascots(panelSelector, kind = "success") {
    const panel = $(panelSelector);
    if (!panel) return;
    panel.classList.remove("is-success-reaction", "is-error-reaction");
    void panel.offsetWidth;
    panel.classList.add(kind === "error" ? "is-error-reaction" : "is-success-reaction");
    window.setTimeout(() => panel.classList.remove("is-success-reaction", "is-error-reaction"), 700);
  }

  function initGamesPage() {
    if (page === "game-profile") { startProfileGame(); return; }
    if (page === "game-memory") { startMemoryGame(); return; }
    if (page === "game-chain") { startChainGame(); return; }
    if (page === "game-grain") { startGrainGame(); return; }
  }

  function updateGameSpeech(left, right) {
    const leftEl = $("#leftMascotSpeech");
    const rightEl = $("#rightMascotSpeech");
    if (left && leftEl) leftEl.textContent = left;
    if (right && rightEl) rightEl.textContent = right;
  }

  function startProfileGame() {
    const root = $("#profileGame");
    const progress = $("#profileProgressBar");
    if (!root) return null;
    let step = 0;
    let xp = 0;
    let choiceSequence = 0;
    const scores = { campo: 0, operacoes: 0, industria: 0, tecnologia: 0, gestao: 0, pessoas: 0 };
    const directHits = { campo: 0, operacoes: 0, industria: 0, tecnologia: 0, gestao: 0, pessoas: 0 };
    const lastChosen = { campo: -1, operacoes: -1, industria: -1, tecnologia: -1, gestao: -1, pessoas: -1 };

    const render = () => {
      if (progress) progress.style.width = `${(step / PROFILE_QUESTIONS.length) * 100}%`;
      if (step >= PROFILE_QUESTIONS.length) {
        const ranking = Object.keys(scores).sort((a, b) => {
          if (scores[b] !== scores[a]) return scores[b] - scores[a];
          if (directHits[b] !== directHits[a]) return directHits[b] - directHits[a];
          return lastChosen[b] - lastChosen[a];
        });
        const winner = ranking[0] || "gestao";
        const runnerUp = ranking[1] || winner;
        const area = PROFILE_AREAS[winner];
        const secondArea = PROFILE_AREAS[runnerUp];
        root.innerHTML = `<div class="profile-result profile-result--game"><div class="profile-result__media"><img src="${area.image}" alt="${escapeHtml(area.title)}"><div class="profile-result__stamp">${area.icon}</div></div><div class="profile-result__content"><span class="game-result-kicker">MISSÃO CONCLUÍDA</span><h3>Seu perfil combina com<br>${escapeHtml(area.title)}</h3><p>${escapeHtml(area.text)}</p><div class="profile-result__match"><strong>Suas maiores afinidades</strong><span>${area.icon} ${escapeHtml(area.title)} · ${scores[winner]} pts</span>${runnerUp !== winner ? `<span>${secondArea.icon} ${escapeHtml(secondArea.title)} · ${scores[runnerUp]} pts</span>` : ""}</div><div class="profile-result__chips"><span>⭐ ${xp} XP</span><span>✓ ${PROFILE_QUESTIONS.length} respostas</span><span>🎮 Perfil descoberto</span></div><div class="hero-actions"><button class="btn btn--soft" type="button" id="profileRestart">Jogar novamente</button><a class="btn btn--primary" href="vagas.html">Ver vagas</a></div></div></div>`;
        $("#profileRestart")?.addEventListener("click", () => { playGameTone("tap"); startProfileGame(); });
        if (progress) progress.style.width = "100%";
        playGameTone("success"); burstConfetti(); pulseMascots("#gameProfile"); updateGameSpeech("Ótimo! Encontramos uma área que combina com você!", "Confira o resultado e explore as oportunidades!");
        return;
      }

      const item = PROFILE_QUESTIONS[step];
      root.innerHTML = `<div class="profile-question profile-question--game"><div class="profile-question__top"><div class="profile-question__count">Pergunta ${step + 1} de ${PROFILE_QUESTIONS.length}</div><div class="profile-question__score">⭐ ${xp} XP</div></div><h3>${escapeHtml(item.question)}</h3><p class="profile-question__helper">Escolha a opção que mais representa você no dia a dia.</p><div class="profile-options">${item.options.map((opt, idx) => { const meta = PROFILE_AREAS[opt.primary] || {}; return `<button class="profile-option profile-option--${meta.accent || opt.primary}" type="button" data-option="${idx}"><div class="profile-option__visual"><img src="${meta.image}" alt=""><i>${meta.icon}</i></div><div class="profile-option__body"><b>0${idx + 1}</b><strong>${escapeHtml(opt.label)}</strong><small>Toque para escolher</small></div></button>`; }).join("")}</div></div>`;
      $$(".profile-option", root).forEach(btn => btn.addEventListener("click", () => {
        const selected = item.options[Number(btn.dataset.option)];
        if (!selected) return;
        Object.entries(selected.scores || {}).forEach(([areaKey, points]) => {
          scores[areaKey] = (scores[areaKey] || 0) + Number(points || 0);
        });
        directHits[selected.primary] = (directHits[selected.primary] || 0) + 1;
        choiceSequence += 1;
        lastChosen[selected.primary] = choiceSequence;
        xp += 100;
        btn.classList.add("is-selected");
        playGameTone("success");
        pulseMascots("#gameProfile");
        updateGameSpeech("Boa escolha!", `Pergunta ${Math.min(step + 2, PROFILE_QUESTIONS.length)} de ${PROFILE_QUESTIONS.length}: vamos continuar!`);
        step += 1;
        window.setTimeout(render, 260);
      }));
    };
    render();
    return null;
  }

  function startMemoryGame() {
    const grid = $("#memoryGrid");
    const result = $("#memoryResult");
    const matchesEl = $("#memoryMatches");
    const movesEl = $("#memoryMoves");
    const timerEl = $("#memoryTimer");
    const streakEl = $("#memoryStreak");
    if (!grid || !result) return null;

    let cards = shuffle(MEMORY_BASE_CARDS).map((card, idx) => ({ ...card, uid: `${card.pairId}-${idx}`, flipped: false, matched: false }));
    let first = null;
    let lock = false;
    let moves = 0;
    let matches = 0;
    let streak = 0;
    const startedAt = Date.now();
    window.clearInterval(gamesMemoryTimer);

    const formatTime = (ms) => {
      const total = Math.floor(ms / 1000);
      const min = String(Math.floor(total / 60)).padStart(2, "0");
      const sec = String(total % 60).padStart(2, "0");
      return `${min}:${sec}`;
    };

    const updateHud = () => {
      if (matchesEl) matchesEl.textContent = String(matches);
      if (movesEl) movesEl.textContent = String(moves);
      if (streakEl) streakEl.textContent = String(streak);
      if (timerEl) timerEl.textContent = formatTime(Date.now() - startedAt);
    };

    const renderBack = (card) => {
      if (card.type === "logo") return `<div class="memory-card__logoWrap"><img class="memory-card__logo" src="${card.image}" alt="${escapeHtml(card.label)}"><small>${escapeHtml(card.label)}</small></div>`;
      return `<div class="memory-card__factFill"><img class="memory-card__photo" src="${card.image}" alt=""><span class="memory-card__shade"></span><span class="memory-card__factBadge">CURIOSIDADE COAMO</span><span class="memory-card__factText"><strong>${escapeHtml(card.title || "")}</strong>${card.subtitle ? `<small>${escapeHtml(card.subtitle)}</small>` : ""}</span></div>`;
    };

    const render = () => {
      updateHud();
      grid.innerHTML = cards.map(card => `
        <button type="button" class="memory-card ${card.flipped || card.matched ? "is-flipped" : ""} ${card.matched ? "is-matched" : ""}" data-uid="${card.uid}" aria-label="Carta do desafio Coamo">
          <span class="memory-card__inner">
            <span class="memory-card__face memory-card__face--front"><img src="assets/logo_verde.png" alt="Coamo"><b>DESAFIO COAMO</b><small>Toque para revelar</small></span>
            <span class="memory-card__face memory-card__face--back ${card.type === "logo" ? "memory-card__face--logo" : "memory-card__face--fact"}">${renderBack(card)}</span>
          </span>
        </button>`).join("");
      $$('[data-uid]', grid).forEach(btn => btn.addEventListener("click", () => reveal(btn.dataset.uid)));
    };

    const finish = () => {
      window.clearInterval(gamesMemoryTimer);
      result.hidden = false;
      result.innerHTML = `<div class="game-result__card is-success game-result__card--celebrate"><span class="game-result-kicker">DESAFIO COMPLETO</span><h3>Você encontrou todos os pares!</h3><p>Excelente! Agora você conhece ainda mais a Coamo.</p><div class="game-result__stats"><span><strong>${matches}</strong> pares</span><span><strong>${moves}</strong> tentativas</span><span><strong>${formatTime(Date.now() - startedAt)}</strong> tempo</span></div><button class="btn btn--primary" type="button" id="memoryRestart">Jogar novamente</button></div>`;
      $("#memoryRestart")?.addEventListener("click", () => { playGameTone("tap"); startMemoryGame(); });
      playGameTone("success"); burstConfetti(); pulseMascots("#gameMemory"); updateGameSpeech("Desafio concluído!", "Você encontrou todos os pares!");
    };

    const reveal = (uid) => {
      if (lock) return;
      const card = cards.find(c => c.uid === uid);
      if (!card || card.flipped || card.matched) return;
      card.flipped = true;
      playGameTone("flip");
      if (!first) { first = card; render(); return; }

      moves += 1;
      const second = card;
      render();

      if (first.pairId === second.pairId && first.uid !== second.uid) {
        first.matched = true;
        second.matched = true;
        first = null;
        matches += 1;
        streak += 1;
        result.hidden = false;
        result.innerHTML = `<div class="game-result__card is-success"><strong>✨ Par encontrado!</strong><p>Boa! Combo x${streak}.</p></div>`;
        playGameTone("success");
        pulseMascots("#gameMemory");
        updateGameSpeech("Par encontrado!", `Combo x${streak}! Continue assim!`);
        setTimeout(() => {
          render();
          if (matches === MEMORY_BASE_CARDS.length / 2) finish();
        }, 360);
      } else {
        lock = true;
        streak = 0;
        result.hidden = false;
        result.innerHTML = `<div class="game-result__card is-error"><strong>Quase!</strong><p>Essas cartas não formam um par. Tente outra combinação.</p></div>`;
        playGameTone("error");
        pulseMascots("#gameMemory", "error");
        updateGameSpeech("Quase! Tente outra combinação.", "Observe bem as cartas e tente novamente!");
        setTimeout(() => {
          first.flipped = false;
          second.flipped = false;
          first = null;
          lock = false;
          render();
        }, 900);
      }
    };

    result.hidden = true;
    result.innerHTML = "";
    gamesMemoryTimer = window.setInterval(updateHud, 1000);
    render(); updateHud();
    return () => window.clearInterval(gamesMemoryTimer);
  }

  function startChainGame() {
    const track = $("#chainTrack");
    const options = $("#chainOptions");
    const result = $("#chainResult");
    if (!track || !options || !result) return null;

    let step = 0;
    let score = 0;
    let hearts = 3;
    let available = shuffle(CHAIN_STEPS);

    const render = () => {
      const shownPhase = Math.min(step + 1, CHAIN_STEPS.length);
      track.innerHTML = `
        <div class="chain-hud chain-hud--v18">
          <div class="chain-hud__card"><i>🚩</i><small>Fase</small><strong>${shownPhase}/${CHAIN_STEPS.length}</strong></div>
          <div class="chain-hud__card"><i>🏆</i><small>Pontos</small><strong>${score}</strong></div>
          <div class="chain-hud__card"><i>❤</i><small>Vidas</small><strong>${"❤".repeat(Math.max(hearts,0)) || "0"}</strong></div>
        </div>
        <div class="chain-track__list chain-track__list--v18">${CHAIN_STEPS.map((item, idx) => {
          const isDone = idx < step;
          const isCurrent = idx === step;
          return `<div class="chain-slot ${isDone ? "is-done" : ""} ${isCurrent ? "is-current" : ""}">
            <b>${idx + 1}</b>
            ${isDone ? `<img src="${item.image}" alt=""><span>${escapeHtml(item.title)}</span>` : `<i>?</i><span>${isCurrent ? "Sua vez" : "Etapa surpresa"}</span>`}
          </div>`;
        }).join("")}</div>`;

      if (hearts <= 0) {
        options.innerHTML = "";
        result.hidden = false;
        result.innerHTML = `<div class="game-result__card is-error game-result__card--celebrate"><span class="game-result-kicker">FIM DE JOGO</span><h3>Suas vidas acabaram.</h3><p>Que tal tentar novamente e completar toda a cadeia?</p><button class="btn btn--primary" type="button" id="chainRestart">Jogar novamente</button></div>`;
        $("#chainRestart")?.addEventListener("click", () => { playGameTone("tap"); startChainGame(); });
        pulseMascots("#gameChain", "error"); updateGameSpeech("Vamos tentar de novo!", "Você consegue completar a cadeia!");
        return;
      }

      if (step >= CHAIN_STEPS.length) {
        options.innerHTML = "";
        result.hidden = false;
        result.innerHTML = `<div class="game-result__card is-success game-result__card--celebrate"><span class="game-result-kicker">CADEIA COMPLETA</span><h3>Você conectou a jornada Coamo!</h3><p>Do campo ao mercado, todas as etapas foram colocadas na ordem correta.</p><div class="game-result__stats"><span><strong>${score}</strong> pontos</span><span><strong>${hearts}</strong> vidas restantes</span></div><button class="btn btn--primary" type="button" id="chainRestart">Jogar novamente</button></div>`;
        $("#chainRestart")?.addEventListener("click", () => { playGameTone("tap"); startChainGame(); });
        playGameTone("success"); burstConfetti(); pulseMascots("#gameChain"); updateGameSpeech("Cadeia completa!", "Do campo ao mercado: missão cumprida!");
        return;
      }

      const expected = CHAIN_STEPS[step];
      result.hidden = false;
      result.innerHTML = `<div class="game-result__card chain-tip-card"><strong>🎯 Missão atual</strong><p>Qual é a etapa ${step + 1}? Toque na carta correta para encaixá-la na sequência.</p></div>`;
      options.innerHTML = available.map(item => `
        <button class="chain-option chain-option--${item.theme}" type="button" data-id="${item.id}" aria-label="${escapeHtml(item.title)}">
          <span class="chain-option__scene"><img src="${item.image}" alt=""><i>${item.icon}</i></span>
          <span class="chain-option__body"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.text)}</small><em>Toque para escolher</em></span>
        </button>`).join("");

      $$(".chain-option", options).forEach(btn => btn.addEventListener("click", () => {
        if (btn.dataset.id === expected.id) {
          btn.classList.add("is-correct");
          score += 100;
          result.innerHTML = `<div class="game-result__card is-success"><strong>✓ Acertou!</strong><p>${escapeHtml(expected.title)} entrou na posição ${step + 1}. +100 pontos.</p></div>`;
          playGameTone("success");
          pulseMascots("#gameChain");
          updateGameSpeech("Acertou a etapa!", "Muito bem! Continue avançando.");
          step += 1;
          available = shuffle(CHAIN_STEPS.filter(item => !CHAIN_STEPS.slice(0, step).some(done => done.id === item.id)));
          setTimeout(render, 600);
        } else {
          hearts -= 1;
          btn.classList.add("is-wrong");
          result.innerHTML = `<div class="game-result__card is-error"><strong>✕ Não foi dessa vez!</strong><p>Essa não é a próxima etapa. Você perdeu 1 vida.</p></div>`;
          playGameTone("error");
          pulseMascots("#gameChain", "error");
          updateGameSpeech("Essa não é a próxima etapa.", "Você perdeu uma vida. Tente outra opção!");
          setTimeout(() => { btn.classList.remove("is-wrong"); render(); }, 720);
        }
      }));
    };

    render();
    return null;
  }


  /* =========================
     MISSÃO COAMO — OPERAÇÃO SAFRA
  ========================== */
  const MISSION_BASE_PHASES = [
    {
      id: "chegada",
      kicker: "FASE 1 · CHEGADA À UNIDADE",
      title: "A safra começou e o movimento aumentou.",
      scene: "Três caminhões chegam quase ao mesmo tempo. O pátio começa a ficar movimentado e os cooperados aguardam orientação.",
      prompt: "Qual decisão ajuda a iniciar a operação de forma organizada?",
      image: "assets/mission/scene_arrival.webp",
      options: [
        { icon: "🧭", label: "Organizar a chegada e orientar o fluxo", desc: "Recepcionar, direcionar e manter a movimentação organizada.", points: 320, impact: { safety: 6, quality: 1, efficiency: 7, service: 8 }, tone: "best", feedback: "Excelente decisão. Organização e orientação ajudam a operação a começar bem e melhoram a experiência de quem chega." },
        { icon: "⏩", label: "Liberar todos o mais rápido possível", desc: "Priorizar velocidade, mesmo com a área ficando mais congestionada.", points: 80, impact: { safety: -8, quality: 0, efficiency: -3, service: -2 }, tone: "risk", feedback: "A pressa pode aumentar o congestionamento e reduzir a segurança. Em uma operação intensa, organização é parte da eficiência." },
        { icon: "⌛", label: "Esperar o movimento diminuir sozinho", desc: "Não mudar o fluxo e aguardar a fila se resolver.", points: 120, impact: { safety: 0, quality: 0, efficiency: -7, service: -7 }, tone: "warn", feedback: "A operação continua, mas a espera sem orientação piora a experiência e reduz a eficiência do fluxo." },
      ]
    },
    {
      id: "classificacao",
      kicker: "FASE 2 · RECEBIMENTO",
      title: "A carga chegou ao ponto de recebimento.",
      scene: "Antes de seguir para armazenagem, é preciso considerar as características do produto e manter o fluxo com qualidade.",
      prompt: "Qual caminho faz mais sentido nesta etapa?",
      image: "assets/mission/scene_classification.webp",
      options: [
        { icon: "🔎", label: "Conferir e classificar antes de direcionar", desc: "Usar as informações da carga para definir o próximo passo.", points: 340, impact: { safety: 2, quality: 9, efficiency: 4, service: 3 }, tone: "best", feedback: "Muito bem. Conhecer as condições do produto antes do direcionamento protege a qualidade e melhora a tomada de decisão." },
        { icon: "🚛", label: "Enviar direto para qualquer estrutura disponível", desc: "Evitar a etapa de conferência para ganhar tempo.", points: 70, impact: { safety: -2, quality: -10, efficiency: -4, service: -2 }, tone: "risk", feedback: "Pular a avaliação pode comprometer a qualidade e criar retrabalho mais adiante." },
        { icon: "📋", label: "Registrar a chegada e deixar a decisão para depois", desc: "Manter a carga aguardando sem definir o destino.", points: 150, impact: { safety: 0, quality: 1, efficiency: -6, service: -5 }, tone: "warn", feedback: "Registrar é importante, mas a operação precisa avançar com informação e direcionamento." },
      ]
    },
    {
      id: "armazenagem",
      kicker: "FASE 3 · ARMAZENAGEM",
      title: "Agora é hora de escolher o destino da carga.",
      scene: "Há estruturas disponíveis, mas o produto deve seguir para um local compatível com suas condições e com o planejamento da unidade.",
      prompt: "Como você conduz essa decisão?",
      image: "assets/mission/scene_storage.webp",
      options: [
        { icon: "🏬", label: "Direcionar conforme classificação e planejamento", desc: "Usar qualidade, capacidade e fluxo para escolher a estrutura adequada.", points: 360, impact: { safety: 2, quality: 8, efficiency: 7, service: 2 }, tone: "best", feedback: "Boa! Uma decisão integrada preserva a qualidade e evita movimentações desnecessárias." },
        { icon: "🎯", label: "Escolher apenas o espaço mais próximo", desc: "Priorizar distância, sem considerar as demais informações.", points: 100, impact: { safety: 0, quality: -7, efficiency: -3, service: 0 }, tone: "risk", feedback: "O espaço mais próximo nem sempre é o destino mais adequado. A decisão precisa considerar o conjunto da operação." },
        { icon: "🔄", label: "Movimentar primeiro e decidir depois", desc: "Levar a carga para uma área temporária e reorganizar posteriormente.", points: 140, impact: { safety: -2, quality: -2, efficiency: -8, service: -1 }, tone: "warn", feedback: "Movimentações extras aumentam o esforço da operação e podem gerar retrabalho." },
      ]
    },
    {
      id: "expedicao",
      kicker: "FASE 5 · EXPEDIÇÃO E LOGÍSTICA",
      title: "A operação está chegando à etapa final.",
      scene: "Uma carga está pronta para seguir ao destino. Antes da saída, ainda há uma última decisão importante.",
      prompt: "O que você prioriza antes da liberação?",
      image: "assets/mission/scene_storage.webp",
      options: [
        { icon: "✅", label: "Conferir carga, destino e liberação", desc: "Validar as informações antes de concluir a expedição.", points: 350, impact: { safety: 4, quality: 4, efficiency: 5, service: 7 }, tone: "best", feedback: "Missão quase concluída! Conferência final ajuda a conectar operação, logística e destino com segurança." },
        { icon: "🏁", label: "Liberar assim que o caminhão estiver pronto", desc: "Evitar nova conferência para ganhar alguns minutos.", points: 80, impact: { safety: -5, quality: -3, efficiency: -2, service: -6 }, tone: "risk", feedback: "Ganhar alguns minutos não compensa o risco de uma informação ou destino incorreto." },
        { icon: "📞", label: "Esperar alguém confirmar tudo novamente", desc: "Paralisar a liberação mesmo com as informações disponíveis.", points: 160, impact: { safety: 1, quality: 1, efficiency: -6, service: -4 }, tone: "warn", feedback: "Confirmar é útil quando há dúvida. Sem uma necessidade real, a espera pode reduzir a fluidez da operação." },
      ]
    }
  ];

  const MISSION_SURPRISES = [
    {
      id: "alerta",
      kicker: "FASE 4 · IMPREVISTO",
      title: "Um equipamento apresentou um alerta.",
      scene: "O fluxo está intenso, mas um equipamento importante indica uma condição fora do normal.",
      prompt: "Como você reage ao imprevisto?",
      image: "assets/mission/scene_maintenance.webp",
      options: [
        { icon: "🛠", label: "Interromper a condição de risco e acionar suporte", desc: "Proteger pessoas e operação antes de retomar o fluxo.", points: 380, impact: { safety: 10, quality: 2, efficiency: 1, service: 1 }, tone: "best", feedback: "Ótima escolha. Segurança vem antes da velocidade. Depois de controlada a situação, a operação pode ser reorganizada." },
        { icon: "⚡", label: "Continuar até aparecer uma falha maior", desc: "Manter o ritmo para não perder produtividade.", points: 40, impact: { safety: -14, quality: -4, efficiency: -6, service: -3 }, tone: "risk", feedback: "Essa é uma decisão de alto risco. Um alerta não deve ser ignorado em nome da velocidade." },
        { icon: "🔀", label: "Redirecionar o fluxo e verificar a situação", desc: "Reduzir a pressão naquele ponto enquanto a condição é avaliada.", points: 280, impact: { safety: 6, quality: 1, efficiency: 4, service: 2 }, tone: "good", feedback: "Boa decisão. Redirecionar pode preservar o fluxo, desde que a condição seja avaliada e tratada corretamente." },
      ]
    },
    {
      id: "chuva",
      kicker: "FASE 4 · IMPREVISTO",
      title: "Uma chuva forte se aproxima da unidade.",
      scene: "Ainda há movimentação no pátio e cargas em processo. O tempo muda rapidamente e exige reorganização.",
      prompt: "Qual é a melhor resposta para o momento?",
      image: "assets/mission/scene_arrival.webp",
      options: [
        { icon: "🌧", label: "Reavaliar o fluxo e proteger produto e pessoas", desc: "Ajustar prioridades considerando segurança e qualidade.", points: 370, impact: { safety: 8, quality: 8, efficiency: 1, service: 2 }, tone: "best", feedback: "Excelente. Mudanças de condição exigem adaptação rápida sem perder segurança e qualidade." },
        { icon: "🚀", label: "Acelerar tudo antes da chuva chegar", desc: "Aumentar o ritmo para finalizar o máximo possível.", points: 70, impact: { safety: -10, quality: -5, efficiency: -2, service: 0 }, tone: "risk", feedback: "Acelerar indiscriminadamente pode aumentar o risco justamente quando as condições estão mudando." },
        { icon: "⏸", label: "Parar toda a unidade imediatamente", desc: "Interromper qualquer atividade, mesmo as que continuam seguras.", points: 170, impact: { safety: 5, quality: 3, efficiency: -9, service: -4 }, tone: "warn", feedback: "Proteger a operação é importante, mas a resposta pode ser proporcional ao risco e às atividades em andamento." },
      ]
    },
    {
      id: "fila",
      kicker: "FASE 4 · IMPREVISTO",
      title: "A fila aumentou de repente.",
      scene: "O volume de chegada supera o ritmo previsto e o tempo de espera começa a crescer.",
      prompt: "Como equilibrar atendimento e operação?",
      image: "assets/mission/scene_arrival.webp",
      options: [
        { icon: "📣", label: "Reorganizar o fluxo e manter todos orientados", desc: "Ajustar prioridades e comunicar o que está acontecendo.", points: 360, impact: { safety: 4, quality: 1, efficiency: 7, service: 9 }, tone: "best", feedback: "Muito bem. Informação e organização ajudam a reduzir a percepção de espera e melhoram o fluxo." },
        { icon: "🤐", label: "Evitar comunicar para não gerar preocupação", desc: "Manter a fila sem novas orientações.", points: 80, impact: { safety: 0, quality: 0, efficiency: -4, service: -10 }, tone: "risk", feedback: "Sem orientação, a experiência piora e a fila pode ficar ainda mais difícil de organizar." },
        { icon: "🔢", label: "Atender apenas pela ordem de chegada", desc: "Manter a sequência sem reavaliar o fluxo.", points: 180, impact: { safety: 1, quality: 0, efficiency: -2, service: -2 }, tone: "warn", feedback: "É uma solução simples, mas uma operação intensa pode exigir reorganização e comunicação ativa." },
      ]
    }
  ];

  function clampMissionMetric(value) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }


  const MISSION_VISUALS = {
    chegada: { actor: "assets/mission/v29/toninho_point.png", actorName: "Toninho", actorClass: "mission-actor--traffic", fx: "arrival", speech: "Vou organizar esse fluxo com você!" },
    classificacao: { actor: "assets/mission/aroldinho_inspect.webp", actorName: "Aroldinho", actorClass: "mission-actor--inspect", fx: "lab", speech: "Vamos observar os detalhes da carga." },
    armazenagem: { actor: "assets/mission/v29/toninho_point.png", actorName: "Toninho", actorClass: "mission-actor--storage", fx: "storage", speech: "Agora precisamos escolher o destino certo." },
    alerta: { actor: "assets/mission/toninho_maintenance.webp", actorName: "Toninho", actorClass: "mission-actor--maintenance", fx: "maintenance", speech: "Alerta na operação. Segurança primeiro!" },
    chuva: { actor: "assets/mission/v29/toninho_wave.png", actorName: "Toninho", actorClass: "mission-actor--weather", fx: "weather", speech: "O tempo mudou. Vamos reorganizar a operação." },
    fila: { actor: "assets/mission/v29/toninho_point.png", actorName: "Toninho", actorClass: "mission-actor--queue", fx: "queue", speech: "A fila cresceu. Organização e comunicação!" },
    expedicao: { actor: "assets/mission/v29/aroldinho_welcome.png", actorName: "Aroldinho", actorClass: "mission-actor--logistics", fx: "dispatch", speech: "Última etapa: vamos liberar a carga com atenção." },
  };

  function missionVisual(phase) {
    return MISSION_VISUALS[phase.id] || MISSION_VISUALS.chegada;
  }

  function missionDecisionVisual(phase, option, optionIndex) {
    const base = missionVisual(phase);
    const tone = option.tone || "warn";
    let action = "Analisando a decisão...";
    if (phase.id === "chegada") action = optionIndex === 0 ? "Toninho sinaliza a entrada e organiza o fluxo." : optionIndex === 1 ? "O fluxo acelera e exige ainda mais atenção." : "A fila aumenta enquanto a operação aguarda.";
    else if (phase.id === "classificacao") action = optionIndex === 0 ? "Aroldinho confere a amostra e registra a classificação." : optionIndex === 1 ? "A carga segue sem conferência e acende um alerta de qualidade." : "A chegada é registrada, mas a carga permanece aguardando.";
    else if (phase.id === "armazenagem") action = optionIndex === 0 ? "Toninho direciona o produto para a estrutura adequada." : optionIndex === 1 ? "A carga vai ao espaço mais próximo sem considerar todos os dados." : "A carga é movimentada para uma área temporária, gerando retrabalho.";
    else if (phase.id === "alerta") action = optionIndex === 0 ? "Toninho sinaliza a parada e aciona a manutenção." : optionIndex === 1 ? "O equipamento continua operando com o alerta ativo." : "O fluxo é redirecionado enquanto o equipamento é verificado.";
    else if (phase.id === "chuva") action = optionIndex === 0 ? "A operação é reorganizada para proteger produto e pessoas." : optionIndex === 1 ? "O ritmo aumenta justamente quando as condições ficam mais críticas." : "Parte da operação para, inclusive atividades que ainda estavam seguras.";
    else if (phase.id === "fila") action = optionIndex === 0 ? "A fila é reorganizada e todos permanecem orientados." : optionIndex === 1 ? "Sem comunicação, a fila cresce e o atendimento fica confuso." : "A sequência é mantida, mas sem adaptação ao pico de movimento.";
    else if (phase.id === "expedicao") action = optionIndex === 0 ? "Carga, destino e liberação são confirmados: missão quase concluída!" : optionIndex === 1 ? "A carga parte sem uma última conferência." : "A carga fica aguardando uma confirmação desnecessária.";
    return { ...base, tone, action };
  }

  function missionFxMarkup(type) {
    if (type === "arrival") return `<div class="mission-fx mission-fx--arrival"><span class="motion-signal"></span><img class="motion-truck" src="assets/mission/coamo_truck_oficial.png" alt="" aria-hidden="true"><span class="motion-dust motion-dust--1"></span><span class="motion-dust motion-dust--2"></span></div>`;
    if (type === "lab") return `<div class="mission-fx mission-fx--lab"><span class="lab-scanner"><i></i><b>QUALIDADE</b></span><span class="lab-grain lab-grain--1"></span><span class="lab-grain lab-grain--2"></span><span class="lab-grain lab-grain--3"></span></div>`;
    if (type === "storage") return `<div class="mission-fx mission-fx--storage"><span class="motion-conveyor"><i></i><b></b><em></em></span><span class="motion-grainfall">${Array.from({length:14},(_,i)=>`<i style="--i:${i}"></i>`).join("")}</span><span class="motion-gear">⚙</span><span class="motion-steam motion-steam--1"></span><span class="motion-steam motion-steam--2"></span></div>`;
    if (type === "maintenance") return `<div class="mission-fx mission-fx--maintenance"><span class="motion-alarm">!</span><span class="motion-wrench">🔧</span><span class="motion-steam motion-steam--3"></span><span class="motion-spark motion-spark--1"></span><span class="motion-spark motion-spark--2"></span></div>`;
    if (type === "weather") return `<div class="mission-fx mission-fx--weather"><span class="motion-cloud"></span><span class="motion-lightning">ϟ</span><span class="motion-rain">${Array.from({length:24},(_,i)=>`<i style="--i:${i}"></i>`).join("")}</span><span class="motion-leaf motion-leaf--1">◆</span><span class="motion-leaf motion-leaf--2">◆</span></div>`;
    if (type === "queue") return `<div class="mission-fx mission-fx--queue"><span class="queue-vehicle queue-vehicle--1"><i></i><b></b></span><span class="queue-vehicle queue-vehicle--2"><i></i><b></b></span><span class="queue-vehicle queue-vehicle--3"><i></i><b></b></span><span class="motion-signal motion-signal--queue"></span></div>`;
    if (type === "dispatch") return `<div class="mission-fx mission-fx--dispatch"><span class="motion-forklift"><i></i><b></b><em></em><strong></strong></span><span class="motion-crate motion-crate--1"></span><span class="motion-crate motion-crate--2"></span><span class="motion-gate"><i></i><b></b></span><span class="dispatch-check">✓</span></div>`;
    return "";
  }

  function startMissionGame() {
    if (page !== "game-mission") return null;
    const root = $("#missionGame");
    const intro = $("#missionIntro");
    const startBtn = $("#missionStart");
    if (!root || !intro || !startBtn) return null;

    let phases = [];
    let phaseIndex = 0;
    let metrics = { safety: 82, quality: 82, efficiency: 82, service: 82 };
    let score = 0;
    let decisions = [];
    let locked = false;

    const labels = { safety: "Segurança", quality: "Qualidade", efficiency: "Eficiência", service: "Atendimento" };
    const icons = { safety: "🛡", quality: "⭐", efficiency: "⚙", service: "🤝" };

    const reset = () => {
      phases = [MISSION_BASE_PHASES[0], MISSION_BASE_PHASES[1], MISSION_BASE_PHASES[2], MISSION_SURPRISES[Math.floor(Math.random() * MISSION_SURPRISES.length)], MISSION_BASE_PHASES[3]];
      phaseIndex = 0;
      metrics = { safety: 82, quality: 82, efficiency: 82, service: 82 };
      score = 0;
      decisions = [];
      locked = false;
      intro.hidden = false;
      root.innerHTML = "";
      updateGameSpeech("Preparado para a safra?", "Aroldinho: suas decisões vão mudar o resultado da missão!");
    };

    const metricsHtml = () => Object.entries(metrics).map(([key, value]) => `
      <div class="mission-metric mission-metric--${key}">
        <div class="mission-metric__head"><span>${icons[key]} ${labels[key]}</span><strong>${value}%</strong></div>
        <div class="mission-metric__bar"><i style="width:${value}%"></i></div>
      </div>`).join("");

    const applyImpact = (impact = {}) => {
      Object.keys(metrics).forEach(key => {
        metrics[key] = clampMissionMetric(metrics[key] + (Number(impact[key]) || 0));
      });
    };

    const rating = () => {
      const avg = Object.values(metrics).reduce((a, b) => a + b, 0) / 4;
      if (avg >= 93) return { title: "Operação de excelência", badge: "OURO", icon: "🏆", text: "Você equilibrou segurança, qualidade, eficiência e atendimento em alto nível." };
      if (avg >= 84) return { title: "Missão cumprida", badge: "VERDE", icon: "🥇", text: "A operação chegou ao fim com decisões consistentes e bons indicadores." };
      if (avg >= 72) return { title: "Boa operação", badge: "PRATA", icon: "🥈", text: "Você completou a jornada, mas ainda há espaço para melhorar alguns indicadores." };
      return { title: "Safra desafiadora", badge: "DESAFIO", icon: "🎯", text: "A missão foi concluída, mas algumas escolhas reduziram o desempenho da operação." };
    };

    const renderFinal = () => {
      const result = rating();
      root.innerHTML = `
        <div class="mission-final mission-final--premium">
          <div class="mission-final__hero">
            <img class="mission-final__mascot" src="assets/mission/v29/duo_highfive.png" alt="Toninho e Aroldinho comemorando">
            <div class="mission-final__medal">${result.icon}</div>
            <span>MISSÃO CONCLUÍDA · ${result.badge}</span>
            <h2>${result.title}</h2>
            <p>${result.text}</p>
            <strong class="mission-final__score">${score.toLocaleString("pt-BR")} pontos</strong>
          </div>
          <div class="mission-final__metrics">${metricsHtml()}</div>
          <div class="mission-final__decisions">
            <h3>Suas decisões na operação</h3>
            ${decisions.map((d, idx) => `<div class="mission-decision-row"><b>${String(idx + 1).padStart(2, "0")}</b><span><strong>${escapeHtml(d.phase)}</strong><small>${escapeHtml(d.choice)}</small></span><i class="mission-tone mission-tone--${d.tone}">${d.tone === "best" ? "+" : d.tone === "risk" ? "!" : "✓"}</i></div>`).join("")}
          </div>
          <div class="mission-final__actions"><button class="btn btn--primary" type="button" id="missionRestart">Jogar novamente</button><a class="btn btn--soft" href="jogos.html">Voltar aos jogos</a></div>
          <p class="mission-disclaimer">Simulação educativa e institucional. As situações do jogo não representam procedimentos operacionais oficiais.</p>
        </div>`;
      playGameTone("win");
      launchGameConfetti();
      pulseMascots("#gameMission", "success");
      updateGameSpeech("Missão cumprida!", "Aroldinho: quer tentar de novo e superar sua pontuação?");
      $("#missionRestart")?.addEventListener("click", reset);
    };

    const renderPhase = () => {
      if (phaseIndex >= phases.length) return renderFinal();
      const phase = phases[phaseIndex];
      locked = false;
      root.innerHTML = `
        <div class="mission-hud">
          <div class="mission-hud__phase"><small>FASE</small><strong>${phaseIndex + 1}<span>/5</span></strong></div>
          <div class="mission-hud__score"><small>PONTOS</small><strong>${score.toLocaleString("pt-BR")}</strong></div>
          <div class="mission-hud__metrics">${metricsHtml()}</div>
        </div>
        <div class="mission-scene mission-scene--premium">
          <div class="mission-cinematic mission-cinematic--${phase.id}" id="missionCinematic">
            <img class="mission-cinematic__bg" src="${phase.image}" alt="Cenário ilustrado da fase">
            <div class="mission-cinematic__parallax"></div>
            <div class="mission-cinematic__shade"></div>
            <img class="mission-cinematic__brand" src="assets/logo_verde.png" alt="Coamo">
            <div class="mission-cinematic__phase"><span>${phase.kicker}</span><b>CENA INTERATIVA</b></div>
            <div class="mission-cinematic__fx" id="missionCinematicFx">${missionFxMarkup(missionVisual(phase).fx)}</div>
            <div class="mission-cinematic__actor ${missionVisual(phase).actorClass}" id="missionActor">
              <div class="mission-cinematic__speech" id="missionActorSpeech">${escapeHtml(missionVisual(phase).speech)}</div>
              <img class="mission-actor-pose mission-actor-pose--single" id="missionActorImg" src="${missionVisual(phase).actor}" alt="${missionVisual(phase).actorName}">
            </div>
            <div class="mission-cinematic__caption">
              <small>${phase.kicker}</small>
              <h2>${phase.title}</h2>
              <p>${phase.scene}</p>
            </div>
            <div class="mission-cinematic__impact" id="missionCinematicImpact" hidden></div>
          </div>
          <div class="mission-scene__challenge">
            <div class="mission-challenge__head"><span>DECISÃO ${phaseIndex + 1}</span><h3>${phase.prompt}</h3><p>Toque na decisão que você tomaria. Cada escolha altera os indicadores da sua operação.</p></div>
            <div class="mission-options">
              ${phase.options.map((opt, idx) => `<button class="mission-option" type="button" data-mission-option="${idx}"><i>${opt.icon}</i><span><b>${escapeHtml(opt.label)}</b><small>${escapeHtml(opt.desc)}</small></span><em>Escolher →</em></button>`).join("")}
            </div>
            <div class="mission-feedback" id="missionFeedback" hidden></div>
          </div>
        </div>`;

      updateGameSpeech(`Fase ${phaseIndex + 1}: atenção à decisão!`, phaseIndex === 3 ? "Aroldinho: imprevisto na operação! Pense rápido." : "Aroldinho: equilíbrio vale mais que pressa.");

      $$("[data-mission-option]", root).forEach(btn => btn.addEventListener("click", () => {
        if (locked) return;
        locked = true;
        const option = phase.options[Number(btn.dataset.missionOption)];
        applyImpact(option.impact);
        score += option.points;
        decisions.push({ phase: phase.title, choice: option.label, tone: option.tone });
        $$("[data-mission-option]", root).forEach(item => { item.disabled = true; item.classList.toggle("is-selected", item === btn); });
        btn.classList.add(`is-${option.tone}`);
        const feedback = $("#missionFeedback");
        feedback.hidden = false;
        feedback.innerHTML = `<div class="mission-feedback__icon">${option.tone === "best" ? "✓" : option.tone === "risk" ? "!" : "↗"}</div><div><strong>${option.tone === "best" ? "Excelente decisão" : option.tone === "risk" ? "Decisão arriscada" : option.tone === "good" ? "Boa decisão" : "Decisão possível"}</strong><p>${escapeHtml(option.feedback)}</p><div class="mission-impact">${Object.entries(option.impact).map(([key, value]) => `<span class="${value >= 0 ? "is-positive" : "is-negative"}">${labels[key]} ${value >= 0 ? "+" : ""}${value}</span>`).join("")}</div></div><button class="btn btn--primary" type="button" id="missionNext">${phaseIndex === phases.length - 1 ? "Ver resultado" : "Próxima fase"} →</button>`;

        const visual = missionDecisionVisual(phase, option, Number(btn.dataset.missionOption));
        const cinematic = $("#missionCinematic");
        const actorImg = $("#missionActorImg");
        const actorSpeech = $("#missionActorSpeech");
        const cinematicFx = $("#missionCinematicFx");
        const cinematicImpact = $("#missionCinematicImpact");
        if (cinematic) {
          cinematic.classList.remove("is-best", "is-good", "is-warn", "is-risk", "is-decided");
          cinematic.classList.add("is-decided", `is-${option.tone}`);
        }
        if (actorImg) actorImg.src = visual.actor;
        if (actorSpeech) actorSpeech.textContent = visual.action;
        if (cinematicFx) cinematicFx.innerHTML = missionFxMarkup(visual.fx);
        if (cinematicImpact) {
          cinematicImpact.hidden = false;
          cinematicImpact.innerHTML = `<strong>${option.tone === "risk" ? "ATENÇÃO" : option.tone === "best" ? "DECISÃO DE EXCELÊNCIA" : "DECISÃO REGISTRADA"}</strong><span>${Object.entries(option.impact).map(([key,value]) => `${icons[key]} ${value >= 0 ? "+" : ""}${value}`).join("  ·  ")}</span>`;
        }

        playGameTone(option.tone === "risk" ? "error" : "success");
        pulseMascots("#gameMission", option.tone === "risk" ? "error" : "success");
        updateGameSpeech(option.tone === "risk" ? "Essa escolha trouxe riscos." : "Boa leitura da situação!", option.feedback);
        $("#missionNext")?.addEventListener("click", () => { phaseIndex += 1; renderPhase(); window.scrollTo({ top: 0, behavior: "smooth" }); });
      }));
    };

    startBtn.addEventListener("click", () => {
      intro.hidden = true;
      playGameTone("tap");
      renderPhase();
    });
    reset();
    return () => {};
  }


  function initGameCovers() {
    $$('[data-game-cover]').forEach(cover => {
      const btn = $('[data-game-cover-start]', cover);
      const targetSel = cover.dataset.target;
      const target = targetSel ? $(targetSel) : null;
      if (!btn || !target) return;
      btn.addEventListener('click', () => {
        playGameTone('tap');
        cover.classList.add('is-leaving');
        window.setTimeout(() => {
          cover.remove();
          target.classList.remove('game-play-hidden-v32');
          target.classList.add('game-play-visible-v31');
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 330);
      });
    });
  }


  /* =========================
     FAZENDA COAMO — V41
     Missão curta para visitantes de estande.
     Nenhum progresso é salvo no navegador.
  ========================== */
  const FARM_SESSION_SECONDS = 180;
  let farmSessionInterval = null;
  let farmResetTimer = null;
  let farmInactivityTimer = null;

  const FARM_SESSION_CROPS = [
    { key: "soja", name: "Soja", icon: "🫘", field: "soja" },
    { key: "milho", name: "Milho", icon: "🌽", field: "milho" },
    { key: "trigo", name: "Trigo", icon: "🌾", field: "trigo" },
  ];

  const FARM_SESSION_WEATHER = [
    { key: "chuva", label: "chuva se aproximando", short: "Chuva se aproximando", icon: "🌧️" },
    { key: "calor", label: "dias quentes e secos", short: "Calor e tempo seco", icon: "☀️" },
    { key: "estavel", label: "janela de clima estável", short: "Clima estável", icon: "🌤️" },
  ];

  const FARM_SESSION_DEMAND = [
    { key: "urgente", label: "pedido urgente da cooperativa", short: "Pedido urgente" },
    { key: "alta", label: "demanda elevada para a safra", short: "Demanda elevada" },
    { key: "equilibrada", label: "fluxo de recebimento equilibrado", short: "Fluxo equilibrado" },
  ];

  const FARM_METRIC_META = {
    productivity: { label: "Produtividade", icon: "🌱" },
    quality: { label: "Qualidade", icon: "⭐" },
    efficiency: { label: "Eficiência", icon: "⚙️" },
    cooperation: { label: "Cooperação", icon: "🤝" },
  };

  function clampFarmMetric(value){ return Math.max(25, Math.min(100, Number(value) || 0)); }
  function formatFarmTime(total){
    const safe=Math.max(0,Math.floor(total));
    return `${String(Math.floor(safe/60)).padStart(2,"0")}:${String(safe%60).padStart(2,"0")}`;
  }

  function buildFarmSession(){
    const crop=FARM_SESSION_CROPS[Math.floor(Math.random()*FARM_SESSION_CROPS.length)];
    const weather=FARM_SESSION_WEATHER[Math.floor(Math.random()*FARM_SESSION_WEATHER.length)];
    const demand=FARM_SESSION_DEMAND[Math.floor(Math.random()*FARM_SESSION_DEMAND.length)];
    const siloPressure=Math.random()>.5 ? "capacidade de armazenagem mais apertada" : "boa disponibilidade de armazenagem";
    return {
      crop, weather, demand, siloPressure,
      phaseIndex:0,
      score:0,
      secondsLeft:FARM_SESSION_SECONDS,
      metrics:{ productivity:72, quality:72, efficiency:72, cooperation:72 },
      chosen:false,
      decisions:[],
      startedAt:Date.now(),
      finished:false,
    };
  }

  function farmPhaseBank(session){
    const crop=session.crop.name.toLowerCase();
    const weather=session.weather;
    const demand=session.demand;
    const careTitle = weather.key === "chuva" ? "A chuva está chegando." : weather.key === "calor" ? "O calor exige atenção." : "A lavoura está em boa janela de desenvolvimento.";
    const carePrompt = weather.key === "chuva"
      ? `A previsão mudou e há chuva forte no caminho. Como você protege a safra de ${crop}?`
      : weather.key === "calor"
        ? `Os próximos dias serão mais quentes e secos. Como você conduz a safra de ${crop}?`
        : `O clima está estável. Como aproveitar essa condição sem perder controle do processo?`;
    const careChoices = weather.key === "chuva" ? [
      { icon:"🛡️", label:"Reavaliar o manejo e antecipar pontos críticos", desc:"Ajustar prioridades considerando solo, qualidade e segurança da operação.", points:500, tone:"best", effects:{productivity:6,quality:9,efficiency:6,cooperation:5}, feedback:"Boa leitura do cenário. Adaptar o plano antes da mudança de clima protege qualidade e produtividade." },
      { icon:"⚡", label:"Acelerar tudo antes da chuva", desc:"Ganhar velocidade mesmo que algumas etapas fiquem comprimidas.", points:300, tone:"mid", effects:{productivity:5,quality:-4,efficiency:1,cooperation:-2}, feedback:"Você ganhou velocidade, mas comprimiu etapas importantes. O resultado fica menos equilibrado." },
      { icon:"🙈", label:"Manter o plano sem alterações", desc:"Confiar que a previsão não afetará a operação.", points:180, tone:"risk", effects:{productivity:-5,quality:-8,efficiency:-4,cooperation:-2}, feedback:"Ignorar uma mudança relevante aumenta risco de perda e retrabalho." },
    ] : weather.key === "calor" ? [
      { icon:"💧", label:"Ajustar manejo e monitorar a necessidade hídrica", desc:"Usar informação do campo para preservar o desenvolvimento da cultura.", points:500, tone:"best", effects:{productivity:8,quality:8,efficiency:5,cooperation:4}, feedback:"Excelente. Monitoramento e adaptação mantêm a lavoura mais estável em condição de calor." },
      { icon:"⏩", label:"Manter o ritmo e compensar depois", desc:"Seguir o plano original e corrigir apenas se houver perda visível.", points:300, tone:"mid", effects:{productivity:1,quality:-3,efficiency:0,cooperation:1}, feedback:"A operação continua, mas a reação tardia pode reduzir qualidade e produtividade." },
      { icon:"🚿", label:"Aumentar o uso de recursos sem monitoramento", desc:"Aplicar mais recursos de forma preventiva, sem conferir a necessidade real.", points:210, tone:"risk", effects:{productivity:2,quality:0,efficiency:-8,cooperation:-2}, feedback:"Usar recursos sem informação pode aumentar custo e reduzir eficiência." },
    ] : [
      { icon:"📊", label:"Acompanhar indicadores e manter o plano ajustável", desc:"Aproveitar a boa janela sem perder o monitoramento da lavoura.", points:500, tone:"best", effects:{productivity:7,quality:7,efficiency:7,cooperation:4}, feedback:"Boa decisão. Clima favorável também exige acompanhamento e disciplina operacional." },
      { icon:"🏃", label:"Acelerar o máximo possível", desc:"Usar a boa condição para priorizar apenas volume e velocidade.", points:310, tone:"mid", effects:{productivity:7,quality:-3,efficiency:2,cooperation:-1}, feedback:"A velocidade aumenta, mas o equilíbrio entre volume e qualidade diminui." },
      { icon:"🛋️", label:"Reduzir o acompanhamento porque o clima ajuda", desc:"Fazer menos verificações enquanto a condição permanece estável.", points:190, tone:"risk", effects:{productivity:-2,quality:-5,efficiency:-3,cooperation:-1}, feedback:"Condições favoráveis não eliminam a necessidade de monitoramento." },
    ];

    return [
      {
        id:"planejamento", mascot:"toninho", scene:"assets/games/farm/farm_landscape_v40.png",
        kicker:"FASE 1 · PLANEJAMENTO", title:"A missão começa antes do plantio.",
        text:`Safra de ${session.crop.name}, ${weather.short.toLowerCase()} e ${demand.short.toLowerCase()}.`,
        decisionTitle:"Como você organiza o início da safra?",
        prompt:`Você recebeu a missão de conduzir uma safra de ${crop}. O cenário indica ${weather.label} e ${demand.label}.`,
        speech:"Antes de começar, vamos olhar o cenário inteiro e planejar a operação.",
        choices:[
          { icon:"🗺️", label:"Planejar janela, recursos e capacidade antes de começar", desc:"Organizar o fluxo completo e deixar margem para imprevistos.", points:500, tone:"best", effects:{productivity:6,quality:5,efficiency:9,cooperation:6}, feedback:"Ótimo começo. Planejamento conecta campo, capacidade operacional e destino da produção." },
          { icon:"🚀", label:"Começar imediatamente e ajustar no caminho", desc:"Ganhar tempo no início e resolver os gargalos conforme surgirem.", points:310, tone:"mid", effects:{productivity:4,quality:-2,efficiency:-3,cooperation:1}, feedback:"Você ganhou velocidade, mas aumentou a chance de retrabalho nas próximas fases." },
          { icon:"🎯", label:"Focar somente no volume a produzir", desc:"Priorizar produtividade e deixar logística e qualidade para depois.", points:220, tone:"risk", effects:{productivity:7,quality:-5,efficiency:-4,cooperation:-5}, feedback:"Volume importa, mas uma grande operação depende do equilíbrio entre várias áreas." },
        ],
      },
      {
        id:"plantio", mascot:"aroldinho", scene:"assets/games/farm/farm_landscape_v40.png",
        kicker:"FASE 2 · PLANTIO", title:`Hora de colocar a ${crop} no campo.`,
        text:"O que acontece agora influencia todo o restante da safra.",
        decisionTitle:"Qual estratégia de plantio você escolhe?",
        prompt:`A equipe está pronta e a janela de plantio começou. ${session.siloPressure === "capacidade de armazenagem mais apertada" ? "Mais à frente, a armazenagem exigirá atenção." : "A capacidade de armazenagem está favorável."}`,
        speech:"Plantio bem executado dá uma base melhor para todas as etapas que vêm depois.",
        choices:[
          { icon:"✅", label:"Seguir o planejamento técnico e acompanhar a execução", desc:"Respeitar a janela definida e monitorar os pontos críticos do plantio.", points:500, tone:"best", effects:{productivity:9,quality:6,efficiency:6,cooperation:4}, feedback:"Boa escolha. Execução consistente transforma planejamento em produtividade." },
          { icon:"⏱️", label:"Priorizar velocidade para terminar antes", desc:"Acelerar o plantio mesmo reduzindo parte das verificações de processo.", points:320, tone:"mid", effects:{productivity:5,quality:-4,efficiency:3,cooperation:-1}, feedback:"A operação avança rápido, mas perde parte do controle de qualidade." },
          { icon:"🔀", label:"Mudar a estratégia no meio da execução", desc:"Alterar sequência e recursos sem replanejar o impacto nas demais etapas.", points:210, tone:"risk", effects:{productivity:-2,quality:-3,efficiency:-7,cooperation:-4}, feedback:"Mudanças sem replanejamento geram desorganização e reduzem eficiência." },
        ],
      },
      {
        id:"cuidado", mascot:"toninho", scene:"assets/games/farm/farm_landscape_v40.png",
        kicker:"FASE 3 · CUIDADO DA LAVOURA", title:careTitle,
        text:`O clima da rodada é: ${weather.short}.`,
        decisionTitle:"Como você reage à condição do campo?",
        prompt:carePrompt,
        speech:weather.key === "chuva" ? "O cenário mudou. Boa gestão também é saber adaptar o plano." : weather.key === "calor" ? "Agora é hora de monitorar o campo e usar os recursos com inteligência." : "Condição boa não é motivo para tirar o olho dos indicadores.",
        choices:careChoices,
      },
      {
        id:"armazenagem", mascot:"aroldinho", scene:"assets/mission/scene_storage.webp",
        kicker:"FASE 4 · COLHEITA E ARMAZENAGEM", title:"A produção chegou. Agora é hora de preservar valor.",
        text:`A colheita de ${crop} começou e a unidade precisa receber o fluxo com qualidade.`,
        decisionTitle:"Como você organiza a chegada da safra?",
        prompt:`O volume cresce rapidamente e há ${session.siloPressure}. Qual é a melhor condução?`,
        speech:"Colher é só uma parte. Receber, classificar e armazenar bem também fazem diferença.",
        choices:[
          { icon:"🏗️", label:"Classificar, sequenciar o fluxo e usar a capacidade disponível", desc:"Direcionar a produção conforme qualidade, espaço e ritmo de recebimento.", points:500, tone:"best", effects:{productivity:4,quality:9,efficiency:9,cooperation:5}, feedback:"Excelente. Você conectou qualidade, capacidade e fluxo operacional." },
          { icon:"📍", label:"Usar primeiro o espaço mais próximo", desc:"Priorizar conveniência e reorganizar a armazenagem depois.", points:300, tone:"mid", effects:{productivity:2,quality:-2,efficiency:-4,cooperation:1}, feedback:"A solução é rápida, mas pode criar movimentação extra e retrabalho." },
          { icon:"📦", label:"Receber todo o volume antes de decidir o destino", desc:"Concentrar a produção temporariamente e definir a organização posteriormente.", points:190, tone:"risk", effects:{productivity:0,quality:-7,efficiency:-7,cooperation:-2}, feedback:"Adiar a decisão aumenta risco de gargalo e perda de qualidade." },
        ],
      },
      {
        id:"entrega", mascot:"aroldinho", scene:"assets/mission/scene_logistics.webp",
        kicker:"FASE 5 · ENTREGA", title:"A safra precisa chegar ao destino certo.",
        text:`O cenário final tem ${demand.short.toLowerCase()}.`,
        decisionTitle:"Como você conclui a missão?",
        prompt:`A cooperativa tem diferentes destinos para a produção e ${demand.label}. Como priorizar a expedição?`,
        speech:"Última decisão! Agora vamos conectar qualidade, prazo e atendimento.",
        choices:[
          { icon:"🚚", label:"Priorizar conforme pedido, qualidade e capacidade logística", desc:"Montar a sequência de entrega usando informação de toda a operação.", points:500, tone:"best", effects:{productivity:3,quality:5,efficiency:9,cooperation:9}, feedback:"Missão concluída com visão integrada. A entrega respeita prioridade, qualidade e capacidade." },
          { icon:"⚡", label:"Enviar primeiro o que estiver pronto", desc:"Reduzir tempo de espera sem considerar todas as prioridades do fluxo.", points:310, tone:"mid", effects:{productivity:2,quality:1,efficiency:2,cooperation:-3}, feedback:"A entrega acontece, mas não necessariamente na melhor ordem para a operação." },
          { icon:"🏁", label:"Escolher apenas a rota mais curta", desc:"Otimizar distância mesmo que o pedido e a qualidade indiquem outra prioridade.", points:210, tone:"risk", effects:{productivity:0,quality:-2,efficiency:-3,cooperation:-6}, feedback:"Distância é um fator, mas não substitui a visão completa do atendimento." },
        ],
      },
    ];
  }


  function startGrainGame(){
    const intro = $("#grainIntro");
    const game = $("#grainGame");
    const result = $("#grainResult");
    const startBtn = $("#grainStart");
    const playAgain = $("#grainPlayAgain");
    const conveyor = $("#grainConveyor");
    const bins = $$(".grain-bin");
    if (!intro || !game || !result || !startBtn || !conveyor) return null;

    const TYPES = {
      soja: { icon: '<img class="grain-soy-icon" src="assets/games/v53/soja.svg" alt="">', label: "Soja" },
      milho: { icon: "🌽", label: "Milho" },
      trigo: { icon: "🌾", label: "Trigo" },
      impureza: { icon: "🪨", label: "Impureza" },
    };
    let running = false;
    let rafId = 0;
    let spawnTimer = 0;
    let clockTimer = 0;
    let resetTimer = 0;
    let nextId = 1;
    let secondsLeft = 75;
    let score = 0;
    let combo = 0;
    let bestCombo = 0;
    let lives = 5;
    let sorted = 0;
    let attempts = 0;
    let misses = 0;
    let selectedId = null;
    let items = new Map();
    let lastFrame = 0;
    let speechTick = 0;

    const timerEl = $("#grainTimer");
    const scoreEl = $("#grainScore");
    const comboEl = $("#grainCombo");
    const livesEl = $("#grainLives");
    const speedEl = $("#grainSpeedLabel");
    const messageEl = $("#grainStageMessage");
    const toninhoEl = $("#grainToninhoSpeech");
    const aroldinhoEl = $("#grainAroldinhoSpeech");

    const formatTime = n => `${String(Math.floor(n/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`;
    const pace = () => secondsLeft > 55 ? 1 : secondsLeft > 35 ? 2 : secondsLeft > 18 ? 3 : 4;
    const speedPx = () => [0, 95, 120, 150, 185][pace()];
    const spawnDelay = () => [0, 1250, 1050, 880, 720][pace()];

    const updateHud = () => {
      if (timerEl) timerEl.textContent = formatTime(secondsLeft);
      if (scoreEl) scoreEl.textContent = String(score);
      if (comboEl) comboEl.textContent = `x${combo}`;
      if (livesEl) livesEl.textContent = "❤".repeat(Math.max(lives,0)) || "0";
      if (speedEl) speedEl.textContent = `Ritmo ${pace()}`;
      game.classList.toggle("is-final-sprint", secondsLeft <= 15);
    };

    const say = (kind) => {
      speechTick += 1;
      if (kind === "hit") {
        if (combo >= 6) {
          if (toninhoEl) toninhoEl.textContent = `Excelente! Combo x${combo}.`;
          if (aroldinhoEl) aroldinhoEl.textContent = "Ritmo forte e classificação precisa!";
        } else if (speechTick % 2) {
          if (toninhoEl) toninhoEl.textContent = "Boa classificação. Continue atento à qualidade.";
        } else if (aroldinhoEl) aroldinhoEl.textContent = "Acertou! Vamos manter a sequência.";
      } else if (kind === "miss") {
        if (toninhoEl) toninhoEl.textContent = "Atenção: item fora do destino correto.";
        if (aroldinhoEl) aroldinhoEl.textContent = "Tudo bem. Recomece o combo no próximo item!";
      }
    };

    const removeItem = item => {
      if (!item) return;
      item.el?.remove();
      items.delete(item.id);
      if (selectedId === item.id) selectedId = null;
    };

    const flashBin = (type, ok) => {
      const bin = bins.find(b => b.dataset.bin === type);
      if (!bin) return;
      bin.classList.remove("is-hit","is-wrong");
      void bin.offsetWidth;
      bin.classList.add(ok ? "is-hit" : "is-wrong");
      window.setTimeout(() => bin.classList.remove("is-hit","is-wrong"), 420);
    };

    const resolveItem = (item, binType) => {
      if (!running || !item || item.resolved) return;
      item.resolved = true;
      attempts += 1;
      if (binType === item.type) {
        combo += 1;
        bestCombo = Math.max(bestCombo, combo);
        sorted += 1;
        const gain = 100 + Math.min(combo, 10) * 15 + (pace() - 1) * 10;
        score += gain;
        flashBin(binType, true);
        say("hit");
        playGameTone("success");
      } else {
        lives -= 1;
        combo = 0;
        misses += 1;
        flashBin(binType, false);
        say("miss");
        playGameTone("error");
      }
      removeItem(item);
      updateHud();
      if (lives <= 0) finishGame(false);
    };

    const registerEscape = item => {
      if (!running || !item || item.resolved) return;
      item.resolved = true;
      attempts += 1;
      lives -= 1;
      combo = 0;
      misses += 1;
      if (messageEl) messageEl.textContent = "Um item passou sem classificação. Recupere no próximo!";
      say("miss");
      removeItem(item);
      updateHud();
      if (lives <= 0) finishGame(false);
    };

    const itemMarkup = type => `<span class="grain-item__icon" aria-hidden="true">${TYPES[type].icon}</span><span class="grain-item__glow"></span>`;

    const spawn = () => {
      if (!running) return;
      const typeKeys = Object.keys(TYPES);
      const type = typeKeys[Math.floor(Math.random() * typeKeys.length)];
      const rect = conveyor.getBoundingClientRect();
      const lanes = [0.23, 0.48, 0.72];
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      const el = document.createElement("button");
      const id = nextId++;
      el.type = "button";
      el.className = `grain-item grain-item--${type}`;
      el.dataset.itemId = String(id);
      el.setAttribute("aria-label", `${TYPES[type].label}. Arraste para classificar.`);
      el.innerHTML = itemMarkup(type);
      conveyor.appendChild(el);
      const item = { id, type, el, x:-72, y:Math.max(18, rect.height * lane - 36), dragging:false, resolved:false, pointerId:null, startX:0, startY:0, moved:false };
      items.set(id, item);
      el.style.left = `${item.x}px`;
      el.style.top = `${item.y}px`;

      el.addEventListener("pointerdown", e => {
        if (!running) return;
        item.dragging = true;
        item.pointerId = e.pointerId;
        item.startX = e.clientX;
        item.startY = e.clientY;
        item.moved = false;
        selectedId = item.id;
        el.classList.add("is-dragging","is-selected");
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
        e.preventDefault();
      });
      el.addEventListener("pointermove", e => {
        if (!item.dragging || item.pointerId !== e.pointerId) return;
        const belt = conveyor.getBoundingClientRect();
        const dx = e.clientX - item.startX;
        const dy = e.clientY - item.startY;
        if (Math.hypot(dx,dy) > 8) item.moved = true;
        item.x += dx;
        item.y += dy;
        item.startX = e.clientX;
        item.startY = e.clientY;
        el.style.left = `${item.x}px`;
        el.style.top = `${item.y}px`;
        e.preventDefault();
      });
      const finishDrag = e => {
        if (!item.dragging) return;
        item.dragging = false;
        el.classList.remove("is-dragging");
        let hit = null;
        for (const bin of bins) {
          const r = bin.getBoundingClientRect();
          if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) { hit = bin.dataset.bin; break; }
        }
        if (hit) resolveItem(item, hit);
        else if (!item.moved) {
          $$(".grain-item.is-selected", conveyor).forEach(n => { if (n !== el) n.classList.remove("is-selected"); });
          selectedId = item.id;
        } else {
          const belt = conveyor.getBoundingClientRect();
          item.y = Math.max(16, Math.min(belt.height - 82, item.y));
          item.x = Math.max(0, Math.min(belt.width - 78, item.x));
          el.style.left = `${item.x}px`;
          el.style.top = `${item.y}px`;
        }
        e.preventDefault();
      };
      el.addEventListener("pointerup", finishDrag);
      el.addEventListener("pointercancel", finishDrag);
    };

    bins.forEach(bin => bin.addEventListener("click", () => {
      if (!running || !selectedId) return;
      const item = items.get(selectedId);
      if (item) resolveItem(item, bin.dataset.bin);
    }));

    const animate = now => {
      if (!running) return;
      const dt = Math.min(.04, Math.max(0, (now - (lastFrame || now)) / 1000));
      lastFrame = now;
      const width = conveyor.clientWidth;
      for (const item of [...items.values()]) {
        if (item.dragging || item.resolved) continue;
        item.x += speedPx() * dt;
        item.el.style.left = `${item.x}px`;
        if (item.x > width - 42) registerEscape(item);
      }
      rafId = requestAnimationFrame(animate);
    };

    const scheduleSpawn = () => {
      window.clearTimeout(spawnTimer);
      if (!running) return;
      spawn();
      spawnTimer = window.setTimeout(scheduleSpawn, spawnDelay());
    };

    const clearTimers = () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(spawnTimer);
      window.clearInterval(clockTimer);
      window.clearTimeout(resetTimer);
      rafId = 0; spawnTimer = 0; clockTimer = 0; resetTimer = 0;
    };

    const resetIntro = () => {
      clearTimers();
      running = false;
      items.forEach(removeItem);
      items = new Map();
      game.hidden = true;
      result.hidden = true;
      intro.hidden = false;
      selectedId = null;
    };

    const finishGame = survived => {
      if (!running) return;
      running = false;
      clearTimers();
      items.forEach(item => item.el?.remove());
      items.clear();
      game.hidden = true;
      result.hidden = false;
      const accuracy = attempts ? Math.round((sorted / attempts) * 100) : 0;
      let title = "Classificação Bronze", badge = "🥉", text = "Boa tentativa. Na próxima rodada, busque mais precisão e sequência.";
      if (accuracy >= 92 && score >= 1800) { title = "Classificação Ouro"; badge = "🏆"; text = "Excelente precisão e ritmo. Você manteve a qualidade mesmo com a esteira acelerando."; }
      else if (accuracy >= 78 && score >= 1100) { title = "Classificação Prata"; badge = "🥈"; text = "Ótimo resultado. Você classificou bem mesmo com o aumento do ritmo."; }
      else if (!survived && lives <= 0) text = "A esteira venceu esta rodada. Tente novamente e recupere o combo.";
      $("#grainResultTitle").textContent = title;
      $("#grainResultBadge").textContent = badge;
      $("#grainResultText").textContent = text;
      $("#grainFinalScore").textContent = String(score);
      $("#grainAccuracy").textContent = `${accuracy}%`;
      $("#grainBestCombo").textContent = `x${bestCombo}`;
      $("#grainSorted").textContent = String(sorted);
      playGameTone(accuracy >= 78 ? "success" : "tap");
      if (accuracy >= 92) burstConfetti();
      resetTimer = window.setTimeout(resetIntro, 18000);
    };

    const start = () => {
      clearTimers();
      items.forEach(item => item.el?.remove());
      items = new Map();
      secondsLeft = 75; score = 0; combo = 0; bestCombo = 0; lives = 5; sorted = 0; attempts = 0; misses = 0; selectedId = null; nextId = 1; lastFrame = 0; speechTick = 0;
      intro.hidden = true;
      result.hidden = true;
      game.hidden = false;
      running = true;
      if (messageEl) messageEl.textContent = "Arraste os itens da esteira para o destino correto.";
      if (toninhoEl) toninhoEl.textContent = "Qualidade começa na classificação.";
      if (aroldinhoEl) aroldinhoEl.textContent = "Vamos buscar um combo alto!";
      updateHud();
      spawn();
      spawnTimer = window.setTimeout(scheduleSpawn, 900);
      rafId = requestAnimationFrame(animate);
      clockTimer = window.setInterval(() => {
        secondsLeft -= 1;
        if ([55,35,18].includes(secondsLeft)) {
          if (messageEl) messageEl.textContent = `A esteira acelerou! Ritmo ${pace()}.`;
          playGameTone("tap");
        }
        updateHud();
        if (secondsLeft <= 0) finishGame(true);
      }, 1000);
    };

    startBtn.addEventListener("click", start);
    playAgain?.addEventListener("click", start);
    return clearTimers;
  }

  function startFarmGame(){
    const intro=$("#farmIntro");
    const game=$("#farmGame");
    const result=$("#farmResult");
    const startBtn=$("#farmStart");
    const playAgain=$("#farmPlayAgain");
    if(!intro||!game||!result||!startBtn) return null;
    let state=null;
    let phases=[];
    let currentChoices=[];

    const clearFarmTimers=()=>{
      window.clearInterval(farmSessionInterval);
      window.clearTimeout(farmResetTimer);
      window.clearTimeout(farmInactivityTimer);
      farmSessionInterval=null; farmResetTimer=null; farmInactivityTimer=null;
    };

    const armInactivity=()=>{
      window.clearTimeout(farmInactivityTimer);
      if(!state || state.finished) return;
      farmInactivityTimer=window.setTimeout(()=>resetToIntro(),90000);
    };

    const updateMetricUI=()=>{
      if(!state) return;
      Object.entries(state.metrics).forEach(([key,val])=>{
        const el=$(`[data-metric="${key}"]`,game);
        if(!el) return;
        const safe=Math.round(clampFarmMetric(val));
        const strong=$("strong",el), bar=$("i",el);
        if(strong) strong.textContent=String(safe);
        if(bar) bar.style.width=`${safe}%`;
      });
    };

    const updateHud=()=>{
      if(!state) return;
      const phaseLabel=$("#farmPhaseLabel"), scenario=$("#farmScenarioLabel"), score=$("#farmScore"), timer=$("#farmTimer");
      if(phaseLabel) phaseLabel.textContent=`${Math.min(state.phaseIndex+1,5)}/5`;
      if(scenario) scenario.textContent=`${state.crop.icon} ${state.crop.name} · ${state.weather.icon} ${state.weather.short}`;
      if(score) score.textContent=String(state.score);
      if(timer){ timer.textContent=formatFarmTime(state.secondsLeft); timer.classList.toggle("is-urgent",state.secondsLeft<=30); }
      updateMetricUI();
    };

    const sceneClass=(phase)=>{
      const weatherClass=phase.id==="cuidado" ? ` weather-${state.weather.key}` : "";
      return `${phase.id}${weatherClass}`;
    };

    const renderPhase=()=>{
      if(!state || state.finished) return;
      armInactivity();
      const phase=phases[state.phaseIndex];
      state.chosen=false;
      currentChoices=shuffle(phase.choices.map(choice=>({...choice})));
      const scene=$("#farmScene"), sceneImg=$("#farmSceneImage"), sceneKicker=$("#farmSceneKicker"), sceneTitle=$("#farmSceneTitle"), sceneText=$("#farmSceneText");
      const guideMascot=$("#farmGuideMascot"), guideSpeech=$("#farmGuideSpeech");
      const dk=$("#farmDecisionKicker"), dt=$("#farmDecisionTitle"), dp=$("#farmDecisionPrompt"), cropBadge=$("#farmCropBadge"), choices=$("#farmChoices"), feedback=$("#farmFeedback"), next=$("#farmNext");
      if(scene){ scene.dataset.scene=sceneClass(phase); scene.className=`harvest-scene scene-${phase.id} weather-${phase.id==="cuidado"?state.weather.key:"none"}`; }
      if(sceneImg){ sceneImg.src=phase.scene; sceneImg.alt=`${phase.kicker}: ${phase.title}`; }
      if(sceneKicker) sceneKicker.textContent=phase.kicker;
      if(sceneTitle) sceneTitle.textContent=phase.title;
      if(sceneText) sceneText.textContent=phase.text;
      const ton=phase.mascot==="toninho";
      if(guideMascot){ guideMascot.src=ton?"assets/mascote_toninho_pose2.png":"assets/mascote_aroldinho.png"; guideMascot.alt=ton?"Toninho":"Aroldinho"; }
      if(guideSpeech) guideSpeech.textContent=phase.speech;
      if(dk) dk.textContent=`DECISÃO ${state.phaseIndex+1} DE 5`;
      if(dt) dt.textContent=phase.decisionTitle;
      if(dp) dp.textContent=phase.prompt;
      if(cropBadge) cropBadge.textContent=`${state.crop.icon} ${state.crop.name}`;
      if(feedback){ feedback.hidden=true; feedback.className="harvest-feedback"; feedback.innerHTML=""; }
      if(next){ next.hidden=true; next.textContent=state.phaseIndex===4?"Ver resultado da missão →":"Avançar para a próxima fase →"; }
      if(choices){
        choices.innerHTML=currentChoices.map((choice,idx)=>`<button class="harvest-choice" type="button" data-farm-choice="${idx}"><span class="harvest-choice__icon">${choice.icon}</span><span class="harvest-choice__body"><strong>${escapeHtml(choice.label)}</strong><small>${escapeHtml(choice.desc)}</small></span><span class="harvest-choice__arrow">→</span></button>`).join("");
        $$('[data-farm-choice]',choices).forEach(btn=>btn.addEventListener("click",()=>chooseFarmOption(Number(btn.dataset.farmChoice))));
      }
      updateHud();
      scene?.scrollIntoView({behavior:"smooth",block:"start"});
    };

    const chooseFarmOption=(idx)=>{
      if(!state || state.chosen || state.finished) return;
      armInactivity();
      const choice=currentChoices[idx];
      if(!choice) return;
      state.chosen=true;
      state.score += choice.points;
      Object.entries(choice.effects||{}).forEach(([key,value])=>{ state.metrics[key]=clampFarmMetric((state.metrics[key]||0)+Number(value||0)); });
      state.decisions.push({phase:phases[state.phaseIndex].id,label:choice.label,points:choice.points,tone:choice.tone});
      updateHud();
      const buttons=$$('[data-farm-choice]',$("#farmChoices"));
      buttons.forEach((btn,buttonIdx)=>{
        btn.disabled=true;
        if(buttonIdx===idx) btn.classList.add(choice.tone==="best"?"is-best":choice.tone==="mid"?"is-mid":"is-risk");
      });
      const feedback=$("#farmFeedback");
      if(feedback){
        feedback.hidden=false;
        feedback.className=`harvest-feedback is-${choice.tone}`;
        feedback.innerHTML=`<span>${choice.tone==="best"?"✓":choice.tone==="mid"?"↗":"!"}</span><div><strong>${choice.tone==="best"?"Ótima decisão":choice.tone==="mid"?"Decisão possível":"Atenção ao impacto"}</strong><p>${escapeHtml(choice.feedback)}</p><small>+${choice.points} pontos</small></div>`;
      }
      const guideSpeech=$("#farmGuideSpeech");
      if(guideSpeech) guideSpeech.textContent=choice.feedback;
      if(choice.tone==="best"){ playGameTone("success"); burstConfetti(); pulseMascots("#farmGame"); }
      else if(choice.tone==="risk") playGameTone("error");
      else playGameTone("tap");
      const next=$("#farmNext"); if(next) next.hidden=false;
    };

    const finishFarmSession=(timedOut=false)=>{
      if(!state || state.finished) return;
      state.finished=true;
      clearFarmTimers();
      const completed=state.decisions.length;
      const avg=Math.round(Object.values(state.metrics).reduce((a,b)=>a+b,0)/4);
      const timeBonus=Math.max(0,state.secondsLeft)*2;
      const completionBonus=completed===5?300:completed*40;
      const penalty=timedOut ? Math.max(0,(5-completed)*160) : 0;
      const finalScore=Math.max(0,state.score + avg*15 + timeBonus + completionBonus - penalty);
      let rank="Safra em Desenvolvimento", rankText="Você concluiu a missão e viu como cada decisão interfere no resultado da operação.";
      if(finalScore>=4000){rank="Safra Ouro";rankText="Excelente equilíbrio entre planejamento, qualidade, eficiência e cooperação.";}
      else if(finalScore>=3500){rank="Safra Excelente";rankText="Uma condução muito consistente, com boas decisões ao longo de toda a jornada.";}
      else if(finalScore>=3000){rank="Boa Gestão da Safra";rankText="Você manteve a operação equilibrada e reagiu bem aos desafios da rodada.";}
      const topKey=Object.entries(state.metrics).sort((a,b)=>b[1]-a[1])[0][0];
      const resultTitle=$("#farmResultTitle"), resultText=$("#farmResultText"), finalScoreEl=$("#farmFinalScore"), resultMetrics=$("#farmResultMetrics"), highlight=$("#farmResultHighlight");
      if(resultTitle) resultTitle.textContent=rank;
      if(resultText) resultText.textContent=timedOut?`O tempo encerrou após ${completed} de 5 decisões. ${rankText}`:rankText;
      if(finalScoreEl) finalScoreEl.textContent=String(finalScore);
      if(resultMetrics) resultMetrics.innerHTML=Object.entries(state.metrics).map(([key,val])=>`<div><span>${FARM_METRIC_META[key].icon}</span><small>${FARM_METRIC_META[key].label}</small><strong>${Math.round(val)}</strong></div>`).join("");
      if(highlight) highlight.innerHTML=`<span>Seu destaque</span><strong>${FARM_METRIC_META[topKey].icon} ${FARM_METRIC_META[topKey].label}</strong><p>Já imaginou participar de uma operação que conecta campo, armazenagem, indústria, tecnologia e pessoas?</p>`;
      game.hidden=true; result.hidden=false;
      result.scrollIntoView({behavior:"smooth",block:"start"});
      burstConfetti(); playGameTone("success");
      let countdown=30;
      const countdownEl=$("#farmResetCountdown");
      const paint=()=>{ if(countdownEl) countdownEl.textContent=`Nova missão automática em ${countdown}s para o próximo visitante.`; };
      paint();
      farmSessionInterval=window.setInterval(()=>{
        countdown-=1; paint();
        if(countdown<=0) resetToIntro();
      },1000);
    };

    const nextPhase=()=>{
      if(!state || !state.chosen || state.finished) return;
      if(state.phaseIndex>=4){ finishFarmSession(false); return; }
      state.phaseIndex+=1;
      renderPhase();
    };

    const beginSession=()=>{
      clearFarmTimers();
      state=buildFarmSession();
      phases=farmPhaseBank(state);
      intro.hidden=true; result.hidden=true; game.hidden=false;
      renderPhase();
      updateHud();
      farmSessionInterval=window.setInterval(()=>{
        if(!state || state.finished) return;
        state.secondsLeft=Math.max(0,state.secondsLeft-1);
        updateHud();
        if(state.secondsLeft<=0) finishFarmSession(true);
      },1000);
      armInactivity();
    };

    function resetToIntro(){
      clearFarmTimers();
      state=null; phases=[]; currentChoices=[];
      game.hidden=true; result.hidden=true; intro.hidden=false;
      const countdownEl=$("#farmResetCountdown"); if(countdownEl) countdownEl.textContent="A tela será reiniciada para o próximo visitante.";
      intro.scrollIntoView({behavior:"smooth",block:"start"});
    }

    startBtn.addEventListener("click",()=>{ playGameTone("tap"); beginSession(); });
    playAgain?.addEventListener("click",()=>{ playGameTone("tap"); beginSession(); });
    $("#farmNext")?.addEventListener("click",()=>{ playGameTone("tap"); nextPhase(); });
    game.addEventListener("pointerdown",armInactivity,{passive:true});
    game.addEventListener("keydown",armInactivity);
    return ()=>clearFarmTimers();
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
          <label class="admin-field"><span>Coamo Games</span><select id="adminGames"><option value="1">Exibir</option><option value="0">Ocultar</option></select></label>
        </div>
        <div class="admin-section">
          <div class="admin-section__head"><div><strong>Conteúdos da apresentação</strong><span>Escolha o que pode aparecer no looping do totem.</span></div><b id="adminContentCount">0 ativos</b></div>
          <div class="admin-toggle-list">
            <label class="admin-toggle"><span><strong>Programa de Estágio</strong><small>Slide das 111 oportunidades</small></span><input id="adminShowInternship" type="checkbox"><i></i></label>
            <label class="admin-toggle admin-toggle--nested"><span><strong>Logo nova do Estágio</strong><small>Deixe desligado até o lançamento oficial</small></span><input id="adminShowInternshipLogo" type="checkbox"><i></i></label>
            <label class="admin-toggle"><span><strong>Unicoamo</strong><small>Desenvolvimento e universidade corporativa</small></span><input id="adminShowUnicoamo" type="checkbox"><i></i></label>
            <label class="admin-toggle"><span><strong>Qualidade de Vida</strong><small>Programa e seus quatro pilares</small></span><input id="adminShowQualityOfLife" type="checkbox"><i></i></label>
            <label class="admin-toggle"><span><strong>Coamo + Saúde</strong><small>Serviços de cuidado e atendimento digital</small></span><input id="adminShowCoamoSaude" type="checkbox"><i></i></label>
            <label class="admin-toggle"><span><strong>FUPS</strong><small>Fundo de Proteção à Saúde</small></span><input id="adminShowFups" type="checkbox"><i></i></label>
            <label class="admin-toggle"><span><strong>ARCAM</strong><small>Esporte, cultura, saúde e lazer</small></span><input id="adminShowArcam" type="checkbox"><i></i></label>
          </div>
        </div>
        <div class="admin-section">
          <div class="admin-section__head"><div><strong>Jogos interativos</strong><span>Ative ou oculte experiências disponíveis no menu.</span></div><b id="adminGamesCount">0 ativos</b></div>
          <div class="admin-toggle-list">
            <label class="admin-toggle"><span><strong>Descubra sua área</strong><small>Questionário de perfil</small></span><input id="adminGameProfile" type="checkbox"><i></i></label>
            <label class="admin-toggle"><span><strong>Desafio Coamo</strong><small>Jogo da memória</small></span><input id="adminGameMemory" type="checkbox"><i></i></label>
            <label class="admin-toggle"><span><strong>Monte a cadeia Coamo</strong><small>Fluxo da cooperativa</small></span><input id="adminGameChain" type="checkbox"><i></i></label>
            <label class="admin-toggle"><span><strong>Desafio da Classificação</strong><small>Arcade de classificação de grãos em 75 segundos</small></span><input id="adminGameGrain" type="checkbox"><i></i></label>
          </div>
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
        gamesEnabled: $("#adminGames")?.value !== "0",
        showInternship: !!$("#adminShowInternship")?.checked,
        showInternshipLogo: true,
        showUnicoamo: !!$("#adminShowUnicoamo")?.checked,
        showQualityOfLife: !!$("#adminShowQualityOfLife")?.checked,
        showCoamoSaude: !!$("#adminShowCoamoSaude")?.checked,
        showFups: !!$("#adminShowFups")?.checked,
        showArcam: !!$("#adminShowArcam")?.checked,
        gameProfileEnabled: !!$("#adminGameProfile")?.checked,
        gameMemoryEnabled: !!$("#adminGameMemory")?.checked,
        gameChainEnabled: !!$("#adminGameChain")?.checked,
        gameGrainEnabled: !!$("#adminGameGrain")?.checked,
      });
      close();
    });
    $("#adminTestApi")?.addEventListener("click", testVacancyIntegration);
  }

  function updateAdminContentCount() {
    const ids = ["adminShowInternship","adminShowUnicoamo","adminShowQualityOfLife","adminShowCoamoSaude","adminShowFups","adminShowArcam"];
    const active = ids.filter(id => $("#" + id)?.checked).length;
    const el = $("#adminContentCount");
    if (el) el.textContent = `${active} ativo${active === 1 ? "" : "s"}`;
    const gameIds = ["adminGameProfile","adminGameMemory","adminGameChain","adminGameGrain"];
    const activeGames = gameIds.filter(id => $("#" + id)?.checked).length;
    const gamesEl = $("#adminGamesCount");
    if (gamesEl) gamesEl.textContent = `${activeGames} ativo${activeGames === 1 ? "" : "s"}`;
    const internshipLogo = $("#adminShowInternshipLogo");
    const internship = $("#adminShowInternship");
    if (internshipLogo && internship) {
      internshipLogo.disabled = !internship.checked;
      internshipLogo.closest(".admin-toggle")?.classList.toggle("is-disabled", !internship.checked);
    }
  }

  function openAdmin() {
    buildAdminModal();
    $("#adminSlideSeconds").value = settings.slideSeconds;
    $("#adminIdleSeconds").value = settings.inactivitySeconds;
    $("#adminRaffle").value = settings.raffleEnabled ? "1" : "0";
    $("#adminAuto").value = settings.autoPresentation ? "1" : "0";
    $("#adminGames").value = settings.gamesEnabled ? "1" : "0";
    $("#adminShowInternship").checked = settings.showInternship !== false;
    if ($("#adminShowInternshipLogo")) { $("#adminShowInternshipLogo").checked = true; $("#adminShowInternshipLogo").disabled = true; }
    $("#adminShowUnicoamo").checked = settings.showUnicoamo !== false;
    $("#adminShowQualityOfLife").checked = settings.showQualityOfLife !== false;
    $("#adminShowCoamoSaude").checked = settings.showCoamoSaude !== false;
    $("#adminShowFups").checked = settings.showFups !== false;
    $("#adminShowArcam").checked = settings.showArcam !== false;
    $("#adminGameProfile").checked = settings.gameProfileEnabled !== false;
    $("#adminGameMemory").checked = settings.gameMemoryEnabled !== false;
    $("#adminGameChain").checked = settings.gameChainEnabled !== false;
    $("#adminGameGrain").checked = settings.gameGrainEnabled !== false;
    $$(".admin-toggle input[type=checkbox]").forEach(el => el.onchange = updateAdminContentCount);
    updateAdminContentCount();
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
    initGamesPage();
    initGameCovers();
    initIdleTracking();
    enrichPresentationWithVacancies();
    maybeAutoStartPresentation();
  });

  window.startPresentation = startPresentation;
  window.stopPresentation = stopPresentation;
})();
