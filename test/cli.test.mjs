import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { SCENARIOS, estimateScope } from "../src/estimate.mjs";
import { handleDemoMessage } from "../src/demo.mjs";
import { createProxy, parseSse } from "../src/proxy.mjs";

const CLI = fileURLToPath(new URL("../bin/cli.mjs", import.meta.url));

test("estimate is deterministic and the math adds up", () => {
  for (const scenario of SCENARIOS) {
    const a = estimateScope({ text: scenario.text, rate: 120, buffer: 0.25 });
    const b = estimateScope({ text: scenario.text, rate: 120, buffer: 0.25 });
    assert.deepEqual(a, b);
    const subtotal = Math.round(a.items.reduce((sum, item) => sum + item.hours * 10, 0)) / 10;
    assert.equal(a.subtotalHours, subtotal);
    assert.equal(a.totalHours, Math.round((a.subtotalHours + a.bufferHours) * 10) / 10);
    assert.equal(a.totalCents, Math.round(a.totalHours * 120 * 100));
  }
});

test("estimate clamps bad input", () => {
  const e = estimateScope({ text: "", rate: -5, buffer: 0.9 });
  assert.equal(e.rate, 100);
  assert.equal(e.buffer, 0.2);
  assert.ok(e.total > 0);
});

test("demo server answers initialize, tools/list and tools/call", () => {
  const init = handleDemoMessage({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } });
  assert.equal(init.result.protocolVersion, "2025-06-18");
  const list = handleDemoMessage({ jsonrpc: "2.0", id: 2, method: "tools/list" });
  assert.deepEqual(list.result.tools.map((t) => t.name), ["create_proposal", "get_proposal_status", "list_proposals", "get_credit_balance"]);
  const call = handleDemoMessage({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: { name: "create_proposal", arguments: { deal_description: SCENARIOS[0].text } },
  });
  assert.match(call.result.content[0].text, /Fixed price: \$/);
  assert.equal(handleDemoMessage({ jsonrpc: "2.0", method: "notifications/initialized" }), null);
  assert.equal(handleDemoMessage({ jsonrpc: "2.0", id: 4, method: "nope" }).error.code, -32601);
});

test("parseSse reads data fields", () => {
  const body = 'event: message\ndata: {"jsonrpc":"2.0","id":1,"result":{}}\n\n';
  assert.deepEqual(parseSse(body), [{ jsonrpc: "2.0", id: 1, result: {} }]);
});

test("proxy forwards with bearer auth and maps 401 to a JSON-RPC error", async () => {
  const seen = [];
  const fake = async (url, init) => {
    seen.push(init.headers.Authorization);
    return new Response(JSON.stringify({ error: { code: "unauthorized" } }), { status: 401, headers: { "content-type": "application/json" } });
  };
  const forward = createProxy({ apiKey: "k", endpoint: "https://example.test/mcp", fetchImpl: fake });
  const [reply] = await forward({ jsonrpc: "2.0", id: 7, method: "tools/list" });
  assert.equal(seen[0], "Bearer k");
  assert.equal(reply.id, 7);
  assert.match(reply.error.message, /401/);
});

test("CLI in demo mode speaks MCP over stdio", async () => {
  const child = spawn(process.execPath, [CLI, "--demo"], { env: { ...process.env, TEMPOREVENUE_API_KEY: "" } });
  let out = "";
  child.stdout.on("data", (chunk) => (out += chunk));
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } } })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" })}\n`);
  child.stdin.end();
  await new Promise((resolve) => child.on("close", resolve));
  const replies = out.trim().split("\n").map((line) => JSON.parse(line));
  assert.equal(replies.length, 2);
  assert.equal(replies.find((r) => r.id === 2).result.tools.length, 4);
});

test("version script checks every manifest", async () => {
  const { execFileSync } = await import("node:child_process");
  const script = fileURLToPath(new URL("../scripts/version.mjs", import.meta.url));
  const pkg = JSON.parse((await import("node:fs")).readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.throws(() => execFileSync(process.execPath, [script, "--check", "99.0.0"], { stdio: "pipe" }));
  assert.throws(() => execFileSync(process.execPath, [script, "--check", "nope"], { stdio: "pipe" }));
  execFileSync(process.execPath, [script, "--check", pkg.version], { stdio: "pipe" });
});
