// MCP prompts served by this package itself (both demo and live mode, routed by
// src/local.mjs). The remote server only implements tools.

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
    name: "scope-repo-to-proposal",
    title: "Scope this repository into a proposal",
    description:
      "Read the current project (README, issues, open tasks) and the client brief, list the remaining deliverables, price them with calculate_sow_pricing and, on confirmation, draft the proposal with create_proposal.",
    arguments: [
      { name: "client_brief", description: "What the client asked for, if not already in the repository.", required: false },
      { name: "hourly_rate", description: "Your hourly rate for the estimate.", required: false },
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

function scopeRepoText({ client_brief: brief = "", hourly_rate: rate = "" }) {
  return [
    "Turn the work on this project into a priced proposal draft.",
    "",
    brief.trim() ? `Client brief:\n${brief.trim()}` : "Client brief: (use the README, issues and TODOs; ask me if the client's goal is unclear)",
    "",
    "1. Read the README, open issues and TODOs. List the deliverables that are still to be built, one line each, in client language.",
    `2. Call calculate_sow_pricing with that list as client_message${String(rate).trim() ? ` and hourly_rate ${String(rate).trim()}` : ""}. Show me the line items, the buffer and the total, plus the preview link.`,
    "3. Ask whether I want to adjust anything. Creating the proposal uses one from my TempoRevenue allowance.",
    "4. On my confirmation, call create_proposal with a short brief (deliverables, timeline, the total as the stated price). Give me the editor link. Nothing is sent to the client until I send it.",
  ].join("\n");
}

/** Result for prompts/get, or null when the name is unknown. */
export function getPrompt(name, args = {}) {
  const prompt = PROMPTS.find((p) => p.name === name);
  if (!prompt) return null;
  const text = name === "quote-client-message" ? quoteText(args) : name === "scope-repo-to-proposal" ? scopeRepoText(args) : PENDING_TEXT;
  return { description: prompt.description, messages: [{ role: "user", content: { type: "text", text } }] };
}
