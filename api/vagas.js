const API_URL = "https://api.selecty.app/v2/jobfeed/index";
const DEFAULT_PER_PAGE = 100;
const MAX_PAGES = 20;
const REQUEST_TIMEOUT_MS = 15000;

function cleanTextEnv(value, fallback = "") {
  const clean = String(value ?? fallback)
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
  return clean || fallback;
}

function cleanSecret(value) {
  let clean = cleanTextEnv(value);
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim();
  }
  // Chaves de API não devem conter espaços/quebras de linha. Isso também
  // evita o erro "invalid header value" quando a variável foi colada com \n.
  return clean.replace(/\s+/g, "");
}

function pickJobsArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

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

  for (const item of candidates) {
    if (Array.isArray(item)) return item;
  }
  return [];
}

function pickPagination(payload) {
  const meta = payload?.meta || payload?.pagination || payload?.pager || payload?.data?.meta || {};
  return {
    currentPage: Number(meta.current_page || meta.page || payload?.page || 1) || 1,
    totalPages: Number(meta.last_page || meta.total_pages || meta.pages || payload?.total_pages || 0) || 0,
    totalItems: Number(meta.total || payload?.total || payload?.count || 0) || 0,
  };
}

async function fetchJobfeedPage({ portal, apiKey, page, perPage }) {
  const url = new URL(API_URL);
  url.searchParams.set("portal", portal);
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(perPage));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "X-Api-Key": apiKey,
      },
      signal: controller.signal,
    });

    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (_) {
      json = null;
    }

    return { response, text, json };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  try {
    // O portal da Coamo é conhecido e pode usar "coamo" como padrão.
    // A chave continua exclusivamente no backend/Vercel.
    const portal = cleanTextEnv(process.env.SELECTY_PORTAL, "coamo");
    const apiKey = cleanSecret(
      process.env.SELECTY_JOBFEED_KEY ||
      process.env.SELECTY_API_KEY ||
      process.env.JOBFEED_KEY
    );

    if (!apiKey) {
      return res.status(500).json({
        ok: false,
        code: "SELECTY_KEY_MISSING",
        error: "Integração Selecty não configurada",
        detail: "Configure SELECTY_JOBFEED_KEY na Vercel e faça um novo deploy.",
      });
    }

    const requestedPerPage = Number(req.query?.per_page || DEFAULT_PER_PAGE) || DEFAULT_PER_PAGE;
    const perPage = Math.max(1, Math.min(requestedPerPage, DEFAULT_PER_PAGE));
    const fetchAll = String(req.query?.all ?? "1") !== "0";

    if (!fetchAll) {
      const single = await fetchJobfeedPage({ portal, apiKey, page: Number(req.query?.page || 1), perPage });
      res.setHeader("Cache-Control", "no-store");
      if (!single.response.ok) {
        return res.status(single.response.status).json({
          ok: false,
          code: "SELECTY_UPSTREAM_ERROR",
          error: "A Selecty recusou a consulta de vagas",
          detail: single.json?.message || single.json?.error || `Resposta HTTP ${single.response.status} da Selecty.`,
        });
      }
      return res.status(200).send(single.text);
    }

    let page = 1;
    let totalPages = 0;
    let totalItems = 0;
    const collected = [];
    const seen = new Set();

    while (page <= MAX_PAGES) {
      const { response, json } = await fetchJobfeedPage({ portal, apiKey, page, perPage });

      if (!response.ok) {
        if (page === 1) {
          res.setHeader("Cache-Control", "no-store");
          return res.status(response.status).json({
            ok: false,
            code: "SELECTY_UPSTREAM_ERROR",
            error: "A Selecty recusou a consulta de vagas",
            detail: json?.message || json?.error || `Resposta HTTP ${response.status} da Selecty.`,
          });
        }
        break;
      }

      const jobs = pickJobsArray(json);
      const meta = pickPagination(json);
      if (meta.totalPages) totalPages = meta.totalPages;
      if (meta.totalItems) totalItems = meta.totalItems;

      for (const job of jobs) {
        const key = String(job?.id || job?.code || job?.vacancy_id || `${page}-${collected.length}`);
        if (!seen.has(key)) {
          seen.add(key);
          collected.push(job);
        }
      }

      const reachedLastKnownPage = totalPages > 0 && page >= totalPages;
      const receivedShortPage = jobs.length < perPage;
      const reachedKnownTotal = totalItems > 0 && collected.length >= totalItems;
      if (reachedLastKnownPage || receivedShortPage || reachedKnownTotal) break;

      page += 1;
    }

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.setHeader("X-Totem-Jobfeed", "ok");
    return res.status(200).json({
      ok: true,
      portal,
      vacancies: collected,
      pagination: {
        fetched_pages: page,
        per_page: perPage,
        total_pages: totalPages || page,
        total_items: totalItems || collected.length,
        returned_items: collected.length,
      },
    });
  } catch (e) {
    const timedOut = e?.name === "AbortError";
    return res.status(500).json({
      ok: false,
      code: timedOut ? "SELECTY_TIMEOUT" : "SELECTY_PROXY_ERROR",
      error: timedOut ? "A consulta de vagas excedeu o tempo limite" : "Falha ao consultar o Jobfeed da Selecty",
      detail: timedOut ? "Tente novamente em alguns instantes." : String(e?.message || e),
    });
  }
}
