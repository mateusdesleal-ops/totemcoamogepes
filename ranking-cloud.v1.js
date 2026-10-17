/* Sincronização opcional. Sem RANKING_ENABLED=1 no servidor, o ranking antigo continua local. */
(() => {
  "use strict";
  const URL_API = "/api/rankings";
  const SNAP_KEY = "coamo_ranking_cloud_snapshot_v1";
  const QUEUE_KEY = "coamo_ranking_cloud_pending_v1";
  const DB_NAME = "coamo-ranking-offline-v1";
  const gameList = ["grain", "silo", "classificacao", "silo3d", "cadeia3d", "memoria3d", "memoria", "cadeia", "jornada"];
  const compare = (a, b) => (Number(b.score)||0) - (Number(a.score)||0)
    || (Number(b.duration)||0) - (Number(a.duration)||0)
    || (Number(b.accuracy)||0) - (Number(a.accuracy)||0)
    || (Number(b.phase)||0) - (Number(a.phase)||0)
    || (Number(a.createdAt)||0) - (Number(b.createdAt)||0);
  const empty = () => Object.fromEntries(gameList.map(game => [game, []]));
  const copy = obj => JSON.parse(JSON.stringify(obj));
  const getLocal = key => { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (_) { return null; } };
  const setLocal = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (_) { return false; } };
  let state = getLocal(SNAP_KEY);
  if (!state || !state.enabled || !state.epochs || !state.games) state = {enabled: false, epoch: null, epochs: {}, games: empty()};
  let pending = getLocal(QUEUE_KEY) || [];
  if (!Array.isArray(pending)) pending = [];
  let syncing = false;
  let refreshPromise = null;
  let started = false;
  let listener = () => {};

  async function request(method, body, secret = "") {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7500);
    try {
      const result = await fetch(URL_API, {
        method, cache: "no-store", credentials: "same-origin", signal: controller.signal,
        headers: {"Content-Type": "application/json", ...(secret ? {"x-ranking-admin-secret": secret} : {})},
        ...(body ? {body: JSON.stringify(body)} : {}),
      });
      const data = await result.json().catch(() => ({}));
      if (!result.ok) {
        const error = new Error(data.error || `http_${result.status}`);
        error.status = result.status;
        throw error;
      }
      return data;
    } finally { clearTimeout(timeout); }
  }

  function indexedStore(operation, payload) {
    if (!window.indexedDB) return Promise.reject(new Error("indexeddb_unavailable"));
    return new Promise((resolve, reject) => {
      const open = indexedDB.open(DB_NAME, 1);
      open.onupgradeneeded = () => open.result.createObjectStore("pending", {keyPath: "id"});
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction("pending", operation === "getAll" ? "readonly" : "readwrite");
        const store = tx.objectStore("pending");
        let result;
        if (operation === "getAll") result = store.getAll();
        else if (operation === "put") result = store.put(payload);
        else if (operation === "delete") result = store.delete(payload);
        else result = store.clear();
        tx.oncomplete = () => { db.close(); resolve(result.result); };
        tx.onerror = () => { db.close(); reject(tx.error); };
        tx.onabort = () => { db.close(); reject(tx.error); };
      };
    });
  }

  async function readPending() {
    try {
      const stored = await indexedStore("getAll");
      // Recupera itens já armazenados em fallback localStorage.
      for (const item of pending) if (!stored.some(x => x.id === item.id)) await indexedStore("put", item);
      pending = await indexedStore("getAll");
    } catch (_) { pending = getLocal(QUEUE_KEY) || pending; }
    setLocal(QUEUE_KEY, pending); // segunda cópia recuperável
    return pending;
  }

  async function enqueue(item) {
    pending.push(item);
    const fallback = setLocal(QUEUE_KEY, pending);
    try { await indexedStore("put", item); return true; }
    catch (_) { return fallback; }
  }

  async function remove(id) {
    pending = pending.filter(x => x.id !== id);
    setLocal(QUEUE_KEY, pending);
    try { await indexedStore("delete", id); } catch (_) {}
  }

  async function clearPending() {
    pending = [];
    setLocal(QUEUE_KEY, pending);
    try { await indexedStore("clear"); } catch (_) {}
  }

  async function discardStale() {
    for (const item of [...pending]) {
      if (item.epoch !== state.epoch || item.gameEpoch !== state.epochs[item.game]) await remove(item.id);
    }
  }

  function notify() { try { listener(); } catch (_) {} }
  async function refresh() {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      try {
        const next = await request("GET");
        if (!next.enabled) {
          state = {enabled: false, epoch: null, epochs: {}, games: empty()};
          setLocal(SNAP_KEY, state);
          notify();
          return state;
        }
        if (!Number.isSafeInteger(next.epoch) || !next.epochs || !next.games) throw new Error("bad_snapshot");
        state = next;
        setLocal(SNAP_KEY, state);
        await discardStale();
        notify();
        return state;
      } catch (_) {
        // Sem rede: conserva último ranking compartilhado e a fila local.
        return state;
      }
    })();
    try { return await refreshPromise; } finally { refreshPromise = null; }
  }

  async function sync() {
    if (syncing || !state.enabled || !navigator.onLine) return;
    syncing = true;
    try {
      await readPending();
      await refresh();
      if (!state.enabled) return;
      for (const item of [...pending]) {
        if (item.epoch !== state.epoch || item.gameEpoch !== state.epochs[item.game]) {
          await remove(item.id);
          continue;
        }
        try { await request("POST", {action: "submit", ...item}); await remove(item.id); }
        catch (error) {
          if (error.status === 409 || error.status === 400) await remove(item.id);
          else break;
        }
      }
      await refresh();
    } finally { syncing = false; notify(); }
  }

  async function record(game, entry) {
    if (!state.enabled) return true;
    // Evita prometer sincronização antes de persistir a fila.
    const id = crypto.randomUUID();
    const item = {id, game, entry: copy(entry), epoch: state.epoch, gameEpoch: state.epochs[game]};
    if (!(await enqueue(item))) return false;
    notify();
    sync().catch(() => {});
    return true;
  }

  function top(game) {
    if (!state.enabled) return null;
    const remote = Array.isArray(state.games[game]) ? state.games[game] : [];
    const local = pending.filter(x => x.game === game && x.epoch === state.epoch && x.gameEpoch === state.epochs[game])
      .map(x => ({...x.entry, pendingSync: true}));
    return [...remote, ...local].sort(compare).slice(0, 5);
  }

  function localBackup() {
    const games = {};
    for (const game of gameList) games[game] = getLocal(`coamo_event_ranking_${game}_v1`) || [];
    return {type: "coamo-ranking-local-v1", exportedAt: new Date().toISOString(), games};
  }

  function downloadBackup() {
    const json = JSON.stringify(localBackup(), null, 2);
    const blob = new Blob([json], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `coamo-ranking-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function admin(action, secret, options = {}) {
    if (!state.enabled) throw new Error("cloud_not_enabled");
    const response = await request("POST", {action, ...options}, secret);
    if (action.startsWith("reset-")) {
      if (action === "reset-all") {
        await clearPending();
        state = {...state, epoch: response.epoch, games: empty()};
        for (const game of gameList) localStorage.removeItem(`coamo_event_ranking_${game}_v1`);
      } else {
        for (const item of [...pending]) if (item.game === options.game) await remove(item.id);
        state = {...state,
          epochs: {...state.epochs, [options.game]: response.gameEpoch},
          games: {...state.games, [options.game]: []}};
        localStorage.removeItem(`coamo_event_ranking_${options.game}_v1`);
      }
      setLocal(SNAP_KEY, state);
      notify();
    }
    if (action !== "admin-list") await refresh();
    return response;
  }

  async function importBackup(secret, backup) {
    if (!backup || backup.type !== "coamo-ranking-local-v1" || !backup.games || typeof backup.games !== "object") {
      throw new Error("invalid_backup");
    }
    const records = [];
    for (const game of gameList) {
      for (const entry of (backup.games[game] || []).slice(0, 5)) {
        records.push({id: crypto.randomUUID(), game, entry});
      }
    }
    return admin("import", secret, {confirm: "IMPORTAR", records});
  }

  async function importLocal(secret) { return importBackup(secret, localBackup()); }

  function init() {
    if (started) return;
    started = true;
    readPending().then(() => { notify(); return refresh(); }).then(() => sync()).catch(() => {});
    window.addEventListener("online", () => sync().catch(() => {}));
    window.addEventListener("focus", () => { refresh().then(() => sync()).catch(() => {}); });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) refresh().then(() => sync()).catch(() => {});
    });
    setInterval(() => { if (!document.hidden) refresh().then(() => sync()).catch(() => {}); }, 45000);
  }

  window.CoamoRankingCloud = {
    init, refresh, sync, record, top, admin, importLocal, importBackup, downloadBackup,
    active: () => Boolean(state.enabled),
    getState: () => state,
    onChange: fn => { listener = fn; },
  };
})();
