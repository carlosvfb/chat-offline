import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import ChatScreen from './components/ChatScreen';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(status => {
        setPermission(status);
        if (status === 'granted') {
          // Test notification
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
      {permission === 'default' && (
        <div className="notification-banner" onClick={requestPermission}>
          🔔 Clique aqui para ativar as notificações e não perder nenhuma mensagem!
        </div>
      )}
      {!user ? (
        <LoginScreen onLogin={setUser} />
      ) : (
        <ChatScreen user={user} />
      )}
    </div>
  );
}

export default App;
