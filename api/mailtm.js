module.exports = async function handler(req, res) {
  try {
    const upstream = await fetch('https://api.mail.tm/domains');
    const body = await upstream.text();
    res.status(upstream.status).setHeader('content-type', 'application/json').send(body);
  } catch (error) {
    res.status(502).json({ error: String(error), stack: error && error.stack });
  }
};
