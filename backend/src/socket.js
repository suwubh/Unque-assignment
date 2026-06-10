const { Server } = require('socket.io');

let io = null;

function initSocket(server) {
  io = new Server(server, {
    // The mobile client connects from a phone, so we don't pin an origin.
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    console.log(`[socket] client connected: ${socket.id} (total: ${io.engine.clientsCount})`);
    socket.on('disconnect', () => {
      console.log(`[socket] client disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.IO has not been initialised yet');
  return io;
}

module.exports = { initSocket, getIO };
