import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { X, Copy, Check, Shield, User, AtSign, FileText, Palette, LogOut, Share2, Sparkles } from 'lucide-react';

const AVATAR_COLORS = [
  '#e17076', '#faa357', '#a695e7', '#7bc862', '#6ec9cb', '#8b5cf6', '#d946ef', '#38bdf8'
];

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { user, updateProfile, logout } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || AVATAR_COLORS[0]);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!user) return null;

  // Direct chat invite link
  const inviteLink = `${window.location.origin}/?user=${user.username}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSaving(true);

    try {
      await updateProfile({
        displayName: displayName.trim(),
        username: username.trim(),
        bio: bio.trim(),
        avatarColor
      });
      setSuccessMsg('Profil muvaffaqiyatli saqlandi!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Saqlashda xatolik yuz berdi');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#130d26]/95 border border-violet-500/25 rounded-3xl shadow-[0_10px_40px_rgba(139,92,246,0.25)] flex flex-col max-h-[90vh] overflow-hidden backdrop-blur-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-violet-500/15">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-black">m.</span>
            </div>
            <h3 className="text-base font-extrabold text-white">Sozlamalar va Profil</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-violet-300 hover:text-white hover:bg-violet-600/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Avatar and Info Header */}
          <div className="flex flex-col items-center gap-3">
            <Avatar
              name={displayName || user.displayName}
              color={avatarColor}
              size="xl"
              className="ring-4 ring-violet-500/30 shadow-xl"
            />
            <div className="text-center">
              <h2 className="text-xl font-black text-white">{displayName || user.displayName}</h2>
              <p className="text-xs text-violet-300 font-mono">@{username || user.username}</p>
            </div>
          </div>

          {/* Direct chat link card */}
          <div className="bg-[#0b0816]/80 p-4.5 rounded-2xl border border-violet-500/30 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-violet-300">
                <Share2 className="w-4 h-4 text-fuchsia-400" />
                Sizning shaxsiy lichka havolangiz:
              </div>
              {copied && (
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Nusxalandi!
                </span>
              )}
            </div>
            <p className="text-xs text-violet-300/70">
              Ushbu havolani do'stingizga yuboring, u havola orqali to'g'ridan-to'g'ri siz bilan lichka chat ochadi:
            </p>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 bg-[#150f29] border border-violet-500/25 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-violet-600/30"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                Nusxalash
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs text-center font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs text-center font-medium">
              {successMsg}
            </div>
          )}

          {/* Edit Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-violet-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-violet-400" /> Ism
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-[#0b0816] border border-violet-500/25 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-300 mb-1.5 flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-violet-400" /> Foydalanuvchi nomi (@username)
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="w-full bg-[#0b0816] border border-violet-500/25 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 lowercase font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-violet-400" /> Bio / Status
              </label>
              <input
                type="text"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="O'zingiz haqingizda bir necha so'z..."
                className="w-full bg-[#0b0816] border border-violet-500/25 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-violet-400/40 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-violet-300 mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-violet-400" /> Avatar rangi
              </label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {AVATAR_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      avatarColor === c
                        ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#130d26]'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-95 text-white py-3 rounded-2xl font-bold text-xs transition-all shadow-md shadow-violet-600/30 disabled:opacity-50"
              >
                {isSaving ? 'Saqlanmoqda...' : "O'zgarishlarni saqlash"}
              </button>
            </div>
          </form>

          {/* Security badge */}
          <div className="bg-[#0b0816]/60 p-3.5 rounded-2xl flex items-center gap-3 border border-violet-500/20">
            <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-[11px] text-violet-300/80">
              m.messages shaxsiy kalitlar va xavfsiz protokollar orqali himoyalangan. Barcha xabarlar va media fayllar himoyada.
            </p>
          </div>

          {/* Logout button */}
          <div className="pt-2 border-t border-violet-500/15">
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-red-500/20"
            >
              <LogOut className="w-4 h-4" />
              Tizimdan chiqish (Log out)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
