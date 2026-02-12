import React, { useState } from 'react';

const MessageInput = ({ onSendMessage, onTyping }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text);
      setText('');
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    onTyping();
  };

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Digite uma mensagem..."
        value={text}
        onChange={handleChange}
        maxLength={500}
      />
      <button type="submit" disabled={!text.trim()}>
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
        </svg>
      </button>
    </form>
  );
};

export default MessageInput;
