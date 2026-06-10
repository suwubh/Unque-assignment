const { Server } = require('socket.io');

let io = null;

// Hold the last few leads so a client that connects (or reconnects) right after
// one arrives still gets it. Emits are fire-and-forget, so without this a lead
// that lands while the app is mid-reconnect just disappears.
const recentLeads = [];
const MAX_RECENT = 25;

function initSocket(server) {
  io = new Server(server, {
    // App connects from a phone on whatever network, so not locking origin down.
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    console.log(`[socket] client connected: ${socket.id} (total: ${io.engine.clientsCount})`);
    if (recentLeads.length) socket.emit('lead:backlog', recentLeads);
    socket.on('disconnect', () => {
      console.log(`[socket] client disconnected: ${socket.id}`);
    });
  });

  return io;
}

// Stash the lead and push it to everyone. Returns how many clients got it.
function publishLead(lead) {
  recentLeads.unshift(lead);
  if (recentLeads.length > MAX_RECENT) recentLeads.length = MAX_RECENT;
  io.emit('lead:new', lead);
  return io.engine.clientsCount;
}

function getIO() {
  if (!io) throw new Error('Socket.IO has not been initialised yet');
  return io;
}

module.exports = { initSocket, publishLead, getIO };
