# TempoRevenue MCP server

[![npm](https://img.shields.io/npm/v/@temporevenue/mcp)](https://www.npmjs.com/package/@temporevenue/mcp)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-stdio%20%7C%20Streamable%20HTTP-black)](https://modelcontextprotocol.io)

Turn a client conversation into a priced proposal draft without leaving Claude, Cursor, Gemini CLI or any MCP client. The draft lands in your [TempoRevenue](https://temporevenue.com) account with a link to review it, then send it for online acceptance.

## Try it without an account

```bash
npx -y @temporevenue/mcp --demo
```

```bash
npx -y @temporevenue/mcp --demo "We need a Shopify redesign, Stripe checkout and QuickBooks sync"
```

Demo mode runs locally. It exposes the same four tools as the live server and answers `create_proposal` with a rule-based estimate: deliverables, hours, a scope risk buffer and a fixed price. Nothing is created and nothing leaves your machine. There is also a [browser version](https://temporevenue.com/resources/chat-to-sow-generator/).

## Tools

| Tool | What it does |
| --- | --- |
| `create_proposal` | Creates a draft proposal from a short description of the client's request. A price stated in the request is used as the total; otherwise it is your rate times the estimated hours, calculated in code. Returns a link to review and send. |
| `get_proposal_status` | Draft, viewed or accepted, with the dates the client opened and accepted it. |
| `list_proposals` | Your most recent proposals, optionally filtered by status. |
| `get_credit_balance` | How many proposals you can still create. |

Nothing is sent to a client until you send it yourself.

## Install

1. Create a free account at [app.temporevenue.com](https://app.temporevenue.com/en/login?utm_source=github&utm_medium=readme) (3 proposals a month, no card).
2. Create an API key on the [Integrations page](https://app.temporevenue.com/en/integrations).
3. Add the server to your client.

### Claude Code

```bash
claude mcp add temporevenue -e TEMPOREVENUE_API_KEY=your_api_key -- npx -y @temporevenue/mcp
```

### Cursor, Claude Desktop, Windsurf

Add to `.cursor/mcp.json`, `claude_desktop_config.json` or your client's MCP config:

```json
{
  "mcpServers": {
    "temporevenue": {
      "command": "npx",
      "args": ["-y", "@temporevenue/mcp"],
      "env": { "TEMPOREVENUE_API_KEY": "your_api_key" }
    }
  }
}
```

### Gemini CLI

```bash
gemini mcp add temporevenue -e TEMPOREVENUE_API_KEY=your_api_key npx -y @temporevenue/mcp
```

### Remote (no Node.js needed)

Clients with Streamable HTTP support can skip this package and connect to the server directly:

```bash
claude mcp add --transport http temporevenue https://app.temporevenue.com/api/mcp --header "Authorization: Bearer your_api_key"
```

On claude.ai and ChatGPT, add TempoRevenue as a connector and sign in with OAuth instead of an API key.

## How it works

```
MCP client ──stdio──▶ @temporevenue/mcp ──HTTPS (Bearer key)──▶ app.temporevenue.com/api/mcp
```

- **Stateless proxy.** Each JSON-RPC message from stdin is POSTed to the TempoRevenue endpoint and the reply is written to stdout. The package keeps no state, writes nothing to disk and has no dependencies.
- **No telemetry.** The only network peer is the endpoint above (override with `TEMPOREVENUE_MCP_URL`).
- **Deterministic pricing.** On the server, the model extracts the scope; the price is computed in code from your rates and the hours, never by the model.
- **Your data.** What `create_proposal` sends is stored in your TempoRevenue account as the proposal draft, under the [Privacy Policy](https://app.temporevenue.com/privacidade). This package stores nothing locally.

## Environment

| Variable | Default | |
| --- | --- | --- |
| `TEMPOREVENUE_API_KEY` | none | Without it the server starts in demo mode. |
| `TEMPOREVENUE_MCP_URL` | `https://app.temporevenue.com/api/mcp` | Endpoint override. |

## Development

```bash
npm test
```

Requires Node.js 18.17 or later.

## Links

- [Developer docs](https://temporevenue.com/developers/)
- [OpenAPI spec](https://temporevenue.com/openapi.json)
- MCP Registry: `com.temporevenue/proposals`
- Support: contact@temporevenue.com

## License

MIT
