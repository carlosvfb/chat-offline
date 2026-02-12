import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import ChatScreen from './components/ChatScreen';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="app-container">
      {!user ? (
        <LoginScreen onLogin={setUser} />
      ) : (
        <ChatScreen user={user} />
      )}
    </div>
  );
}

export default App;
