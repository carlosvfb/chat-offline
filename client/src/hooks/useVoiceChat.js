import { useState, useRef, useCallback } from 'react';

export const useVoiceChat = (socket, username) => {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [isChannelBusy, setIsChannelBusy] = useState(false);

  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const keepAliveAudioRef = useRef(null);
  
  // Para reprodução
  const playbackContextRef = useRef(null);
  const nextStartTimeRef = useRef(0);

  // Estratégia Keep-Alive para Segundo Plano
  const enableBackgroundMode = useCallback(() => {
    if (keepAliveAudioRef.current) return;

    // Áudio silencioso de 1 segundo em base64
    const SILENT_WAV = 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhBAAAAAAAAgA=';
    const audio = new Audio(SILENT_WAV);
    audio.loop = true;
    audio.volume = 0.01; // Quase mudo, mas ativo para o sistema
    
    const playAudio = () => {
      audio.play().catch(e => console.log("Background audio blocked:", e));
    };

    // Media Session API para manter o processo vivo no Android/iOS
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Rádio Chat Offline',
        artist: username,
        album: 'Ativo em Segundo Plano',
        artwork: [
          { src: '/vite.svg', sizes: '512x512', type: 'image/svg+xml' }
        ]
      });

      // Handlers vazios para evitar que o sistema pause o áudio
      navigator.mediaSession.setActionHandler('play', playAudio);
      navigator.mediaSession.setActionHandler('pause', () => {
        // Tenta dar play novamente se o sistema pausar
        setTimeout(playAudio, 1000);
      });
    }

    playAudio();
    keepAliveAudioRef.current = audio;
    console.log("Modo rádio em segundo plano ativado.");
  }, [username]);

  // Inicializar AudioContext de forma robusta
  const getAudioContext = useCallback(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    return new AudioContext();
  }, []);

  const initPlaybackContext = useCallback(async () => {
    try {
      if (!playbackContextRef.current) {
        playbackContextRef.current = getAudioContext();
      }
      if (playbackContextRef.current.state === 'suspended') {
        await playbackContextRef.current.resume();
      }
    } catch (e) {
      console.error("Erro ao iniciar playback context:", e);
    }
  }, [getAudioContext]);

  // Efeitos sonoros de rádio (Beeps)
  const playBeep = useCallback((type) => {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      
      osc.connect(gain);
      gain.connect(context.destination);
      
      if (type === 'start') {
        // Beep de início (dois tons curtos e agudos)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, context.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.15);
        osc.start();
        osc.stop(context.currentTime + 0.15);
      } else {
        // Beep de fim (tom mais grave e descendente)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, context.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.25);
        osc.start();
        osc.stop(context.currentTime + 0.25);
      }
    } catch (e) {
      console.log("Beep error:", e);
    }
  }, []);

  // Começar transmissão (PTT)
  const startTransmission = useCallback(async (e) => {
    if (e && e.cancelable) e.preventDefault();
    if (isTransmitting || currentSpeaker) return;

    playBeep('start');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextRef.current = getAudioContext();
      const sampleRate = audioContextRef.current.sampleRate;
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      // Usar buffer menor para menor latência
      processorRef.current = audioContextRef.current.createScriptProcessor(2048, 1, 1);
      
      socket.emit('start-voice-transmission', username);
      setIsTransmitting(true);

      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Enviar como Float32Array diretamente para evitar erros de conversão
        // Socket.io lida bem com buffers binários
        socket.emit('voice-audio-chunk', {
          audio: inputData.buffer,
          sampleRate: sampleRate
        });
      };

      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      if ('vibrate' in navigator) navigator.vibrate(50);
    } catch (error) {
      console.error('Erro microfone:', error);
    }
  }, [socket, username, isTransmitting, currentSpeaker, getAudioContext]);

  // Parar transmissão
  const stopTransmission = useCallback((e) => {
    if (e && e.cancelable) e.preventDefault();
    if (!isTransmitting) return;

    playBeep('end');
    setIsTransmitting(false);
    socket.emit('stop-voice-transmission');

    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      processorRef.current.disconnect();
    }
    if (sourceRef.current) sourceRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    
    if ('vibrate' in navigator) navigator.vibrate(30);
  }, [socket, isTransmitting]);

  // Reproduzir áudio recebido
  const handleAudioStream = useCallback(async (data) => {
    try {
      await initPlaybackContext();
      const context = playbackContextRef.current;
      
      // Reconstruir o buffer a partir do ArrayBuffer recebido
      const audioData = new Float32Array(data.audio);
      const audioBuffer = context.createBuffer(1, audioData.length, data.sampleRate);
      audioBuffer.getChannelData(0).set(audioData);

      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(context.destination);

      const currentTime = context.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime + 0.05; // Pequeno buffer para jitter
      }
      
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
    } catch (e) {
      console.error("Erro ao processar áudio recebido:", e);
    }
  }, [initPlaybackContext]);

  const setupSocketListeners = useCallback(() => {
    if (!socket) return;

    socket.on('voice-transmission-started', ({ username: speaker }) => {
      setCurrentSpeaker(speaker);
      nextStartTimeRef.current = 0;
      if (speaker !== username) {
        initPlaybackContext();
        playBeep('start');
      }
    });

    socket.on('voice-transmission-ended', () => {
      if (currentSpeaker && currentSpeaker !== username) {
        playBeep('end');
      }
      setCurrentSpeaker(null);
      setIsChannelBusy(false);
    });

    socket.on('voice-audio-stream', (data) => {
      if (data && data.audio) {
        handleAudioStream(data);
      }
    });

    socket.on('voice-channel-busy', () => {
      setIsChannelBusy(true);
      setTimeout(() => setIsChannelBusy(false), 2000);
    });

    return () => {
      socket.off('voice-transmission-started');
      socket.off('voice-transmission-ended');
      socket.off('voice-audio-stream');
      socket.off('voice-channel-busy');
    };
  }, [socket, username, handleAudioStream, initPlaybackContext]);

  return {
    isTransmitting,
    currentSpeaker,
    isChannelBusy,
    startTransmission,
    stopTransmission,
    setupSocketListeners,
    enableBackgroundMode
  };
};