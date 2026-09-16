const https = require('https');

function proxyRequest(target, options, body) {
  return new Promise((resolve, reject) => {
    const request = https.request(target, options, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode || 502, headers: response.headers, body: Buffer.concat(chunks) }));
    });
    request.on('error', reject);
    if (body) request.write(body);
    request.end();
  });
}

module.exports = async function handler(req, res) {
  try {
    const requestUrl = new URL(req.url || '/', 'https://vercel.local');
    const rawPath = requestUrl.searchParams.get('path') || '';
    const path = rawPath.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');
    const target = new URL(`https://api.mail.tm/${path}`);
    const incomingQuery = new URLSearchParams(requestUrl.search);
    incomingQuery.delete('path');
    target.search = incomingQuery.toString();

    const body = ['GET', 'HEAD'].includes(req.method) ? null : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));
    const headers = { accept: 'application/json' };
    if (req.headers && req.headers.authorization) headers.authorization = req.headers.authorization;
    if (body) {
      headers['content-type'] = req.headers['content-type'] || 'application/json';
      headers['content-length'] = Buffer.byteLength(body);
    }

    const result = await proxyRequest(target, { method: req.method || 'GET', headers }, body);
    res.status(result.status);
    res.setHeader('cache-control', 'no-store');
    res.setHeader('content-type', result.headers['content-type'] || 'application/json');
    res.send(result.body);
  } catch (error) {
    res.status(502).json({ message: 'Mail service proxy unavailable', detail: error.message });
  }
};
