export const config = { runtime: 'edge' };

const MAILTM_ORIGIN = 'https://api.mail.tm';

export default async function handler(request) {
  try {
    const requestUrl = new URL(request.url);
    const rawPath = requestUrl.searchParams.get('path') || '';
    const path = rawPath.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');
    const upstreamQuery = new URLSearchParams(requestUrl.search);
    upstreamQuery.delete('path');
    const target = `${MAILTM_ORIGIN}/${path}${upstreamQuery.toString() ? `?${upstreamQuery}` : ''}`;
    const headers = new Headers({ accept: 'application/json' });
    const authorization = request.headers.get('authorization');
    const contentType = request.headers.get('content-type');
    if (authorization) headers.set('authorization', authorization);
    if (contentType) headers.set('content-type', contentType);

    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
    });
    return new Response(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: {
        'cache-control': 'no-store',
        'content-type': upstream.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    return Response.json({ message: 'Mail service proxy unavailable', detail: error.message }, { status: 502 });
  }
}
