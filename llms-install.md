# Installing the TempoRevenue MCP server

Instructions for an AI agent (Cline and similar) setting up this server for a user.

## What it is

A stdio MCP server, published on npm as `@temporevenue/mcp`. It needs Node.js 18.17 or later and no other dependency. It forwards MCP messages to `https://app.temporevenue.com/api/mcp` using the user's API key.

Tools:

- `create_proposal`: create a draft proposal from a short description of the client's request (client, scope, timeline, budget). Returns a link to review and send. Uses one proposal from the user's allowance.
- `get_proposal_status`: draft, viewed or accepted, with dates.
- `list_proposals`: the user's most recent proposals, optionally filtered by status.
- `get_credit_balance`: how many proposals the user can still create.

## Steps

1. Ask the user for their TempoRevenue API key. If they do not have one:
   - free account: https://app.temporevenue.com/en/login
   - create the key: https://app.temporevenue.com/en/integrations (shown once, copy it right away)
   If they only want to try it, skip the key: the server starts in demo mode (local estimate, nothing is created).
2. Add this to the MCP settings file (for Cline: `cline_mcp_settings.json`), replacing the key:

```json
{
  "mcpServers": {
    "temporevenue": {
      "command": "npx",
      "args": ["-y", "@temporevenue/mcp"],
      "env": {
        "TEMPOREVENUE_API_KEY": "the_user_api_key"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

3. Verify: list the tools. You should see the 4 tools above. With a key, call `get_credit_balance`; it returns `credits_remaining`.

## Notes

- Do not auto-approve `create_proposal`: it uses the user's allowance. The read tools are safe to auto-approve if the user wants.
- No telemetry and nothing written to disk. Source: https://github.com/TempoRevenue/mcp
- A 401 error means the key is wrong or revoked: create a new one on the Integrations page.
