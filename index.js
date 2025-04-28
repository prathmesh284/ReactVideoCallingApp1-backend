// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const cors = require('cors'); // Import the cors package

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server);

// const PORT = 5000;

// // Enable CORS for all domains, or specify localhost:3000 to restrict to your frontend
// app.use(cors({
//   origin: 'http://localhost:3000', // Allow only your frontend (localhost:3000) to connect
//   methods: ['GET', 'POST'],
//   allowedHeaders: ['Content-Type'],
// }));

// io.on('connection', (socket) => {
//   console.log('a user connected');
  
//   socket.on('join', (roomId) => {
//     socket.join(roomId);
//     console.log(`User joined room: ${roomId}`);
//   });

//   socket.on('offer', (offer, roomId) => {
//     socket.to(roomId).emit('offer', offer);
//   });

//   socket.on('answer', (answer, roomId) => {
//     socket.to(roomId).emit('answer', answer);
//   });

//   socket.on('ice-candidate', (candidate, roomId) => {
//     socket.to(roomId).emit('ice-candidate', candidate);
//   });

//   socket.on('disconnect', () => {
//     console.log('user disconnected');
//   });
// });

// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });



// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Basic express setup
const app = express();
// app.use(cors());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// HTTP Server
const server = http.createServer(app);

// Socket.IO server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true, // <- important if client lib is old
});

// --- SOCKET EVENTS --- //

io.on('connection', (socket) => {
  console.log('⚡ New client connected:', socket.id);

  socket.on('join', (roomId) => {
    console.log(`🛡️ User ${socket.id} joining room: ${roomId}`);
    socket.join(roomId);
    socket.to(roomId).emit('ready'); // Notify others someone joined
  });

  socket.on('offer', ({ offer, roomId }) => {
    console.log('📨 Offer received and sent to room:', roomId);
    socket.to(roomId).emit('offer', offer);
  });

  socket.on('answer', ({ answer, roomId }) => {
    console.log('📨 Answer received and sent to room:', roomId);
    socket.to(roomId).emit('answer', { answer });
  });

  socket.on('ice-candidate', ({ candidate, roomId }) => {
    console.log('🧊 ICE candidate received and sent to room:', roomId);
    socket.to(roomId).emit('ice-candidate', { candidate });
  });

  socket.on('screen-sharing', ({ screenStream, roomId }) => {
    console.log('🖥️ Screen sharing triggered.');
    socket.to(roomId).emit('screen-sharing', screenStream);
  });

  socket.on('leave', (roomId) => {
    console.log(`🏃‍♂️ User ${socket.id} leaving room: ${roomId}`);
    socket.leave(roomId);
    socket.to(roomId).emit('leave');
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// --- TEST ENDPOINT (optional) --- //
app.get('/', (req, res) => {
  res.send('🚀 Video Call Signaling Server Running.');
});

// --- SERVER START --- //
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0',() => {
  console.log(`🌍 Server running on http://0.0.0.0:${PORT}`);
});

console.log('🚀 Starting server...');
console.log('Environment variables:', process.env);

process.on('uncaughtException', err => {
  console.error('🔥 Uncaught Exception:', err);
});

process.on('unhandledRejection', err => {
  console.error('🔥 Unhandled Rejection:', err);
});