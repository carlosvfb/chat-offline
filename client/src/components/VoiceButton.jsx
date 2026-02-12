import React from 'react';
import './VoiceButton.css';

const VoiceButton = ({ 
  isTransmitting, 
  currentSpeaker, 
  isChannelBusy,
  username,
  onStartTransmission, 
  onStopTransmission 
}) => {
  const isDisabled = currentSpeaker && currentSpeaker !== username;

  const getButtonState = () => {
    if (isTransmitting) return 'transmitting';
    if (currentSpeaker) return 'listening';
    if (isChannelBusy) return 'busy';
    return 'idle';
  };

  const getButtonText = () => {
    if (isTransmitting) return '🔴 TRANSMITINDO';
    if (currentSpeaker) return `🔊 ${currentSpeaker} falando...`;
    if (isChannelBusy) return '⚠️ CANAL OCUPADO';
    return '🎤 APERTAR PARA FALAR';
  };

  return (
    <div className="voice-button-container">
      {currentSpeaker && currentSpeaker !== username && (
        <div className="voice-indicator">
          <span className="pulse-dot"></span>
          {currentSpeaker} está falando
        </div>
      )}
      
      <button
        className={`voice-button ${getButtonState()}`}
        onMouseDown={(e) => !isDisabled && onStartTransmission(e)}
        onMouseUp={(e) => !isDisabled && onStopTransmission(e)}
        onTouchStart={(e) => !isDisabled && onStartTransmission(e)}
        onTouchEnd={(e) => !isDisabled && onStopTransmission(e)}
        onContextMenu={(e) => e.preventDefault()}
        disabled={isDisabled}
      >
        {getButtonText()}
      </button>
      
      <p className="voice-hint">
        {isTransmitting ? 'Solte para parar' : 'Segure para transmitir voz'}
      </p>
    </div>
  );
};

export default VoiceButton;