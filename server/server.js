const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const os = require('os');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// In-memory storage
let messages = [];
const MAX_MESSAGES = 50;
let onlineUsers = new Map(); // socket.id -> username

// Helper function to get local IP address (prioritizing Hotspot range if available)
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  let fallbackIP = '127.0.0.1';
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // Common Android Hotspot IP is usually 192.168.43.1
        if (iface.address.startsWith('192.168.43.')) {
          return iface.address;
        }
        fallbackIP = iface.address;
      }
    }
  }
  return fallbackIP;
}

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log(`Nova conexão: ${socket.id}`);

  // Send message history to new user
  socket.emit('message-history', messages);

  // User joins the chat
  socket.on('user-joined', (username) => {
    onlineUsers.set(socket.id, username);
    console.log(`Usuário entrou: ${username} (${socket.id})`);
    
    // Notify others
    socket.broadcast.emit('user-status', {
      user: username,
      status: 'online',
      onlineCount: onlineUsers.size
    });

    // Send current online count to everyone
    io.emit('online-count', onlineUsers.size);
  });

  // Handle new messages
  socket.on('send-message', (data) => {
    const newMessage = {
      id: Date.now().toString(),
      user: data.user,
      text: data.text.substring(0, 500),
      timestamp: new Date().toISOString()
    };

    messages.push(newMessage);
    if (messages.length > MAX_MESSAGES) {
      messages.shift();
    }

    // Broadcast to all clients
    io.emit('receive-message', newMessage);
    console.log(`Mensagem de ${data.user}: ${data.text.substring(0, 20)}...`);
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.broadcast.emit('user-typing', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const username = onlineUsers.get(socket.id);
    if (username) {
      onlineUsers.delete(socket.id);
      console.log(`Usuário saiu: ${username}`);
      
      socket.broadcast.emit('user-status', {
        user: username,
        status: 'offline',
        onlineCount: onlineUsers.size
      });
      
      io.emit('online-count', onlineUsers.size);
    }
  });
});

// Serve React App for any other routes (SPA Fallback)
app.use((req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/dist/index.html'));
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log('-------------------------------------------');
  console.log('SISTEMA DE CHAT HOTSPOT INICIADO');
  console.log(`Porta: ${PORT}`);
  console.log(`IP Local: ${localIP}`);
  console.log(`Acesse: http://${localIP}:${PORT}`);
  console.log('-------------------------------------------');
});
