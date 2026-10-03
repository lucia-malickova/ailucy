// Prepojenie webu s AI Lucy na vlastnom hardvéri.
// Tajný kľúč ostáva tu na serveri, prehliadač návštevníka ho nikdy nevidí.
export const config = { runtime: 'edge', regions: ['fra1'] };

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let body;
  try { body = await req.json(); } catch { return new Response('Bad request', { status: 400 }); }

  const upstream = await fetch(`${process.env.MIA_URL}/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MIA_KEY}`,
      // IP sa použije len na ochranu pred zneužitím (limit otázok) a nikde sa neukladá
      'X-Visitor-IP': (req.headers.get('x-forwarded-for') || '').split(',')[0].trim(),
      // ukladá sa len kód krajiny (napr. SK), nie IP adresa
      'X-Visitor-Country': req.headers.get('x-vercel-ip-country') || '',
    },
    body: JSON.stringify({
      messages: Array.isArray(body.messages) ? body.messages.slice(-8) : [],
      lang: String(body.lang || 'sk').slice(0, 5),
      card: String(body.card || 'web').slice(0, 32),
      session: String(body.session || '').slice(0, 64),
    }),
  }).catch(() => null);

  if (!upstream || !upstream.ok) return new Response('MIA unavailable', { status: 503 });

  return new Response(upstream.body, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
