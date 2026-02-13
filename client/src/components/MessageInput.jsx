import React, { useState, useRef, useEffect } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

const MessageInput = ({ onSendMessage, onTyping, onSendAudio }) => {
  const [text, setText] = useState('');
  const { isRecording, recordingTime, startRecording, stopRecording } = useAudioRecorder();
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text);
      setText('');
    }
  };

  const handleInputChange = (e) => {
    setText(e.target.value);
    onTyping();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAudioEnd = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const audioData = await stopRecording();
    if (audioData) {
      onSendAudio(audioData);
    }
  };

  return (
    <div className={`message-input-wrapper ${isRecording ? 'recording' : ''}`}>
      <form className="message-input" onSubmit={handleSubmit}>
        {isRecording ? (
          <div className="recording-status">
            <span className="recording-dot"></span>
            <span className="recording-timer">{formatTime(recordingTime)}</span>
            <span className="recording-hint">Solte para enviar</span>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleInputChange}
            placeholder="Mensagem"
            autoFocus
          />
        )}
        
        {text.trim() && !isRecording ? (
          <button type="submit" className="send-btn">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
            </svg>
          </button>
        ) : (
          <button 
            type="button" 
            className={`mic-btn ${isRecording ? 'active' : ''}`}
            onMouseDown={(e) => startRecording(e)}
            onMouseUp={(e) => handleAudioEnd(e)}
            onTouchStart={(e) => startRecording(e)}
            onTouchEnd={(e) => handleAudioEnd(e)}
            onContextMenu={(e) => e.preventDefault()}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2.001z" />
            </svg>
          </button>
        )}
      </form>
    </div>
  );
};

export default MessageInput;
