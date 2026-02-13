import React from 'react';

const VoiceButton = ({ 
  isTransmitting, 
  currentSpeaker, 
  isChannelBusy,
  username,
  onStartTransmission, 
  onStopTransmission 
}) => {
  const isDisabled = isChannelBusy && !isTransmitting && currentSpeaker !== username;

  const getButtonState = () => {
    if (isTransmitting) return 'transmitting';
    if (isChannelBusy) return 'busy';
    return 'idle';
  };

  const getButtonText = () => {
    if (isTransmitting) return '🔴 TRANSMITINDO...';
    if (isChannelBusy && currentSpeaker) return `🔊 ${currentSpeaker} FALANDO...`;
    if (isChannelBusy) return '⚠️ CANAL OCUPADO';
    return '🎤 APERTAR PARA FALAR (RÁDIO)';
  };

  const getHintText = () => {
    if (isTransmitting) return 'Solte para parar';
    if (isChannelBusy) return 'Aguarde o canal liberar';
    return 'Segure para transmitir voz';
  };

  return (
    <div className="voice-button-container">
      {isChannelBusy && !isTransmitting && (
        <div className="speaker-indicator">
          🔊 {currentSpeaker} falando...
        </div>
      )}
      <button
        className={`ptt-button ${getButtonState()}`}
        onMouseDown={(e) => !isDisabled && onStartTransmission(e)}
        onMouseUp={(e) => !isDisabled && onStopTransmission(e)}
        onTouchStart={(e) => !isDisabled && onStartTransmission(e)}
        onTouchEnd={(e) => !isDisabled && onStopTransmission(e)}
        onContextMenu={(e) => e.preventDefault()}
        disabled={isDisabled}
      >
        <span className="ptt-label">{getButtonText()}</span>
        <span className="ptt-status">{getHintText()}</span>
      </button>
    </div>
  );
};

export default VoiceButton;
