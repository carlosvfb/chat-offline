import React, { useEffect, useRef } from 'react';

const MessageList = ({ messages, currentUser }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`message-item ${msg.user === currentUser ? 'own-message' : ''}`}
        >
          <div className="message-bubble">
            <span className="message-user">{msg.user}</span>
            <p className="message-text">{msg.text}</p>
            <div className="message-footer">
              <span className="message-time">{formatTime(msg.timestamp)}</span>
              {msg.isPending && <span className="pending-icon">🕒</span>}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
