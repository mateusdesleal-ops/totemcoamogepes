const API_URL = "https://api.selecty.app/v2/jobfeed/index";
const DEFAULT_PER_PAGE = 100;
const MAX_PAGES = 20;

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
    payload.payload?.jobs
  ];

  for(const item of candidates){
    if(Array.isArray(item)) return item;
  }
  return [];
}

function pickPagination(payload){
  const meta = payload?.meta || payload?.pagination || payload?.pager || payload?.data?.meta || {};
  return {
    currentPage: Number(meta.current_page || meta.page || payload?.page || 1) || 1,
    totalPages: Number(meta.last_page || meta.total_pages || meta.pages || payload?.total_pages || 0) || 0,
    totalItems: Number(meta.total || payload?.total || payload?.count || 0) || 0,
  };
}

async function fetchJobfeedPage({ portal, apiKey, page, perPage }){
  const url = new URL(API_URL);
  url.searchParams.set("portal", portal);
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(perPage));

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "X-Api-Key": apiKey,
    },
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { response, text, json };
}

export default async function handler(req, res) {
  try {
    const portal = process.env.SELECTY_PORTAL;
    const apiKey = process.env.SELECTY_JOBFEED_KEY;

    if (!portal || !apiKey) {
      return res.status(500).json({
        error: "Variáveis não configuradas",
        detail: "Defina SELECTY_PORTAL e SELECTY_JOBFEED_KEY na Vercel.",
      });
    }

    const perPage = Math.min(Number(req.query.per_page || DEFAULT_PER_PAGE) || DEFAULT_PER_PAGE, DEFAULT_PER_PAGE);
    const fetchAll = String(req.query.all ?? "1") !== "0";

    if (!fetchAll) {
      const single = await fetchJobfeedPage({ portal, apiKey, page: Number(req.query.page || 1), perPage });
      res.setHeader("Cache-Control", "no-store");
      return res.status(single.response.status).send(single.text);
    }

    let page = 1;
    let totalPages = 0;
    let totalItems = 0;
    const collected = [];
    const seen = new Set();

    while (page <= MAX_PAGES) {
      const { response, json, text } = await fetchJobfeedPage({ portal, apiKey, page, perPage });

      if (!response.ok) {
        if (page === 1) {
          res.setHeader("Cache-Control", "no-store");
          return res.status(response.status).send(text);
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

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
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
    return res.status(500).json({ error: "Falha ao consultar Jobfeed", detail: String(e) });
  }
}
