import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { Chat } from '../../types';
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
  FileText
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
    return (
      chat.title.toLowerCase().includes(q) ||
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
      className={`w-full md:w-80 lg:w-96 h-full bg-[#17212b] border-r border-white/5 flex flex-col select-none flex-shrink-0 ${
        isMobileChatOpen ? 'hidden md:flex' : 'flex'
      }`}
    >
      {/* Top Header: Menu, Search, New Chat */}
      <div className="p-2.5 pb-2 flex items-center gap-2">
        <button
          onClick={onOpenMenu}
          className="p-2 rounded-full text-[#708499] hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
          title="Menyu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#708499]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Qidiruv..."
            className="w-full bg-[#0e1621] border border-transparent rounded-full py-2 pl-9 pr-8 text-xs text-white placeholder-[#708499] focus:outline-none focus:border-[#2481cc]/60 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-[#708499] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={onOpenNewChat}
          className="p-2 rounded-full text-[#65aadd] hover:text-white hover:bg-[#2481cc]/20 transition-colors flex-shrink-0"
          title="Yangi xabar / guruh"
        >
          <Edit3 className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs Filter Bar (Telegram Folders) */}
      <div className="flex items-center px-2 border-b border-white/5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('all')}
          className={`py-2 px-3 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'all'
              ? 'border-[#2481cc] text-[#65aadd]'
              : 'border-transparent text-[#708499] hover:text-white'
          }`}
        >
          Barchasi
        </button>
        <button
          onClick={() => setActiveTab('personal')}
          className={`py-2 px-3 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'personal'
              ? 'border-[#2481cc] text-[#65aadd]'
              : 'border-transparent text-[#708499] hover:text-white'
          }`}
        >
          Shaxsiy
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`py-2 px-3 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'groups'
              ? 'border-[#2481cc] text-[#65aadd]'
              : 'border-transparent text-[#708499] hover:text-white'
          }`}
        >
          Guruhlar
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`py-2 px-3 text-xs font-medium border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeTab === 'unread'
              ? 'border-[#2481cc] text-[#65aadd]'
              : 'border-transparent text-[#708499] hover:text-white'
          }`}
        >
          <span>O'qilmagan</span>
          {totalUnread > 0 && (
            <span className="px-1.5 py-0.2 bg-[#2481cc] text-white text-[10px] font-bold rounded-full">
              {totalUnread}
            </span>
          )}
        </button>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03]">
        {isLoadingChats ? (
          <div className="p-8 text-center text-xs text-[#708499]">Chatlar yuklanmoqda...</div>
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#708499] flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[#708499]">
              <Users className="w-6 h-6" />
            </div>
            <span>Hech qanday chat topilmadi</span>
            <button
              onClick={onOpenNewChat}
              className="text-xs text-[#65aadd] hover:underline"
            >
              Yangi chat boshlash +
            </button>
          </div>
        ) : (
          filteredChats.map(chat => {
            const isActive = chat.id === activeChatId;
            const isDirect = chat.type === 'direct';
            const otherUser = (chat as any).otherUser;
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
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[#2b5278]'
                    : 'hover:bg-[#202b36]'
                }`}
              >
                {/* Avatar */}
                <Avatar
                  name={chat.title}
                  avatarUrl={chat.avatar}
                  color={chat.avatarColor || '#65aadd'}
                  size="md"
                  isOnline={isDirect ? isOnline : undefined}
                />

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      {chat.type === 'saved' && (
                        <Bookmark className="w-3.5 h-3.5 text-[#65aadd] flex-shrink-0" />
                      )}
                      <h4 className="text-sm font-semibold text-white truncate">
                        {chat.title}
                      </h4>
                    </div>
                    <span className={`text-[11px] flex-shrink-0 ml-1.5 ${isActive ? 'text-white/80' : 'text-[#708499]'}`}>
                      {formatMessageTime(lastMsg?.createdAt || chat.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className={`text-xs truncate flex items-center gap-1 ${isActive ? 'text-white/90' : 'text-[#708499]'}`}>
                      {isTyping ? (
                        <span className="text-[#65aadd] font-medium animate-pulse flex items-center gap-1">
                          yozmoqda...
                        </span>
                      ) : lastMsg ? (
                        <>
                          {isOutgoing && (
                            <span className="inline-flex items-center mr-0.5">
                              {isRead ? (
                                <CheckCheck className="w-3.5 h-3.5 text-[#65aadd]" />
                              ) : (
                                <Check className="w-3.5 h-3.5 opacity-70" />
                              )}
                            </span>
                          )}
                          {lastMsg.type === 'voice' && (
                            <span className="flex items-center gap-1 text-[#65aadd]">
                              <Mic className="w-3.5 h-3.5" /> Ovozli xabar
                            </span>
                          )}
                          {lastMsg.type === 'image' && (
                            <span className="flex items-center gap-1 text-[#65aadd]">
                              <ImageIcon className="w-3.5 h-3.5" /> Rasm
                            </span>
                          )}
                          {lastMsg.type === 'file' && (
                            <span className="flex items-center gap-1 text-[#65aadd]">
                              <FileText className="w-3.5 h-3.5" /> {lastMsg.text || 'Hujjat'}
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
                      <span className="ml-2 px-1.5 py-0.5 bg-[#2481cc] text-white text-[11px] font-bold rounded-full min-w-[20px] text-center flex-shrink-0 shadow-sm">
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
