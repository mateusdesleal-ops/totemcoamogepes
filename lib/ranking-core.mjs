export const GAMES = ["grain", "silo", "classificacao", "silo3d", "cadeia3d", "memoria3d", "memoria", "cadeia", "jornada"];
export const isGame = game => GAMES.includes(game);
export const isUuid = value => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const num = (v, low, high) => v == null || v === "" ? null : Number.isFinite(Number(v)) && Number(v) >= low && Number(v) <= high ? Number(v) : NaN;

export function parseEntry(game, entry) {
  if (!isGame(game) || !entry || typeof entry !== "object" || Array.isArray(entry)) return null;
  const name = String(entry.name ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
  const phoneDigits = String(entry.phoneDigits ?? entry.phone ?? "").replace(/\D/g, "");
  const score = num(entry.score, 0, 1000000000);
  const duration = num(entry.duration, 0, 86400);
  const accuracy = num(entry.accuracy, 0, 100);
  const phase = num(entry.phase, 0, 1000);
  const stars = num(entry.stars, 0, 5);
  const createdAt = num(entry.createdAt, 1600000000000, Date.now() + 300000);
  if (name.length < 2 || phoneDigits.length < 10 || phoneDigits.length > 11 || !Number.isSafeInteger(score)
    || [duration, accuracy, phase, stars, createdAt].some(v => Number.isNaN(v)) || !Number.isSafeInteger(createdAt)) return null;
  return {name, phoneDigits, score, duration, accuracy, phase, stars, createdAt};
}

export function compareEntries(a, b) {
  return (Number(b.score) || 0) - (Number(a.score) || 0)
    || (Number(b.duration) || 0) - (Number(a.duration) || 0)
    || (Number(b.accuracy) || 0) - (Number(a.accuracy) || 0)
    || (Number(b.phase) || 0) - (Number(a.phase) || 0)
    || (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0);
}
