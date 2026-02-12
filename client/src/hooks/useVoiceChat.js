import { useState, useRef, useCallback } from 'react';

export const useVoiceChat = (socket, username) => {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [isChannelBusy, setIsChannelBusy] = useState(false);

  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  
  // Para reprodução
  const playbackContextRef = useRef(null);
  const nextStartTimeRef = useRef(0);

  // Inicializar AudioContext para reprodução
  const initPlaybackContext = useCallback(async () => {
    if (!playbackContextRef.current) {
      playbackContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 24000 // Sample rate fixo para consistência
      });
    }
    if (playbackContextRef.current.state === 'suspended') {
      await playbackContextRef.current.resume();
    }
  }, []);

  // Começar transmissão (PTT)
  const startTransmission = useCallback(async (e) => {
    if (e) {
      if (e.cancelable) e.preventDefault();
    }

    if (isTransmitting || currentSpeaker) return;

    try {
      // Garantir permissão e stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      // Inicializar context de gravação
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 24000
      });
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      // Usar ScriptProcessor para capturar áudio bruto (PCM)
      // 4096 é um bom equilíbrio entre latência e performance
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      socket.emit('start-voice-transmission', username);
      setIsTransmitting(true);

      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Converter para Int16 para economizar banda (opcional, mas recomendado)
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        socket.emit('voice-audio-chunk', pcmData.buffer);
      };

      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      alert('Erro ao acessar microfone. Verifique se está em HTTPS e deu permissão.');
    }
  }, [socket, username, isTransmitting, currentSpeaker]);

  // Parar transmissão
  const stopTransmission = useCallback((e) => {
    if (e) {
      if (e.cancelable) e.preventDefault();
    }

    if (!isTransmitting) return;

    setIsTransmitting(false);
    socket.emit('stop-voice-transmission');

    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  }, [socket, isTransmitting]);

  // Receber e reproduzir áudio bruto
  const handleAudioStream = useCallback(async (audioBuffer) => {
    await initPlaybackContext();
    
    const context = playbackContextRef.current;
    const pcmData = new Int16Array(audioBuffer);
    const floatData = new Float32Array(pcmData.length);
    
    // Converter de volta para Float32
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 0x7FFF;
    }

    const buffer = context.createBuffer(1, floatData.length, 24000);
    buffer.getChannelData(0).set(floatData);

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);

    // Agendamento preciso para evitar gaps
    const currentTime = context.currentTime;
    if (nextStartTimeRef.current < currentTime) {
      nextStartTimeRef.current = currentTime;
    }
    
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;
  }, [initPlaybackContext]);

  // Configurar listeners de socket
  const setupSocketListeners = useCallback(() => {
    if (!socket) return;

    socket.on('voice-transmission-started', ({ username: speaker }) => {
      setCurrentSpeaker(speaker);
      nextStartTimeRef.current = 0; // Reset scheduling
      
      if (speaker !== username) {
        initPlaybackContext();
        // Beep sutil de início
        const beep = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ8PTKXh8bllHAU7k9n0zXgrBSh+zPLaizsKGWe56+efTRAMUKfj8LVjHAY4ktfy');
        beep.volume = 0.3;
        beep.play().catch(() => {});
      }
    });

    socket.on('voice-transmission-ended', () => {
      setCurrentSpeaker(null);
      setIsChannelBusy(false);
    });

    socket.on('voice-channel-busy', ({ currentSpeaker }) => {
      setIsChannelBusy(true);
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      setTimeout(() => setIsChannelBusy(false), 2000);
    });

    socket.on('voice-audio-stream', (audioData) => {
      handleAudioStream(audioData);
    });

    return () => {
      socket.off('voice-transmission-started');
      socket.off('voice-transmission-ended');
      socket.off('voice-channel-busy');
      socket.off('voice-audio-stream');
    };
  }, [socket, username, handleAudioStream, initPlaybackContext]);

  return {
    isTransmitting,
    currentSpeaker,
    isChannelBusy,
    startTransmission,
    stopTransmission,
    setupSocketListeners
  };
};