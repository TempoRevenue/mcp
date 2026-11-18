---
name: quote-from-conversation
description: Turn a client conversation, call notes or a project brief into a contract draft in TempoRevenue (service agreement, statement of work, master services agreement or change order). Use when the user asks to quote, price, estimate or write a contract, proposal or statement of work for a client.
---

# Quote from a conversation

Use the TempoRevenue MCP server (`create_contract`) to turn what the client asked for into a contract draft the user reviews before publishing it for the client to sign.

## Steps

1. **Find the request.** Use the text the user pasted, the client message, or the call notes in this conversation. If there is no client request yet, ask for it in one short question.
2. **Write a short brief**, not the full chat history:
   - client name (if known)
   - what they want built or done, as a list of deliverables
   - timeline or deadline
   - budget or price, only if the client or the user stated one
   - anything explicitly out of scope
3. **Confirm before creating.** Show the brief and say that creating it counts toward the user's TempoRevenue draft limit (it does not use a credit). Wait for a yes.
4. **Call `create_contract`** with `deal_description` set to the brief, `client_name` if known, `language` only if the user asked for a specific language (`en`, `pt`, `es` or `de`), and `contract_type` only when it is clear (`statement_of_work` under an existing master agreement, `master_services_agreement` for ongoing work; default `service_agreement`). For extra work on a contract already agreed, use `create_change_order` instead.
5. **Return the editor link** from the result and remind the user that nothing reaches the client until they review and publish it.

## Rules

- Never invent a price. If no price was stated, leave it out: TempoRevenue calculates it from the user's rate and the estimated hours.
- Never put secrets, credentials or unrelated private data in the brief.
- To check a contract later, use `get_contract_status` with its id, or `list_contracts`.
- If the tool says the draft limit is reached, tell the user to check their TempoRevenue account. Do not suggest a purchase.
- Without `TEMPOREVENUE_API_KEY` the server runs in demo mode: the result is a local estimate and nothing is created. Say so plainly and point to https://app.temporevenue.com/en/integrations to create a key.
