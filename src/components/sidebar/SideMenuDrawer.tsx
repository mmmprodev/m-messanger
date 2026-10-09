import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';
import {
  Bookmark,
  Users,
  Settings,
  Moon,
  Sun,
  Share2,
  LogOut,
  X,
  Check,
  Shield,
  Sparkles
} from 'lucide-react';

interface SideMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenNewChat: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const SideMenuDrawer: React.FC<SideMenuDrawerProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenNewChat,
  isDarkMode,
  onToggleTheme
}) => {
  const { user, logout } = useAuth();
  const { chats, setActiveChatId } = useChat();
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !user) return null;

  const inviteLink = `${window.location.origin}/?user=${user.username}`;

  const handleOpenSavedMessages = () => {
    const savedChat = chats.find(c => c.type === 'saved');
    if (savedChat) {
      setActiveChatId(savedChat.id);
    }
    onClose();
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex select-none animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-72 sm:w-80 h-full bg-[#120c24]/95 border-r border-violet-500/20 shadow-2xl flex flex-col animate-in slide-in-from-left duration-250 backdrop-blur-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* User Banner Header */}
        <div className="p-6 bg-gradient-to-b from-violet-900/30 via-purple-900/20 to-transparent border-b border-violet-500/15 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-violet-300 hover:text-white hover:bg-violet-600/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <Avatar
            name={user.displayName}
            avatarUrl={user.avatar}
            color={user.avatarColor}
            size="lg"
            className="mb-3.5 ring-2 ring-violet-500/40 shadow-lg"
          />

          <h3 className="text-base font-extrabold text-white truncate">{user.displayName}</h3>
          <p className="text-xs text-violet-300 font-mono mt-0.5">@{user.username}</p>
          {user.bio && (
            <p className="text-[11px] text-violet-300/70 mt-2 line-clamp-2 leading-relaxed">
              {user.bio}
            </p>
          )}
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 text-sm text-white">
          <button
            onClick={handleOpenSavedMessages}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl hover:bg-violet-600/15 transition-all text-left"
          >
            <Bookmark className="w-5 h-5 text-violet-400" />
            <span className="font-semibold text-xs text-violet-100">Saqlangan xabarlar</span>
          </button>

          <button
            onClick={() => {
              onOpenNewChat();
              onClose();
            }}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl hover:bg-violet-600/15 transition-all text-left"
          >
            <Users className="w-5 h-5 text-fuchsia-400" />
            <span className="font-semibold text-xs text-violet-100">Yangi guruh ochish</span>
          </button>

          <button
            onClick={handleCopyInviteLink}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl hover:bg-violet-600/15 transition-all text-left"
          >
            <div className="flex items-center gap-3.5">
              <Share2 className="w-5 h-5 text-purple-400" />
              <span className="font-semibold text-xs text-violet-100">Lichka havolasini ulashish</span>
            </div>
            {copiedLink && <Check className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={onToggleTheme}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl hover:bg-violet-600/15 transition-all text-left"
          >
            <div className="flex items-center gap-3.5">
              {isDarkMode ? <Moon className="w-5 h-5 text-violet-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
              <span className="font-semibold text-xs text-violet-100">
                {isDarkMode ? "Qorong'u rejim (Premium Fioletoviy)" : "Yorug' rejim (Och tus)"}
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold text-violet-400 bg-violet-600/20 px-2 py-0.5 rounded-md">
              {isDarkMode ? 'Dark' : 'Light'}
            </span>
          </button>

          <button
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl hover:bg-violet-600/15 transition-all text-left"
          >
            <Settings className="w-5 h-5 text-violet-400" />
            <span className="font-semibold text-xs text-violet-100">Sozlamalar</span>
          </button>
        </div>

        {/* Brand & Logout Footer */}
        <div className="p-4 border-t border-violet-500/15 bg-violet-950/20 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-xs">
              <span className="text-white text-[10px] font-black">m.</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-white">m.messages</span>
              <span className="text-[10px] text-violet-300/70">Xavfsiz va shifrlangan</span>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-red-500/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            Chiqish
          </button>
        </div>
      </div>
    </div>
  );
};
