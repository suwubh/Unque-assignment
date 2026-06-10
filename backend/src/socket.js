const { Server } = require('socket.io');

let io = null;

function initSocket(server) {
  io = new Server(server, {
    // App connects from a phone on whatever network, so not locking origin down.
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
