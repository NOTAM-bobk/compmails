const https = require('https');

module.exports = function handler(req, res) {
  const queryPath = req.query && req.query.path ? req.query.path : '/domains';
  const path = String(queryPath).replace(/^\/+/, '');
  const targetPath = `/${path}`;
  const headers = { accept: 'application/json' };
  if (req.headers && req.headers.authorization) headers.authorization = req.headers.authorization;
  if (req.headers && req.headers['content-type']) headers['content-type'] = req.headers['content-type'];

  const upstream = https.request({
    hostname: 'api.mail.tm',
    path: targetPath,
    method: req.method || 'GET',
    headers,
  }, (upstreamRes) => {
    res.statusCode = upstreamRes.statusCode || 502;
    res.setHeader('cache-control', 'no-store');
    res.setHeader('content-type', upstreamRes.headers['content-type'] || 'application/json');
    upstreamRes.pipe(res);
  });

  upstream.on('error', (error) => {
    if (!res.headersSent) res.statusCode = 502;
    res.end(JSON.stringify({ message: 'Mail service proxy unavailable', detail: error.message }));
  });

  if (req.method === 'GET' || req.method === 'HEAD') {
    upstream.end();
  } else {
    req.pipe(upstream);
  }
};
