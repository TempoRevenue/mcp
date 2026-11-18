// MCP prompts served by this package itself (both demo and live mode, routed by
// src/local.mjs). The remote server only implements tools.

export const PROMPTS = [
  {
    name: "quote-client-message",
    title: "Quote a client message",
    description:
      "Turn a client message, call notes or a project brief into a contract draft: structure the scope, then create it with create_contract.",
    arguments: [
      { name: "message", description: "The client's message or your notes about the project.", required: true },
      { name: "client_name", description: "The client's name, if known.", required: false },
    ],
  },
  {
    name: "scope-repo-to-contract",
    title: "Scope this repository into a contract",
    description:
      "Read the current project (README, issues, open tasks) and the client brief, list the remaining deliverables, price them with calculate_sow_pricing and, on confirmation, draft the contract with create_contract.",
    arguments: [
      { name: "client_brief", description: "What the client asked for, if not already in the repository.", required: false },
      { name: "hourly_rate", description: "Your hourly rate for the estimate.", required: false },
    ],
  },
  {
    name: "check-pending-contracts",
    title: "Check pending contracts",
    description: "Summarize contracts that are still waiting for the client: published or viewed, not yet signed.",
    arguments: [],
  },
];

function quoteText({ message = "", client_name: clientName = "" }) {
  return [
    "Turn this client request into a TempoRevenue contract draft.",
    "",
    clientName ? `Client: ${clientName}` : "Client: (ask if unknown, or leave it out)",
    "Client request:",
    message.trim() || "(ask me for the client's message)",
    "",
    "1. Write a short brief, not the full chat: deliverables as a list, timeline, budget only if one was stated, anything out of scope.",
    "2. Show me the brief and wait for my confirmation: creating the draft counts toward my TempoRevenue draft limit.",
    "3. Call create_contract with deal_description set to the brief and client_name if known (contract_type: service_agreement by default, statement_of_work under an existing master agreement, master_services_agreement for ongoing work). Never invent a price.",
    "4. Give me the editor link. Nothing reaches the client until I publish it.",
  ].join("\n");
}

const PENDING_TEXT = [
  "Check my TempoRevenue contracts that are still waiting for the client.",
  "",
  "1. Call list_contracts with status \"viewed\", then with status \"draft\".",
  "2. For each viewed contract, call get_contract_status to get the date the client opened it.",
  "3. Summarize: client or title, status, days since it was opened, and the editor link.",
  "4. Suggest which ones deserve a follow-up today (viewed more than 2 days ago and not signed).",
].join("\n");

function scopeRepoText({ client_brief: brief = "", hourly_rate: rate = "" }) {
  return [
    "Turn the work on this project into a priced contract draft.",
    "",
    brief.trim() ? `Client brief:\n${brief.trim()}` : "Client brief: (use the README, issues and TODOs; ask me if the client's goal is unclear)",
    "",
    "1. Read the README, open issues and TODOs. List the deliverables that are still to be built, one line each, in client language.",
    `2. Call calculate_sow_pricing with that list as client_message${String(rate).trim() ? ` and hourly_rate ${String(rate).trim()}` : ""}. Show me the line items, the buffer and the total, plus the preview link.`,
    "3. Ask whether I want to adjust anything. Creating the draft counts toward my TempoRevenue draft limit.",
    "4. On my confirmation, call create_contract with a short brief (deliverables, timeline, the total as the stated price). Give me the editor link. Nothing reaches the client until I publish it.",
  ].join("\n");
}

/** Result for prompts/get, or null when the name is unknown. */
/** v1.3.0: old prompt names keep working (never listed). */
const LEGACY_PROMPT_ALIASES = { "scope-repo-to-proposal": "scope-repo-to-contract", "check-pending-proposals": "check-pending-contracts" };

export function getPrompt(rawName, args = {}) {
  const name = LEGACY_PROMPT_ALIASES[rawName] ?? rawName;
  const prompt = PROMPTS.find((p) => p.name === name);
  if (!prompt) return null;
  const text = name === "quote-client-message" ? quoteText(args) : name === "scope-repo-to-contract" ? scopeRepoText(args) : PENDING_TEXT;
  return { description: prompt.description, messages: [{ role: "user", content: { type: "text", text } }] };
}
