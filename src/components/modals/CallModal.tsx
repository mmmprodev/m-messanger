import React, { useState, useEffect } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react';
import { Avatar } from '../common/Avatar';

interface CallModalProps {
  contactName: string;
  contactAvatar?: string;
  contactColor?: string;
  isVideo?: boolean;
  onClose: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  contactName,
  contactAvatar,
  contactColor = '#65aadd',
  isVideo = false,
  onClose
}) => {
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(isVideo);
  const [status, setStatus] = useState<'connecting' | 'ringing' | 'connected'>('connecting');

  useEffect(() => {
    const ringTimeout = setTimeout(() => {
      setStatus('ringing');
    }, 1200);

    const connectTimeout = setTimeout(() => {
      setStatus('connected');
    }, 3200);

    return () => {
      clearTimeout(ringTimeout);
      clearTimeout(connectTimeout);
    };
  }, []);

  useEffect(() => {
    let interval: any;
    if (status === 'connected') {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0e1621]/95 backdrop-blur-md flex flex-col items-center justify-between p-8 select-none animate-in fade-in duration-300">
      {/* Encryption Header */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/40">
          <span>🔒 Telegram uchdan-uchga shifrlangan qo'ng'iroq</span>
        </div>
        <p className="text-white/60 text-xs mt-1">🔑 Kalit emojilari: 🍋 ⚡ 🐬 🍓</p>
      </div>

      {/* Main Avatar / Video Area */}
      <div className="flex flex-col items-center gap-5 my-auto">
        <div className="relative">
          <Avatar
            name={contactName}
            avatarUrl={contactAvatar}
            color={contactColor}
            size="xl"
            className="w-28 h-28 ring-4 ring-white/10"
          />
          {status === 'ringing' && (
            <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-60 pointer-events-none" />
          )}
        </div>

        <div className="text-center">
          <h3 className="text-2xl font-semibold text-white tracking-wide">{contactName}</h3>
          <p className="text-sm text-white/70 mt-1 font-mono">
            {status === 'connecting' && 'Ulanmoqda...'}
            {status === 'ringing' && 'Gudok ketmoqda...'}
            {status === 'connected' && formatTime(duration)}
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-6 pb-6">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={isMuted ? 'Mikrofonni yoqish' : 'Ovozsiz qilish'}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button
          onClick={() => setIsCameraOn(!isCameraOn)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            !isCameraOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-[#2481cc] text-white'
          }`}
          title={isCameraOn ? 'Kamerani o\'chirish' : 'Kamerani yoqish'}
        >
          {isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </button>

        <button
          onClick={onClose}
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
          title="Qo'ng'iroqni tugatish"
        >
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
