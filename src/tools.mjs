// Static copy of the tool catalog served by https://app.temporevenue.com/api/mcp
// (the same list as https://app.temporevenue.com/.well-known/mcp/server-card.json).
// Used only by demo mode, so MCP clients and registry scanners can inspect the
// schemas without an API key. Live mode always forwards tools/list upstream.
// v1.3.0: contract names. The old names (create_proposal, get_proposal_status,
// list_proposals) are still accepted in tools/call, here and on the live server.

export const SERVER_INFO = {
  name: "temporevenue",
  title: "TempoRevenue",
  version: "1.3.0",
  websiteUrl: "https://temporevenue.com",
};

/** Old tool names still accepted in tools/call (never listed). */
export const LEGACY_TOOL_ALIASES = {
  create_proposal: "create_contract",
  get_proposal_status: "get_contract_status",
  list_proposals: "list_contracts",
};

export const TOOLS = [
  {
    "name": "create_contract",
    "title": "Create contract",
    "description": "Draft a client contract (service agreement, statement of work or master services agreement) in the user's TempoRevenue account from a short brief: client, scope, timeline and budget. Use it when a freelancer, consultant or agency wants a contract, agreement, SOW, MSA, quote or proposal for client work. The model extracts the scope; code calculates the price (a stated price, or estimated hours times the user's rate, when set). Returns an editor link for review. Does not publish, send, collect payment or give legal advice. Publishing a contract for signature uses one credit in the web app.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "deal_description": {
          "type": "string",
          "minLength": 1,
          "description": "Brief description of the client's request. Do not send the full chat history."
        },
        "client_name": {
          "description": "The client's name, if known.",
          "type": "string",
          "maxLength": 200
        },
        "language": {
          "description": "Language of the contract. If omitted, it follows the language of the description.",
          "type": "string",
          "enum": [
            "en",
            "pt",
            "es",
            "de"
          ]
        },
        "contract_type": {
          "description": "service_agreement (default): one project. statement_of_work: one project under an existing master agreement. master_services_agreement: framework terms for ongoing work with the same client.",
          "type": "string",
          "enum": [
            "service_agreement",
            "statement_of_work",
            "master_services_agreement"
          ]
        }
      },
      "required": [
        "deal_description"
      ]
    },
    "annotations": {
      "readOnlyHint": false,
      "destructiveHint": false,
      "idempotentHint": false,
      "openWorldHint": false
    }
  },
  {
    "name": "create_change_order",
    "title": "Create change order",
    "description": "Draft a change order for extra work on an existing agreement: what was agreed, what the client asked to change, the additional price and the timeline impact. Use it when a client requests work outside the agreed scope. The professional confirms the timeline impact in the editor before sending. Returns an editor link. Does not publish, and does not decide whether the client owes money.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "prior_agreement": {
          "type": "string",
          "minLength": 1,
          "description": "What was already agreed with the client, in one or two sentences."
        },
        "requested_change": {
          "type": "string",
          "minLength": 1,
          "description": "What the client asked to add or change."
        },
        "timeline_impact": {
          "type": "string",
          "minLength": 1,
          "description": "How the change affects the timeline, as the professional described it (\"no impact\" is a valid answer)."
        },
        "additional_price": {
          "description": "The additional price, only if the professional stated it (for example 800 or 800 USD).",
          "type": "string",
          "maxLength": 40
        },
        "original_contract_id": {
          "description": "Id of the original contract in this account, from list_contracts, to link the change order to it.",
          "type": "string"
        },
        "client_name": {
          "description": "The client's name, if known.",
          "type": "string",
          "maxLength": 200
        },
        "language": {
          "description": "Language of the change order. If omitted, it follows the language of the text.",
          "type": "string",
          "enum": [
            "en",
            "pt",
            "es",
            "de"
          ]
        }
      },
      "required": [
        "prior_agreement",
        "requested_change",
        "timeline_impact"
      ]
    },
    "annotations": {
      "readOnlyHint": false,
      "destructiveHint": false,
      "idempotentHint": false,
      "openWorldHint": false
    }
  },
  {
    "name": "get_contract_status",
    "title": "Get contract status",
    "description": "Check the status of a contract in the user's TempoRevenue account: draft, viewed or accepted, with the date the client first opened it and the date they signed it. Accepted means the client signed, not that they paid. Use the `id` returned by create_contract or list_contracts.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "description": "Contract id returned by create_contract or list_contracts."
        }
      },
      "required": [
        "id"
      ]
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": false
    }
  },
  {
    "name": "list_contracts",
    "title": "List contracts",
    "description": "List the user's most recent contracts in TempoRevenue, newest first: id, title, status (draft, viewed or accepted) and a link to open each one. Optionally filter by status. Returns at most 20.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "status": {
          "description": "Only contracts in this status.",
          "type": "string",
          "enum": [
            "draft",
            "viewed",
            "accepted"
          ]
        },
        "limit": {
          "description": "How many contracts to return (1 to 20, default 10).",
          "type": "integer",
          "minimum": 1,
          "maximum": 20
        }
      }
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": false
    }
  },
  {
    "name": "get_credit_balance",
    "title": "Get credit balance",
    "description": "Return remaining publication credits for the account. This balance does not measure AI draft generation limits or Pro access.",
    "inputSchema": {
      "type": "object",
      "properties": {}
    },
    "annotations": {
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": false
    }
  }
];
