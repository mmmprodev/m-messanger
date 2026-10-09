import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { User } from '../../types';
import { Avatar } from '../common/Avatar';
import { X, Search, Users, UserPlus, Check, Sparkles, MessageCircle } from 'lucide-react';

interface NewChatModalProps {
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ onClose }) => {
  const { user: currentUser } = useAuth();
  const { createDirectChat, createGroupChat } = useChat();

  const [tab, setTab] = useState<'direct' | 'group'>('direct');
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Group state
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getUsers(search)
      .then(res => setUsers(res.users))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [search]);

  const handleSelectDirectUser = async (targetUserId: string) => {
    setIsSubmitting(true);
    try {
      await createDirectChat(targetUserId);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleGroupMember = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await createGroupChat(groupTitle.trim(), selectedUserIds);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#130d26]/95 border border-violet-500/25 rounded-3xl shadow-[0_10px_40px_rgba(139,92,246,0.25)] flex flex-col max-h-[85vh] overflow-hidden backdrop-blur-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-violet-500/15">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-md">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {tab === 'direct' ? 'Yangi lichka (1-on-1)' : 'Yangi guruh ochish'}
              </h3>
              <p className="text-[11px] text-violet-300/70">
                {tab === 'direct' ? 'Suhbatlashish uchun kontaktni tanlang' : "Guruh nomi va a'zolarni tanlang"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-violet-300 hover:text-white hover:bg-violet-600/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 p-2 bg-[#0b0816]/60 border-b border-violet-500/15 gap-2">
          <button
            type="button"
            onClick={() => setTab('direct')}
            className={`py-2.5 px-3 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all ${
              tab === 'direct'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/30 glow-primary'
                : 'text-violet-300/70 hover:text-white hover:bg-violet-600/10'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Lichka (1-on-1)
          </button>
          <button
            type="button"
            onClick={() => setTab('group')}
            className={`py-2.5 px-3 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all ${
              tab === 'group'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/30 glow-primary'
                : 'text-violet-300/70 hover:text-white hover:bg-violet-600/10'
            }`}
          >
            <Users className="w-4 h-4" />
            Guruh
          </button>
        </div>

        {/* Group title input if in group mode */}
        {tab === 'group' && (
          <div className="p-4 border-b border-violet-500/15 bg-violet-950/20">
            <label className="block text-xs font-semibold text-violet-300 mb-1.5">
              Guruh nomi *
            </label>
            <input
              type="text"
              value={groupTitle}
              onChange={e => setGroupTitle(e.target.value)}
              placeholder="Masalan: Frontend jamoasi 🚀"
              className="w-full bg-[#0a0614] border border-violet-500/30 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-violet-400/40 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40"
            />
            <p className="text-[11px] text-violet-400/80 mt-2">
              Tanlangan a'zolar: <span className="text-fuchsia-400 font-bold">{selectedUserIds.length}</span> ta
            </p>
          </div>
        )}

        {/* Search */}
        <div className="p-3 border-b border-violet-500/15">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-violet-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Foydalanuvchi qidirish (ism yoki @username)..."
              className="w-full bg-[#0a0614] border border-violet-500/20 rounded-2xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-violet-400/40 focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* Users list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="py-8 text-center text-xs text-violet-400 animate-pulse">Yuklanmoqda...</div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-xs text-violet-400/70">Foydalanuvchilar topilmadi</div>
          ) : (
            users.map(u => {
              const isSelected = selectedUserIds.includes(u.id);

              return (
                <div
                  key={u.id}
                  onClick={() => {
                    if (tab === 'direct') {
                      handleSelectDirectUser(u.id);
                    } else {
                      handleToggleGroupMember(u.id);
                    }
                  }}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'bg-violet-600/30 border border-violet-500/40 shadow-sm'
                      : 'hover:bg-violet-600/15 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={u.displayName}
                      avatarUrl={u.avatar}
                      color={u.avatarColor}
                      size="md"
                      isOnline={u.isOnline}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white">{u.displayName}</h4>
                      <p className="text-xs text-violet-300/70 font-mono">@{u.username}</p>
                    </div>
                  </div>

                  {tab === 'group' && (
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 border-transparent text-white shadow-sm'
                          : 'border-violet-400/30'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  )}

                  {tab === 'direct' && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      className="px-3 py-1.5 bg-violet-600/25 hover:bg-violet-600 text-violet-200 hover:text-white text-xs font-bold rounded-xl transition-all"
                    >
                      Yozish
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer for group creation */}
        {tab === 'group' && (
          <div className="p-3.5 border-t border-violet-500/15 bg-[#0b0816]/70 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-violet-400 hover:text-white"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleCreateGroup}
              disabled={isSubmitting || !groupTitle.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-95 text-white text-xs font-bold rounded-2xl transition-all disabled:opacity-50 shadow-md shadow-violet-600/30"
            >
              {isSubmitting ? 'Yaratilmoqda...' : 'Guruh yaratish'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
