// Deterministic scope estimator used by `--demo`. No AI and no network: keyword
// rules pick the deliverables and base hours; all arithmetic (hours, risk buffer,
// total) happens here in integer cents. Same input, same output, every time.
// Identical copy lives in the TempoRevenue site (chat-to-SOW generator).

/** Known deliverables. `hours` is the base; pages add per unit. */
const RULES = [
  { id: "design", label: "UI/UX design and mockups", hours: 16, match: /\b(design|redesign|mock-?ups?|figma|wireframes?|branding|look and feel|ui|ux)\b/i },
  { id: "pages", label: "Page build-out", hours: 0, perPage: 4, match: /\b(pages?|landing|homepage|website|site)\b/i },
  { id: "store", label: "Store setup, catalog and checkout", hours: 20, match: /\b(e-?commerce|shopify|woocommerce|store|shop|checkout|cart|products?|catalog)\b/i },
  { id: "payments", label: "Payment integration", hours: 10, match: /\b(payments?|stripe|paypal|billing|subscriptions?|invoic\w*)\b/i },
  { id: "auth", label: "Authentication and user accounts", hours: 12, match: /\b(log-?ins?|sign-?in|auth\w*|user accounts?|roles?|permissions?|sso)\b/i },
  { id: "dashboard", label: "Admin dashboard", hours: 24, match: /\b(dashboard|admin|back-?office|portal|reports?)\b/i },
  { id: "api", label: "API integration", hours: 16, match: /\b(api|integrat\w*|webhooks?|sync\w*|crm|hubspot|salesforce|zapier|erp|quickbooks|airtable)\b/i },
  { id: "mobile", label: "Mobile app (iOS and Android)", hours: 60, match: /\b(ios|android|mobile app|app store|play store|react native|flutter)\b/i },
  { id: "data", label: "Database and data model", hours: 8, match: /\b(database|postgres\w*|mysql|data model|schema|supabase|firebase)\b/i },
  { id: "migration", label: "Data migration", hours: 10, match: /\b(migrat\w*|import (?:our|the|existing)|move (?:our|the) (?:data|site|store))\b/i },
  { id: "cms", label: "CMS and blog setup", hours: 8, match: /\b(cms|blog|wordpress|webflow|sanity|contentful)\b/i },
  { id: "seo", label: "SEO basics", hours: 6, match: /\b(seo|search engine|google ranking|meta tags)\b/i },
  { id: "email", label: "Email and notifications", hours: 6, match: /\b(emails?|notifications?|newsletter|mailchimp|sendgrid|sms)\b/i },
  { id: "analytics", label: "Analytics and tracking", hours: 6, match: /\b(analytics|tracking|pixel|ga4|mixpanel|metrics)\b/i },
  { id: "ai", label: "AI feature integration", hours: 20, match: /\b(ai|gpt|llm|chatbot|openai|claude|machine learning)\b/i },
];

const HARDER = /\b(complex|custom|enterprise|scal\w+|real-?time|multi-?tenant|high traffic|compliance|hipaa|gdpr)\b/i;
const SIMPLER = /\b(simple|small|minimal|one-?page|starter)\b/i;
const URGENT = /\b(asap|urgent|rush|this week|by friday|tight deadline)\b/i;

export const BUFFER_OPTIONS = [0.15, 0.2, 0.25];
export const DEFAULT_RATE = 100;
export const MAX_INPUT_CHARS = 6000;

/** Hours to one decimal place, without accumulating float error. */
const tenths = (value) => Math.round(value * 10) / 10;

function pageCount(text) {
  const found = text.match(/\b(\d{1,2})\s*(?:-|to)?\s*(?:\d{1,2}\s*)?(?:pages?|screens?)\b/i);
  if (found) return Math.min(Math.max(Number(found[1]), 1), 40);
  return /\b(landing|one-?page)\b/i.test(text) ? 1 : 5;
}

/**
 * @param {{ text: string, rate?: number, buffer?: number }} input
 */
export function estimateScope({ text, rate = DEFAULT_RATE, buffer = 0.2 }) {
  const source = String(text ?? "").slice(0, MAX_INPUT_CHARS);
  const safeRate = Number.isFinite(rate) && rate > 0 ? Math.min(Math.round(rate), 2000) : DEFAULT_RATE;
  const safeBuffer = BUFFER_OPTIONS.includes(buffer) ? buffer : 0.2;

  const signals = [];
  let multiplier = 1;
  if (HARDER.test(source)) {
    multiplier = 1.25;
    signals.push("Complexity keywords: +25% build hours");
  } else if (SIMPLER.test(source)) {
    multiplier = 0.85;
    signals.push("Simplicity keywords: -15% build hours");
  }

  const items = [];
  for (const rule of RULES) {
    if (!rule.match.test(source)) continue;
    // "site"/"pages" only gets its own line when there is no store or app (avoids double counting).
    if (rule.id === "pages" && (/\b(e-?commerce|shopify|store|mobile app)\b/i.test(source))) continue;
    const base = rule.perPage ? rule.perPage * pageCount(source) : rule.hours;
    items.push({ id: rule.id, label: rule.label, hours: tenths(base * multiplier) });
  }

  if (items.length === 0) {
    signals.push("No known deliverables found: generic build scope");
    items.push({ id: "build", label: "Implementation", hours: tenths(24 * multiplier) });
  }

  const build = items.reduce((sum, item) => sum + item.hours, 0);
  items.unshift({ id: "discovery", label: "Discovery and scoping", hours: tenths(Math.max(3, build * 0.08)) });
  items.push({ id: "qa", label: "Testing and QA", hours: tenths(Math.max(4, build * 0.12)) });
  items.push({ id: "launch", label: "Deployment and handoff", hours: 4 });

  if (URGENT.test(source)) signals.push("Urgency keywords: consider a rush fee");

  const subtotalHours = tenths(items.reduce((sum, item) => sum + item.hours, 0));
  const bufferHours = tenths(subtotalHours * safeBuffer);
  const totalHours = tenths(subtotalHours + bufferHours);
  // Integer cents: tenths of hours × integer rate, no floats in money.
  const totalCents = Math.round(totalHours * 10) * safeRate * 10;

  return {
    items,
    signals,
    rate: safeRate,
    buffer: safeBuffer,
    subtotalHours,
    bufferHours,
    totalHours,
    totalCents,
    total: totalCents / 100,
  };
}

const money = (value) => `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const hours = (value) => `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })} h`;

/** Brief text for the TempoRevenue composer (and the terminal in --demo). */
export function formatBrief({ clientName, text }, estimate) {
  const lines = [];
  if (clientName) lines.push(`Client: ${clientName}`, "");
  lines.push("Client message:", String(text ?? "").trim(), "");
  lines.push("Scope and hours:");
  for (const item of estimate.items) lines.push(`- ${item.label}: ${hours(item.hours)}`);
  lines.push(`- Scope risk buffer (${Math.round(estimate.buffer * 100)}%): ${hours(estimate.bufferHours)}`);
  lines.push("");
  lines.push(`Fixed price: ${money(estimate.total)} (${hours(estimate.totalHours)} at ${money(estimate.rate)}/h).`);
  return lines.join("\n");
}

export const SCENARIOS = [
  {
    id: "ecommerce",
    label: "E-commerce redesign",
    clientName: "Northwind Goods",
    text:
      "Hi! We sell handmade ceramics on an old Shopify theme and it looks dated. We'd love a redesign of the store, " +
      "a smoother checkout, and to sync orders with our QuickBooks. Around 8 pages plus product pages. " +
      "Also want basic SEO and an email signup for the newsletter. Hoping to launch before the holidays.",
  },
  {
    id: "saas",
    label: "SaaS MVP build",
    clientName: "Ledgerly",
    text:
      "We're a two-person startup building a simple tool for landlords to track rent. Need an MVP: sign up and login, " +
      "a dashboard showing payments per unit, Stripe subscriptions, email reminders for late rent, and a Postgres database. " +
      "Design can be clean and minimal. We want to demo it to investors in 6 weeks.",
  },
  {
    id: "api",
    label: "API integration",
    clientName: "Brightside Clinics",
    text:
      "Our booking system needs to push new appointments into HubSpot and send SMS confirmations. " +
      "We also need a webhook so cancellations sync back. It has to be HIPAA-aware since it touches patient names. " +
      "There's an existing REST API on our side with docs.",
  },
];
