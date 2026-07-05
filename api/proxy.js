export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get('url');

  if (!target) {
    return new Response('Faltou o parametro ?url=', { status: 400 });
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch (e) {
    return new Response('URL invalida', { status: 400 });
  }

  const range = req.headers.get('range');
  const upstreamHeaders = {};
  if (range) upstreamHeaders['Range'] = range;

  try {
    const upstream = await fetch(targetUrl.toString(), {
      headers: upstreamHeaders,
      redirect: 'follow'
    });

    const headers = new Headers();
    // repassa apenas os headers relevantes para video streaming
    const passthrough = [
      'content-type', 'content-length', 'content-range',
      'accept-ranges', 'cache-control', 'etag', 'last-modified'
    ];
    passthrough.forEach((h) => {
      const v = upstream.headers.get(h);
      if (v) headers.set(h, v);
    });
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Headers', 'Range');

    return new Response(upstream.body, {
      status: upstream.status,
      headers
    });
  } catch (err) {
    return new Response('Erro no proxy: ' + err.message, { status: 502 });
  }
}
