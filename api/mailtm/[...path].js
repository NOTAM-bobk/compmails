const MAILTM_ORIGIN = 'https://api.mail.tm';

module.exports = async function handler(req, res) {
  const pathParts = Array.isArray(req.query.path)
    ? req.query.path
    : req.query.path
      ? [req.query.path]
      : [];
  const path = pathParts.map((part) => encodeURIComponent(part)).join('/');
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined) query.append(key, item);
    }
  }

  const target = `${MAILTM_ORIGIN}/${path}${query.toString() ? `?${query}` : ''}`;
  const headers = {};
  if (req.headers.authorization) headers.authorization = req.headers.authorization;
  if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];
  headers.accept = 'application/json';

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    res.status(upstream.status);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    const body = await upstream.arrayBuffer();
    res.send(Buffer.from(body));
  } catch (error) {
    res.status(502).json({ message: 'Mail service proxy unavailable', detail: error.message });
  }
};
