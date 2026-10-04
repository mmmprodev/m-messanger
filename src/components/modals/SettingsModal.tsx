import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { X, Copy, Check, Shield, User, AtSign, FileText, Palette, LogOut, Share2 } from 'lucide-react';

const AVATAR_COLORS = [
  '#e17076', '#faa357', '#a695e7', '#7bc862', '#6ec9cb', '#65aadd', '#ee7aae'
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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#17212b] rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#17212b]">
          <h3 className="text-base font-semibold text-white">Sozlamalar</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#708499] hover:text-white hover:bg-white/10 transition-colors"
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
              className="ring-4 ring-white/10 shadow-lg"
            />
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">{displayName || user.displayName}</h2>
              <p className="text-xs text-[#65aadd] font-mono">@{username || user.username}</p>
            </div>
          </div>

          {/* Direct chat link card */}
          <div className="bg-[#0e1621] p-4 rounded-xl border border-[#2481cc]/20 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#65aadd]">
                <Share2 className="w-4 h-4" />
                Sizning shaxsiy lichka havolangiz:
              </div>
              {copied && (
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Nusxalandi!
                </span>
              )}
            </div>
            <p className="text-xs text-[#708499]">
              Ushbu havolani do'stingizga yuborsangiz, u havola orqali to'g'ridan-to'g'ri siz bilan chat ochadi:
            </p>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 bg-[#17212b] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white/90 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2 bg-[#2481cc] hover:bg-[#1f73b8] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                Nusxalash
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs text-center font-medium">
              {successMsg}
            </div>
          )}

          {/* Edit Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#708499] mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Ism
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-[#0e1621] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#2481cc]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#708499] mb-1.5 flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5" /> Foydalanuvchi nomi (@username)
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="w-full bg-[#0e1621] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#2481cc] lowercase font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#708499] mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Bio / Status
              </label>
              <input
                type="text"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="O'zingiz haqingizda bir necha so'z..."
                className="w-full bg-[#0e1621] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#2481cc]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#708499] mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Avatar rangi
              </label>
              <div className="flex items-center gap-2.5">
                {AVATAR_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    className={`w-7 h-7 rounded-full transition-all ${
                      avatarColor === c
                        ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#17212b]'
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
                className="w-full bg-[#2481cc] hover:bg-[#1f73b8] text-white py-2.5 rounded-xl font-medium text-xs transition-colors shadow-md disabled:opacity-50"
              >
                {isSaving ? 'Saqlanmoqda...' : 'O\'zgarishlarni saqlash'}
              </button>
            </div>
          </form>

          {/* Security badge */}
          <div className="bg-[#0e1621] p-3.5 rounded-xl flex items-center gap-3 border border-white/5">
            <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-[11px] text-[#708499]">
              Telegram Cloud xavfsiz protokol bilan himoyalangan. Barcha xabarlar va media shifrlangan.
            </p>
          </div>

          {/* Logout button */}
          <div className="pt-2 border-t border-white/5">
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors"
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
