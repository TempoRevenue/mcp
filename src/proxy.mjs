// Live mode: a stateless stdio <-> Streamable HTTP bridge. Each JSON-RPC message
// read from stdin is POSTed to the TempoRevenue MCP endpoint with your API key,
// and the response (JSON or SSE) is written back to stdout. No telemetry, no
// disk writes, no other hosts: the only network peer is the endpoint below.

export const DEFAULT_ENDPOINT = "https://app.temporevenue.com/api/mcp";

/** Parses an SSE body into the JSON-RPC messages carried in its `data:` fields. */
export function parseSse(body) {
  const messages = [];
  for (const block of body.split(/\r?\n\r?\n/)) {
    const data = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).replace(/^ /, ""))
      .join("\n");
    if (data) messages.push(JSON.parse(data));
  }
  return messages;
}

export function createProxy({ apiKey, endpoint = DEFAULT_ENDPOINT, fetchImpl = globalThis.fetch, userAgent = "temporevenue-mcp" }) {
  let sessionId = null;
  let protocolVersion = null;

  /** Forwards one message; resolves to the list of messages to write back. */
  return async function forward(message) {
    const isRequest = message && typeof message === "object" && "id" in message && message.id !== null;
    const failure = (msg) => (isRequest ? [{ jsonrpc: "2.0", id: message.id, error: { code: -32603, message: msg } }] : []);

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "User-Agent": userAgent,
    };
    if (sessionId) headers["Mcp-Session-Id"] = sessionId;
    if (protocolVersion) headers["MCP-Protocol-Version"] = protocolVersion;

    let response;
    try {
      response = await fetchImpl(endpoint, { method: "POST", headers, body: JSON.stringify(message) });
    } catch (error) {
      return failure(`Could not reach TempoRevenue (${error?.cause?.code ?? error?.message ?? "network error"}).`);
    }

    sessionId = response.headers.get("mcp-session-id") ?? sessionId;
    const body = await response.text();

    if (response.status === 401) {
      return failure("TempoRevenue rejected the API key (401). Check TEMPOREVENUE_API_KEY or create a new key at https://app.temporevenue.com/en/integrations.");
    }
    if (response.status === 202 || body.trim() === "") return [];

    let messages;
    try {
      messages = (response.headers.get("content-type") ?? "").includes("text/event-stream") ? parseSse(body) : [JSON.parse(body)];
    } catch {
      return failure(`Unexpected response from TempoRevenue (HTTP ${response.status}).`);
    }

    // Plain HTTP errors (429, 403, 5xx) come back as {error:{code,message}}, not JSON-RPC.
    messages = messages.flatMap((item) => {
      if (item && item.jsonrpc === "2.0") return [item];
      const detail = item?.error?.message ?? `HTTP ${response.status}`;
      return failure(`TempoRevenue: ${detail}`);
    });

    for (const item of messages) {
      if (message.method === "initialize" && item.id === message.id && item.result?.protocolVersion) {
        protocolVersion = item.result.protocolVersion;
      }
    }
    return messages;
  };
}
