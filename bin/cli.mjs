#!/usr/bin/env node
// @temporevenue/mcp: stdio entry point.
//   live:  TEMPOREVENUE_API_KEY=... npx -y @temporevenue/mcp
//   demo:  npx -y @temporevenue/mcp --demo            (MCP server, no account)
//          npx -y @temporevenue/mcp --demo "<text>"   (in a terminal: prints an estimate)

import { createInterface } from "node:readline";
import { readFileSync } from "node:fs";
import { API_KEY_URL, SIGNUP_URL, WEB_DEMO_URL, handleDemoMessage } from "../src/demo.mjs";
import { DEFAULT_ENDPOINT, createProxy } from "../src/proxy.mjs";
import { SCENARIOS, estimateScope, formatBrief } from "../src/estimate.mjs";
import { handlePromptMessage, withPromptsCapability } from "../src/prompts.mjs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const positional = args.filter((arg) => !arg.startsWith("--")).join(" ").trim();

const HELP = `TempoRevenue MCP server ${pkg.version}

Turn a client conversation into a priced proposal draft from any MCP client.

Usage
  npx -y @temporevenue/mcp              Live mode (needs TEMPOREVENUE_API_KEY)
  npx -y @temporevenue/mcp --demo       Demo mode, no account, nothing leaves your machine
  npx -y @temporevenue/mcp --demo "<client message>"
                                        Print a demo estimate for your own text

Environment
  TEMPOREVENUE_API_KEY   API key from ${API_KEY_URL}
  TEMPOREVENUE_MCP_URL   Override the endpoint (default ${DEFAULT_ENDPOINT})

Add to Claude Code
  claude mcp add temporevenue -e TEMPOREVENUE_API_KEY=<key> -- npx -y @temporevenue/mcp
`;

if (flag("--help") || flag("-h")) {
  process.stdout.write(HELP);
  process.exit(0);
}
if (flag("--version") || flag("-v")) {
  process.stdout.write(`${pkg.version}\n`);
  process.exit(0);
}

// A client that does not expand variables passes "${TEMPOREVENUE_API_KEY}" literally: treat it as unset (demo mode).
const rawKey = process.env.TEMPOREVENUE_API_KEY?.trim();
const apiKey = rawKey && !rawKey.startsWith("${") ? rawKey : undefined;
const demo = flag("--demo") || !apiKey;

// A person typing in a terminal (not an MCP client) gets a readable estimate.
if (demo && (process.stdin.isTTY || positional)) {
  const scenario = SCENARIOS[1];
  const input = positional ? { text: positional } : { clientName: scenario.clientName, text: scenario.text };
  const estimate = estimateScope({ text: input.text });
  process.stdout.write(
    `\nTempoRevenue demo: rule-based estimate, computed locally\n\n${formatBrief(input, estimate)}\n\n` +
      `${estimate.signals.length ? `Signals: ${estimate.signals.join("; ")}\n\n` : ""}` +
      `Try your own text:   npx -y @temporevenue/mcp --demo "paste the client message"\n` +
      `Try it in the browser: ${WEB_DEMO_URL}\n` +
      `Create real proposals: ${SIGNUP_URL}\n` +
      `Then add an API key:   ${API_KEY_URL}\n\n`
  );
  process.exit(0);
}

if (!apiKey && !flag("--demo")) {
  process.stderr.write(`[temporevenue] TEMPOREVENUE_API_KEY is not set: running in demo mode. Get a key at ${API_KEY_URL}\n`);
} else if (process.stdin.isTTY) {
  process.stderr.write("[temporevenue] MCP server on stdio. Add it to an MCP client; see --help.\n");
}

const upstream = demo
  ? async (message) => {
      const response = handleDemoMessage(message);
      return response ? [response] : [];
    }
  : createProxy({ apiKey, endpoint: process.env.TEMPOREVENUE_MCP_URL || DEFAULT_ENDPOINT, userAgent: `temporevenue-mcp/${pkg.version}` });

// Prompts are answered here in both modes; everything else goes upstream.
const forward = async (message) => {
  const prompt = handlePromptMessage(message);
  if (prompt !== undefined) return message.id === undefined || message.id === null ? [] : [prompt];
  const responses = await upstream(message);
  return message?.method === "initialize" ? responses.map(withPromptsCapability) : responses;
};

const write = (message) => process.stdout.write(`${JSON.stringify(message)}\n`);
const pending = new Set();

const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
lines.on("line", (line) => {
  if (!line.trim()) return;
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    write({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
    return;
  }
  const task = forward(message)
    .then((responses) => responses.forEach(write))
    .catch((error) => {
      if (message?.id !== undefined && message?.id !== null) {
        write({ jsonrpc: "2.0", id: message.id, error: { code: -32603, message: String(error?.message ?? error) } });
      }
    })
    .finally(() => pending.delete(task));
  pending.add(task);
});
lines.on("close", async () => {
  await Promise.allSettled([...pending]);
  process.exit(0);
});
