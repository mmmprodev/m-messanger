import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Sparkles, User as UserIcon, Lock, AtSign } from 'lucide-react';

const AVATAR_COLORS = [
  '#8b5cf6', '#d946ef', '#ec4899', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b'
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
    <div className="fixed inset-0 z-50 bg-[#090714] flex items-center justify-center p-4 select-none overflow-y-auto">
      {/* Ambient background glows */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-[120px] pointer-events-none -top-20 -left-20" />
      <div className="absolute w-[450px] h-[450px] rounded-full bg-fuchsia-600/15 blur-[120px] pointer-events-none -bottom-20 -right-20" />

      <div className="w-full max-w-md glass-panel rounded-3xl shadow-2xl border border-violet-500/25 p-7 sm:p-9 flex flex-col items-center relative z-10">
        {/* m.messages Brand Logo */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-500 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.45)] mb-4 ring-2 ring-white/20">
          <span className="text-white text-3xl font-black tracking-tight">m.</span>
        </div>

        <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-violet-100 via-white to-fuchsia-200 bg-clip-text text-transparent">
          m.messages
        </h2>
        <p className="text-xs text-violet-300/70 mt-1 text-center font-medium">
          Ultra-tezkor, xavfsiz va zamonaviy real-time messenjer
        </p>

        {/* Tab switch */}
        <div className="w-full grid grid-cols-2 bg-violet-950/50 p-1.5 rounded-2xl mt-6 border border-violet-500/20">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md glow-primary'
                : 'text-violet-300/70 hover:text-white'
            }`}
          >
            Kirish
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md glow-primary'
                : 'text-violet-300/70 hover:text-white'
            }`}
          >
            Ro'yxatdan o'tish
          </button>
        </div>

        {error && (
          <div className="w-full mt-4 p-3 bg-red-500/15 border border-red-500/30 rounded-2xl text-red-300 text-xs text-center font-semibold animate-in fade-in">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full mt-5 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-violet-300/80 mb-1.5">
                To'liq ismingiz *
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-violet-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Masalan: Sardor Rahimov"
                  className="w-full glass-input rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-violet-400/40 focus:outline-none focus:border-violet-500 transition-colors"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-violet-300/80 mb-1.5">
              Foydalanuvchi nomi (@username) *
            </label>
            <div className="relative">
              <AtSign className="absolute left-3.5 top-3 w-4 h-4 text-violet-400" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="masalan: sardor_dev"
                className="w-full glass-input rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-violet-400/40 focus:outline-none focus:border-violet-500 transition-colors lowercase"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-violet-300/80 mb-1.5">
              Parol *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-violet-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full glass-input rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-violet-400/40 focus:outline-none focus:border-violet-500 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-violet-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-violet-300/80 mb-1.5">
                  Bio / Status (ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Hey there! I am using m.messages"
                  className="w-full glass-input rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-violet-400/40 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-violet-300/80 mb-2">
                  Avatar rangi
                </label>
                <div className="flex items-center gap-2.5">
                  {AVATAR_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAvatarColor(c)}
                      className={`w-7 h-7 rounded-xl transition-transform ${
                        avatarColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#090714]' : 'opacity-75 hover:opacity-100'
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
            className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:opacity-95 active:scale-[0.99] text-white py-3 rounded-2xl font-bold text-sm transition-all shadow-lg glow-primary flex items-center justify-center gap-2 mt-3 disabled:opacity-50"
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
        <div className="w-full mt-6 pt-5 border-t border-violet-500/15">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-violet-300 flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
              Tezkor demo hisoblar:
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemo('durov')}
              className="px-3 py-2 bg-violet-950/40 hover:bg-violet-900/40 border border-violet-500/20 rounded-xl text-left transition-colors disabled:opacity-50"
            >
              <div className="font-bold text-white truncate">Pavel Durov</div>
              <div className="text-[11px] text-violet-400">@durov</div>
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemo('alisher_dev')}
              className="px-3 py-2 bg-violet-950/40 hover:bg-violet-900/40 border border-violet-500/20 rounded-xl text-left transition-colors disabled:opacity-50"
            >
              <div className="font-bold text-white truncate">Alisher Qodirov</div>
              <div className="text-[11px] text-violet-400">@alisher_dev</div>
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemo('dildora_art')}
              className="px-3 py-2 bg-violet-950/40 hover:bg-violet-900/40 border border-violet-500/20 rounded-xl text-left transition-colors disabled:opacity-50"
            >
              <div className="font-bold text-white truncate">Dildora K.</div>
              <div className="text-[11px] text-violet-400">@dildora_art</div>
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGuestQuick}
              className="px-3 py-2 bg-gradient-to-r from-violet-600/25 to-fuchsia-600/25 hover:from-violet-600/35 hover:to-fuchsia-600/35 border border-fuchsia-500/35 rounded-xl text-left transition-all text-fuchsia-200 disabled:opacity-50"
            >
              <div className="font-bold truncate">⚡ Yangi Mehmon</div>
              <div className="text-[11px] text-fuchsia-300/80">1 soniyada kirish</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
