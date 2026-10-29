---
name: quote-from-conversation
description: Turn a client conversation, call notes or a project brief into a priced proposal draft in TempoRevenue. Use when the user asks to quote, price, estimate or write a proposal or statement of work for a client.
---

# Quote from a conversation

Use the TempoRevenue MCP server (`create_proposal`) to turn what the client asked for into a proposal draft the user reviews before sending.

## Steps

1. **Find the request.** Use the text the user pasted, the client message, or the call notes in this conversation. If there is no client request yet, ask for it in one short question.
2. **Write a short brief**, not the full chat history:
   - client name (if known)
   - what they want built or done, as a list of deliverables
   - timeline or deadline
   - budget or price, only if the client or the user stated one
   - anything explicitly out of scope
3. **Confirm before creating.** Show the brief and say that creating it uses one proposal from the user's allowance. Wait for a yes.
4. **Call `create_proposal`** with `deal_description` set to the brief, `client_name` if known, and `language` only if the user asked for a specific language (`en`, `pt`, `es` or `de`).
5. **Return the editor link** from the result and remind the user that nothing is sent to the client until they review and send it.

## Rules

- Never invent a price. If no price was stated, leave it out: TempoRevenue calculates it from the user's rate and the estimated hours.
- Never put secrets, credentials or unrelated private data in the brief.
- To check a proposal later, use `get_proposal_status` with its id, or `list_proposals`.
- If the tool says the allowance is used up, call `get_credit_balance` and tell the user.
- Without `TEMPOREVENUE_API_KEY` the server runs in demo mode: the result is a local estimate and nothing is created. Say so plainly and point to https://app.temporevenue.com/en/integrations to create a key.
