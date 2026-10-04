(() => {
  "use strict";
  document.documentElement.dataset.totemBuild = "v21";

  const STORAGE_KEY = "coamoTotemSettingsV3";
  const BUILD_VERSION = "v21";
  const DEFAULT_SETTINGS = {
    slideSeconds: 9,
    inactivitySeconds: 60,
    raffleEnabled: true,
    autoPresentation: true,
    showInternship: true,
    showInternshipLogo: false,
    showUnicoamo: true,
    showQualityOfLife: true,
    showCoamoSaude: true,
    showFups: true,
    showArcam: true,
    gamesEnabled: true,
    gameProfileEnabled: true,
    gameMemoryEnabled: true,
    gameChainEnabled: true,
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
    if (page === "raffle" && !settings.raffleEnabled) {
      window.location.replace("index.html?interactive=1");
    }
    if (page === "games" && !settings.gamesEnabled) {
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
    return {
      id,
      title,
      location: getLocation(job) || "Localidade a consultar",
      group: guessGroup(job),
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
      root.innerHTML = `<div class="vacancy-empty"><strong>Nenhuma vaga encontrada.</strong><span>Tente remover um dos filtros ou escaneie o QR Code para consultar o portal completo.</span></div>`;
    } else {
      list.forEach(v => {
        const item = document.createElement("article");
        item.className = "vagaItem";
        item.innerHTML = `
          ${getVacancyImage(v)
            ? `<div class="vagaThumb ${v?.photo?.profile === "estrutura" ? "vagaThumb--structure" : ""}"><img src="${escapeHtml(getVacancyImage(v))}" alt="${v?.photo?.profile === "estrutura" ? "Estrutura Coamo" : ""}" loading="lazy" onerror="this.closest('.vagaThumb')?.classList.add('vagaThumb--neutral');this.remove()"></div>`
            : `<div class="vagaThumb vagaThumb--neutral" aria-hidden="true"><span>coamo</span></div>`}
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
      id: "coamo",
      pill: "Coamo",
      title: "Uma história construída em cooperação.",
      sub: "Diferentes profissões, conhecimentos e experiências se conectam todos os dias para fazer uma grande operação acontecer.",
      bg: "assets/img_cultura.jpg",
      position: "center 40%",
    },
    {
      id: "campo",
      pill: "Campo & Cooperado",
      title: "Onde a relação com o produtor acontece.",
      sub: "Assistência técnica, atendimento, orientação e atividades ligadas à produção aproximam conhecimento, cooperado e resultado.",
      bg: "assets/agro_01.jpg",
      position: "center 48%",
      metric: { value: "+400", label: "Agrônomos e Veterinários" },
    },
    {
      id: "operacoes",
      pill: "Armazenagem & Operações",
      title: "Onde cada safra exige precisão.",
      sub: "Recebimento, classificação, movimentação, conservação e expedição conectam pessoas, equipamentos e processos.",
      bg: "assets/industria_03.jpg",
      position: "center 46%",
    },
    {
      id: "industria",
      pill: "Indústria & Qualidade",
      title: "Onde matéria-prima ganha novas possibilidades.",
      sub: "Produção, manutenção, controle de qualidade, segurança e eficiência fazem parte de uma operação industrial de grande escala.",
      bg: "assets/industria_01.jpg",
      position: "center 42%",
    },
    {
      id: "tecnologia",
      pill: "Tecnologia & Dados",
      title: "Tecnologia por trás de uma operação que não para.",
      sub: "Sistemas, infraestrutura, dados, automação e soluções digitais dão suporte às decisões e aos processos do negócio.",
      bg: "assets/admin_04.jpg",
      position: "center 45%",
    },
    {
      id: "gestao",
      pill: "Gestão & Áreas Corporativas",
      title: "Estrutura para transformar estratégia em execução.",
      sub: "Pessoas, finanças, engenharia, jurídico, comunicação, planejamento e outras especialidades sustentam a operação.",
      bg: "assets/admin_01.jpg",
      position: "center 42%",
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
      brand: "assets/logo_programa_estagios_v11.png",
      brandSetting: "showInternshipLogo",
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
      brand: "assets/logo_programa_estagios_v11.png",
      brandSetting: "showInternshipLogo",
      brandFallback: "Programa de Estágio",
      tags: ["Engenharias", "Agronomia", "Veterinária", "Saúde", "Psicologia", "Tecnologia", "Alimentos", "Biotecnologia"],
    },
    {
      id: "trajetorias",
      pill: "Trajetórias",
      title: "Carreiras são construídas com o tempo.",
      sub: "Conhecimento, experiência e novas responsabilidades fazem parte de uma trajetória profissional que continua evoluindo.",
      bg: "assets/depo_edivilson_bg.jpg",
      position: "center 42%",
      author: { name: "Edevilson Canali", role: "Supervisor de Soluções de Negócio", photo: "assets/depo_edivilson_avatar.jpg" },
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
        <div class="presentation-logo"><img src="assets/logo.png" alt="Coamo"></div>
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
    if (topLogo) topLogo.src = institutional ? "assets/logo_verde.png" : "assets/logo.png";

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
    const showBrand = !!s.brand && (!s.brandSetting || settings[s.brandSetting] === true || !s.brandSetting);
    if (brandStage && brandImage && brandFallback && institutional) {
      brandStage.hidden = false;
      brandStage.style.display = "flex";
      if (showBrand) {
        brandImage.style.display = "block";
        brandImage.src = s.brand;
        brandImage.alt = s.pill || "Marca";
        brandFallback.hidden = true;
        brandFallback.style.display = "none";
        brandFallback.textContent = "";
      } else {
        brandImage.style.display = "none";
        brandImage.removeAttribute("src");
        brandFallback.hidden = false;
        brandFallback.style.display = "flex";
        brandFallback.textContent = s.brandFallback || s.pill || "Coamo";
      }
    } else if (brandStage && brandImage && brandFallback) {
      brandStage.hidden = true;
      brandStage.style.display = "none";
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
    campo: { title: "Campo & Cooperado", text: "Você demonstra afinidade com relacionamento, orientação e proximidade com a produção. Na Coamo, essa área conecta conhecimento técnico e cooperados.", image: "assets/agro_01.jpg", icon: "🌾", accent: "campo" },
    operacoes: { title: "Armazenagem & Operações", text: "Seu perfil combina com ambientes dinâmicos, processos e execução. Essa área conecta recebimento, movimentação, conservação e expedição.", image: "assets/estruturas/estrutura_unidade_aerea.jpg", icon: "🏗", accent: "operacoes" },
    industria: { title: "Indústria & Produção", text: "Você se identifica com produção, qualidade, manutenção e eficiência. A indústria transforma matéria-prima em novas possibilidades.", image: "assets/industria_05.jpg", icon: "⚙", accent: "industria" },
    tecnologia: { title: "Tecnologia & Dados", text: "Seu perfil aponta para soluções digitais, análise e inovação. Na Coamo, a tecnologia ajuda uma grande operação a continuar conectada.", image: "assets/admin_04.jpg", icon: "💻", accent: "tecnologia" },
    gestao: { title: "Gestão & Áreas Corporativas", text: "Você demonstra afinidade com planejamento, análise, organização e suporte à operação. Essa estrutura sustenta as decisões do negócio.", image: "assets/admin_01.jpg", icon: "👥", accent: "gestao" },
    pessoas: { title: "Pessoas & Desenvolvimento", text: "Seu perfil combina com relações humanas, cuidado, desenvolvimento e apoio às pessoas. É um universo importante para fortalecer cultura e crescimento.", image: "assets/img_carreira.jpg", icon: "🤝", accent: "pessoas" },
  };

  const PROFILE_QUESTIONS = [
    { question: "Em qual ambiente você mais se imagina trabalhando?", options: [
      { label: "Próximo ao campo e ao produtor", area: "campo" },
      { label: "Em uma operação dinâmica", area: "operacoes" },
      { label: "Com análise, gestão ou pessoas", area: "gestao" },
    ]},
    { question: "Qual atividade parece mais interessante para você?", options: [
      { label: "Orientar e gerar relacionamento", area: "campo" },
      { label: "Resolver problemas com tecnologia", area: "tecnologia" },
      { label: "Acompanhar produção e qualidade", area: "industria" },
    ]},
    { question: "O que mais chama sua atenção em um trabalho?", options: [
      { label: "Organização e ritmo da operação", area: "operacoes" },
      { label: "Aprendizado e desenvolvimento de pessoas", area: "pessoas" },
      { label: "Planejamento e estratégia", area: "gestao" },
    ]},
    { question: "Qual frase combina mais com você?", options: [
      { label: "Gosto de ver o resultado prático do que faço", area: "industria" },
      { label: "Gosto de conectar sistemas, dados e soluções", area: "tecnologia" },
      { label: "Gosto de estar próximo das pessoas", area: "pessoas" },
    ]},
    { question: "Qual cenário desperta mais interesse?", options: [
      { label: "Lavoura, produção e assistência", area: "campo" },
      { label: "Silos, recebimento e movimentação", area: "operacoes" },
      { label: "Projetos, números e decisões", area: "gestao" },
    ]},
    { question: "Escolha a área que mais desperta curiosidade.", options: [
      { label: "Tecnologia e dados", area: "tecnologia" },
      { label: "Indústria e processos", area: "industria" },
      { label: "Pessoas e desenvolvimento", area: "pessoas" },
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
    { pairId: "pr", type: "fact", image: "assets/estruturas/estrutura_campo_mourao_aerea.jpg", title: "A maior empresa", subtitle: "do Paraná" },
    { pairId: "pr", type: "fact", image: "assets/estruturas/estrutura_campo_mourao_aerea.jpg", title: "COAMO", subtitle: "" },
    { pairId: "latam", type: "fact", image: "assets/estruturas/estrutura_terminal_paranagua.jpg", title: "A maior cooperativa agrícola", subtitle: "da América Latina" },
    { pairId: "latam", type: "fact", image: "assets/estruturas/estrutura_terminal_paranagua.jpg", title: "COAMO", subtitle: "" },
  ];

  const CHAIN_STEPS = [
    { id: "campo", title: "Campo", text: "Origem da produção e relacionamento com o cooperado.", image: "assets/agro_01.jpg", icon: "🌾", theme: "campo" },
    { id: "recebimento", title: "Recebimento", text: "Chegada, conferência e início do fluxo operacional.", image: "assets/estruturas/estrutura_unidade_aerea.jpg", icon: "⬇", theme: "recebimento" },
    { id: "armazenagem", title: "Armazenagem", text: "Conservação, controle e organização dos produtos.", image: "assets/estruturas/estrutura_parque_industrial.jpg", icon: "◫", theme: "armazenagem" },
    { id: "industria", title: "Indústria", text: "Transformação da matéria-prima em novos produtos.", image: "assets/industria_05.jpg", icon: "⚙", theme: "industria" },
    { id: "logistica", title: "Logística", text: "Movimentação e conexão entre unidades e mercados.", image: "assets/vaga_fotos/mecanico_de_veiculos.jpg", icon: "🚚", theme: "logistica" },
    { id: "mercado", title: "Mercado", text: "Entrega final e presença no Brasil e no exterior.", image: "assets/estruturas/estrutura_terminal_paranagua.jpg", icon: "🌎", theme: "mercado" },
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
    if (page !== "games") return;
    const panels = { profile: $("#gameProfile"), memory: $("#gameMemory"), chain: $("#gameChain") };
    const menu = $("#gamesMenu");
    const hero = $("#gamesHero");
    let cleanupCurrentGame = null;

    const showMenu = () => {
      if (typeof cleanupCurrentGame === "function") cleanupCurrentGame();
      cleanupCurrentGame = null;
      if (hero) hero.hidden = false;
      if (menu) menu.hidden = false;
      document.body.classList.remove("is-game-active");
      Object.values(panels).forEach(panel => { if (panel) panel.hidden = true; });
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const showPanel = (key) => {
      if (typeof cleanupCurrentGame === "function") cleanupCurrentGame();
      cleanupCurrentGame = null;
      if (hero) hero.hidden = true;
      if (menu) menu.hidden = true;
      document.body.classList.add("is-game-active");
      Object.entries(panels).forEach(([name, panel]) => { if (panel) panel.hidden = name !== key; });
      playGameTone("tap");
      if (key === "profile") cleanupCurrentGame = startProfileGame();
      if (key === "memory") cleanupCurrentGame = startMemoryGame();
      if (key === "chain") cleanupCurrentGame = startChainGame();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    $$('[data-game-launch]').forEach(btn => btn.addEventListener("click", () => showPanel(btn.dataset.gameLaunch)));
    $$(".js-back-games").forEach(btn => btn.addEventListener("click", () => { playGameTone("tap"); showMenu(); }));
    showMenu();
  }

  function startProfileGame() {
    const root = $("#profileGame");
    const progress = $("#profileProgressBar");
    if (!root) return null;
    let step = 0;
    let xp = 0;
    const scores = { campo: 0, operacoes: 0, industria: 0, tecnologia: 0, gestao: 0, pessoas: 0 };

    const render = () => {
      if (progress) progress.style.width = `${(step / PROFILE_QUESTIONS.length) * 100}%`;
      if (step >= PROFILE_QUESTIONS.length) {
        const winner = Object.entries(scores).sort((a,b) => b[1]-a[1])[0]?.[0] || "gestao";
        const area = PROFILE_AREAS[winner];
        root.innerHTML = `<div class="profile-result profile-result--game"><div class="profile-result__media"><img src="${area.image}" alt="${escapeHtml(area.title)}"><div class="profile-result__stamp">${area.icon}</div></div><div class="profile-result__content"><span class="game-result-kicker">MISSÃO CONCLUÍDA</span><h3>Seu perfil combina com<br>${escapeHtml(area.title)}</h3><p>${escapeHtml(area.text)}</p><div class="profile-result__chips"><span>⭐ ${xp} XP</span><span>✓ ${PROFILE_QUESTIONS.length} respostas</span><span>🎮 Perfil descoberto</span></div><div class="hero-actions"><button class="btn btn--soft" type="button" id="profileRestart">Jogar novamente</button><a class="btn btn--primary" href="vagas.html">Ver vagas</a></div></div></div>`;
        $("#profileRestart")?.addEventListener("click", () => { playGameTone("tap"); startProfileGame(); });
        if (progress) progress.style.width = "100%";
        playGameTone("success"); burstConfetti(); pulseMascots("#gameProfile");
        return;
      }

      const item = PROFILE_QUESTIONS[step];
      root.innerHTML = `<div class="profile-question profile-question--game"><div class="profile-question__top"><div class="profile-question__count">Pergunta ${step + 1} de ${PROFILE_QUESTIONS.length}</div><div class="profile-question__score">⭐ ${xp} XP</div></div><h3>${escapeHtml(item.question)}</h3><p class="profile-question__helper">Escolha a opção que mais representa você no dia a dia.</p><div class="profile-options">${item.options.map((opt, idx) => { const meta = PROFILE_AREAS[opt.area] || {}; return `<button class="profile-option profile-option--${meta.accent || opt.area}" type="button" data-area="${opt.area}"><span class="profile-option__visual"><img src="${meta.image}" alt=""><i>${meta.icon}</i></span><span class="profile-option__body"><b>0${idx + 1}</b><strong>${escapeHtml(opt.label)}</strong><small>Toque para escolher</small></span></button>`; }).join("")}</div></div>`;
      $$(".profile-option", root).forEach(btn => btn.addEventListener("click", () => {
        scores[btn.dataset.area] = (scores[btn.dataset.area] || 0) + 1;
        xp += 100;
        btn.classList.add("is-selected");
        playGameTone("success");
        pulseMascots("#gameProfile");
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
      if (card.type === "logo") return `<img class="memory-card__logo" src="${card.image}" alt="${escapeHtml(card.label)}"><small>${escapeHtml(card.label)}</small>`;
      return `<img class="memory-card__photo" src="${card.image}" alt=""><span class="memory-card__factText"><strong>${escapeHtml(card.title || "")}</strong>${card.subtitle ? `<small>${escapeHtml(card.subtitle)}</small>` : ""}</span>`;
    };

    const render = () => {
      updateHud();
      grid.innerHTML = cards.map(card => `
        <button type="button" class="memory-card ${card.flipped || card.matched ? "is-flipped" : ""} ${card.matched ? "is-matched" : ""}" data-uid="${card.uid}" aria-label="Carta do desafio Coamo">
          <span class="memory-card__inner">
            <span class="memory-card__face memory-card__face--front"><img src="assets/logo.png" alt="Coamo"><b>DESAFIO COAMO</b><small>Toque para revelar</small></span>
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
      playGameTone("success"); burstConfetti(); pulseMascots("#gameMemory");
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
        pulseMascots("#gameChain", "error");
        return;
      }

      if (step >= CHAIN_STEPS.length) {
        options.innerHTML = "";
        result.hidden = false;
        result.innerHTML = `<div class="game-result__card is-success game-result__card--celebrate"><span class="game-result-kicker">CADEIA COMPLETA</span><h3>Você conectou a jornada Coamo!</h3><p>Do campo ao mercado, todas as etapas foram colocadas na ordem correta.</p><div class="game-result__stats"><span><strong>${score}</strong> pontos</span><span><strong>${hearts}</strong> vidas restantes</span></div><button class="btn btn--primary" type="button" id="chainRestart">Jogar novamente</button></div>`;
        $("#chainRestart")?.addEventListener("click", () => { playGameTone("tap"); startChainGame(); });
        playGameTone("success"); burstConfetti(); pulseMascots("#gameChain");
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
          step += 1;
          available = shuffle(CHAIN_STEPS.filter(item => !CHAIN_STEPS.slice(0, step).some(done => done.id === item.id)));
          setTimeout(render, 600);
        } else {
          hearts -= 1;
          btn.classList.add("is-wrong");
          result.innerHTML = `<div class="game-result__card is-error"><strong>✕ Não foi dessa vez!</strong><p>Essa não é a próxima etapa. Você perdeu 1 vida.</p></div>`;
          playGameTone("error");
          pulseMascots("#gameChain", "error");
          setTimeout(() => { btn.classList.remove("is-wrong"); render(); }, 720);
        }
      }));
    };

    render();
    return null;
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
          <label class="admin-field"><span>Jogos Coamo</span><select id="adminGames"><option value="1">Exibir</option><option value="0">Ocultar</option></select></label>
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
        showInternshipLogo: !!$("#adminShowInternshipLogo")?.checked,
        showUnicoamo: !!$("#adminShowUnicoamo")?.checked,
        showQualityOfLife: !!$("#adminShowQualityOfLife")?.checked,
        showCoamoSaude: !!$("#adminShowCoamoSaude")?.checked,
        showFups: !!$("#adminShowFups")?.checked,
        showArcam: !!$("#adminShowArcam")?.checked,
        gameProfileEnabled: !!$("#adminGameProfile")?.checked,
        gameMemoryEnabled: !!$("#adminGameMemory")?.checked,
        gameChainEnabled: !!$("#adminGameChain")?.checked,
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
    const gameIds = ["adminGameProfile","adminGameMemory","adminGameChain"];
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
    $("#adminShowInternshipLogo").checked = settings.showInternshipLogo === true;
    $("#adminShowUnicoamo").checked = settings.showUnicoamo !== false;
    $("#adminShowQualityOfLife").checked = settings.showQualityOfLife !== false;
    $("#adminShowCoamoSaude").checked = settings.showCoamoSaude !== false;
    $("#adminShowFups").checked = settings.showFups !== false;
    $("#adminShowArcam").checked = settings.showArcam !== false;
    $("#adminGameProfile").checked = settings.gameProfileEnabled !== false;
    $("#adminGameMemory").checked = settings.gameMemoryEnabled !== false;
    $("#adminGameChain").checked = settings.gameChainEnabled !== false;
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
    initIdleTracking();
    enrichPresentationWithVacancies();
    maybeAutoStartPresentation();
  });

  window.startPresentation = startPresentation;
  window.stopPresentation = stopPresentation;
})();
