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



const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://react-video-calling-app1.netlify.app/',
    methods: ['GET', 'POST'],
  }
});

const rooms = {};

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on('join', (roomId) => {
    console.log(`📥 ${socket.id} joined room: ${roomId}`);
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    rooms[roomId].push(socket.id);

    const otherUser = rooms[roomId].find(id => id !== socket.id);
    if (otherUser) {
      socket.emit('other-user', { otherUser });
      socket.to(otherUser).emit('user-joined', { newUser: socket.id });
    }
  });

  socket.on('offer', ({ offer, room, to }) => {
    console.log(`📡 Offer from ${socket.id} to ${to}`);
    socket.to(to).emit('offer', { offer, from: socket.id });
  });

  socket.on('answer', ({ answer, room, to }) => {
    console.log(`📡 Answer from ${socket.id} to ${to}`);
    socket.to(to).emit('answer', { answer, from: socket.id });
  });

  socket.on('ice-candidate', ({ candidate, to }) => {
    console.log(`🧊 ICE Candidate from ${socket.id} to ${to}`);
    socket.to(to).emit('ice-candidate', { candidate, from: socket.id });
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      }
    }
  });
});

server.listen(5000, () => {
  console.log('✅ Signaling server running on port 5000');
});
