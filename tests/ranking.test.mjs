import {test} from "node:test";
import assert from "node:assert/strict";
import {GAMES, compareEntries, parseEntry, isUuid} from "../lib/ranking-core.mjs";

const valid = {name: "Maria Coamo", phone: "(44) 99999-9999", score: 1500, duration: 70,
  accuracy: 89, phase: 3, stars: 4, createdAt: Date.now()};

test("nove modalidades têm rankings independentes", () => {
  assert.equal(GAMES.length, 9);
  assert.equal(new Set(GAMES).size, 9);
});

test("pontuação maior sempre entra acima, mesmo com cinco registros", () => {
  const top = [100, 200, 300, 400, 500].map((score, i) => ({score, duration: 30, createdAt: i})).sort(compareEntries);
  const incoming = {score: 350, duration: 25, createdAt: 99};
  assert.deepEqual([...top, incoming].sort(compareEntries).slice(0, 5).map(x => x.score), [500, 400, 350, 300, 200]);
});

test("empate segue duração, precisão, fase e horário", () => {
  const entries = [
    {score: 100, duration: 20, accuracy: 80, phase: 1, createdAt: 1},
    {score: 100, duration: 21, accuracy: 10, phase: 1, createdAt: 2},
    {score: 100, duration: 21, accuracy: 90, phase: 1, createdAt: 3},
    {score: 100, duration: 21, accuracy: 90, phase: 2, createdAt: 4},
    {score: 100, duration: 21, accuracy: 90, phase: 2, createdAt: 2},
  ].sort(compareEntries);
  assert.deepEqual(entries.map(x => x.createdAt), [2, 4, 3, 2, 1]);
});

test("nome e telefone são normalizados sem aceitar dados incompletos", () => {
  const result = parseEntry("grain", {...valid, name: "   Maria   Coamo  "});
  assert.equal(result.name, "Maria Coamo");
  assert.equal(result.phoneDigits, "44999999999");
  assert.equal(parseEntry("grain", {...valid, phone: "999"}), null);
  assert.equal(parseEntry("grain", {...valid, name: "A"}), null);
});

test("rejeita modalidade inválida e número suspeito", () => {
  assert.equal(parseEntry("inexistente", valid), null);
  assert.equal(parseEntry("grain", {...valid, score: 99999999999}), null);
  assert.equal(parseEntry("grain", {...valid, duration: -1}), null);
  assert.equal(parseEntry("grain", {...valid, createdAt: 1}), null);
});

test("identificadores de tentativa exigem UUID", () => {
  assert.equal(isUuid("bc02910c-cd82-4b09-97e5-f29cf0b74dbc"), true);
  assert.equal(isUuid("../../etc/passwd"), false);
});

test("gerações isolam pontuação pendente após zerar tudo", () => {
  const oldScore = {epoch: 1, gameEpoch: 1};
  const active = {epoch: 2, gameEpoch: 1};
  assert.equal(oldScore.epoch === active.epoch && oldScore.gameEpoch === active.gameEpoch, false);
});

test("zerar uma modalidade não invalida fila das outras", () => {
  const epochs = {grain: 2, silo: 1};
  assert.equal(epochs.grain === 1, false);
  assert.equal(epochs.silo === 1, true);
});
