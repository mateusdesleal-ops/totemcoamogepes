const CACHE_NAME = "coamo-totem-v53";

const CORE_ASSETS = [
  "./",
  "./index.html?interactive=1&source=pwa&v=53",
  "./jogos.html",
  "./jogo-area.html",
  "./jogo-memoria.html",
  "./jogo-cadeia.html",
  "./jogo-classificacao.html",
  "./jogo-silo.html",
  "./apresentacao.html",
  "./vagas.html",
  "./sorteio.html",
  "./manifest.webmanifest?v=53.0",
  "./pwa.v53.js?v=53.0",
  "./app.v48.js?v=53.0",
  "./app.v42.js?v=53.0",
  "./styles.v48.css?v=53.0",
  "./silo.v48.js?v=48.0",
  "./assets/logo_verde.png",
  "./assets/mascote_aroldinho.png",
  "./assets/mascote_aroldinho_pose2.png",
  "./assets/mascote_toninho.png",
  "./assets/mascote_toninho_pose2.png",
  "./assets/games/v48/hero_coamo_games.png",
  "./assets/games/v48/area_banner.png",
  "./assets/games/v48/memory_banner.png",
  "./assets/games/v48/chain_banner.png",
  "./assets/games/v48/classification_banner.png",
  "./assets/games/v48/silo_banner.png",
  "./assets/games/v53/soja.svg",
  "./assets/pwa/icon-192.png?v=53.0",
  "./assets/pwa/icon-512.png?v=53.0"
];

const GAME_PATHS = new Set([
  "/jogos.html",
  "/jogo-area.html",
  "/jogo-memoria.html",
  "/jogo-cadeia.html",
  "/jogo-classificacao.html",
  "/jogo-silo.html"
]);

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(CORE_ASSETS.map(async (url) => {
      try {
        const response = await fetch(new Request(url, { cache: "reload" }));
        if (response.ok) await cache.put(url, response.clone());
      } catch (_) {}
    }));
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((name) => name.startsWith("coamo-totem-") && name !== CACHE_NAME)
        .map((name) => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

async function cachedByPath(url) {
  const cache = await caches.open(CACHE_NAME);
  const exact = await cache.match(url.pathname.replace(/^\//, "./"), { ignoreSearch: true });
  if (exact) return exact;
  return caches.match(url.pathname, { ignoreSearch: true });
}

function offlineGameResponse(pathname) {
  const label = pathname.replace(/^\//, "").replace(/\.html$/, "");
  return new Response(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Coamo Games</title><style>body{font-family:Arial,sans-serif;background:#f4f8f5;color:#123b28;display:grid;place-items:center;min-height:100vh;margin:0}.box{max-width:560px;padding:32px;text-align:center}button{border:0;border-radius:14px;padding:14px 22px;background:#0b4d2b;color:#fff;font-weight:700;font-size:17px}</style><div class="box"><h1>Coamo Games</h1><p>Não foi possível carregar <b>${label}</b> neste momento.</p><p>Verifique a conexão e tente novamente.</p><button onclick="location.reload()">Tentar novamente</button></div></html>`, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
  });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const isNavigation = request.mode === "navigate";
    const isGameNavigation = isNavigation && GAME_PATHS.has(url.pathname);

    try {
      const response = await fetch(request, { cache: "no-store" });
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone()).catch(() => {});
        return response;
      }

      // Se o servidor responder 404/5xx para um jogo, usa a cópia local do próprio jogo.
      if (isGameNavigation) {
        const cachedGame = await cachedByPath(url);
        if (cachedGame) return cachedGame;
        return offlineGameResponse(url.pathname);
      }

      return response;
    } catch (_) {
      const cached = await caches.match(request, { ignoreSearch: isNavigation });
      if (cached) return cached;

      if (isGameNavigation) {
        const cachedGame = await cachedByPath(url);
        if (cachedGame) return cachedGame;
        return offlineGameResponse(url.pathname);
      }

      if (isNavigation) {
        return (await caches.match("./index.html?interactive=1&source=pwa&v=53", { ignoreSearch: true })) || Response.error();
      }
      return Response.error();
    }
  })());
});
