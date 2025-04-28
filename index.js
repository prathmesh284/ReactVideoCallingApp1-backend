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
app.use(cors({
  origin: '*',  // allow all origins (or specify your frontend URL for stricter control)
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket'],
  allowEIO3: true, // Support older clients if needed
});

const rooms = {};

io.on('connection', socket => {
  console.log('New client connected: ', socket.id);

  socket.on('join-room', ({ roomId }) => {
    if (rooms[roomId]) {
      rooms[roomId].push(socket.id);
    } else {
      rooms[roomId] = [socket.id];
    }

    const otherUser = rooms[roomId].find(id => id !== socket.id);
    if (otherUser) {
      socket.emit('other-user', otherUser);
      socket.to(otherUser).emit('user-joined', socket.id);
    }
  });

  socket.on('offer', payload => {
    io.to(payload.target).emit('offer', { sdp: payload.sdp, caller: socket.id });
  });

  socket.on('answer', payload => {
    io.to(payload.target).emit('answer', { sdp: payload.sdp });
  });

  socket.on('ice-candidate', payload => {
    io.to(payload.target).emit('ice-candidate', { candidate: payload.candidate });
  });

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      }
    }
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
