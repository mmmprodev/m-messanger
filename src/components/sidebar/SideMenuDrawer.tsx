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
  HelpCircle
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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex select-none animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-72 sm:w-80 h-full bg-[#17212b] shadow-2xl flex flex-col animate-in slide-in-from-left duration-250 border-r border-white/5"
        onClick={e => e.stopPropagation()}
      >
        {/* User Banner Header */}
        <div className="p-5 bg-gradient-to-b from-[#2481cc]/20 to-[#17212b] border-b border-white/5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-[#708499] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <Avatar
            name={user.displayName}
            avatarUrl={user.avatar}
            color={user.avatarColor}
            size="lg"
            className="mb-3 ring-2 ring-[#2481cc]/40"
          />

          <h3 className="text-base font-bold text-white truncate">{user.displayName}</h3>
          <p className="text-xs text-[#65aadd] font-mono mt-0.5">@{user.username}</p>
          {user.bio && (
            <p className="text-[11px] text-[#708499] mt-2 line-clamp-2 leading-relaxed">
              {user.bio}
            </p>
          )}
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 text-sm text-white">
          <button
            onClick={handleOpenSavedMessages}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl hover:bg-[#202b36] transition-colors text-left"
          >
            <Bookmark className="w-5 h-5 text-[#65aadd]" />
            <span className="font-medium">Saqlangan xabarlar</span>
          </button>

          <button
            onClick={() => {
              onOpenNewChat();
              onClose();
            }}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl hover:bg-[#202b36] transition-colors text-left"
          >
            <Users className="w-5 h-5 text-[#7bc862]" />
            <span className="font-medium">Yangi guruh</span>
          </button>

          <button
            onClick={handleCopyInviteLink}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-[#202b36] transition-colors text-left"
          >
            <div className="flex items-center gap-3.5">
              <Share2 className="w-5 h-5 text-[#faa357]" />
              <span className="font-medium">Lichka havolasini ulashish</span>
            </div>
            {copiedLink && <Check className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={onToggleTheme}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-[#202b36] transition-colors text-left"
          >
            <div className="flex items-center gap-3.5">
              {isDarkMode ? <Moon className="w-5 h-5 text-[#a695e7]" /> : <Sun className="w-5 h-5 text-amber-400" />}
              <span className="font-medium">Tungi rejim</span>
            </div>
            <span className={`w-8 h-4 rounded-full transition-colors relative ${isDarkMode ? 'bg-[#2481cc]' : 'bg-[#708499]'}`}>
              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isDarkMode ? 'left-4.5' : 'left-0.5'}`} />
            </span>
          </button>

          <button
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl hover:bg-[#202b36] transition-colors text-left"
          >
            <Settings className="w-5 h-5 text-[#708499]" />
            <span className="font-medium">Sozlamalar</span>
          </button>

          <div className="pt-2 my-2 border-t border-white/5" />

          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors text-left"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Tizimdan chiqish</span>
          </button>
        </div>

        {/* Footer version */}
        <div className="p-4 border-t border-white/5 text-[11px] text-[#708499] flex items-center justify-between">
          <span>Telegram Web Real-Time</span>
          <span className="text-[#65aadd] font-mono">v2.4.0</span>
        </div>
      </div>
    </div>
  );
};
