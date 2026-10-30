// Capabilities this package serves itself, in demo and live mode, with no
// account and no network: the read-only `calculate_sow_pricing` tool, two
// reference resources and the MCP prompts. The remote server keeps its four
// account tools; this bridge adds these next to them.

import { BUFFER_OPTIONS, LOCALES, LOCALE_SETTINGS, RULES, estimateScope } from "./estimate.mjs";
import { PROMPTS, getPrompt } from "./prompts.mjs";

const SOW_URL = "https://temporevenue.com/sow";

export const CALCULATE_TOOL = {
  name: "calculate_sow_pricing",
  title: "Calculate SOW pricing",
  description:
    "Estimate a freelance project from a client message: deliverables found by keyword rules, hours per deliverable, " +
    "a scope risk buffer and a fixed price (hours times the hourly rate, calculated in integer cents). " +
    "Runs locally, needs no account and creates nothing. Returns a link to open the same estimate in the TempoRevenue web calculator.",
  inputSchema: {
    type: "object",
    properties: {
      client_message: { type: "string", minLength: 1, description: "The client's request, call notes or a feature list." },
      hourly_rate: { type: "number", exclusiveMinimum: 0, maximum: 2000, description: "Hourly rate. Defaults to 100 (or the language's default)." },
      buffer_percent: { type: "integer", enum: [15, 20, 25], description: "Scope risk buffer in percent. Defaults to 20." },
      language: { type: "string", enum: LOCALES, description: "Language of the labels and currency: en (USD), pt (BRL), es or de (EUR). Defaults to en." },
      client_name: { type: "string", maxLength: 200, description: "The client's name, if known." },
    },
    required: ["client_message"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: {
      currency: { type: "string" },
      hourly_rate: { type: "number" },
      buffer_percent: { type: "integer" },
      line_items: {
        type: "array",
        items: {
          type: "object",
          properties: { deliverable: { type: "string" }, hours: { type: "number" }, price: { type: "number" } },
          required: ["deliverable", "hours", "price"],
        },
      },
      subtotal_hours: { type: "number" },
      buffer_hours: { type: "number" },
      total_hours: { type: "number" },
      total_price: { type: "number" },
      signals: { type: "array", items: { type: "string" } },
      preview_url: { type: "string", description: "Opens this estimate, editable, in the TempoRevenue web calculator." },
    },
    required: ["currency", "hourly_rate", "buffer_percent", "line_items", "total_hours", "total_price", "preview_url"],
  },
  annotations: { title: "Calculate SOW pricing", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
};

/** Link in the human-readable /sow format the web calculator reads. */
export function sowUrl({ clientName, items, rate, bufferPercent, language }, source = { utm_source: "mcp", utm_medium: "calculate_tool" }) {
  const params = new URLSearchParams();
  if (clientName) params.set("client", clientName);
  params.set("rate", String(rate));
  params.set("buffer", String(bufferPercent));
  params.set("items", items.map((i) => `${i.label.replace(/[;:]/g, " ")}:${i.hours}`).join(";"));
  if (language && language !== "en") params.set("lang", language);
  for (const [k, v] of Object.entries(source)) params.set(k, v);
  return `${SOW_URL}?${params}`;
}

export function calculate(args = {}) {
  const message = typeof args.client_message === "string" ? args.client_message.trim() : "";
  if (!message) return { isError: true, content: [{ type: "text", text: JSON.stringify({ error: { code: "invalid_request", message: "client_message is required." } }) }] };
  const language = LOCALES.includes(args.language) ? args.language : "en";
  const settings = LOCALE_SETTINGS[language];
  const rate = Number.isFinite(args.hourly_rate) && args.hourly_rate > 0 ? args.hourly_rate : settings.rate;
  const bufferPercent = [15, 20, 25].includes(args.buffer_percent) ? args.buffer_percent : 20;
  const estimate = estimateScope({ text: message, rate, buffer: bufferPercent / 100, locale: language });
  const cents = (hours) => (Math.round(hours * 10) * estimate.rate * 10) / 100;
  const structured = {
    currency: settings.currency,
    hourly_rate: estimate.rate,
    buffer_percent: bufferPercent,
    line_items: estimate.items.map((i) => ({ deliverable: i.label, hours: i.hours, price: cents(i.hours) })),
    subtotal_hours: estimate.subtotalHours,
    buffer_hours: estimate.bufferHours,
    total_hours: estimate.totalHours,
    total_price: estimate.total,
    signals: estimate.signals,
    preview_url: sowUrl({ clientName: args.client_name, items: estimate.items, rate: estimate.rate, bufferPercent, language }),
  };
  return { content: [{ type: "text", text: JSON.stringify(structured, null, 2) }], structuredContent: structured };
}

// ---------- Resources ----------

const DEFAULTS_URI = "temporevenue://reference/estimator-defaults";
const CLAUSES_URI = "temporevenue://templates/sow-clauses";

export const RESOURCES = [
  {
    uri: DEFAULTS_URI,
    name: "estimator-defaults",
    title: "TempoRevenue estimator defaults",
    description: "Base hours per deliverable and the pricing formula used by calculate_sow_pricing and the web calculator. Defaults, not market averages.",
    mimeType: "application/json",
  },
  {
    uri: CLAUSES_URI,
    name: "sow-clauses",
    title: "SOW clauses",
    description: "Plain-language clauses for scope boundaries, change requests, revisions, payment and ownership.",
    mimeType: "text/markdown",
  },
];

function defaultsJson() {
  return {
    note: "TempoRevenue defaults for a typical freelance project, not market averages. Adjust to your own speed and rate.",
    deliverables: RULES.map((r) => ({ id: r.id, deliverable: r.label.en, base_hours: r.perPage ? `${r.perPage} per page` : r.hours })),
    always_included: { discovery: "8% of build hours, at least 3", testing: "12% of build hours, at least 4", deployment: 4 },
    complexity_multiplier: { complex: 1.25, simple: 0.85, default: 1 },
    buffer_percent_options: BUFFER_OPTIONS.map((b) => Math.round(b * 100)),
    formula: "total_hours = (discovery + build x multiplier + testing + deployment) x (1 + buffer); price = total_hours x hourly_rate",
    next_action: "Use calculate_sow_pricing for an itemized estimate, or create_proposal (TempoRevenue account) to draft the full proposal.",
    calculator: "https://temporevenue.com/resources/chat-to-sow-generator/",
  };
}

const CLAUSES = `# SOW clauses

## Scope
The work is limited to the deliverables listed in this document. Anything not listed is out of scope.

## Change requests
Any change to scope gets a written estimate (hours x rate) and starts only after written approval.

## Revisions
Each deliverable includes [2] rounds of revisions. Further rounds are billed at the hourly rate.

## Client inputs
The client provides content, assets and access by [date]. Delays in inputs move the timeline by the same number of days.

## Payment
[40]% on signature, [30]% at [milestone], [30]% on acceptance. Invoices are due within [7] days.

## Acceptance
A milestone is accepted when the client confirms it in writing, or [5] business days after delivery with no reported defects.

## Ownership
Rights to the final deliverables transfer to the client on full payment.

More templates: https://github.com/TempoRevenue/mcp/tree/main/templates
`;

export function readResource(uri) {
  if (uri === DEFAULTS_URI) return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(defaultsJson(), null, 2) }] };
  if (uri === CLAUSES_URI) return { contents: [{ uri, mimeType: "text/markdown", text: CLAUSES }] };
  return null;
}

// ---------- JSON-RPC routing ----------

const reply = (message, result) => ({ jsonrpc: "2.0", id: message.id ?? null, result });
const fail = (message, code, text) => ({ jsonrpc: "2.0", id: message.id ?? null, error: { code, message: text } });

/**
 * Answers the locally served methods. Returns the response, or undefined when
 * the message should go upstream (or to the demo server).
 */
export function handleLocalMessage(message) {
  if (!message || typeof message.method !== "string") return undefined;
  switch (message.method) {
    case "prompts/list":
      return reply(message, { prompts: PROMPTS });
    case "prompts/get": {
      const result = getPrompt(message.params?.name, message.params?.arguments);
      return result ? reply(message, result) : fail(message, -32602, `Unknown prompt: ${message.params?.name}`);
    }
    case "resources/list":
      return reply(message, { resources: RESOURCES });
    case "resources/templates/list":
      return reply(message, { resourceTemplates: [] });
    case "resources/read": {
      const result = readResource(message.params?.uri);
      return result ? reply(message, result) : fail(message, -32002, `Resource not found: ${message.params?.uri}`);
    }
    case "tools/call":
      return message.params?.name === CALCULATE_TOOL.name ? reply(message, calculate(message.params?.arguments)) : undefined;
    default:
      return undefined;
  }
}

/** Adds the local tool to a tools/list result and the local capabilities to initialize. */
export function decorateUpstream(request, response) {
  if (!response || response.error) return response;
  if (request?.method === "tools/list" && Array.isArray(response.result?.tools)) {
    if (!response.result.tools.some((t) => t.name === CALCULATE_TOOL.name)) response.result.tools = [CALCULATE_TOOL, ...response.result.tools];
  }
  if (request?.method === "initialize" && response.result?.capabilities) {
    const caps = response.result.capabilities;
    caps.prompts ??= { listChanged: false };
    caps.resources ??= { listChanged: false };
    caps.tools ??= { listChanged: false };
  }
  return response;
}
