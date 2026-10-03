// Zaznamená anonymnú udalosť (otvorenie stránky, uloženie vizitky, LinkedIn).
export const config = { runtime: 'edge', regions: ['fra1'] };

const ALLOWED = ['open', 'vcard', 'linkedin', 'link'];
// automatické prehliadače (náhľady Vercelu, vyhľadávače, testy) sa nepočítajú
const BOTS = /bot|crawl|spider|headless|lighthouse|vercel|preview|monitor/i;

export default async function handler(req) {
  if (req.method !== 'POST') return new Response(null, { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response(null, { status: 400 }); }
  if (!ALLOWED.includes(body.type)) return new Response(null, { status: 400 });
  if (BOTS.test(req.headers.get('user-agent') || '')) return new Response(null, { status: 204 });

  await fetch(`${process.env.MIA_URL}/v1/event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MIA_KEY}`,
      'X-Visitor-IP': (req.headers.get('x-forwarded-for') || '').split(',')[0].trim(),
      'X-Visitor-Country': req.headers.get('x-vercel-ip-country') || '',
    },
    body: JSON.stringify({
      type: body.type,
      card: String(body.card || 'web').slice(0, 32),
      session: String(body.session || '').slice(0, 64),
    }),
  }).catch(() => null);   // analytika nikdy nesmie pokaziť stránku

  return new Response(null, { status: 204 });
}
