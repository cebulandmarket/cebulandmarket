/**
 * CebuLandMarket — Telegram notification Worker (the "Secrets Broker").
 *
 * SECURITY BOUNDARY: the website (untrusted, public source) never holds the
 * bot token. It only knows this Worker's URL. The token + chat ID live as
 * encrypted Cloudflare secrets and are attached HERE, at the boundary, when
 * forwarding to Telegram. If the site is defaced or the request is forged,
 * there is no secret in the browser to steal.
 *
 * Set secrets with:
 *   npx wrangler secret put BOT_TOKEN
 *   npx wrangler secret put CHAT_ID
 */

const ALLOWED_ORIGIN = 'https://cebulandmarket.com';

// Only these fields are ever forwarded. Anything else a submitter injects
// into the form is ignored (least-data egress).
const FIELDS = [
  ['reference_id', 'Ref'],
  ['owner_name', 'Name'],
  ['contact_number', 'Phone'],
  ['email', 'Email'],
  ['property_title', 'Property'],
  ['property_type', 'Type'],
  ['location', 'Location'],
  ['lot_area', 'Lot area (sqm)'],
  ['total_price', 'Asking price'],
  ['fee_option', 'Fee option'],
];

const MAX_FIELD_LEN = 300;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// Telegram form input is attacker-controllable text. We send as PLAIN TEXT
// (no parse_mode), so injected Markdown/HTML cannot render fake links or
// formatting. We also strip control chars and cap length.
function clean(value) {
  return String(value == null ? '' : value)
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .trim()
    .slice(0, MAX_FIELD_LEN);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders() });
    }
    if (request.headers.get('Origin') !== ALLOWED_ORIGIN) {
      return new Response('Forbidden', { status: 403, headers: corsHeaders() });
    }

    let form;
    try {
      form = await request.formData();
    } catch (e) {
      return new Response('Bad Request', { status: 400, headers: corsHeaders() });
    }

    const lines = ['New CebuLandMarket listing submission', ''];
    for (const [key, label] of FIELDS) {
      const v = clean(form.get(key));
      if (v) lines.push(label + ': ' + v);
    }
    const text = lines.join('\n').slice(0, 3500);

    const tgUrl = 'https://api.telegram.org/bot' + env.BOT_TOKEN + '/sendMessage';
    const tgResp = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.CHAT_ID,
        text: text,
        disable_web_page_preview: true,
      }),
    });

    // Observability: one audit line per request, no secrets logged.
    console.log(JSON.stringify({
      ok: tgResp.ok,
      status: tgResp.status,
      ref: clean(form.get('reference_id')),
      ts: new Date().toISOString(),
    }));

    if (!tgResp.ok) {
      return new Response('Notify failed', { status: 502, headers: corsHeaders() });
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    });
  },
};
