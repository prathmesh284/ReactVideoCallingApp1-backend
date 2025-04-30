// //server.js
// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const cors = require('cors');

// const app = express();
// app.use(cors());
// const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: {
//     origin: '*',
//     methods: ['GET', 'POST'],
//   },
// });

// const socketToRoom = {};
// const roomToSockets = {};

// io.on('connection', (socket) => {
//   console.log(`🔌 New socket connected: ${socket.id}`);

//   socket.on('join-room', ({ roomId }) => {
//     const room = roomToSockets[roomId] || [];

//     // Prevent duplicate joins
//     if (!room.includes(socket.id)) {
//       if (room.length >= 2) {
//         socket.emit('room-full');
//         return;
//       }

//       room.push(socket.id);
//       roomToSockets[roomId] = room;
//       socketToRoom[socket.id] = roomId;
//       socket.join(roomId);
//     }

//     const otherUser = room.find(id => id !== socket.id);

//     if (otherUser) {
//       // Assign roles
//       socket.emit('user-joined', {
//         socketId: otherUser,
//         shouldCreateOffer: true, // new user creates offer
//       });

//       io.to(otherUser).emit('user-joined', {
//         socketId: socket.id,
//         shouldCreateOffer: false, // old user just listens/responds
//       });
//     }

//     console.log(`✅ ${socket.id} joined room ${roomId}`);
//   });

//   socket.on('send-offer', ({ offer, to }) => {
//     io.to(to).emit('receive-offer', { offer, from: socket.id });
//   });

//   socket.on('send-answer', ({ answer, to }) => {
//     io.to(to).emit('receive-answer', { answer, from: socket.id });
//   });

//   socket.on('send-ice-candidate', ({ candidate, to }) => {
//     io.to(to).emit('receive-ice-candidate', { candidate, from: socket.id });
//   });

//   socket.on('disconnect', () => {
//     const roomId = socketToRoom[socket.id];
//     const room = roomToSockets[roomId];
//     if (room) {
//       const index = room.indexOf(socket.id);
//       if (index !== -1) {
//         room.splice(index, 1);
//       }
//       if (room.length === 0) {
//         delete roomToSockets[roomId];
//       }
//     }
//     delete socketToRoom[socket.id];

//     socket.broadcast.emit('user-left', socket.id);
//     console.log(`❌ Socket disconnected: ${socket.id}`);
//   });
// });

// // --- TEST ENDPOINT (optional) --- //
// app.get('/', (req, res) => {
//   res.send('🚀 Video Call Signaling Server Running.');
// });

// // Health check endpoint for Railway
// app.get('/healthz', (req, res) => {
//   res.status(200).json({ status: 'ok' });
// });

// // --- SERVER START --- //
// const PORT = process.env.PORT || 8080;
// server.listen(PORT, '0.0.0.0',() => {
//   console.log(`🌍 Server running on http://0.0.0.0:${PORT}`);
// });



const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const socketToRoom = {};
const roomToSockets = {};

io.on('connection', (socket) => {
  console.log(`🔌 New socket connected: ${socket.id}`);

  socket.on('join-room', ({ roomId }) => {
    if (!roomToSockets[roomId]) {
      roomToSockets[roomId] = [];
    }

    const room = roomToSockets[roomId];

    if (room.length >= 2) {
      socket.emit('room-full');
      return;
    }

    if (!room.includes(socket.id)) {
      room.push(socket.id);
      socketToRoom[socket.id] = roomId;
      socket.join(roomId);
    }

    const otherUser = room.find(id => id !== socket.id);
    if (otherUser) {
      // Tell the new user to create offer toward the existing peer
      socket.emit('user-joined', { socketId: otherUser });
      console.log(`🔁 Sent user-joined to ${socket.id} to connect with ${otherUser}`);
    }

    console.log(`✅ ${socket.id} joined room ${roomId}`);
  });

  socket.on('send-offer', ({ offer, to }) => {
    io.to(to).emit('receive-offer', { offer, from: socket.id });
  });

  socket.on('send-answer', ({ answer, to }) => {
    io.to(to).emit('receive-answer', { answer, from: socket.id });
  });

  socket.on('send-ice-candidate', ({ candidate, to }) => {
    io.to(to).emit('receive-ice-candidate', { candidate, from: socket.id });
  });

  socket.on('disconnect', () => {
    const roomId = socketToRoom[socket.id];
    const room = roomToSockets[roomId];
    if (room) {
      roomToSockets[roomId] = room.filter(id => id !== socket.id);
      if (roomToSockets[roomId].length === 0) {
        delete roomToSockets[roomId];
      }
    }
    delete socketToRoom[socket.id];

    const peers = roomToSockets[roomId] || [];
    peers.forEach(peerId => {
      io.to(peerId).emit('user-left', { socketId: socket.id });
    });

    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// --- Optional Endpoints --- //
app.get('/', (req, res) => {
  res.send('🚀 Video Call Signaling Server Running.');
});

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// --- Start Server --- //
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌍 Server running on http://0.0.0.0:${PORT}`);
});