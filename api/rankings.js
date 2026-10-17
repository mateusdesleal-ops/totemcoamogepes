import {createHash, timingSafeEqual} from "node:crypto";
import {GAMES, isGame, isUuid, parseEntry} from "../lib/ranking-core.mjs";

let sqlPromise;
async function connection() {
  if (!sqlPromise) sqlPromise = import("@neondatabase/serverless").then(({neon}) => neon(process.env.DATABASE_URL));
  return sqlPromise;
}
const generation = x => Number.isSafeInteger(Number(x)) && Number(x) >= 1 ? Number(x) : null;
const limitBody = obj => { try { return JSON.stringify(obj).length <= 100000; } catch (_) { return false; } };

function authorized(req) {
  const expected = process.env.RANKING_ADMIN_SECRET;
  const supplied = req.headers["x-ranking-admin-secret"];
  if (typeof expected !== "string" || expected.length < 20 || typeof supplied !== "string") return false;
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(supplied, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

function exposed(row, admin = false) {
  const result = {
    name: row.player_name,
    score: Number(row.score),
    duration: row.duration == null ? null : Number(row.duration),
    accuracy: row.accuracy == null ? null : Number(row.accuracy),
    phase: row.phase,
    stars: row.stars,
    createdAt: Number(row.created_at_ms),
  };
  if (admin) result.phone = row.phone_digits;
  return result;
}

async function snapshot(sql, admin = false) {
  const [control] = await sql`SELECT epoch FROM ranking_control WHERE id = 1`;
  const gameEpochs = await sql`SELECT game, epoch FROM ranking_game_epoch`;
  const epochs = Object.fromEntries(gameEpochs.map(x => [x.game, Number(x.epoch)]));
  const rows = await sql`
    SELECT * FROM (
      SELECT e.*, ROW_NUMBER() OVER (
        PARTITION BY e.game ORDER BY e.score DESC, COALESCE(e.duration,0) DESC,
        COALESCE(e.accuracy,0) DESC, COALESCE(e.phase,0) DESC,
        e.created_at_ms ASC, e.submission_id ASC
      ) AS place
      FROM ranking_entries e
      JOIN ranking_game_epoch g ON e.game = g.game AND e.game_epoch = g.epoch
      WHERE e.event_epoch = ${control.epoch}
    ) ranked WHERE place <= 5 ORDER BY game, place`;
  const games = Object.fromEntries(GAMES.map(game => [game, []]));
  for (const row of rows) if (games[row.game]) games[row.game].push(exposed(row, admin));
  return {enabled: true, epoch: Number(control.epoch), epochs, games};
}

async function insert(sql, {id, game, entry, epoch, gameEpoch, importKey = null}) {
  return sql`
    INSERT INTO ranking_entries (submission_id, event_epoch, game_epoch, game,
      player_name, phone_digits, score, duration, accuracy, phase, stars, created_at_ms, import_key)
    SELECT ${id}::uuid, c.epoch, g.epoch, ${game}, ${entry.name}, ${entry.phoneDigits},
      ${entry.score}, ${entry.duration}, ${entry.accuracy}, ${entry.phase}, ${entry.stars},
      ${entry.createdAt}, ${importKey}
    FROM ranking_control c JOIN ranking_game_epoch g ON g.game = ${game}
    WHERE c.id = 1 AND c.epoch = ${epoch} AND g.epoch = ${gameEpoch}
    ON CONFLICT DO NOTHING RETURNING submission_id`;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({error: "method_not_allowed"});
  }
  // A funcionalidade fica inerte até ser ativada explicitamente no servidor.
  if (process.env.RANKING_ENABLED !== "1") return res.status(200).json({enabled: false});
  if (!process.env.DATABASE_URL) return res.status(503).json({error: "database_not_configured"});

  try {
    const sql = await connection();
    if (req.method === "GET") return res.status(200).json(await snapshot(sql));

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!body || !limitBody(body)) return res.status(400).json({error: "invalid_body"});
    const action = body.action;

    if (action === "submit") {
      const {id, game} = body;
      const entry = parseEntry(game, body.entry);
      const epoch = generation(body.epoch);
      const gameEpoch = generation(body.gameEpoch);
      if (!isUuid(id) || !entry || !epoch || !gameEpoch) return res.status(400).json({error: "invalid_score"});
      const inserted = await insert(sql, {id, game, entry, epoch, gameEpoch});
      // Empty result can mean a duplicate ID or a score from before a reset.
      const [state] = await sql`SELECT c.epoch AS event_epoch, g.epoch AS game_epoch
        FROM ranking_control c JOIN ranking_game_epoch g ON g.game = ${game} WHERE c.id = 1`;
      if (Number(state.event_epoch) !== epoch || Number(state.game_epoch) !== gameEpoch) {
        return res.status(409).json({error: "ranking_reset", epoch: Number(state.event_epoch), gameEpoch: Number(state.game_epoch)});
      }
      return res.status(200).json({ok: true, stored: inserted.length > 0});
    }

    if (!["admin-list", "reset-all", "reset-game", "import"].includes(action)) {
      return res.status(400).json({error: "unknown_action"});
    }
    if (!authorized(req)) return res.status(403).json({error: "invalid_admin_secret"});
    if (action === "admin-list") return res.status(200).json(await snapshot(sql, true));
    if (action === "reset-all") {
      if (body.confirm !== "ZERAR TODOS") return res.status(400).json({error: "confirmation_required"});
      const [row] = await sql`UPDATE ranking_control SET epoch = epoch + 1 WHERE id = 1 RETURNING epoch`;
      return res.status(200).json({ok: true, epoch: Number(row.epoch)});
    }
    if (action === "reset-game") {
      if (!isGame(body.game) || body.confirm !== "ZERAR JOGO") return res.status(400).json({error: "confirmation_required"});
      const [row] = await sql`UPDATE ranking_game_epoch SET epoch = epoch + 1 WHERE game = ${body.game} RETURNING epoch`;
      return res.status(200).json({ok: true, game: body.game, gameEpoch: Number(row.epoch)});
    }
    if (action === "import") {
      if (!Array.isArray(body.records) || body.records.length > 100 || body.confirm !== "IMPORTAR") {
        return res.status(400).json({error: "invalid_import"});
      }
      // Importações são administrativas, idempotentes por conteúdo e nunca mudam uma geração.
      const [state] = await sql`SELECT epoch FROM ranking_control WHERE id = 1`;
      const gameStates = await sql`SELECT game, epoch FROM ranking_game_epoch`;
      const epochs = Object.fromEntries(gameStates.map(row => [row.game, Number(row.epoch)]));
      let accepted = 0;
      for (const record of body.records) {
        const game = record?.game;
        const entry = parseEntry(game, record?.entry);
        if (!entry || !epochs[game]) continue;
        const importKey = createHash("sha256").update(JSON.stringify([game, entry])).digest("hex");
        const id = record.id;
        if (!isUuid(id)) continue;
        const rows = await insert(sql, {id, game, entry, epoch: Number(state.epoch), gameEpoch: epochs[game], importKey});
        accepted += rows.length;
      }
      return res.status(200).json({ok: true, accepted});
    }
  } catch (error) {
    // Erros de conexão ou esquema não devem expor SQL, senhas ou telefones.
    console.error("ranking_api_error", error?.code || error?.name || "unknown");
    return res.status(503).json({error: "ranking_temporarily_unavailable"});
  }
}
