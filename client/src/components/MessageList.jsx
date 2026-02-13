import React, { useEffect, useRef, useState } from 'react';

const AudioPlayer = ({ src, duration: initialDuration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error("Erro ao reproduzir áudio:", err);
        setIsPlaying(false);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const onLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration !== Infinity) {
      setDuration(audioRef.current.duration);
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-player">
      <audio 
        ref={audioRef} 
        src={src} 
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        preload="metadata"
      />
      <button className="audio-play-btn" onClick={togglePlay}>
        {isPlaying ? (
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>
      <div className="audio-waveform">
        {[...Array(15)].map((_, i) => {
          // Simular progresso na waveform
          const progress = (currentTime / duration) * 15;
          const isActive = i <= progress;
          return (
            <div 
              key={i} 
              className={`waveform-bar ${isActive ? 'active' : ''}`} 
              style={{ 
                height: `${20 + Math.random() * 60}%`,
                opacity: isActive ? 1 : 0.5
              }}
            />
          );
        })}
      </div>
      <div className="audio-info">
        {formatTime(isPlaying ? currentTime : duration)}
      </div>
    </div>
  );
};

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
          <div className={`message-bubble ${msg.audio ? 'has-audio' : ''}`}>
            <span className="message-user">{msg.user}</span>
            
            {msg.audio ? (
              <AudioPlayer src={msg.audio} duration={msg.duration} />
            ) : (
              <p className="message-text">{msg.text}</p>
            )}

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
