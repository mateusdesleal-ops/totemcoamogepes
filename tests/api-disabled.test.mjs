import {test} from "node:test";
import assert from "node:assert/strict";
import handler from "../api/rankings.js";

function response() {
  return {
    headers: {}, code: 200, data: null,
    setHeader(k, v) { this.headers[k] = v; return this; },
    status(code) { this.code = code; return this; },
    json(value) { this.data = value; return this; },
  };
}

test("ranking desativado nunca acessa banco nem grava", async () => {
  const original = process.env.RANKING_ENABLED;
  delete process.env.RANKING_ENABLED;
  try {
    const get = response();
    await handler({method: "GET", headers: {}}, get);
    assert.equal(get.code, 200);
    assert.deepEqual(get.data, {enabled: false});
    const post = response();
    await handler({method: "POST", headers: {}, body: {action: "reset-all", confirm: "ZERAR TODOS"}}, post);
    assert.equal(post.code, 200);
    assert.deepEqual(post.data, {enabled: false});
    const invalid = response();
    await handler({method: "DELETE", headers: {}}, invalid);
    assert.equal(invalid.code, 405);
  } finally {
    if (original === undefined) delete process.env.RANKING_ENABLED;
    else process.env.RANKING_ENABLED = original;
  }
});
