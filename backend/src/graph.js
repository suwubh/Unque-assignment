const axios = require('axios');

const GRAPH_VERSION = process.env.GRAPH_API_VERSION || 'v21.0';

// The webhook only hands us a leadgen_id, so we read the actual answers back
// from the Graph API using the page token.
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

// field_data comes back as [{ name, values: [] }]. Turn it into a plain map the
// app can render, keep the raw payload around just in case.
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
