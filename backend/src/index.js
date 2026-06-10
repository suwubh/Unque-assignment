require('dotenv').config();

const http = require('http');
const express = require('express');
const { initSocket, publishLead, getIO } = require('./socket');
const webhookRouter = require('./webhook');

const app = express();

// Keep the raw body so we can check the webhook signature.
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'meta-leads-backend',
    connectedClients: getIO().engine.clientsCount,
  });
});

app.use('/webhook', webhookRouter);

// Fire a fake lead without going through Meta. Handy for testing the
// socket -> app path on its own: curl -X POST localhost:4000/dev/simulate
app.post('/dev/simulate', (req, res) => {
  const body = req.body || {};
  const lead = {
    id: `test_${Date.now()}`,
    createdTime: new Date().toISOString(),
    formId: 'dev_form',
    pageId: 'dev_page',
    fields: {
      full_name: body.name || 'Test Lead',
      email: body.email || 'test.lead@example.com',
      phone_number: body.phone || '+1 555 0100',
    },
    raw: { simulated: true },
  };
  publishLead(lead);
  res.json({ emitted: true, lead });
});

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[server] backend listening on http://localhost:${PORT}`);
});
