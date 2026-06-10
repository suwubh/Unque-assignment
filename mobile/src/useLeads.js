import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../config';

// Merge keeping newest first and dropping anything we already have, so the
// backlog replay on reconnect doesn't create duplicates.
function merge(existing, incoming) {
  const seen = new Set();
  const out = [];
  for (const lead of [...incoming, ...existing]) {
    if (seen.has(lead.id)) continue;
    seen.add(lead.id);
    out.push(lead);
  }
  return out;
}

// Keeps the socket open and holds the leads. Newest goes on top.
export function useLeads() {
  const [leads, setLeads] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket'],
      reconnection: true,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    // Whatever arrived just before this client connected.
    socket.on('lead:backlog', (items) => {
      if (items?.length) setLeads((prev) => merge(prev, items));
    });

    socket.on('lead:new', (lead) => {
      // receivedAt is just so the newest card can flash for a second.
      setLeads((prev) => merge(prev, [{ ...lead, receivedAt: Date.now() }]));
    });

    return () => socket.disconnect();
  }, []);

  return { leads, connected };
}
