const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const os = require('os');
const fs = require('fs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  allowEIO3: true
});

const PORT = process.env.PORT || 3000;
const DIST_PATH = path.resolve(__dirname, '../client/dist');
const INDEX_HTML = path.join(DIST_PATH, 'index.html');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files with logging
app.use(express.static(DIST_PATH));

// In-memory storage
let messages = [];
const MAX_MESSAGES = 50;
let onlineUsers = new Map(); // socket.id -> username

// Novo endpoint HTTP para o Service Worker enviar mensagens em background
app.post('/api/messages', (req, res) => {
  const { user, text } = req.body;
  if (!user || !text) return res.status(400).json({ error: 'Faltando dados' });

  const newMessage = {
    id: Date.now().toString(),
    user: user,
    text: text.substring(0, 500),
    timestamp: new Date().toISOString()
  };

  messages.push(newMessage);
  if (messages.length > MAX_MESSAGES) messages.shift();

  // Notificar todos via socket.io que uma mensagem chegou via HTTP
  io.emit('receive-message', newMessage);
  
  console.log(`[HTTP/SW] Mensagem de ${user}: ${text.substring(0, 20)}...`);
  res.status(201).json(newMessage);
});

// MiddlewareControle de transmissão de voz
let currentVoiceSpeaker = null;

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
    io.emit('update-users', Array.from(onlineUsers.values()));
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

  // NOVOS EVENTOS DE VOZ (RADIO PTT)
  
  socket.on('start-voice-transmission', (username) => {
    if (!currentVoiceSpeaker) {
      currentVoiceSpeaker = {
        socketId: socket.id,
        username: username
      };
      
      console.log(`🎤 [VOZ] ${username} começou transmissão`);
      
      // Notificar todos que transmissão começou
      io.emit('voice-transmission-started', {
        username: username,
        socketId: socket.id
      });
    } else {
      // Canal ocupado
      socket.emit('voice-channel-busy', {
        currentSpeaker: currentVoiceSpeaker.username
      });
    }
  });

  socket.on('voice-audio-chunk', (audioData) => {
    // Só retransmitir se for o speaker atual
    if (currentVoiceSpeaker && currentVoiceSpeaker.socketId === socket.id) {
      // Broadcast para todos exceto transmissor
      socket.broadcast.emit('voice-audio-stream', audioData);
    }
  });

  socket.on('stop-voice-transmission', () => {
    if (currentVoiceSpeaker && currentVoiceSpeaker.socketId === socket.id) {
      const username = currentVoiceSpeaker.username;
      console.log(`🔇 [VOZ] ${username} parou transmissão`);
      
      currentVoiceSpeaker = null;
      io.emit('voice-transmission-ended', { username });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const username = onlineUsers.get(socket.id);
    
    // Liberar canal se transmissor desconectar
    if (currentVoiceSpeaker && currentVoiceSpeaker.socketId === socket.id) {
      const speakerName = currentVoiceSpeaker.username;
      console.log(`❌ [VOZ] ${speakerName} desconectou durante transmissão`);
      currentVoiceSpeaker = null;
      io.emit('voice-transmission-ended', { username: speakerName });
    }

    if (username) {
      onlineUsers.delete(socket.id);
      console.log(`Usuário saiu: ${username}`);
      
      socket.broadcast.emit('user-status', {
        user: username,
        status: 'offline',
        onlineCount: onlineUsers.size
      });
      
      io.emit('online-count', onlineUsers.size);
      io.emit('update-users', Array.from(onlineUsers.values()));
    }
  });
});

// Serve React App for any other routes (SPA Fallback)
app.use((req, res) => {
  if (fs.existsSync(INDEX_HTML)) {
    res.sendFile(INDEX_HTML);
  } else {
    res.status(404).send(`
      <div style="font-family: sans-serif; padding: 20px; text-align: center;">
        <h1 style="color: #ff4444;">Erro: Build não encontrado</h1>
        <p>O arquivo <strong>index.html</strong> não foi encontrado em: <br><code>${INDEX_HTML}</code></p>
        <hr>
        <p><strong>Como resolver:</strong></p>
        <ol style="display: inline-block; text-align: left;">
          <li>Vá para a pasta <code>client</code> no seu PC ou Termux</li>
          <li>Execute: <code>npm install</code> e depois <code>npm run build</code></li>
          <li>Certifique-se de que a pasta <code>dist</code> foi criada dentro de <code>client</code></li>
        </ol>
      </div>
    `);
  }
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log('-------------------------------------------');
  console.log('SISTEMA DE CHAT HOTSPOT INICIADO');
  console.log(`Porta: ${PORT}`);
  console.log(`IP Local: ${localIP}`);
  console.log(`Caminho do Build: ${DIST_PATH}`);
  console.log(`Status do Build: ${fs.existsSync(INDEX_HTML) ? '✅ OK' : '❌ NÃO ENCONTRADO'}`);
  console.log(`Acesse: http://${localIP}:${PORT}`);
  console.log('-------------------------------------------');
});
