const express = require('express');
const { createServer, context, getServerPort, redis } = require('@devvit/web/server');
const app = express();
app.use(express.json({ limit: '64kb' }));
const key = () => {
  if (!context.userId) throw new Error('Authenticated user required');
  return `lightning-pong:save:${context.userId}`;
};
app.get('/api/save', async (_req, res) => {
  try { const raw = await redis.get(key()); res.json({ save: raw ? JSON.parse(raw) : null }); }
  catch (error) { res.status(401).json({ error: String(error.message ?? error) }); }
});
app.put('/api/save', async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return res.status(400).json({ error: 'Invalid save' });
    await redis.set(key(), JSON.stringify(req.body));
    res.json({ ok: true });
  } catch (error) { res.status(400).json({ error: String(error.message ?? error) }); }
});
app.delete('/api/save', async (_req, res) => {
  try { await redis.del(key()); res.json({ ok: true }); }
  catch (error) { res.status(400).json({ error: String(error.message ?? error) }); }
});
const server = createServer(app);
server.on('error', error => console.error(`server error: ${error.stack}`));
server.listen(getServerPort());

