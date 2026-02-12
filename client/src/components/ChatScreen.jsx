import React, { useState, useEffect } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import VoiceButton from './VoiceButton';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { socket } from '../socket';

const ChatScreen = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showUserList, setShowUserList] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [isConnected, setIsConnected] = useState(socket.connected);

  const {
    isTransmitting,
    currentSpeaker,
    isChannelBusy,
    startTransmission,
    stopTransmission,
    setupSocketListeners,
    enableBackgroundMode
  } = useVoiceChat(socket, user);

  useEffect(() => {
    const handleInteraction = () => {
      enableBackgroundMode();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    function onConnect() {
      setIsConnected(true);
      console.log('Reconectado ao servidor');
      socket.emit('user-joined', user);
    }

    function onReconnect() {
      console.log('Tentando re-identificar após reconexão...');
      socket.emit('user-joined', user);
    }

    function onDisconnect(reason) {
      setIsConnected(false);
      console.log('Desconectado:', reason);
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

    function onUpdateUsers(users) {
      setOnlineUsers(users);
    }

    function onUserTyping(data) {
      if (data.user !== user && data.isTyping) {
        setTypingUser(data.user);
        setTimeout(() => setTypingUser(null), 3000);
      }
    }

    socket.on('connect', onConnect);
    socket.on('reconnect', onReconnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message-history', onMessageHistory);
    socket.on('receive-message', onReceiveMessage);
    socket.on('online-count', onOnlineCount);
    socket.on('update-users', onUpdateUsers);
    socket.on('user-typing', onUserTyping);

    // Setup Voice listeners
    const cleanupVoice = setupSocketListeners();

    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('reconnect', onReconnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message-history', onMessageHistory);
      socket.off('receive-message', onReceiveMessage);
      socket.off('online-count', onOnlineCount);
      socket.off('update-users', onUpdateUsers);
      socket.off('user-typing', onUserTyping);
      if (cleanupVoice) cleanupVoice();
    };
  }, [user, setupSocketListeners]);

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
        <div className="header-info" onClick={() => setShowUserList(!showUserList)} style={{ cursor: 'pointer' }}>
          <h2>Chat Local</h2>
          <div className="header-status">
            <span className={`status-dot ${isConnected ? 'online' : 'offline'}`}></span>
            <span className="online-count">{onlineCount} online (ver todos)</span>
          </div>
        </div>
        <div className="current-user"><strong>{user}</strong></div>
      </header>

      {showUserList && (
        <div className="user-list-overlay" onClick={() => setShowUserList(false)}>
          <div className="user-list-modal" onClick={e => e.stopPropagation()}>
            <div className="user-list-header">
              <h3>Usuários Online</h3>
              <button onClick={() => setShowUserList(false)}>×</button>
            </div>
            <div className="user-list-content">
              {onlineUsers.map((u, i) => (
                <div key={i} className="user-list-item">
                  <span className="user-dot online"></span>
                  {u} {u === user && "(você)"}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <MessageList messages={messages} currentUser={user} />

      {typingUser && (
        <div className="typing-indicator">
          {typingUser} está digitando...
        </div>
      )}

      <MessageInput onSendMessage={handleSendMessage} onTyping={handleTyping} />

      {isConnected && (
        <VoiceButton
          isTransmitting={isTransmitting}
          currentSpeaker={currentSpeaker}
          isChannelBusy={isChannelBusy}
          username={user}
          onStartTransmission={startTransmission}
          onStopTransmission={stopTransmission}
        />
      )}
    </div>
  );
};

export default ChatScreen;
