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
| `calculate_sow_pricing` | Itemized estimate from a client message: deliverables, hours, a 15/20/25% buffer and a fixed price, plus a link that opens it in the web calculator. Runs locally in this package, read-only, no account needed. |
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

### Claude Code plugin

Adds the server plus a `/quote` command and a skill that turns the conversation into a proposal brief:

```bash
claude plugin marketplace add TempoRevenue/mcp
claude plugin install temporevenue@temporevenue
```

Set `TEMPOREVENUE_API_KEY` in your environment first; without it the plugin runs in demo mode.

### VS Code

One click. VS Code asks for your API key in a password field (leave it empty to try demo mode):

- [Install in VS Code](https://insiders.vscode.dev/redirect/mcp/install?name=temporevenue&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22temporevenue_api_key%22%2C%22description%22%3A%22TempoRevenue+API+key+%28leave+empty+to+try+demo+mode%29%22%2C%22password%22%3Atrue%7D%5D&config=%7B%22type%22%3A%22stdio%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40temporevenue%2Fmcp%22%5D%2C%22env%22%3A%7B%22TEMPOREVENUE_API_KEY%22%3A%22%24%7Binput%3Atemporevenue_api_key%7D%22%7D%7D)
- [Install in VS Code Insiders](https://insiders.vscode.dev/redirect/mcp/install?name=temporevenue&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22temporevenue_api_key%22%2C%22description%22%3A%22TempoRevenue+API+key+%28leave+empty+to+try+demo+mode%29%22%2C%22password%22%3Atrue%7D%5D&config=%7B%22type%22%3A%22stdio%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40temporevenue%2Fmcp%22%5D%2C%22env%22%3A%7B%22TEMPOREVENUE_API_KEY%22%3A%22%24%7Binput%3Atemporevenue_api_key%7D%22%7D%7D&quality=insiders)

### Cline

Ask Cline to install the server from this repository. It follows [llms-install.md](llms-install.md).

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

## Prompts and resources

Besides the tools, the package serves MCP prompts and resources locally (in demo and live mode, no account):

- `quote-client-message`: turns a client message into a brief and creates the draft after you confirm.
- `check-pending-proposals`: lists proposals the client opened but has not accepted, so you know who to follow up.
- `scope-repo-to-proposal`: reads the current project, lists the remaining deliverables, prices them with `calculate_sow_pricing` and drafts the proposal after you confirm.
- Resource `temporevenue://reference/estimator-defaults` (JSON): base hours per deliverable and the pricing formula.
- Resource `temporevenue://templates/sow-clauses` (Markdown): scope, change request, revision, payment and ownership clauses.

## Templates and rules

- [benchmarks/](benchmarks/): hours by deliverable as CSV and Markdown (TempoRevenue defaults, not market averages), each row linked to the calculator.
- [templates/](templates/): five free statement of work templates (web app MVP, website redesign, API integration, e-commerce build, monthly retainer).
- [.cursor/rules/client-scoping.mdc](.cursor/rules/client-scoping.mdc): a Cursor rule that turns a pasted client request into a brief and calls `create_proposal`.

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

### Releasing

One tag publishes to npm (with provenance) and to the official MCP Registry, then creates the GitHub release:

```bash
node scripts/version.mjs 1.2.0
git commit -am "Release 1.2.0"
git tag v1.2.0
git push origin main v1.2.0
```

The workflow refuses to run if any manifest disagrees with the tag. The registry only accepts a version once, so always pick a new number.

Requires Node.js 18.17 or later.

## Links

- [Developer docs](https://temporevenue.com/developers/)
- [OpenAPI spec](https://temporevenue.com/openapi.json)
- MCP Registry: `com.temporevenue/proposals`
- Support: contact@temporevenue.com

## License

MIT
