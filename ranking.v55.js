(() => {
  "use strict";

  const STORAGE_PREFIX = "coamo_event_ranking_";
  const MAX_ENTRIES = 5;
  const GAME_LABELS = {
    grain: "Desafio da Classificação",
    silo: "Silo em Equilíbrio",
    classificacao: "Classificação 3D",
    memoria: "Desafio Coamo (Memória)",
    cadeia: "Monte a cadeia Coamo",
    jornada: "Jornada da Safra",
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const keyFor = game => `${STORAGE_PREFIX}${game}_v1`;
  const esc = value => String(value ?? "");
  const digits = value => esc(value).replace(/\D/g, "").slice(0, 11);

  function formatPhone(value) {
    const d = digits(value);
    if (d.length <= 2) return d ? `(${d}` : "";
    if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  }

  function formatScore(score) {
    return new Intl.NumberFormat("pt-BR").format(Math.max(0, Math.round(Number(score) || 0)));
  }

  function formatTime(totalSeconds) {
    const n = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    return `${String(Math.floor(n / 60)).padStart(2,"0")}:${String(n % 60).padStart(2,"0")}`;
  }

  function load(game) {
    try {
      const raw = JSON.parse(localStorage.getItem(keyFor(game)) || "[]");
      return Array.isArray(raw) ? raw.filter(Boolean) : [];
    } catch (_) {
      return [];
    }
  }

  function compare(a, b) {
    return (Number(b.score) || 0) - (Number(a.score) || 0)
      || (Number(b.duration) || 0) - (Number(a.duration) || 0)
      || (Number(b.accuracy) || 0) - (Number(a.accuracy) || 0)
      || (Number(b.phase) || 0) - (Number(a.phase) || 0)
      || (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0);
  }

  function sorted(game) {
    return load(game).sort(compare).slice(0, MAX_ENTRIES);
  }

  function save(game, entries) {
    const clean = [...entries].sort(compare).slice(0, MAX_ENTRIES);
    localStorage.setItem(keyFor(game), JSON.stringify(clean));
    return clean;
  }

  function metaText(game, entry) {
    const parts = [];
    if (entry.duration != null) parts.push(formatTime(entry.duration));
    if ((game === "grain" || game === "classificacao") && entry.phase) parts.push(`Fase ${entry.phase}`);
    if (entry.stars) parts.push("★".repeat(entry.stars));
    if (entry.accuracy != null) parts.push(`${Math.round(entry.accuracy)}%`);
    return parts.join(" · ");
  }

  function render(game) {
    const entries = sorted(game);
    $$(`[data-ranking-list="${game}"]`).forEach(list => {
      list.innerHTML = "";
      for (let i = 0; i < MAX_ENTRIES; i += 1) {
        const entry = entries[i];
        const li = document.createElement("li");
        li.className = `coamo-ranking-row${i < 3 ? ` is-top-${i+1}` : ""}`;

        const pos = document.createElement("span");
        pos.className = "coamo-ranking-row__position";
        pos.textContent = `${i + 1}º`;
        li.appendChild(pos);

        const who = document.createElement("div");
        who.className = "coamo-ranking-row__who";
        const name = document.createElement("strong");
        name.textContent = entry?.name || "Aguardando participante";
        const meta = document.createElement("small");
        meta.textContent = entry ? metaText(game, entry) : "—";
        who.append(name, meta);
        li.appendChild(who);

        const points = document.createElement("b");
        points.className = "coamo-ranking-row__score";
        points.textContent = entry ? `${formatScore(entry.score)} pts` : "—";
        li.appendChild(points);

        list.appendChild(li);
      }
    });
  }

  function qualifies(game, candidate) {
    const entries = sorted(game);
    if (entries.length < MAX_ENTRIES) return true;
    const test = {...candidate, createdAt: Date.now()};
    return compare(test, entries[entries.length - 1]) < 0;
  }

  function ensureOverlay() {
    let overlay = $("#coamoRankingOverlay");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "coamoRankingOverlay";
    overlay.className = "coamo-ranking-overlay";
    overlay.hidden = true;
    document.body.appendChild(overlay);
    return overlay;
  }

  function closeOverlay() {
    const overlay = ensureOverlay();
    overlay.hidden = true;
    overlay.innerHTML = "";
    document.documentElement.classList.remove("ranking-modal-open");
  }

  function playerCapture(game, entry) {
    return new Promise(resolve => {
      if (!qualifies(game, entry)) {
        render(game);
        resolve(false);
        return;
      }

      const overlay = ensureOverlay();
      overlay.hidden = false;
      document.documentElement.classList.add("ranking-modal-open");
      overlay.innerHTML = `
        <div class="coamo-ranking-modal" role="dialog" aria-modal="true" aria-labelledby="rankCaptureTitle">
          <div class="coamo-ranking-modal__badge">🏆</div>
          <span class="coamo-ranking-modal__kicker">VOCÊ ENTROU NO TOP 5</span>
          <h2 id="rankCaptureTitle">Registre sua pontuação</h2>
          <p>Informe seus dados para participar da premiação. O telefone não aparece no ranking público.</p>
          <div class="coamo-ranking-modal__score"><strong>${formatScore(entry.score)}</strong><span>pontos</span></div>
          <form id="coamoRankingForm" novalidate>
            <label>Nome
              <input id="coamoRankingName" name="name" autocomplete="name" maxlength="40" placeholder="Seu nome" required>
            </label>
            <label>Telefone
              <input id="coamoRankingPhone" name="phone" inputmode="tel" autocomplete="tel" maxlength="16" placeholder="(44) 99999-9999" required>
            </label>
            <small id="coamoRankingError" class="coamo-ranking-modal__error" aria-live="polite"></small>
            <div class="coamo-ranking-modal__actions">
              <button class="btn btn--primary" type="submit">Salvar no ranking</button>
              <button class="btn btn--soft" type="button" id="coamoRankingSkip">Não registrar</button>
            </div>
          </form>
          <small class="coamo-ranking-modal__privacy">Dados armazenados somente neste totem para contato da premiação.</small>
        </div>`;

      const form = $("#coamoRankingForm", overlay);
      const nameInput = $("#coamoRankingName", overlay);
      const phoneInput = $("#coamoRankingPhone", overlay);
      const error = $("#coamoRankingError", overlay);
      let done = false;
      const finish = value => {
        if (done) return;
        done = true;
        clearTimeout(autoClose);
        closeOverlay();
        render(game);
        resolve(value);
      };

      phoneInput?.addEventListener("input", () => {
        const caretAtEnd = phoneInput.selectionStart === phoneInput.value.length;
        phoneInput.value = formatPhone(phoneInput.value);
        if (caretAtEnd) phoneInput.setSelectionRange(phoneInput.value.length, phoneInput.value.length);
      });

      form?.addEventListener("submit", event => {
        event.preventDefault();
        const name = esc(nameInput?.value).trim().replace(/\s+/g, " ").slice(0, 40);
        const phoneDigits = digits(phoneInput?.value);
        if (name.length < 2) {
          error.textContent = "Digite seu nome para registrar a pontuação.";
          nameInput?.focus();
          return;
        }
        if (phoneDigits.length < 10) {
          error.textContent = "Digite um telefone válido com DDD.";
          phoneInput?.focus();
          return;
        }
        const record = {
          ...entry,
          name,
          phone: formatPhone(phoneDigits),
          phoneDigits,
          createdAt: Date.now(),
        };
        save(game, [...load(game), record]);
        finish(true);
      });

      $("#coamoRankingSkip", overlay)?.addEventListener("click", () => finish(false));
      const autoClose = setTimeout(() => finish(false), 60000);
      setTimeout(() => nameInput?.focus(), 120);
    });
  }

  function openAdmin(game) {
    const entries = sorted(game);
    const overlay = ensureOverlay();
    overlay.hidden = false;
    document.documentElement.classList.add("ranking-modal-open");
    overlay.innerHTML = `
      <div class="coamo-ranking-modal coamo-ranking-modal--admin" role="dialog" aria-modal="true">
        <span class="coamo-ranking-modal__kicker">ADMIN DO RANKING</span>
        <h2>${GAME_LABELS[game] || game}</h2>
        <p>Contatos dos atuais cinco melhores. O telefone permanece oculto para os visitantes.</p>
        <div class="coamo-ranking-admin-list" id="coamoRankingAdminList"></div>
        <div class="coamo-ranking-modal__actions">
          <button class="btn btn--soft" id="coamoRankingCloseAdmin" type="button">Fechar</button>
          <button class="coamo-ranking-reset" id="coamoRankingReset" type="button">Zerar ranking</button>
        </div>
        <small class="coamo-ranking-modal__privacy">Para abrir este painel novamente, toque 5 vezes no título do ranking.</small>
      </div>`;

    const list = $("#coamoRankingAdminList", overlay);
    entries.forEach((entry, index) => {
      const row = document.createElement("div");
      row.className = "coamo-ranking-admin-row";
      const left = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = `${index + 1}º · ${entry.name}`;
      const phone = document.createElement("small");
      phone.textContent = entry.phone || "Telefone não informado";
      left.append(name, phone);
      const score = document.createElement("b");
      score.textContent = `${formatScore(entry.score)} pts`;
      row.append(left, score);
      list.appendChild(row);
    });
    if (!entries.length) {
      const empty = document.createElement("p");
      empty.className = "coamo-ranking-admin-empty";
      empty.textContent = "O ranking ainda está vazio.";
      list.appendChild(empty);
    }

    $("#coamoRankingCloseAdmin", overlay)?.addEventListener("click", closeOverlay);
    const reset = $("#coamoRankingReset", overlay);
    let armed = false;
    let armTimer = 0;
    reset?.addEventListener("click", () => {
      if (!armed) {
        armed = true;
        reset.textContent = "Toque novamente para confirmar";
        reset.classList.add("is-armed");
        armTimer = setTimeout(() => {
          armed = false;
          reset.textContent = "Zerar ranking";
          reset.classList.remove("is-armed");
        }, 5000);
        return;
      }
      clearTimeout(armTimer);
      localStorage.removeItem(keyFor(game));
      closeOverlay();
      render(game);
    });
  }

  function armAdminTriggers() {
    const state = new WeakMap();
    $$('[data-ranking-admin-trigger]').forEach(trigger => {
      trigger.addEventListener("click", () => {
        const now = Date.now();
        const prev = state.get(trigger) || {count:0, first:0};
        const next = (!prev.first || now - prev.first > 4000)
          ? {count:1, first:now}
          : {count:prev.count + 1, first:prev.first};
        state.set(trigger, next);
        if (next.count >= 5) {
          state.set(trigger, {count:0, first:0});
          openAdmin(trigger.dataset.rankingAdminTrigger);
        }
      });
    });
  }

  function boot() {
    const games = new Set(["grain", "silo"]);
    $$("[data-ranking-list]").forEach(el => games.add(el.dataset.rankingList));
    games.forEach(render);
    armAdminTriggers();
  }

  window.CoamoLeaderboard = {
    render,
    qualifies,
    maybeCapture: playerCapture,
    formatTime,
    top: game => sorted(game),
    openAdmin,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
