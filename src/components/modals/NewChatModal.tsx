import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { User } from '../../types';
import { Avatar } from '../common/Avatar';
import { X, Search, Users, UserPlus, Check } from 'lucide-react';

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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#17212b] rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="text-base font-semibold text-white">
            {tab === 'direct' ? 'Yangi lichka / xabar' : 'Yangi guruh ochish'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#708499] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-2 bg-[#0e1621] border-b border-white/5 gap-2">
          <button
            type="button"
            onClick={() => setTab('direct')}
            className={`py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
              tab === 'direct' ? 'bg-[#2481cc] text-white shadow-sm' : 'text-[#708499] hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Lichka (1-on-1)
          </button>
          <button
            type="button"
            onClick={() => setTab('group')}
            className={`py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
              tab === 'group' ? 'bg-[#2481cc] text-white shadow-sm' : 'text-[#708499] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Guruh
          </button>
        </div>

        {/* Group title input if in group mode */}
        {tab === 'group' && (
          <div className="p-4 border-b border-white/5 bg-[#17212b]">
            <label className="block text-xs font-medium text-[#708499] mb-1.5">
              Guruh nomi *
            </label>
            <input
              type="text"
              value={groupTitle}
              onChange={e => setGroupTitle(e.target.value)}
              placeholder="Masalan: Startap jamoasi 🚀"
              className="w-full bg-[#0e1621] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#708499] focus:outline-none focus:border-[#2481cc]"
            />
            <p className="text-[11px] text-[#708499] mt-2">
              Tanlangan a'zolar: <span className="text-white font-medium">{selectedUserIds.length}</span> ta
            </p>
          </div>
        )}

        {/* Search */}
        <div className="p-3 bg-[#17212b] border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#708499]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Foydalanuvchi qidirish..."
              className="w-full bg-[#0e1621] border border-transparent rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-[#708499] focus:outline-none focus:border-[#2481cc]"
            />
          </div>
        </div>

        {/* Users list */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-white/5">
          {loading ? (
            <div className="py-8 text-center text-xs text-[#708499]">Yuklanmoqda...</div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#708499]">Foydalanuvchilar topilmadi</div>
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
                  className="flex items-center justify-between p-2.5 hover:bg-[#202b36] rounded-xl cursor-pointer transition-colors"
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
                      <h4 className="text-sm font-medium text-white">{u.displayName}</h4>
                      <p className="text-xs text-[#708499]">@{u.username}</p>
                    </div>
                  </div>

                  {tab === 'group' && (
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-[#2481cc] border-[#2481cc] text-white'
                          : 'border-white/20'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer for group creation */}
        {tab === 'group' && (
          <div className="p-3 border-t border-white/5 bg-[#17212b] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#708499] hover:text-white"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleCreateGroup}
              disabled={isSubmitting || !groupTitle.trim()}
              className="px-5 py-2 bg-[#2481cc] hover:bg-[#1f73b8] text-white text-xs font-medium rounded-xl transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Yaratilmoqda...' : 'Guruh yaratish'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
