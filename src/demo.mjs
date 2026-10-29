// Demo mode: a local MCP server with the same tool catalog as the live one.
// Nothing leaves the machine and nothing is created in any account.
// create_proposal returns a deterministic estimate (src/estimate.mjs) so you
// can see the shape of the workflow before signing up.

import { estimateScope, formatBrief } from "./estimate.mjs";
import { SERVER_INFO, TOOLS } from "./tools.mjs";

export const SIGNUP_URL = "https://app.temporevenue.com/en/login?utm_source=npm&utm_medium=cli&utm_campaign=mcp-demo";
export const API_KEY_URL = "https://app.temporevenue.com/en/integrations";
export const WEB_DEMO_URL = "https://temporevenue.com/resources/chat-to-sow-generator/";

const SUPPORTED_PROTOCOLS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

const DEMO_NOTE =
  "Demo mode: this is a rule-based estimate computed locally. No proposal was created and nothing was sent anywhere.\n" +
  `To create real proposals with a review-and-send link, create a free account (${SIGNUP_URL}), ` +
  `generate an API key (${API_KEY_URL}) and set TEMPOREVENUE_API_KEY.`;

const text = (value) => ({ content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }] });

function callTool(name, args = {}) {
  switch (name) {
    case "create_proposal": {
      const description = typeof args.deal_description === "string" ? args.deal_description.trim() : "";
      if (!description) {
        return { isError: true, ...text({ error: { code: "invalid_request", message: "deal_description is required." } }) };
      }
      const estimate = estimateScope({ text: description });
      return text(`${formatBrief({ clientName: args.client_name, text: description }, estimate)}\n\n${DEMO_NOTE}`);
    }
    case "list_proposals":
      return text({ proposals: [], note: DEMO_NOTE });
    case "get_proposal_status":
      return { isError: true, ...text({ error: { code: "not_found", message: `No proposals exist in demo mode. ${DEMO_NOTE}` } }) };
    case "get_credit_balance":
      return text({ credits_remaining: 0, note: DEMO_NOTE });
    default:
      return null;
  }
}

/**
 * Handles one JSON-RPC message. Returns the response object, or null for
 * notifications (which never get a response).
 */
export function handleDemoMessage(message) {
  const isRequest = message && typeof message === "object" && "id" in message && message.id !== null;
  const reply = (result) => (isRequest ? { jsonrpc: "2.0", id: message.id, result } : null);
  const fail = (code, msg) => (isRequest ? { jsonrpc: "2.0", id: message.id, error: { code, message: msg } } : null);

  if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return { jsonrpc: "2.0", id: message?.id ?? null, error: { code: -32600, message: "Invalid Request" } };
  }

  switch (message.method) {
    case "initialize": {
      const requested = message.params?.protocolVersion;
      return reply({
        protocolVersion: SUPPORTED_PROTOCOLS.includes(requested) ? requested : SUPPORTED_PROTOCOLS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { ...SERVER_INFO, title: `${SERVER_INFO.title} (demo)` },
        instructions: DEMO_NOTE,
      });
    }
    case "ping":
      return reply({});
    case "tools/list":
      return reply({ tools: TOOLS });
    case "tools/call": {
      const result = callTool(message.params?.name, message.params?.arguments);
      return result ? reply(result) : fail(-32602, `Unknown tool: ${message.params?.name}`);
    }
    default:
      return message.method.startsWith("notifications/") ? null : fail(-32601, "Method not found");
  }
}
