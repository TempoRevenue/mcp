# Docker MCP Catalog submission (prepared, not yet submitted)

Copy `temporevenue/` to `servers/temporevenue/` in a fork of https://github.com/docker/mcp-registry and open a PR.

- Remote server, Streamable HTTP, OAuth 2.1 with RFC 9728 discovery (same flow as claude.ai and ChatGPT).
- `tools.json` is `[]` because Docker discovers remote tools dynamically.
- Open question before submitting: whether Docker needs a registered OAuth provider named `temporevenue` on their side. Ask in the PR description.
