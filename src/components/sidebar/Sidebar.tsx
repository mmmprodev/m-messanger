import React from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import {
  Menu,
  Search,
  X,
  Edit3,
  Bookmark,
  Users,
  Check,
  CheckCheck,
  Mic,
  Image as ImageIcon,
  FileText,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  onOpenMenu: () => void;
  onOpenNewChat: () => void;
  isMobileChatOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenMenu,
  onOpenNewChat,
  isMobileChatOpen
}) => {
  const {
    chats,
    activeChatId,
    setActiveChatId,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    typingMap,
    userStatusMap,
    isLoadingChats
  } = useChat();

  const { user: currentUser } = useAuth();

  // Filter chats by tab and search
  const filteredChats = chats.filter(chat => {
    // 1. Tab filter
    if (activeTab === 'personal' && chat.type !== 'direct') return false;
    if (activeTab === 'groups' && chat.type !== 'group') return false;
    if (activeTab === 'unread' && (!chat.unreadCount || chat.unreadCount === 0)) return false;

    // 2. Search filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const otherUser = (chat as any).otherUser;
    const searchTarget = chat.type === 'direct' && otherUser ? otherUser.displayName : chat.title;

    return (
      searchTarget.toLowerCase().includes(q) ||
      (chat.lastMessage && chat.lastMessage.text.toLowerCase().includes(q))
    );
  });

  const totalUnread = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const formatMessageTime = (ts?: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Kecha';
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <aside
      className={`w-full md:w-84 lg:w-96 h-full glass-panel border-r flex flex-col select-none flex-shrink-0 z-20 ${
        isMobileChatOpen ? 'hidden md:flex' : 'flex'
      }`}
    >
      {/* Top Brand & Header: Menu, m.messages logo, Search, New Chat */}
      <div className="p-3 pb-2.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenMenu}
              className="p-2 rounded-2xl text-violet-600 dark:text-violet-300 hover:text-violet-950 dark:hover:text-white hover:bg-violet-600/15 transition-all duration-200"
              title="Menyu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-500 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <span className="text-white text-xs font-black tracking-tight">m.</span>
              </div>
              <span className="text-base font-black tracking-tight bg-gradient-to-r from-violet-700 via-purple-800 to-fuchsia-700 dark:from-violet-100 dark:via-white dark:to-purple-200 bg-clip-text text-transparent">
                m.messages
              </span>
            </div>
          </div>

          <button
            onClick={onOpenNewChat}
            className="p-2.5 rounded-2xl text-violet-600 dark:text-violet-200 bg-violet-600/10 dark:bg-violet-600/20 hover:bg-violet-600/25 border border-violet-500/20 transition-all duration-200 shadow-xs"
            title="Yangi suhbat"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-violet-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Suhbatlar yoki xabarlarni qidirish..."
            className="w-full glass-input rounded-2xl py-2 pl-10 pr-8 text-xs text-slate-900 dark:text-white placeholder-violet-400/60 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-violet-400 hover:text-violet-600 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs Filter Bar (m.messages folders) */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-violet-500/10 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('all')}
          className={`py-1.5 px-3.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'all'
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm glow-primary'
              : 'text-violet-600/70 dark:text-violet-300/70 hover:text-violet-950 dark:hover:text-white hover:bg-violet-500/10'
          }`}
        >
          Barchasi
        </button>
        <button
          onClick={() => setActiveTab('personal')}
          className={`py-1.5 px-3.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'personal'
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm glow-primary'
              : 'text-violet-600/70 dark:text-violet-300/70 hover:text-violet-950 dark:hover:text-white hover:bg-violet-500/10'
          }`}
        >
          Lichka
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`py-1.5 px-3.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'groups'
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm glow-primary'
              : 'text-violet-600/70 dark:text-violet-300/70 hover:text-violet-950 dark:hover:text-white hover:bg-violet-500/10'
          }`}
        >
          Guruhlar
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`py-1.5 px-3.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
            activeTab === 'unread'
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm glow-primary'
              : 'text-violet-600/70 dark:text-violet-300/70 hover:text-violet-950 dark:hover:text-white hover:bg-violet-500/10'
          }`}
        >
          <span>O'qilmagan</span>
          {totalUnread > 0 && (
            <span className="px-1.5 py-0.2 bg-fuchsia-500 text-white text-[10px] font-black rounded-full shadow-xs">
              {totalUnread}
            </span>
          )}
        </button>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoadingChats ? (
          <div className="p-8 text-center text-xs text-violet-400 animate-pulse">Suhbatlar yuklanmoqda...</div>
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center text-xs text-violet-500 dark:text-violet-300/70 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Users className="w-6 h-6" />
            </div>
            <span>Hech qanday suhbat topilmadi</span>
            <button
              onClick={onOpenNewChat}
              className="text-xs text-violet-500 dark:text-violet-400 hover:underline font-bold"
            >
              Yangi lichka boshlash +
            </button>
          </div>
        ) : (
          filteredChats.map(chat => {
            const isActive = chat.id === activeChatId;
            const isDirect = chat.type === 'direct';
            const otherUser = (chat as any).otherUser;

            // GUARANTEE: For direct chat, ALWAYS show the other user's name and details
            const displayTitle = isDirect && otherUser ? otherUser.displayName : chat.title;
            const displayAvatar = isDirect && otherUser ? otherUser.avatar : chat.avatar;
            const displayColor = isDirect && otherUser ? otherUser.avatarColor : (chat.avatarColor || '#8b5cf6');

            const userStatus = otherUser ? userStatusMap[otherUser.id] : undefined;
            const isOnline = userStatus ? userStatus.isOnline : otherUser?.isOnline;

            const isTyping = typingMap[chat.id];
            const lastMsg = chat.lastMessage;
            const isOutgoing = Boolean(lastMsg && currentUser && lastMsg.senderId === currentUser.id);
            const isRead = lastMsg && lastMsg.readBy.length > 1;

            return (
              <div
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/30 to-purple-600/20 dark:from-violet-600/35 dark:to-purple-600/20 border border-violet-500/35 shadow-[0_4px_16px_rgba(139,92,246,0.18)]'
                    : 'hover:bg-violet-600/10 border border-transparent'
                }`}
              >
                {/* Avatar */}
                <Avatar
                  name={displayTitle}
                  avatarUrl={displayAvatar}
                  color={displayColor}
                  size="md"
                  isOnline={isDirect ? isOnline : undefined}
                />

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      {chat.type === 'saved' && (
                        <Bookmark className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                      )}
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {displayTitle}
                      </h4>
                    </div>
                    <span className={`text-[11px] font-mono flex-shrink-0 ml-1.5 ${isActive ? 'text-violet-600 dark:text-violet-200' : 'text-violet-400 dark:text-violet-400/60'}`}>
                      {formatMessageTime(lastMsg?.createdAt || chat.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className={`text-xs truncate flex items-center gap-1 ${isActive ? 'text-violet-900 dark:text-violet-100' : 'text-slate-600 dark:text-violet-300/70'}`}>
                      {isTyping ? (
                        <span className="text-fuchsia-500 dark:text-fuchsia-400 font-bold animate-pulse flex items-center gap-1">
                          yozmoqda...
                        </span>
                      ) : lastMsg ? (
                        <>
                          {isOutgoing && (
                            <span className="inline-flex items-center mr-0.5">
                              {isRead ? (
                                <CheckCheck className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                              ) : (
                                <Check className="w-3.5 h-3.5 opacity-60" />
                              )}
                            </span>
                          )}
                          {lastMsg.type === 'voice' && (
                            <span className="flex items-center gap-1 text-fuchsia-600 dark:text-fuchsia-300 font-semibold">
                              <Mic className="w-3.5 h-3.5" /> Ovozli xabar
                            </span>
                          )}
                          {lastMsg.type === 'image' && (
                            <span className="flex items-center gap-1 text-fuchsia-600 dark:text-fuchsia-300 font-semibold">
                              <ImageIcon className="w-3.5 h-3.5" /> Rasm
                            </span>
                          )}
                          {lastMsg.type === 'file' && (
                            <span className="flex items-center gap-1 text-fuchsia-600 dark:text-fuchsia-300 font-semibold">
                              <FileText className="w-3.5 h-3.5" /> {lastMsg.text || 'Fayl'}
                            </span>
                          )}
                          {lastMsg.type === 'text' && (
                            <span className="truncate">{lastMsg.text}</span>
                          )}
                        </>
                      ) : (
                        <span className="italic opacity-60">Xabarlar yo'q</span>
                      )}
                    </div>

                    {/* Unread badge */}
                    {chat.unreadCount !== undefined && chat.unreadCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[11px] font-bold rounded-full min-w-[20px] text-center flex-shrink-0 shadow-md">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
