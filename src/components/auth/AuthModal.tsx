import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Send, Eye, EyeOff, Sparkles, User as UserIcon, Lock, AtSign } from 'lucide-react';

const AVATAR_COLORS = [
  '#e17076', '#faa357', '#a695e7', '#7bc862', '#6ec9cb', '#65aadd', '#ee7aae'
];

export const AuthModal: React.FC = () => {
  const { login, register, guestLogin, isLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (mode === 'login') {
        if (!username || !password) {
          setError('Username va parolni kiriting');
          return;
        }
        await login(username, password);
      } else {
        if (!username || !displayName || !password) {
          setError('Barcha majburiy maydonlarni to\'ldiring');
          return;
        }
        await register({
          username,
          displayName,
          password,
          avatarColor,
          bio
        });
      }
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    }
  };

  const handleQuickDemo = async (demoUsername: string, pass: string = '123456') => {
    setError(null);
    try {
      await login(demoUsername, pass);
    } catch (err: any) {
      setError(err.message || 'Demo profilga kirib bo\'lmadi');
    }
  };

  const handleGuestQuick = async () => {
    setError(null);
    try {
      await guestLogin();
    } catch (err: any) {
      setError(err.message || 'Mehmon sifatida kirib bo\'lmadi');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0e1621] flex items-center justify-center p-4 select-none overflow-y-auto">
      <div className="w-full max-w-md bg-[#17212b] rounded-2xl shadow-2xl border border-white/5 p-6 sm:p-8 flex flex-col items-center">
        {/* Telegram Icon Logo */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#229ed9] to-[#2aafee] flex items-center justify-center shadow-lg shadow-[#2481cc]/25 mb-4">
          <Send className="w-10 h-10 text-white -rotate-12 translate-x-0.5" />
        </div>

        <h2 className="text-2xl font-bold text-white tracking-wide">Telegram Web</h2>
        <p className="text-xs text-[#708499] mt-1 text-center">
          Xavfsiz va tezkor real-time messenjer
        </p>

        {/* Tab switch */}
        <div className="w-full grid grid-cols-2 bg-[#0e1621] p-1 rounded-xl mt-6 border border-white/5">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`py-2 text-sm font-medium rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-[#2481cc] text-white shadow-md'
                : 'text-[#708499] hover:text-white'
            }`}
          >
            Kirish
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`py-2 text-sm font-medium rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-[#2481cc] text-white shadow-md'
                : 'text-[#708499] hover:text-white'
            }`}
          >
            Ro'yxatdan o'tish
          </button>
        </div>

        {error && (
          <div className="w-full mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-medium animate-in fade-in">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full mt-5 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-[#708499] mb-1.5">
                To'liq ismingiz *
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-[#708499]" />
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Masalan: Sardor Rahimov"
                  className="w-full bg-[#0e1621] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-[#708499] focus:outline-none focus:border-[#2481cc] transition-colors"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#708499] mb-1.5">
              Username (@username) *
            </label>
            <div className="relative">
              <AtSign className="absolute left-3.5 top-3 w-4 h-4 text-[#708499]" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="masalan: sardor_dev"
                className="w-full bg-[#0e1621] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-[#708499] focus:outline-none focus:border-[#2481cc] transition-colors lowercase"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#708499] mb-1.5">
              Parol *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#708499]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0e1621] border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-[#708499] focus:outline-none focus:border-[#2481cc] transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-[#708499] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#708499] mb-1.5">
                  Bio / Status (ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Hey there! I am using Telegram"
                  className="w-full bg-[#0e1621] border border-white/10 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-[#708499] focus:outline-none focus:border-[#2481cc] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#708499] mb-2">
                  Avatar rangi
                </label>
                <div className="flex items-center gap-2.5">
                  {AVATAR_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAvatarColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        avatarColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#17212b]' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2481cc] hover:bg-[#1f73b8] active:scale-[0.99] text-white py-3 rounded-xl font-medium text-sm transition-all shadow-md shadow-[#2481cc]/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mode === 'login' ? (
              'Kirish'
            ) : (
              'Hisob yaratish'
            )}
          </button>
        </form>

        {/* Demo Fast Logins Section */}
        <div className="w-full mt-6 pt-5 border-t border-white/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#708499] flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Tezkor demo foydalanuvchilar:
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickDemo('durov')}
              className="px-3 py-2 bg-[#0e1621] hover:bg-[#202b36] border border-white/5 rounded-xl text-left transition-colors"
            >
              <div className="font-semibold text-white truncate">Pavel Durov</div>
              <div className="text-[11px] text-[#708499]">@durov</div>
            </button>
            <button
              onClick={() => handleQuickDemo('alisher_dev')}
              className="px-3 py-2 bg-[#0e1621] hover:bg-[#202b36] border border-white/5 rounded-xl text-left transition-colors"
            >
              <div className="font-semibold text-white truncate">Alisher Qodirov</div>
              <div className="text-[11px] text-[#708499]">@alisher_dev</div>
            </button>
            <button
              onClick={() => handleQuickDemo('dildora_art')}
              className="px-3 py-2 bg-[#0e1621] hover:bg-[#202b36] border border-white/5 rounded-xl text-left transition-colors"
            >
              <div className="font-semibold text-white truncate">Dildora K.</div>
              <div className="text-[11px] text-[#708499]">@dildora_art</div>
            </button>
            <button
              onClick={handleGuestQuick}
              className="px-3 py-2 bg-[#2481cc]/15 hover:bg-[#2481cc]/25 border border-[#2481cc]/30 rounded-xl text-left transition-colors text-[#65aadd]"
            >
              <div className="font-semibold truncate">⚡ Yangi Mehmon</div>
              <div className="text-[11px] opacity-80">1 soniyada kirish</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
