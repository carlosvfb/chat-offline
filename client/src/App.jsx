import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import ChatScreen from './components/ChatScreen';
import './App.css';

function App() {
  const [user, setUser] = useState(() => localStorage.getItem('chat-user'));
  const [permission, setPermission] = useState('default');
  const [isSecure, setIsSecure] = useState(true);

  useEffect(() => {
    const secure = window.isSecureContext;
    setIsSecure(secure);

    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Fix for mobile address bar
    const setAppHeight = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    window.addEventListener('resize', setAppHeight);
    setAppHeight();

    return () => window.removeEventListener('resize', setAppHeight);
  }, []);

  const handleLogin = (username) => {
    localStorage.setItem('chat-user', username);
    setUser(username);
  };

  const requestPermission = () => {
    if (!isSecure) {
      alert("⚠️ Navegador bloqueou as notificações!\n\nPor segurança, notificações só funcionam em HTTPS ou Localhost.\n\nPara funcionar no IP do Hotspot, você deve:\n1. Usar HTTPS (https://...)\n2. OU configurar o navegador para confiar neste IP.");
      return;
    }

    if ('Notification' in window) {
      Notification.requestPermission().then(status => {
        setPermission(status);
        if (status === 'granted') {
          new Notification("Notificações Ativadas!", {
            body: "Você receberá avisos de novas mensagens.",
            icon: '/vite.svg'
          });
        }
      });
    }
  };

  return (
    <div className="app-container">
      {!isSecure && (
        <div className="security-warning">
          ❌ Conexão Insegura: Notificações desativadas. Use <strong>HTTPS</strong>.
        </div>
      )}
      {isSecure && permission === 'default' && (
        <div className="notification-banner" onClick={requestPermission}>
          🔔 Ativar Notificações
        </div>
      )}
      {!user ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <ChatScreen user={user} />
      )}
    </div>
  );
}

export default App;
