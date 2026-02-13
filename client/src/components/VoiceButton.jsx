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
    <button
      className={`voice-button ${getButtonState()}`}
      onMouseDown={(e) => !isDisabled && onStartTransmission(e)}
      onMouseUp={(e) => !isDisabled && onStopTransmission(e)}
      onTouchStart={(e) => !isDisabled && onStartTransmission(e)}
      onTouchEnd={(e) => !isDisabled && onStopTransmission(e)}
      onContextMenu={(e) => e.preventDefault()}
      disabled={isDisabled}
    >
      <span className="label">{getButtonText()}</span>
      <span className="hint">{getHintText()}</span>
    </button>
  );
};

export default VoiceButton;
