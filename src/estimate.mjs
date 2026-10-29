// Deterministic scope estimator used by `--demo` and the TempoRevenue web
// generator (en, pt, es, de). No AI and no network: keyword rules pick the
// deliverables and base hours; all arithmetic (hours, risk buffer, total)
// happens here in integer cents. Same input, same output, every time.
// Identical copy lives in the TempoRevenue site (chat-to-SOW generator).

export const LOCALES = ["en", "pt", "es", "de"];

/** Generator currency and default rate per language (the user can change the rate). */
export const LOCALE_SETTINGS = {
  en: { intl: "en-US", currency: "USD", rate: 100 },
  pt: { intl: "pt-BR", currency: "BRL", rate: 100 },
  es: { intl: "es-ES", currency: "EUR", rate: 50 },
  de: { intl: "de-DE", currency: "EUR", rate: 80 },
};

/** Known deliverables. `hours` is the base; pages add per unit. */
export const RULES = [
  {
    id: "design",
    hours: 16,
    label: { en: "UI/UX design and mockups", pt: "Design de interface e protótipos", es: "Diseño de interfaz y maquetas", de: "UI/UX-Design und Entwürfe" },
    match: /\b(design|redesign|mock-?ups?|figma|wireframes?|branding|look and feel|ui|ux|layout|visual|protótipos?|diseño|rediseño|maquetas?|entwürfe?|gestaltung|neugestaltung)\b/i,
  },
  {
    id: "pages",
    hours: 0,
    perPage: 4,
    label: { en: "Page build-out", pt: "Construção das páginas", es: "Construcción de páginas", de: "Umsetzung der Seiten" },
    match: /\b(pages?|landing|homepage|website|site|páginas?|sitio|sitio web|seiten?|webseite|startseite|landingpage)\b/i,
  },
  {
    id: "store",
    hours: 20,
    label: { en: "Store setup, catalog and checkout", pt: "Loja, catálogo e checkout", es: "Tienda, catálogo y checkout", de: "Shop, Katalog und Checkout" },
    match: /\b(e-?commerce|shopify|woocommerce|store|shop|checkout|cart|products?|catalog|loja|carrinho|produtos?|catálogo|tienda|carrito|productos?|warenkorb|produkte?|katalog|onlineshop)\b/i,
  },
  {
    id: "payments",
    hours: 10,
    label: { en: "Payment integration", pt: "Integração de pagamentos", es: "Integración de pagos", de: "Zahlungsintegration" },
    match: /\b(payments?|stripe|paypal|billing|subscriptions?|invoic\w*|pagamentos?|pix|assinaturas?|cobrança|pagos?|suscripci\w+|facturaci\w+|zahlung\w*|abonnements?|rechnung\w*)\b/i,
  },
  {
    id: "auth",
    hours: 12,
    label: { en: "Authentication and user accounts", pt: "Login e contas de usuário", es: "Inicio de sesión y cuentas", de: "Login und Benutzerkonten" },
    match: /\b(log-?ins?|sign-?in|auth\w*|user accounts?|roles?|permissions?|sso|contas? de usuário|permiss\w+|inicio de sesión|registro de usuarios|cuentas? de usuario|registrierung|benutzerkonten?|rollen|berechtigungen)\b/i,
  },
  {
    id: "dashboard",
    hours: 24,
    label: { en: "Admin dashboard", pt: "Painel administrativo", es: "Panel de administración", de: "Admin-Dashboard" },
    match: /\b(dashboard|admin|back-?office|portal|reports?|painel|relatórios?|panel|informes?|berichte?|verwaltung)\b/i,
  },
  {
    id: "api",
    hours: 16,
    label: { en: "API integration", pt: "Integração via API", es: "Integración por API", de: "API-Integration" },
    match: /\b(api|integrat\w*|webhooks?|sync\w*|crm|hubspot|salesforce|zapier|erp|quickbooks|airtable|integra\w*|sincroniz\w*|schnittstelle\w*|synchronis\w*)\b/i,
  },
  {
    id: "mobile",
    hours: 60,
    label: { en: "Mobile app (iOS and Android)", pt: "App mobile (iOS e Android)", es: "App móvil (iOS y Android)", de: "Mobile App (iOS und Android)" },
    match: /\b(ios|android|mobile app|app store|play store|react native|flutter|aplicativo|app móvil|aplicación móvil|handy-?app)\b/i,
  },
  {
    id: "data",
    hours: 8,
    label: { en: "Database and data model", pt: "Banco de dados e modelo de dados", es: "Base de datos y modelo de datos", de: "Datenbank und Datenmodell" },
    match: /\b(database|postgres\w*|mysql|data model|schema|supabase|firebase|banco de dados|base de datos|datenbank)\b/i,
  },
  {
    id: "migration",
    hours: 10,
    label: { en: "Data migration", pt: "Migração de dados", es: "Migración de datos", de: "Datenmigration" },
    match: /\b(migrat\w*|migra\w*|import (?:our|the|existing)|move (?:our|the) (?:data|site|store)|umzug)\b/i,
  },
  {
    id: "cms",
    hours: 8,
    label: { en: "CMS and blog setup", pt: "CMS e blog", es: "CMS y blog", de: "CMS und Blog" },
    match: /\b(cms|blog|wordpress|webflow|sanity|contentful)\b/i,
  },
  {
    id: "seo",
    hours: 6,
    label: { en: "SEO basics", pt: "SEO básico", es: "SEO básico", de: "SEO-Grundlagen" },
    match: /\b(seo|search engine|google ranking|meta tags)\b/i,
  },
  {
    id: "email",
    hours: 6,
    label: { en: "Email and notifications", pt: "E-mails e notificações", es: "Correos y notificaciones", de: "E-Mails und Benachrichtigungen" },
    match: /\b(e-?mails?|notifications?|newsletter|mailchimp|sendgrid|sms|whatsapp|notifica\w+|correos?|benachrichtigung\w*)\b/i,
  },
  {
    id: "analytics",
    hours: 6,
    label: { en: "Analytics and tracking", pt: "Métricas e rastreamento", es: "Analítica y seguimiento", de: "Analyse und Tracking" },
    match: /\b(analytics|tracking|pixel|ga4|mixpanel|metrics|métricas|analítica|seguimiento|auswertung)\b/i,
  },
  {
    id: "ai",
    hours: 20,
    label: { en: "AI feature integration", pt: "Recurso com IA", es: "Función con IA", de: "KI-Funktion" },
    match: /\b(ai|gpt|llm|chatbot|openai|claude|machine learning|ia|inteligência artificial|inteligencia artificial|ki|künstliche intelligenz)\b/i,
  },
];

const FIXED = {
  discovery: { en: "Discovery and scoping", pt: "Descoberta e escopo", es: "Descubrimiento y alcance", de: "Analyse und Umfang" },
  build: { en: "Implementation", pt: "Implementação", es: "Implementación", de: "Umsetzung" },
  qa: { en: "Testing and QA", pt: "Testes e QA", es: "Pruebas y QA", de: "Tests und QA" },
  launch: { en: "Deployment and handoff", pt: "Publicação e entrega", es: "Publicación y entrega", de: "Livegang und Übergabe" },
};

const SIGNALS = {
  harder: { en: "Complexity keywords: +25% build hours", pt: "Sinais de complexidade: +25% nas horas", es: "Señales de complejidad: +25% de horas", de: "Hinweise auf Komplexität: +25 % Stunden" },
  simpler: { en: "Simplicity keywords: -15% build hours", pt: "Sinais de simplicidade: -15% nas horas", es: "Señales de simplicidad: -15% de horas", de: "Hinweise auf Einfachheit: -15 % Stunden" },
  generic: { en: "No known deliverables found: generic build scope", pt: "Nenhuma entrega conhecida: escopo genérico", es: "Sin entregas conocidas: alcance genérico", de: "Keine bekannten Leistungen: allgemeiner Umfang" },
  urgent: { en: "Urgency keywords: consider a rush fee", pt: "Sinais de urgência: considere uma taxa de urgência", es: "Señales de urgencia: considera un recargo", de: "Hinweise auf Eile: plane einen Eilzuschlag ein" },
};

const HARDER = /\b(complex\w*|custom|enterprise|scal\w+|real-?time|multi-?tenant|high traffic|compliance|hipaa|gdpr|lgpd|rgpd|dsgvo|personaliza\w*|escal\w+|tempo real|tiempo real|komplex\w*|individuell\w*|echtzeit)\b/i;
const SIMPLER = /\b(simple|small|minimal|one-?page|starter|simples|pequen\w+|sencill\w+|einfach\w*|klein\w*)\b/i;
const URGENT = /\b(asap|urgent\w*|rush|this week|by friday|tight deadline|urgente|essa semana|esta semana|dringend|eilig|diese woche)\b/i;

export const BUFFER_OPTIONS = [0.15, 0.2, 0.25];
export const DEFAULT_RATE = 100;
export const MAX_INPUT_CHARS = 6000;

/** Hours to one decimal place, without accumulating float error. */
const tenths = (value) => Math.round(value * 10) / 10;
const pick = (labels, locale) => labels[locale] ?? labels.en;
const localeOf = (locale) => (LOCALES.includes(locale) ? locale : "en");

function pageCount(text) {
  const found = text.match(/\b(\d{1,2})\s*(?:-|to|a|bis)?\s*(?:\d{1,2}\s*)?(?:pages?|screens?|páginas?|telas?|pantallas?|seiten?)\b/i);
  if (found) return Math.min(Math.max(Number(found[1]), 1), 40);
  return /\b(landing|one-?page|landingpage)\b/i.test(text) ? 1 : 5;
}

/**
 * @param {{ text: string, rate?: number, buffer?: number, locale?: string }} input
 */
export function estimateScope({ text, rate = DEFAULT_RATE, buffer = 0.2, locale = "en" }) {
  const lang = localeOf(locale);
  const source = String(text ?? "").slice(0, MAX_INPUT_CHARS);
  const safeRate = Number.isFinite(rate) && rate > 0 ? Math.min(Math.round(rate), 2000) : DEFAULT_RATE;
  const safeBuffer = BUFFER_OPTIONS.includes(buffer) ? buffer : 0.2;

  const signals = [];
  let multiplier = 1;
  if (HARDER.test(source)) {
    multiplier = 1.25;
    signals.push(pick(SIGNALS.harder, lang));
  } else if (SIMPLER.test(source)) {
    multiplier = 0.85;
    signals.push(pick(SIGNALS.simpler, lang));
  }

  const items = [];
  for (const rule of RULES) {
    if (!rule.match.test(source)) continue;
    // "site"/"pages" only gets its own line when there is no store or app (avoids double counting).
    if (rule.id === "pages" && /\b(e-?commerce|shopify|store|mobile app|loja|tienda|onlineshop|shop|aplicativo|app móvil)\b/i.test(source)) continue;
    const base = rule.perPage ? rule.perPage * pageCount(source) : rule.hours;
    items.push({ id: rule.id, label: pick(rule.label, lang), hours: tenths(base * multiplier) });
  }

  if (items.length === 0) {
    signals.push(pick(SIGNALS.generic, lang));
    items.push({ id: "build", label: pick(FIXED.build, lang), hours: tenths(24 * multiplier) });
  }

  const build = items.reduce((sum, item) => sum + item.hours, 0);
  items.unshift({ id: "discovery", label: pick(FIXED.discovery, lang), hours: tenths(Math.max(3, build * 0.08)) });
  items.push({ id: "qa", label: pick(FIXED.qa, lang), hours: tenths(Math.max(4, build * 0.12)) });
  items.push({ id: "launch", label: pick(FIXED.launch, lang), hours: 4 });

  if (URGENT.test(source)) signals.push(pick(SIGNALS.urgent, lang));

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

/** Money without cents in the language's format, with a plain space (the app does not read non-breaking spaces). */
export function formatMoney(value, locale = "en") {
  const { intl, currency } = LOCALE_SETTINGS[localeOf(locale)];
  return new Intl.NumberFormat(intl, { style: "currency", currency, maximumFractionDigits: 0, minimumFractionDigits: 0 })
    .format(value)
    .replace(/[  ]/g, " ");
}

export function formatHours(value, locale = "en") {
  return `${value.toLocaleString(LOCALE_SETTINGS[localeOf(locale)].intl, { maximumFractionDigits: 1 })} h`;
}

const BRIEF = {
  en: { client: "Client", message: "Client message", scope: "Scope and hours", buffer: "Scope risk buffer", price: (t, h, r) => `Fixed price: ${t} (${h} at ${r}/h).` },
  pt: { client: "Cliente", message: "Mensagem do cliente", scope: "Escopo e horas", buffer: "Margem de risco do escopo", price: (t, h, r) => `Preço fixo: ${t} (${h} a ${r}/h).` },
  es: { client: "Cliente", message: "Mensaje del cliente", scope: "Alcance y horas", buffer: "Margen de riesgo del alcance", price: (t, h, r) => `Precio fijo: ${t} (${h} a ${r}/h).` },
  de: { client: "Kunde", message: "Nachricht des Kunden", scope: "Umfang und Stunden", buffer: "Risikopuffer für den Umfang", price: (t, h, r) => `Festpreis: ${t} (${h} zu ${r}/h).` },
};

/** Brief text for the TempoRevenue composer (and the terminal in --demo). */
export function formatBrief({ clientName, text }, estimate, locale = "en") {
  const lang = localeOf(locale);
  const t = BRIEF[lang];
  const lines = [];
  if (clientName) lines.push(`${t.client}: ${clientName}`, "");
  lines.push(`${t.message}:`, String(text ?? "").trim(), "");
  lines.push(`${t.scope}:`);
  for (const item of estimate.items) lines.push(`- ${item.label}: ${formatHours(item.hours, lang)}`);
  lines.push(`- ${t.buffer} (${Math.round(estimate.buffer * 100)}%): ${formatHours(estimate.bufferHours, lang)}`);
  lines.push("");
  lines.push(t.price(formatMoney(estimate.total, lang), formatHours(estimate.totalHours, lang), formatMoney(estimate.rate, lang)));
  return lines.join("\n");
}

export const SCENARIOS_BY_LOCALE = {
  en: [
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
  ],
  pt: [
    {
      id: "ecommerce",
      label: "Nova loja virtual",
      clientName: "Casa Aurora",
      text:
        "Oi! Vendemos cerâmica artesanal numa loja Shopify antiga e o visual está datado. Queremos um redesign da loja, " +
        "um checkout mais fácil e integrar os pedidos com o nosso ERP. São umas 8 páginas mais as páginas de produto. " +
        "Também queremos SEO básico e cadastro de e-mail para a newsletter. A ideia é lançar antes do Natal.",
    },
    {
      id: "saas",
      label: "MVP de SaaS",
      clientName: "Aluguel Fácil",
      text:
        "Somos uma startup de duas pessoas criando uma ferramenta simples para proprietários controlarem aluguéis. Precisamos de um MVP: " +
        "cadastro e login, um painel com os pagamentos por imóvel, assinaturas com Stripe, lembretes por e-mail de aluguel atrasado " +
        "e um banco de dados Postgres. O design pode ser limpo e minimalista. Queremos apresentar aos investidores em 6 semanas.",
    },
    {
      id: "api",
      label: "Integração via API",
      clientName: "Clínica Bem Viver",
      text:
        "Nosso sistema de agendamento precisa enviar as novas consultas para o HubSpot e mandar confirmação por WhatsApp. " +
        "Também precisamos de um webhook para os cancelamentos voltarem sincronizados. Tem que respeitar a LGPD porque envolve " +
        "nomes de pacientes. Já temos uma API REST documentada.",
    },
  ],
  es: [
    {
      id: "ecommerce",
      label: "Rediseño de tienda online",
      clientName: "Taller Alba",
      text:
        "¡Hola! Vendemos cerámica artesanal en una tienda Shopify antigua y se ve anticuada. Queremos un rediseño de la tienda, " +
        "un checkout más ágil y sincronizar los pedidos con nuestro ERP. Son unas 8 páginas más las páginas de producto. " +
        "También queremos SEO básico y registro de correo para la newsletter. Nos gustaría lanzar antes de Navidad.",
    },
    {
      id: "saas",
      label: "MVP de SaaS",
      clientName: "Alquila Bien",
      text:
        "Somos una startup de dos personas creando una herramienta sencilla para que los propietarios controlen los alquileres. Necesitamos un MVP: " +
        "registro e inicio de sesión, un panel con los pagos por vivienda, suscripciones con Stripe, recordatorios por correo de " +
        "alquileres atrasados y una base de datos Postgres. El diseño puede ser limpio y minimalista. Queremos enseñarlo a inversores en 6 semanas.",
    },
    {
      id: "api",
      label: "Integración por API",
      clientName: "Clínica Sonrisa",
      text:
        "Nuestro sistema de citas tiene que enviar las nuevas citas a HubSpot y mandar confirmaciones por SMS. " +
        "También necesitamos un webhook para que las cancelaciones se sincronicen de vuelta. Debe cumplir el RGPD porque " +
        "maneja nombres de pacientes. Ya tenemos una API REST documentada.",
    },
  ],
  de: [
    {
      id: "ecommerce",
      label: "Onlineshop neu gestalten",
      clientName: "Töpferei Lind",
      text:
        "Hallo! Wir verkaufen handgemachte Keramik in einem alten Shopify-Shop, der veraltet aussieht. Wir wünschen uns eine " +
        "Neugestaltung des Shops, einen flüssigeren Checkout und die Synchronisation der Bestellungen mit unserem ERP. Etwa 8 Seiten " +
        "plus Produktseiten. Dazu SEO-Grundlagen und eine Newsletter-Anmeldung per E-Mail. Start vor Weihnachten wäre ideal.",
    },
    {
      id: "saas",
      label: "SaaS-MVP",
      clientName: "Mietfuchs",
      text:
        "Wir sind ein Startup mit zwei Leuten und bauen ein einfaches Tool, mit dem Vermieter ihre Mieteingänge verfolgen. Wir brauchen ein MVP: " +
        "Registrierung und Anmeldung, ein Dashboard mit den Zahlungen pro Wohnung, Abonnements über Stripe, E-Mail-Erinnerungen bei " +
        "verspäteter Miete und eine Postgres-Datenbank. Das Design darf schlicht sein. Wir wollen es in 6 Wochen Investoren zeigen.",
    },
    {
      id: "api",
      label: "API-Integration",
      clientName: "Praxis am Park",
      text:
        "Unser Buchungssystem soll neue Termine an HubSpot übertragen und Bestätigungen per SMS verschicken. Außerdem brauchen wir " +
        "einen Webhook, damit Absagen zurück synchronisiert werden. Es muss DSGVO-konform sein, weil Namen von Patienten verarbeitet " +
        "werden. Eine dokumentierte REST-API gibt es bereits.",
    },
  ],
};

/** English samples (used by --demo). */
export const SCENARIOS = SCENARIOS_BY_LOCALE.en;
