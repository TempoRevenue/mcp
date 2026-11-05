// Static copy of the tool catalog served by https://app.temporevenue.com/api/mcp.
// Used only by demo mode, so MCP clients and registry scanners can inspect the
// schemas without an API key. Live mode always forwards tools/list upstream.

export const SERVER_INFO = {
  name: "temporevenue",
  title: "TempoRevenue",
  version: "1.0.0",
  websiteUrl: "https://temporevenue.com",
};

export const TOOLS = [
  {
    name: "create_proposal",
    title: "Create proposal",
    description:
      "Draft a project proposal when a freelancer wants to quote a client request or prepare a scope of work. " +
      "Send a short brief with client, scope, timeline, and budget, not the full chat history. " +
      "An explicit price is used as the total; otherwise code calculates estimated hours times the user's rate. " +
      "Returns an editor link for review. Does not publish, send, collect payment, or create change orders. " +
      "Every account includes one free personal draft. Further AI drafts use generation limits, not publication credits. " +
      "Publishing an approval link uses one credit in the web app. Optional Pro includes zero publication credits.",
    inputSchema: {
      type: "object",
      properties: {
        deal_description: {
          type: "string",
          minLength: 1,
          description: "Brief description of the client's request. Do not send the full chat history.",
        },
        client_name: { type: "string", maxLength: 200, description: "The client's name, if known." },
        language: {
          type: "string",
          enum: ["en", "pt", "es", "de"],
          description: "Language of the proposal. If omitted, it follows the language of the description.",
        },
      },
      required: ["deal_description"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  {
    name: "get_proposal_status",
    title: "Get proposal status",
    description:
      "Check the status of a proposal in the user's TempoRevenue account: draft, viewed or accepted, " +
      "with the date the client first opened it and the date they accepted it. " +
      "Accepted means client approval, not payment. Use the `id` returned by create_proposal or list_proposals.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Proposal id returned by create_proposal or list_proposals." } },
      required: ["id"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "list_proposals",
    title: "List proposals",
    description:
      "List the user's most recent proposals in TempoRevenue, newest first: id, title, status (draft, viewed or accepted) " +
      "and a link to open each one. Optionally filter by status. Returns at most 20.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["draft", "viewed", "accepted"], description: "Only proposals in this status." },
        limit: { type: "integer", minimum: 1, maximum: 20, description: "How many proposals to return (1 to 20, default 10)." },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "get_credit_balance",
    title: "Get credit balance",
    description: "Return remaining publication credits for the account. This balance does not measure AI draft generation limits or Pro access.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
];
