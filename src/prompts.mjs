// MCP prompts served by this package itself (both demo and live mode). The
// remote server only implements tools, so the bridge answers prompts/list and
// prompts/get locally and adds the `prompts` capability to initialize.

export const PROMPTS = [
  {
    name: "quote-client-message",
    title: "Quote a client message",
    description:
      "Turn a client message, call notes or a project brief into a priced proposal draft: structure the scope, then create it with create_proposal.",
    arguments: [
      { name: "message", description: "The client's message or your notes about the project.", required: true },
      { name: "client_name", description: "The client's name, if known.", required: false },
    ],
  },
  {
    name: "check-pending-proposals",
    title: "Check pending proposals",
    description: "Summarize proposals that are still waiting for the client: sent or viewed, not yet accepted.",
    arguments: [],
  },
];

function quoteText({ message = "", client_name: clientName = "" }) {
  return [
    "Turn this client request into a TempoRevenue proposal draft.",
    "",
    clientName ? `Client: ${clientName}` : "Client: (ask if unknown, or leave it out)",
    "Client request:",
    message.trim() || "(ask me for the client's message)",
    "",
    "1. Write a short brief, not the full chat: deliverables as a list, timeline, budget only if one was stated, anything out of scope.",
    "2. Show me the brief and wait for my confirmation: creating a proposal uses one from my allowance.",
    "3. Call create_proposal with deal_description set to the brief and client_name if known. Never invent a price.",
    "4. Give me the editor link. Nothing is sent to the client until I send it.",
  ].join("\n");
}

const PENDING_TEXT = [
  "Check my TempoRevenue proposals that are still waiting for the client.",
  "",
  "1. Call list_proposals with status \"viewed\", then with status \"draft\".",
  "2. For each viewed proposal, call get_proposal_status to get the date the client opened it.",
  "3. Summarize: client or title, status, days since it was opened, and the editor link.",
  "4. Suggest which ones deserve a follow-up today (viewed more than 2 days ago and not accepted).",
].join("\n");

/** Result for prompts/get, or null when the name is unknown. */
export function getPrompt(name, args = {}) {
  const prompt = PROMPTS.find((p) => p.name === name);
  if (!prompt) return null;
  const text = name === "quote-client-message" ? quoteText(args) : PENDING_TEXT;
  return { description: prompt.description, messages: [{ role: "user", content: { type: "text", text } }] };
}

/**
 * Answers prompts/* locally. Returns the JSON-RPC response, or undefined when
 * the message is not a prompts request (so it should be handled elsewhere).
 */
export function handlePromptMessage(message) {
  if (!message || typeof message.method !== "string" || !message.method.startsWith("prompts/")) return undefined;
  const id = message.id ?? null;
  if (message.method === "prompts/list") return { jsonrpc: "2.0", id, result: { prompts: PROMPTS } };
  if (message.method === "prompts/get") {
    const result = getPrompt(message.params?.name, message.params?.arguments);
    return result
      ? { jsonrpc: "2.0", id, result }
      : { jsonrpc: "2.0", id, error: { code: -32602, message: `Unknown prompt: ${message.params?.name}` } };
  }
  return { jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } };
}

/** Adds the prompts capability to an initialize result coming from the server. */
export function withPromptsCapability(message) {
  if (message?.result?.capabilities && !message.result.capabilities.prompts) {
    message.result.capabilities.prompts = { listChanged: false };
  }
  return message;
}
