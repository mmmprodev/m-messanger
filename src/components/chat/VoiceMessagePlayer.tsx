import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

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
  const [totalDuration, setTotalDuration] = useState<number>(duration);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate synthetic waveform bars if none provided
  const bars = waveform && waveform.length > 0 ? waveform : [
    20, 45, 70, 30, 80, 50, 90, 60, 40, 75, 85, 40, 65, 95, 30, 50, 70, 40, 60, 35, 80, 50, 70, 30
  ];

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setTotalDuration(audio.duration);
      }
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Audio play error:', err);
      });
    }
  };

  const handleSpeedToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    audioRef.current.playbackRate = nextRate;
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * totalDuration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = totalDuration > 0 ? currentTime / totalDuration : 0;

  return (
    <div className="flex items-center gap-3 py-1 select-none min-w-[220px] max-w-[280px]">
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95 flex-shrink-0 shadow-md ${
          isOutgoing ? 'bg-[#5da0da] hover:bg-[#4d90ca] text-white' : 'bg-[#2b5278] hover:bg-[#33618d] text-white'
        }`}
        title={isPlaying ? 'Pauza' : 'Ijro etish'}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 fill-current" />
        ) : (
          <Play className="w-5 h-5 fill-current translate-x-0.5" />
        )}
      </button>

      {/* Waveform and Progress Bar */}
      <div className="flex-1 flex flex-col justify-center gap-1.5 cursor-pointer" onClick={handleWaveformClick}>
        <div className="flex items-center gap-[2px] h-7">
          {bars.map((val, idx) => {
            const barProgress = idx / bars.length;
            const isPlayed = barProgress <= progress;
            const barHeight = Math.max(15, Math.min(100, val));

            return (
              <div
                key={idx}
                className="w-[3px] rounded-full transition-colors duration-150"
                style={{
                  height: `${barHeight}%`,
                  backgroundColor: isPlayed
                    ? (isOutgoing ? '#ffffff' : '#5da0da')
                    : (isOutgoing ? 'rgba(255, 255, 255, 0.4)' : 'rgba(112, 132, 153, 0.4)')
                }}
              />
            );
          })}
        </div>

        {/* Time and Speed */}
        <div className="flex items-center justify-between text-[11px] font-mono opacity-80">
          <span>{formatSeconds(isPlaying ? currentTime : (totalDuration || duration))}</span>
          <button
            onClick={handleSpeedToggle}
            className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold transition-colors ${
              playbackRate > 1
                ? 'bg-white/20 text-white'
                : 'hover:bg-white/10 text-white/70'
            }`}
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
};
