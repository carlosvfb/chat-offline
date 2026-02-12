import React, { useState, useEffect } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { socket } from '../socket';

const ChatScreen = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingUser, setTypingUser] = useState(null);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      socket.emit('user-joined', user);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onMessageHistory(history) {
      setMessages(history);
    }

    function onReceiveMessage(message) {
      setMessages(prev => [...prev, message]);
      
      // Handle Notification
      if (document.visibilityState !== 'visible' && message.user !== user) {
        showNotification(message);
      }
    }

    function onOnlineCount(count) {
      setOnlineCount(count);
    }

    function onUserTyping(data) {
      if (data.user !== user && data.isTyping) {
        setTypingUser(data.user);
        setTimeout(() => setTypingUser(null), 3000);
      }
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message-history', onMessageHistory);
    socket.on('receive-message', onReceiveMessage);
    socket.on('online-count', onOnlineCount);
    socket.on('user-typing', onUserTyping);

    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message-history', onMessageHistory);
      socket.off('receive-message', onReceiveMessage);
      socket.off('online-count', onOnlineCount);
      socket.off('user-typing', onUserTyping);
    };
  }, [user]);

  const handleSendMessage = (text) => {
    socket.emit('send-message', { user, text });
  };

  const handleTyping = () => {
    socket.emit('typing', { user, isTyping: true });
  };

  const showNotification = (message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const payload = {
        title: `Nova mensagem de ${message.user}`,
        body: message.text.substring(0, 50),
        icon: '/vite.svg'
      };

      // Tenta via Service Worker para funcionar em background
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload
        });
      } else {
        // Fallback para notificação normal se SW não estiver pronto
        new Notification(payload.title, { body: payload.body, icon: payload.icon });
      }
      
      // Som de notificação e vibração
      playNotificationSound();
    }
  };

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Criar um som de "ding" mais complexo
      const playTone = (freq, startTime, duration) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Duas notas para um som de notificação clássico
      playTone(880, audioCtx.currentTime, 0.2);
      playTone(1046, audioCtx.currentTime + 0.1, 0.3);

      // Vibração para dispositivos móveis
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch (e) {
      console.log('Erro ao tocar som:', e);
    }
  };

  return (
    <div className="chat-screen">
      <header className="chat-header">
        <div className="header-info">
          <h2>Chat Local</h2>
          <div className="header-status">
            <span className={`status-dot ${isConnected ? 'online' : 'offline'}`}></span>
            <span className="online-count">{onlineCount} online</span>
          </div>
        </div>
        <div className="current-user"><strong>{user}</strong></div>
      </header>

      <MessageList messages={messages} currentUser={user} />

      {typingUser && (
        <div className="typing-indicator">
          {typingUser} está digitando...
        </div>
      )}

      <MessageInput onSendMessage={handleSendMessage} onTyping={handleTyping} />
    </div>
  );
};

export default ChatScreen;
