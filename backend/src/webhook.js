const crypto = require('crypto');
const express = require('express');
const { fetchLead, normalizeLead } = require('./graph');
const { getIO } = require('./socket');

const router = express.Router();

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;

// Meta signs the body with the app secret. I only check it when it's turned on,
// otherwise a wrong secret would quietly drop every webhook during a demo.
// Needs req.rawBody (set in index.js).
function isValidSignature(req) {
  if (process.env.VERIFY_SIGNATURE !== 'true') return true;

  const signature = req.get('x-hub-signature-256');
  const secret = process.env.META_APP_SECRET;
  if (!signature || !secret || !req.rawBody) return false;

  const expected =
    'sha256=' + crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// The verification handshake Meta does when you set the webhook up.
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

router.post('/', async (req, res) => {
  if (!isValidSignature(req)) {
    console.warn('[webhook] rejected: bad signature');
    return res.sendStatus(401);
  }

  // Ack first. Meta retries if you're slow, and the Graph lookup below doesn't
  // need to hold up the 200.
  res.sendStatus(200);

  const body = req.body || {};
  if (body.object !== 'page') return;

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'leadgen') continue;
      await handleLead(change.value, entry.id);
    }
  }
});

async function handleLead(value, pageId) {
  const leadgenId = value.leadgen_id;

  let lead;
  try {
    const raw = await fetchLead(leadgenId, process.env.PAGE_ACCESS_TOKEN);
    lead = normalizeLead(raw, { formId: value.form_id, pageId });
  } catch (err) {
    // If the token or permission is off the lookup throws. Fall back to the
    // little the webhook gave us so the lead still shows up.
    console.error(
      '[webhook] lead lookup failed:',
      err.response?.data?.error?.message || err.message
    );
    lead = {
      id: leadgenId,
      createdTime: value.created_time
        ? new Date(value.created_time * 1000).toISOString()
        : new Date().toISOString(),
      formId: value.form_id || null,
      pageId,
      fields: {},
      raw: value,
      fetchError: true,
    };
  }

  getIO().emit('lead:new', lead);
  console.log(`[webhook] sent lead ${lead.id} to ${getIO().engine.clientsCount} client(s)`);
}

module.exports = router;
