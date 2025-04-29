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

  socket.on('join-room', ({ roomId }) => {
    const room = io.sockets.adapter.rooms.get(roomId) || new Set();
  
    if (room.has(socket.id)) {
      console.log(`🚫 Socket ${socket.id} already in room ${roomId}, ignoring duplicate join.`);
      return;
    }
  
    socket.join(roomId);
    console.log(`✅ Socket ${socket.id} joined room ${roomId}`);
  
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId));
    console.log(`Room ${roomId} clients:`, clients);
  
    if (clients.length === 2) {
      const [firstClient, secondClient] = clients;
      io.to(firstClient).emit('user-joined', secondClient);
      io.to(secondClient).emit('user-joined', firstClient);
    }
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

// Health check endpoint for Railway
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// --- SERVER START --- //
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0',() => {
  console.log(`🌍 Server running on http://0.0.0.0:${PORT}`);
});