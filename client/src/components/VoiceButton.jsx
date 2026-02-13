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
    if (isTransmitting) return '🔴 VOCÊ ESTÁ TRANSMITINDO...';
    if (currentSpeaker) return `🔊 ${currentSpeaker.toUpperCase()} FALANDO...`;
    return '🎤 APERTAR PARA FALAR (RÁDIO)';
  };

  const getHintText = () => {
    if (isTransmitting) return 'Solte para parar';
    if (currentSpeaker) return 'Aguarde o canal liberar';
    return 'Segure para transmitir voz';
  };

  return (
    <div className="voice-button-container">
      <button
        className={`ptt-button ${getButtonState()}`}
        onMouseDown={(e) => !isDisabled && onStartTransmission(e)}
        onMouseUp={(e) => onStopTransmission(e)}
        onTouchStart={(e) => !isDisabled && onStartTransmission(e)}
        onTouchEnd={(e) => onStopTransmission(e)}
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
