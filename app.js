(() => {
  "use strict";

  const CONFIG = {
    inactivityMs: 60 * 1000,
    slideMs: 10 * 1000,
    presentationVacancyLimit: 10,
    jobfeed: {
      enabled: true,
      baseUrl: "",
      endpoint: "/api/vagas"
    }
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[ch]));

  const norm = (value = "") =>
    String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  function formatClock() {
    const el = $("#currentTime");
    if (!el) return;
    const update = () => {
      const d = new Date();
      el.textContent = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      el.dateTime = d.toISOString();
    };
    update();
    setInterval(update, 30 * 1000);
  }

  function pickJobsArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];
    const candidates = [
      payload.vacancies, payload.data, payload.jobs, payload.items, payload.results, payload.rows,
      payload.data?.vacancies, payload.data?.jobs, payload.data?.items,
      payload.payload?.vacancies, payload.payload?.jobs
    ];
    return candidates.find(Array.isArray) || [];
  }

  function readableValue(value) {
    if (value == null) return "";
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (Array.isArray(value)) return value.map(readableValue).filter(Boolean).join(", ");
    if (typeof value === "object") {
      return readableValue(value.name || value.title || value.label || value.city || value.value || "");
    }
    return "";
  }

  function extractLocation(job) {
    const direct = readableValue(job.location || job.workplace || job.unit || job.city || job.address_city);
    if (direct) return direct;

    const city = readableValue(job.address?.city || job.city?.name || job.location?.city);
    const state = readableValue(job.address?.state || job.state || job.location?.state);
    if (city && state) return `${city}, ${state}`;
    return city || state || "Local a consultar";
  }

  function guessGroup(job) {
    const title = norm(job.title || job.name || job.position || job.job_title || "");
    const explicit = norm([
      readableValue(job.group), readableValue(job.area), readableValue(job.department),
      readableValue(job.category), readableValue(job.segment), readableValue(job.business_unit)
    ].filter(Boolean).join(" "));

    const all = `${title} ${explicit}`;

    const agroTerms = [
      "agronom", "classificador", "cereais", "graos", "armazen", "entreposto",
      "maquinista", "balanca", "moega", "sement", "agro", "campo"
    ];
    const industryTerms = [
      "industr", "producao", "manutencao", "mecan", "eletric", "caldeira",
      "operador industrial", "laboratorio", "qualidade industrial"
    ];

    if (agroTerms.some(k => all.includes(k))) return "agro";
    if (industryTerms.some(k => all.includes(k))) return "industria";
    return "admin";
  }

  function normalizeVacancy(job, idx) {
    const title = readableValue(job.title || job.name || job.position || job.job_title) || "Vaga";
    const id = readableValue(job.id || job.code || job.vacancy_id || job.job_id) || String(idx + 1);
    return {
      id,
      title,
      location: extractLocation(job),
      group: guessGroup(job),
      raw: job
    };
  }

  async function fetchVacanciesFromApi() {
    const jf = CONFIG.jobfeed;
    if (!jf.enabled || !jf.endpoint) return [];
    const base = jf.baseUrl ? jf.baseUrl.replace(/\/$/, "") : window.location.origin;
    const res = await fetch(base + jf.endpoint, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    const jobs = pickJobsArray(payload);

    const unique = new Map();
    jobs.forEach((job, idx) => {
      const v = normalizeVacancy(job, idx);
      const key = v.id || `${v.title}|${v.location}`;
      if (!unique.has(key)) unique.set(key, v);
    });
    return Array.from(unique.values());
  }

  const GROUPS = {
    agro: { label: "Campo & Agro" },
    industria: { label: "Indústria" },
    admin: { label: "Administrativo" }
  };

  function groupLabel(group) {
    return GROUPS[group]?.label || "Administrativo";
  }

  function groupIcon(group) {
    if (group === "agro") {
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5C14 3.7 9.4 6 7.2 10.3 5 14.5 6.2 18.4 6.3 18.7c.7-2.3 2.4-5.8 6.3-8.5-3.3 3.2-4.7 6.9-5.2 9.2H5v2h4.1c.8-2.7 3-7.4 8.1-10.8-2.7 3.1-4.5 6.7-5.2 10.8h2c.9-5 3.3-9.3 7-12.5.6-2.1.2-4.1-.5-5.4Z"/></svg>`;
    }
    if (group === "industria") {
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21V9l6 3V8l6 4V5h6v16H3Zm14-14v4.6l-4-2.7v3.6l-4-2.7v3.5l-4-2V19h14V7h-2Z"/></svg>`;
    }
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3h10a2 2 0 0 1 2 2v3h2a2 2 0 0 1 2 2v11H4V3Zm2 2v14h3v-3h2v3h3V5H6Zm10 5v9h2v-9h-2ZM8 8h2v2H8V8Zm0 4h2v2H8v-2Zm4-4h2v2h-2V8Zm0 4h2v2h-2v-2Z"/></svg>`;
  }

  /*
    Regra principal das fotos:
    - usa SOMENTE o título da vaga;
    - regex com limites de palavra (evita "ti" casar com "administrativo");
    - foto só é usada quando a correspondência é específica e confiável;
    - sem correspondência segura = visual institucional por área.
  */
  const STRICT_PHOTO_RULES = [
    { re: /\b(veterinario|veterinaria|medico veterinario|medica veterinaria)\b/, image: "assets/vaga_fotos/medico_a_veterinario_a.jpg" },
    { re: /\b(mecanico|mecanica|mecanico de veiculos|manutencao de veiculos)\b/, image: "assets/vaga_fotos/mecanico_de_veiculos.jpg" },
    { re: /\b(vigilante|vigilancia|seguranca patrimonial)\b/, image: "assets/vaga_fotos/vigilante.jpeg" },
    { re: /\b(zelador|zeladora|auxiliar de limpeza|servicos de limpeza|copeiro|copeira)\b/, image: "assets/vaga_fotos/zeladora.jpg" },
    { re: /\b(jovem aprendiz|aprendiz)\b/, image: "assets/vaga_fotos/aprendiz.jpg" },
    { re: /\b(ajudante de servicos gerais|ajudante de armazenista|ajudante de producao|ajudante)\b/, image: "assets/vaga_fotos/ajudantes.jpg" },
    { re: /\b(eletricista|eletrica|eletrico|fiacao|eletrotecnico|eletrotecnica)\b/, image: "assets/vaga_fotos/vagas_com_a_palavra_de_fiacao.jpg" },
    { re: /\b(analista de sistemas|desenvolvedor|desenvolvedora|programador|programadora|software|devops|infraestrutura de ti|suporte de ti|tecnologia da informacao|cientista de dados|engenheiro de dados)\b/, image: "assets/vaga_fotos/vagas_de_ti.jpg" },
    { re: /\b(agronomo|agronoma|engenheiro agronomo|engenheira agronoma)\b/, image: "assets/vaga_fotos/agro.jpg" }
  ];

  function getVacancyVisual(v) {
    const title = norm(v?.title || "");
    const match = STRICT_PHOTO_RULES.find(rule => rule.re.test(title));
    if (match) return { type: "photo", image: match.image, group: v.group };
    return { type: "category", image: null, group: v.group || "admin" };
  }

  function vacancyVisualHtml(v, { modal = false } = {}) {
    const visual = getVacancyVisual(v);
    if (visual.type === "photo") {
      return `<img src="${visual.image}" alt="" loading="${modal ? "eager" : "lazy"}">`;
    }
    return `<div class="vagaVisual__icon" aria-hidden="true">${groupIcon(visual.group)}</div>`;
  }

  /* ---------- Home ---------- */
  async function initHome() {
    const count = $("#homeOpeningsCount");
    const preview = $("#homeVagasPreview");
    if (!count || !preview) return;

    try {
      const all = await fetchVacanciesFromApi();
      count.textContent = String(all.length);
      if (!all.length) {
        preview.innerHTML = `<div class="homeVacancy"><span class="homeVacancy__accent"></span><div><strong>Nenhuma vaga disponível no momento</strong><span>Consulte novamente em breve.</span></div></div>`;
        return;
      }
      preview.innerHTML = all.slice(0, 3).map(v => `
        <a class="homeVacancy" href="vagas.html?q=${encodeURIComponent(v.title)}">
          <span class="homeVacancy__accent"></span>
          <div>
            <strong>${escapeHtml(v.title)}</strong>
            <span>${escapeHtml(v.location)}</span>
          </div>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7 1.4 1.4L18.8 12 10.4 3.6 9 5Z"/></svg>
        </a>
      `).join("");
    } catch {
      count.textContent = "—";
      preview.innerHTML = `<div class="homeVacancy"><span class="homeVacancy__accent"></span><div><strong>Vagas temporariamente indisponíveis</strong><span>Use a opção “Vagas” para tentar novamente.</span></div></div>`;
    }
  }

  /* ---------- Vagas ---------- */
  let vacancies = [];
  let activeGroup = "all";

  function matchesFilter(v) {
    const qCargo = norm($("#qCargo")?.value || "");
    const qCidade = norm($("#qCidade")?.value || "");
    const byCargo = !qCargo || norm(v.title).includes(qCargo);
    const byCity = !qCidade || norm(v.location).includes(qCidade);
    const byGroup = activeGroup === "all" || v.group === activeGroup;
    return byCargo && byCity && byGroup;
  }

  function renderVacancies() {
    const root = $("#vagasList");
    if (!root) return;

    const filtered = vacancies.filter(matchesFilter);
    const status = $("#vagasCount");
    const number = $("#vagasCountNumber");
    if (number) number.textContent = String(filtered.length);

    if (!vacancies.length) {
      if (status) status.textContent = "Nenhuma oportunidade disponível no momento.";
      root.innerHTML = `
        <div class="emptyState">
          <div class="emptyState__inner">
            <div class="emptyState__icon">${groupIcon("admin")}</div>
            <h3>Nenhuma vaga disponível agora</h3>
            <p>As oportunidades são atualizadas automaticamente. Consulte novamente em breve.</p>
          </div>
        </div>`;
      return;
    }

    if (status) status.textContent = `${filtered.length} de ${vacancies.length} oportunidade(s)`;
    if (!filtered.length) {
      root.innerHTML = `
        <div class="emptyState">
          <div class="emptyState__inner">
            <div class="emptyState__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 20-4.4-4.4a7 7 0 1 0-1.4 1.4L19.6 21 21 20ZM5 11a6 6 0 1 1 12 0 6 6 0 0 1-12 0Z"/></svg></div>
            <h3>Nenhum resultado encontrado</h3>
            <p>Altere o cargo, a cidade ou selecione outra área.</p>
          </div>
        </div>`;
      return;
    }

    root.innerHTML = filtered.map((v, index) => {
      const visual = getVacancyVisual(v);
      const visualClass = visual.type === "photo" ? "" : ` vagaVisual--${escapeHtml(v.group)}`;
      return `
        <article class="vagaCard" role="button" tabindex="0" data-vacancy-id="${escapeHtml(v.id)}" aria-label="Ver detalhes da vaga ${escapeHtml(v.title)}">
          <div class="vagaVisual${visualClass}">
            ${vacancyVisualHtml(v)}
          </div>
          <div class="vagaCard__body">
            <div class="vagaCard__area">${escapeHtml(groupLabel(v.group))}</div>
            <h3>${escapeHtml(v.title)}</h3>
            <div class="vagaCard__location">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.1 7-13A7 7 0 0 0 5 9c0 6.9 7 13 7 13Zm0-9.5A3.5 3.5 0 1 1 12 5a3.5 3.5 0 0 1 0 7.5Z"/></svg>
              <span>${escapeHtml(v.location)}</span>
            </div>
            <div class="vagaCard__footer">
              <span class="vagaCode">Cód. ${escapeHtml(v.id)}</span>
              <span class="vagaTap">Toque para ver <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7 1.4 1.4L18.8 12 10.4 3.6 9 5Z"/></svg></span>
            </div>
          </div>
        </article>`;
    }).join("");

    $$(".vagaCard", root).forEach(card => {
      const open = () => {
        const v = vacancies.find(item => String(item.id) === String(card.dataset.vacancyId));
        if (v) openVacancyModal(v);
      };
      card.addEventListener("click", open);
      card.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
    });
  }

  function openVacancyModal(v) {
    const modal = $("#vacancyModal");
    if (!modal) return;
    const title = $("#vacancyModalTitle");
    const meta = $("#vacancyModalMeta");
    const visual = $("#vacancyModalVisual");
    if (title) title.textContent = v.title;
    if (meta) meta.innerHTML = `
      <span class="metaPill">${escapeHtml(groupLabel(v.group))}</span>
      <span class="metaPill">${escapeHtml(v.location)}</span>
      <span class="metaPill">Cód. ${escapeHtml(v.id)}</span>`;
    if (visual) {
      const info = getVacancyVisual(v);
      visual.className = `vacancyModal__visual ${info.type === "photo" ? "" : `vagaVisual--${v.group}`}`;
      visual.innerHTML = vacancyVisualHtml(v, { modal: true });
    }
    modal.classList.remove("is-hidden");
    document.body.classList.add("is-modal-open");
    armIdleTimer();
  }

  function closeVacancyModal() {
    const modal = $("#vacancyModal");
    if (!modal) return;
    modal.classList.add("is-hidden");
    document.body.classList.remove("is-modal-open");
    armIdleTimer();
  }

  async function initVacanciesPage() {
    const root = $("#vagasList");
    if (!root) return;

    const query = new URLSearchParams(location.search).get("q");
    if (query && $("#qCargo")) $("#qCargo").value = query;

    try {
      vacancies = await fetchVacanciesFromApi();
    } catch {
      vacancies = [];
      const status = $("#vagasCount");
      const number = $("#vagasCountNumber");
      if (number) number.textContent = "—";
      if (status) status.textContent = "Não foi possível carregar as vagas. Tente novamente em instantes.";
    }
    renderVacancies();

    ["#qCargo", "#qCidade"].forEach(sel => {
      $(sel)?.addEventListener("input", renderVacancies);
    });

    $$(".filterChip").forEach(btn => {
      btn.addEventListener("click", () => {
        activeGroup = btn.dataset.groupFilter || "all";
        $$(".filterChip").forEach(x => x.classList.toggle("is-active", x === btn));
        renderVacancies();
      });
    });

    $("#clearFilters")?.addEventListener("click", () => {
      if ($("#qCargo")) $("#qCargo").value = "";
      if ($("#qCidade")) $("#qCidade").value = "";
      activeGroup = "all";
      $$(".filterChip").forEach(x => x.classList.toggle("is-active", x.dataset.groupFilter === "all"));
      renderVacancies();
    });

    $$("[data-modal-close]").forEach(el => el.addEventListener("click", closeVacancyModal));
    window.addEventListener("keydown", e => {
      if (e.key === "Escape") closeVacancyModal();
    });
  }

  /* ---------- Sorteio ---------- */
  function initSorteio() {
    const form = $("#sorteioForm");
    const tel = $("#sorteioTel");
    const success = $("#sorteioSuccess");
    if (!form) return;

    const maskPhone = value => {
      const d = String(value || "").replace(/\D/g, "").slice(0, 11);
      if (d.length <= 2) return d;
      if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    };
    tel?.addEventListener("input", () => { tel.value = maskPhone(tel.value); });

    form.addEventListener("submit", () => {
      success?.classList.remove("is-visible");
      setTimeout(() => {
        success?.classList.add("is-visible");
        try { form.reset(); } catch {}
      }, 750);
    });
  }

  /* =========================================================
     APRESENTAÇÃO
     ========================================================= */
  const BASE_SLIDES = [
    {
      type: "institutional",
      kicker: "CULTURA COAMO",
      title: "Cooperação que se transforma em resultados.",
      text: "Princípios e valores que orientam nosso jeito de trabalhar, decidir e construir relações duradouras.",
      image: "assets/img_cultura.jpg"
    },
    {
      type: "institutional",
      kicker: "CARREIRA",
      title: "Aqui, desenvolvimento faz parte do caminho.",
      text: "Oportunidades em diferentes áreas, aprendizado contínuo e espaço para construir uma trajetória profissional.",
      image: "assets/img_carreira.jpg"
    },
    {
      type: "institutional",
      kicker: "BEM-ESTAR",
      title: "Pessoas no centro da experiência.",
      text: "Um ambiente que valoriza segurança, qualidade de vida e iniciativas que apoiam funcionários e suas famílias.",
      image: "assets/img_bemestar.jpg"
    },
    {
      type: "institutional",
      kicker: "QUEM FAZ A COAMO",
      title: "“A Coamo é uma escola, uma segunda casa.”",
      text: "São anos de aprendizado, dedicação e crescimento profissional construídos junto com a cooperativa.",
      image: "assets/depo_edivilson_bg.jpg",
      author: {
        name: "Edevilson Canali",
        role: "Supervisor de Soluções de Negócio",
        photo: "assets/depo_edivilson_avatar.jpg"
      }
    },
    {
      type: "institutional",
      kicker: "QUEM FAZ A COAMO",
      title: "“Somos motivados diariamente a superar obstáculos.”",
      text: "Cultura e valores ganham força nos exemplos e nas pessoas que constroem a Coamo todos os dias.",
      image: "assets/depo_bruno_bg.jpg",
      author: {
        name: "Bruno Bortolini",
        role: "Assessor de Operações Portuárias",
        photo: "assets/depo_bruno_avatar.jpg"
      }
    }
  ];

  let presentationSlides = BASE_SLIDES.slice();
  let presentationIndex = 0;
  let presentationTimer = null;
  let presentationActive = false;
  let presentationMode = "idle";
  let idleTimer = null;

  function ensurePresentationOverlay() {
    if ($("#presentationOverlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "presentationOverlay";
    overlay.className = "presentationOverlay";
    overlay.innerHTML = `
      <div class="presentationStage" id="presentationStage"></div>

      <div class="presentationChrome">
        <div class="presentationBrand">
          <img src="assets/logo.png" alt="Coamo">
          <span>GEPES • CARREIRAS</span>
        </div>
        <div class="presentationCounter" id="presentationCounter"></div>
      </div>

      <div class="presentationBottom">
        <div>
          <div class="presentationProgress"><span id="presentationProgressBar"></span></div>
          <div class="presentationHint" id="presentationHint">Toque em “Explorar o totem” para acessar o conteúdo.</div>
        </div>
        <div class="presentationControls">
          <button class="presentationControl presentationControl--nav" type="button" id="presentationPrev">Anterior</button>
          <button class="presentationControl presentationControl--nav" type="button" id="presentationNext">Próximo</button>
          <button class="presentationControl presentationControl--exit" type="button" id="presentationExit">Explorar o totem</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    $("#presentationPrev")?.addEventListener("click", e => {
      e.stopPropagation();
      changePresentation(-1);
    });
    $("#presentationNext")?.addEventListener("click", e => {
      e.stopPropagation();
      changePresentation(1);
    });
    $("#presentationExit")?.addEventListener("click", e => {
      e.stopPropagation();
      stopPresentation();
    });

    overlay.addEventListener("pointerdown", e => {
      if (presentationMode === "idle" && !e.target.closest("button")) stopPresentation();
    });
  }

  function presentationVacancySlide(v) {
    return {
      type: "vacancy",
      vacancy: v
    };
  }

  async function buildPresentationSlides() {
    presentationSlides = BASE_SLIDES.slice();
    try {
      const all = await fetchVacanciesFromApi();
      if (!all.length) return;

      // Distribui áreas para evitar uma sequência visual repetitiva.
      const pools = {
        agro: all.filter(v => v.group === "agro"),
        industria: all.filter(v => v.group === "industria"),
        admin: all.filter(v => v.group === "admin")
      };
      const selected = [];
      const order = ["agro", "industria", "admin"];
      let cursor = 0;
      while (selected.length < Math.min(CONFIG.presentationVacancyLimit, all.length)) {
        const group = order[cursor % order.length];
        if (pools[group].length) selected.push(pools[group].shift());
        cursor++;
        if (cursor > all.length * 5) break;
      }
      presentationSlides.push(...selected.map(presentationVacancySlide));
    } catch {
      // Em caso de falha na API, apresenta apenas conteúdo institucional.
    }
  }

  function renderPresentationSlide() {
    const stage = $("#presentationStage");
    const slide = presentationSlides[presentationIndex];
    if (!stage || !slide) return;

    if (slide.type === "vacancy") {
      const v = slide.vacancy;
      const visual = getVacancyVisual(v);
      stage.innerHTML = `
        <section class="presentationVacancy">
          <div class="presentationVacancy__copy">
            <span class="presentationKicker">VAGA EM DESTAQUE</span>
            <h2>${escapeHtml(v.title)}</h2>
            <div class="presentationVacancy__meta">
              <span>${escapeHtml(v.location)}</span>
              <span>${escapeHtml(groupLabel(v.group))}</span>
              <span>Cód. ${escapeHtml(v.id)}</span>
            </div>
            <div class="presentationVacancy__cta">
              <img src="assets/qr-selecty.png" alt="QR Code para candidatura">
              <div>
                <strong>Quer fazer parte?</strong>
                <span>Escaneie o QR Code ou toque na tela para explorar todas as vagas disponíveis.</span>
              </div>
            </div>
          </div>
          <div class="presentationVacancy__visual ${visual.type === "photo" ? "has-photo" : `no-photo group-${escapeHtml(v.group)}`}">
            ${visual.type === "photo"
              ? `<img src="${visual.image}" alt="">`
              : `<div class="presentationVacancy__visualMark">${groupIcon(v.group)}</div>`}
          </div>
        </section>`;
    } else {
      const author = slide.author ? `
        <div class="presentationAuthor">
          <img src="${slide.author.photo}" alt="">
          <div class="presentationAuthor__text">
            <strong>${escapeHtml(slide.author.name)}</strong>
            <span>${escapeHtml(slide.author.role)}</span>
          </div>
        </div>` : "";
      stage.innerHTML = `
        <section class="presentationInstitutional">
          <img class="presentationInstitutional__photo" src="${slide.image}" alt="">
          <div class="presentationInstitutional__shade"></div>
          <div class="presentationInstitutional__content">
            <span class="presentationKicker">${escapeHtml(slide.kicker)}</span>
            <h2>${escapeHtml(slide.title)}</h2>
            <p class="presentationInstitutional__text">${escapeHtml(slide.text)}</p>
            ${author}
          </div>
        </section>`;
    }

    const counter = $("#presentationCounter");
    if (counter) counter.textContent = `${presentationIndex + 1} / ${presentationSlides.length}`;
    const bar = $("#presentationProgressBar");
    if (bar) bar.style.width = `${((presentationIndex + 1) / presentationSlides.length) * 100}%`;
  }

  function schedulePresentationAdvance() {
    clearInterval(presentationTimer);
    presentationTimer = setInterval(() => {
      presentationIndex = (presentationIndex + 1) % presentationSlides.length;
      renderPresentationSlide();
    }, CONFIG.slideMs);
  }

  function changePresentation(delta) {
    if (!presentationActive || !presentationSlides.length) return;
    presentationIndex = (presentationIndex + delta + presentationSlides.length) % presentationSlides.length;
    renderPresentationSlide();
    schedulePresentationAdvance();
  }

  async function startPresentation(mode = "manual") {
    ensurePresentationOverlay();
    if (presentationSlides.length === BASE_SLIDES.length) await buildPresentationSlides();

    presentationMode = mode;
    presentationActive = true;
    presentationIndex = 0;

    const overlay = $("#presentationOverlay");
    if (!overlay) return;
    overlay.dataset.mode = mode;
    overlay.classList.add("is-active");
    document.body.style.overflow = "hidden";

    const hint = $("#presentationHint");
    if (hint) {
      hint.textContent = mode === "idle"
        ? "Toque na tela para voltar ao modo interativo."
        : "Use os controles para navegar ou toque em “Explorar o totem”.";
    }

    renderPresentationSlide();
    schedulePresentationAdvance();
    clearTimeout(idleTimer);
  }

  function stopPresentation() {
    $("#presentationOverlay")?.classList.remove("is-active");
    presentationActive = false;
    clearInterval(presentationTimer);
    presentationTimer = null;
    document.body.style.overflow = "";
    armIdleTimer();

    if (document.body.dataset.page === "apresentacao" && document.body.dataset.autoPresentation === "1") {
      // Ao sair de uma apresentação iniciada pela página dedicada, volta para a Home.
      window.location.href = "index.html";
      return;
    }
  }

  function armIdleTimer() {
    clearTimeout(idleTimer);
    if (presentationActive || document.body.dataset.idle === "off") return;
    idleTimer = setTimeout(() => startPresentation("idle"), CONFIG.inactivityMs);
  }

  function wireIdle() {
    if (document.body.dataset.idle === "off") return;
    const reset = () => armIdleTimer();
    ["pointerdown", "touchstart", "keydown", "input"].forEach(evt => {
      window.addEventListener(evt, reset, { passive: evt !== "keydown" && evt !== "input" });
    });
    window.addEventListener("scroll", reset, { passive: true });
    armIdleTimer();
  }

  function wirePresentationLaunchers() {
    $$("[data-presentation-launch]").forEach(el => {
      el.addEventListener("click", e => {
        e.preventDefault();
        startPresentation("manual");
      });
    });
    $("#launchPresentation")?.addEventListener("click", () => startPresentation("manual"));

    if (document.body.dataset.autoPresentation === "1") {
      setTimeout(() => startPresentation("manual"), 350);
    }
  }

  /* ---------- boot ---------- */
  window.addEventListener("DOMContentLoaded", () => {
    formatClock();
    initHome();
    initVacanciesPage();
    initSorteio();
    wirePresentationLaunchers();
    wireIdle();
  });

  window.startPresentation = startPresentation;
  window.stopPresentation = stopPresentation;
})();
