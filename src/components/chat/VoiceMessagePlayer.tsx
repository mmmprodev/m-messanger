import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, AlertCircle, RotateCcw } from 'lucide-react';

interface VoiceMessagePlayerProps {
  audioUrl: string;
  duration?: number;
  waveform?: number[];
  isOutgoing?: boolean;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  audioUrl,
  duration = 0,
  waveform,
  isOutgoing = false
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(duration || 0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Synchronize duration if prop updates
  useEffect(() => {
    if (duration && duration > 0) {
      setTotalDuration(prev => (prev > 0 ? prev : duration));
    }
  }, [duration]);

  // Default synthetic waveform bars if none provided
  const bars = waveform && waveform.length > 0 ? waveform : [
    25, 45, 75, 40, 85, 60, 95, 70, 45, 80, 90, 50, 70, 100, 35, 55, 75, 45, 65, 40, 85, 55, 75, 35
  ];

  // Reset state when audioUrl changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setHasError(false);
    setIsLoading(false);
  }, [audioUrl]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        setHasError(false);
        setIsLoading(true);

        // If audio has ended, rewind to beginning
        if (audio.currentTime >= (audio.duration || totalDuration) || audio.ended) {
          audio.currentTime = 0;
          setCurrentTime(0);
        }

        audio.playbackRate = playbackRate;
        await audio.play();
        setIsPlaying(true);
        setIsLoading(false);
      } catch (err: any) {
        console.warn('Audio play attempt 1 failed, retrying with reload:', err);
        try {
          audio.load();
          audio.playbackRate = playbackRate;
          await audio.play();
          setIsPlaying(true);
          setIsLoading(false);
        } catch (retryErr) {
          console.error('Audio play failed:', retryErr);
          setIsLoading(false);
          setHasError(true);
        }
      }
    }
  };

  const handleSpeedToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const effectiveDur = totalDuration > 0 ? totalDuration : (audio.duration && !isNaN(audio.duration) ? audio.duration : 10);
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * effectiveDur;

    try {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    } catch (err) {
      console.warn('Error setting currentTime:', err);
    }
  };

  const formatSeconds = (sec: number) => {
    const val = Math.max(0, Math.round(sec));
    const m = Math.floor(val / 60);
    const s = Math.floor(val % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const effectiveTotal = totalDuration > 0 ? totalDuration : (duration > 0 ? duration : 0);
  const progress = effectiveTotal > 0 ? currentTime / effectiveTotal : 0;

  return (
    <div className="flex items-center gap-3 py-1 select-none min-w-[240px] max-w-[300px]">
      {/* Hidden native HTML5 audio element rendered inside the DOM tree */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        playsInline
        onLoadedMetadata={(e) => {
          const audio = e.currentTarget;
          if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity && audio.duration > 0) {
            setTotalDuration(audio.duration);
          }
        }}
        onTimeUpdate={(e) => {
          const audio = e.currentTarget;
          setCurrentTime(audio.currentTime);
          if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity && audio.duration > 0) {
            setTotalDuration(audio.duration);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => {
          console.warn('Audio element error for URL:', audioUrl);
          setHasError(true);
          setIsLoading(false);
        }}
      />

      {/* Play / Pause / Retry Button */}
      <button
        type="button"
        onClick={togglePlay}
        disabled={isLoading}
        className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95 flex-shrink-0 shadow-md ${
          isOutgoing
            ? 'bg-white text-violet-700 hover:bg-violet-50 hover:shadow-violet-400/30'
            : 'bg-gradient-to-tr from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-violet-600/30'
        }`}
        title={isPlaying ? 'Pauza' : hasError ? 'Qayta urinish' : 'Eshitish'}
      >
        {isLoading ? (
          <span className={`w-4 h-4 rounded-full border-2 border-t-transparent animate-spin ${isOutgoing ? 'border-violet-700' : 'border-white'}`} />
        ) : hasError ? (
          <RotateCcw className="w-4 h-4" />
        ) : isPlaying ? (
          <Pause className="w-5 h-5 fill-current" />
        ) : (
          <Play className="w-5 h-5 fill-current translate-x-0.5" />
        )}
      </button>

      {/* Waveform and Progress Bar */}
      <div className="flex-1 flex flex-col justify-center gap-1.5 cursor-pointer" onClick={handleWaveformClick}>
        <div className="flex items-center gap-[2.5px] h-7">
          {bars.map((val, idx) => {
            const barProgress = idx / bars.length;
            const isPlayed = barProgress <= progress;
            const barHeight = Math.max(16, Math.min(100, val));

            return (
              <div
                key={idx}
                className={`w-[3px] rounded-full transition-all duration-150 ${
                  isPlaying && isPlayed ? 'animate-pulse' : ''
                }`}
                style={{
                  height: `${barHeight}%`,
                  backgroundColor: isPlayed
                    ? (isOutgoing ? '#ffffff' : '#c084fc')
                    : (isOutgoing ? 'rgba(255, 255, 255, 0.45)' : 'rgba(167, 139, 250, 0.35)')
                }}
              />
            );
          })}
        </div>

        {/* Time and Speed */}
        <div className="flex items-center justify-between text-[11px] font-mono font-medium opacity-90">
          <span className={isOutgoing ? 'text-white' : 'text-violet-300 dark:text-violet-200'}>
            {formatSeconds(isPlaying ? currentTime : (effectiveTotal || 0))}
          </span>

          <div className="flex items-center gap-1.5">
            {hasError && (
              <span className="text-[10px] text-amber-300 flex items-center gap-0.5 font-sans" title="Audio yuklanmadi, qayta bosing">
                <AlertCircle className="w-3 h-3" /> Qayta
              </span>
            )}
            <button
              type="button"
              onClick={handleSpeedToggle}
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-sans font-bold transition-colors ${
                playbackRate > 1
                  ? (isOutgoing ? 'bg-white/30 text-white' : 'bg-violet-500/30 text-violet-200')
                  : (isOutgoing ? 'hover:bg-white/20 text-white/80' : 'hover:bg-violet-500/20 text-violet-300')
              }`}
            >
              {playbackRate}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
