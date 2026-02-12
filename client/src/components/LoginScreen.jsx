import React, { useState } from 'react';

const LoginScreen = ({ onLogin }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Chat Offline</h1>
        <p>Entre com seu nome para começar</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Seu nome..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            required
            autoFocus
          />
          <button type="submit">Entrar no Chat</button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
