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
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://react-video-calling-app1.netlify.app', // <--- your frontend URL here
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  }
});

const PORT = process.env.PORT || 5000;

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('join', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on('offer', ({ offer, roomId }) => {
    socket.to(roomId).emit('offer', offer);
  });

  socket.on('answer', ({ answer, roomId }) => {
    socket.to(roomId).emit('answer', answer);
  });

  socket.on('ice-candidate', ({ candidate, roomId }) => {
    socket.to(roomId).emit('ice-candidate', candidate);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
