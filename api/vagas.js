export default async function handler(req, res) {
  try {
    const portal = process.env.SELECTY_PORTAL;      // ex: "coamo"
    const apiKey = process.env.SELECTY_JOBFEED_KEY; // token do jobfeed (X-Api-Key)

    if (!portal || !apiKey) {
      return res.status(500).json({
        error: "Variáveis não configuradas",
        detail: "Defina SELECTY_PORTAL e SELECTY_JOBFEED_KEY na Vercel."
      });
    }

    const page = String(req.query.page || "1");
    const perPage = String(req.query.per_page || "50");

    const url = new URL("https://api.selecty.app/v2/jobfeed/index");
    url.searchParams.set("portal", portal);
    url.searchParams.set("page", page);
    url.searchParams.set("per_page", perPage);

    const r = await fetch(url.toString(), {
      headers: {
        "Accept": "application/json",
        "X-Api-Key": apiKey,
      },
    });

    const body = await r.text();

    // Cache curto (bom para totens)
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.status(r.status).send(body);
  } catch (e) {
    res.status(500).json({ error: "Falha ao consultar Jobfeed", detail: String(e) });
  }
}
