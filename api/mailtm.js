const https = require('https');

module.exports = function handler(req, res) {
  const path = req.url && req.url.includes('path=/token') ? '/token' : '/domains';
  https.get({ hostname: 'api.mail.tm', path, headers: { accept: 'application/json' } }, (upstream) => {
    res.statusCode = upstream.statusCode || 502;
    res.setHeader('content-type', upstream.headers['content-type'] || 'application/json');
    upstream.pipe(res);
  }).on('error', (error) => {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: error.message }));
  });
};
