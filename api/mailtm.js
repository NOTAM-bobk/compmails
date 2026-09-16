const MAILTM_ORIGIN = 'https://api.mail.tm';

module.exports = async function handler(req, res) {
  try {
    const requestUrl = new URL(req.url || '/', 'https://vercel.local');
    const rawPath = requestUrl.searchParams.get('path') || '';
    const path = rawPath.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');
    const upstreamQuery = new URLSearchParams(requestUrl.search);
    upstreamQuery.delete('path');
    const target = `${MAILTM_ORIGIN}/${path}${upstreamQuery.toString() ? `?${upstreamQuery}` : ''}`;
    const headers = { accept: 'application/json' };
    if (req.headers?.authorization) headers.authorization = req.headers.authorization;
    if (req.headers?.['content-type']) headers['content-type'] = req.headers['content-type'];

    const init = { method: req.method || 'GET', headers };
    if (!['GET', 'HEAD'].includes(init.method)) {
      init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    }

    const upstream = await fetch(target, init);
    res.status(upstream.status);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    res.status(502).json({ message: 'Mail service proxy unavailable', detail: error.message });
  }
};
