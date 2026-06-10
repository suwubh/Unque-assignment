const axios = require('axios');

const GRAPH_VERSION = process.env.GRAPH_API_VERSION || 'v21.0';

// Webhook only gives a leadgen_id; fetch the actual answers from the Graph API.
async function fetchLead(leadgenId, accessToken) {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${leadgenId}`;
  const { data } = await axios.get(url, {
    params: {
      access_token: accessToken,
      fields: 'id,created_time,field_data,form_id',
    },
  });
  return data;
}

// field_data comes back as [{ name, values: [] }] — flatten it into a plain
// object the app can render.
function normalizeLead(raw, meta = {}) {
  const fields = {};
  for (const field of raw.field_data || []) {
    fields[field.name] = (field.values || []).join(', ');
  }

  return {
    id: raw.id,
    createdTime: raw.created_time || new Date().toISOString(),
    formId: raw.form_id || meta.formId || null,
    pageId: meta.pageId || null,
    fields,
    raw,
  };
}

module.exports = { fetchLead, normalizeLead };
