import { useState, useRef, useEffect, useCallback } from 'react';

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const animFrameRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const waveformSamplesRef = useRef<number[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      waveformSamplesRef.current = [];
      setDuration(0);
      setWaveformData([]);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // AudioContext for visual waveform
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      // Try webm, then mp4, or fallback
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setDuration(elapsed);
      }, 100);

      // Analyze waveform repeatedly
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateWaveform = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Scale from 0-255 to 15-100
          const barHeight = Math.max(15, Math.min(100, Math.round((avg / 255) * 100)));
          waveformSamplesRef.current.push(barHeight);
          // Keep up to 28 bars
          if (waveformSamplesRef.current.length > 28) {
            waveformSamplesRef.current.shift();
          }
          setWaveformData([...waveformSamplesRef.current]);
        }
        animFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      setError(err.name === 'NotAllowedError' ? 'Mikrofonga ruxsat berilmadi' : 'Mikrofon xatosi: ' + err.message);
      setIsRecording(false);
    }
  }, []);

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current);
    cancelAnimationFrame(animFrameRef.current);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const stopRecording = useCallback((): Promise<{ blob: Blob; duration: number; waveform: number[] } | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        cleanup();
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const finalDuration = duration;
        const finalWaveform = waveformSamplesRef.current.length > 0
          ? [...waveformSamplesRef.current]
          : [20, 40, 60, 80, 50, 70, 90, 40, 60, 30, 80, 50];

        cleanup();
        resolve({ blob, duration: finalDuration, waveform: finalWaveform });
      };

      mediaRecorderRef.current.stop();
    });
  }, [cleanup, duration]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {};
      mediaRecorderRef.current.stop();
    }
    cleanup();
    setDuration(0);
    setWaveformData([]);
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isRecording,
    duration,
    waveformData,
    error,
    startRecording,
    stopRecording,
    cancelRecording
  };
}
