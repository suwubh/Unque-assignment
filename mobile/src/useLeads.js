import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../config';

// Keeps the socket open and the lead list in state. New leads go on top.
export function useLeads() {
  const [leads, setLeads] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    socket.on('lead:new', (lead) => {
      // receivedAt drives the brief highlight on the newest card.
      setLeads((prev) => [{ ...lead, receivedAt: Date.now() }, ...prev]);
    });

    return () => socket.disconnect();
  }, []);

  return { leads, connected };
}
