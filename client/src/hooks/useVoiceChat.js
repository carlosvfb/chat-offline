import { useState, useRef, useCallback } from 'react';

export const useVoiceChat = (socket, username) => {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [isChannelBusy, setIsChannelBusy] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);

  // Inicializar AudioContext
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, []);

  // Começar transmissão
  const startTransmission = useCallback(async () => {
    try {
      initAudioContext();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      socket.emit('start-voice-transmission', username);

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 96000
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          socket.emit('voice-audio-chunk', event.data);
        }
      };

      mediaRecorderRef.current.start(100); // Chunks de 100ms
      setIsTransmitting(true);

      // Vibração de feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      alert('Erro: Não foi possível acessar o microfone. Verifique as permissões.');
    }
  }, [socket, username, initAudioContext]);

  // Parar transmissão
  const stopTransmission = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      socket.emit('stop-voice-transmission');
      setIsTransmitting(false);

      // Vibração de feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    }
  }, [socket]);

  // Reproduzir fila de áudio
  const playAudioQueue = useCallback(async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const audioData = audioQueueRef.current.shift();

    try {
      const audioBlob = new Blob([audioData], { type: 'audio/webm' });
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);

      source.onended = () => {
        playAudioQueue();
      };

      source.start();
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
      playAudioQueue(); // Tentar próximo na fila
    }
  }, []);

  // Receber áudio
  const handleAudioStream = useCallback((audioData) => {
    audioQueueRef.current.push(audioData);
    if (!isPlayingRef.current) {
      playAudioQueue();
    }
  }, [playAudioQueue]);

  // Configurar listeners de socket
  const setupSocketListeners = useCallback(() => {
    if (!socket) return;

    socket.on('voice-transmission-started', ({ username: speaker }) => {
      setCurrentSpeaker(speaker);
      
      // Tocar som de alerta se não for você transmitindo
      if (speaker !== username) {
        const beep = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ8PTKXh8bllHAU7k9n0zXgrBSh+zPLaizsKGWe56+efTRAMUKfj8LVjHAY4ktfy');
        beep.play().catch(() => {});
      }
    });

    socket.on('voice-transmission-ended', () => {
      setCurrentSpeaker(null);
      setIsChannelBusy(false);
    });

    socket.on('voice-channel-busy', ({ currentSpeaker }) => {
      setIsChannelBusy(true);
      alert(`Canal ocupado! ${currentSpeaker} está transmitindo.`);
      
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
  }, [socket, username, handleAudioStream]);

  return {
    isTransmitting,
    currentSpeaker,
    isChannelBusy,
    startTransmission,
    stopTransmission,
    setupSocketListeners
  };
};