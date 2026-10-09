import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Avatar } from '../common/Avatar';
import {
  X,
  Share2,
  Copy,
  Check,
  Bell,
  BellOff,
  Image as ImageIcon,
  FileText,
  Mic,
  Users,
  ShieldCheck,
  UserPlus
} from 'lucide-react';

interface ChatInfoDrawerProps {
  onClose: () => void;
  onOpenNewChat: () => void;
}

export const ChatInfoDrawer: React.FC<ChatInfoDrawerProps> = ({ onClose, onOpenNewChat }) => {
  const { activeChat, messages, userStatusMap } = useChat();
  const { user: currentUser } = useAuth();
  const [activeMediaTab, setActiveMediaTab] = useState<'media' | 'files' | 'voice'>('media');
  const [isMuted, setIsMuted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!activeChat) return null;

  const isDirect = activeChat.type === 'direct';
  const otherUser = (activeChat as any).otherUser;
  const isSavedMessages = activeChat.type === 'saved';

  const displayTitle = isDirect && otherUser ? otherUser.displayName : activeChat.title;
  const displayAvatar = isDirect && otherUser ? otherUser.avatar : activeChat.avatar;
  const displayColor = isDirect && otherUser ? otherUser.avatarColor : (activeChat.avatarColor || '#8b5cf6');

  const userStatus = otherUser ? userStatusMap[otherUser.id] : undefined;
  const isOnline = userStatus ? userStatus.isOnline : otherUser?.isOnline;

  // Filter media from chat messages
  const mediaPhotos = messages.filter(m => m.type === 'image' && m.mediaUrl);
  const mediaFiles = messages.filter(m => m.type === 'file' && m.mediaUrl);
  const mediaVoice = messages.filter(m => m.type === 'voice' && m.mediaUrl);

  // Links for direct chat or group
  const myInviteLink = currentUser ? `${window.location.origin}/?user=${currentUser.username}` : window.location.origin;
  const friendLink = isDirect && otherUser ? `${window.location.origin}/?user=${otherUser.username}` : `${window.location.origin}/?chat=${activeChat.id}`;

  const handleCopyMyLink = () => {
    navigator.clipboard.writeText(myInviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyFriendLink = () => {
    navigator.clipboard.writeText(friendLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="w-80 h-full glass-panel border-l flex flex-col select-none flex-shrink-0 z-20">
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-violet-500/10">
        <h3 className="text-sm font-bold text-white tracking-wide">Suhbat ma'lumotlari</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-violet-300 hover:text-white hover:bg-violet-600/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile Card */}
        <div className="p-6 flex flex-col items-center text-center border-b border-violet-500/10">
          <Avatar
            name={displayTitle}
            avatarUrl={displayAvatar}
            color={displayColor}
            size="xl"
            isOnline={isDirect ? isOnline : undefined}
            className="mb-3.5 shadow-xl ring-2 ring-violet-500/30"
          />
          <h2 className="text-lg font-black text-white leading-snug">{displayTitle}</h2>
          <p className="text-xs text-violet-300/80 mt-1 font-medium">
            {isDirect ? (
              isOnline ? <span className="text-emerald-400 font-bold">onlayn</span> : "yaqinda bo'lgan"
            ) : isSavedMessages ? (
              'Shaxsiy xotira buluti'
            ) : (
              `${activeChat.participants.length} ta a'zo`
            )}
          </p>

          {/* Direct chat link buttons */}
          <div className="flex flex-col gap-2 w-full mt-4">
            <button
              onClick={handleCopyFriendLink}
              className="w-full px-3.5 py-2 bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 hover:from-violet-600/50 hover:to-fuchsia-600/50 text-violet-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border border-violet-500/35 shadow-sm"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              {isDirect ? "Do'st profil havolasini nusxalash" : "Guruh havolasini nusxalash"}
            </button>
            {isDirect && (
              <button
                onClick={handleCopyMyLink}
                className="w-full px-3.5 py-2 bg-violet-600/15 hover:bg-violet-600/25 text-violet-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-violet-500/20"
              >
                <Copy className="w-3.5 h-3.5" />
                Mening lichka havolamni nusxalash
              </button>
            )}
          </div>
        </div>

        {/* Info list */}
        <div className="p-5 space-y-4 border-b border-violet-500/10 text-xs">
          {otherUser?.username && (
            <div>
              <span className="text-violet-400/70 block mb-0.5 font-medium">Foydalanuvchi nomi</span>
              <span className="text-white font-mono select-all font-semibold">@{otherUser.username}</span>
            </div>
          )}

          {otherUser?.bio && (
            <div>
              <span className="text-violet-400/70 block mb-0.5 font-medium">Bio</span>
              <span className="text-white/90 leading-relaxed">{otherUser.bio}</span>
            </div>
          )}

          {activeChat.description && (
            <div>
              <span className="text-violet-400/70 block mb-0.5 font-medium">Guruh tavsifi</span>
              <span className="text-white/90 leading-relaxed">{activeChat.description}</span>
            </div>
          )}

          {/* Notifications toggle */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-white font-semibold flex items-center gap-2">
              {isMuted ? <BellOff className="w-4 h-4 text-violet-400/60" /> : <Bell className="w-4 h-4 text-fuchsia-400" />}
              Bildirishnomalar
            </span>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                isMuted ? 'bg-zinc-700' : 'bg-gradient-to-r from-violet-600 to-fuchsia-600'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  isMuted ? 'left-0.5' : 'left-5.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Shared Media Section */}
        <div className="p-4">
          <div className="grid grid-cols-3 bg-violet-950/40 border border-violet-500/15 p-1 rounded-2xl gap-1 text-[11px] mb-3">
            <button
              onClick={() => setActiveMediaTab('media')}
              className={`py-1.5 rounded-xl font-bold transition-all ${
                activeMediaTab === 'media'
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-xs'
                  : 'text-violet-300/70 hover:text-white'
              }`}
            >
              Rasmlar ({mediaPhotos.length})
            </button>
            <button
              onClick={() => setActiveMediaTab('files')}
              className={`py-1.5 rounded-xl font-bold transition-all ${
                activeMediaTab === 'files'
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-xs'
                  : 'text-violet-300/70 hover:text-white'
              }`}
            >
              Fayllar ({mediaFiles.length})
            </button>
            <button
              onClick={() => setActiveMediaTab('voice')}
              className={`py-1.5 rounded-xl font-bold transition-all ${
                activeMediaTab === 'voice'
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-xs'
                  : 'text-violet-300/70 hover:text-white'
              }`}
            >
              Ovozlar ({mediaVoice.length})
            </button>
          </div>

          {/* Media tab content */}
          {activeMediaTab === 'media' && (
            mediaPhotos.length === 0 ? (
              <p className="text-center py-6 text-xs text-violet-400/60">Rasmlar hali yuklanmagan</p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {mediaPhotos.map(m => (
                  <a
                    key={m.id}
                    href={api.getMediaUrl(m.mediaUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-square rounded-xl overflow-hidden bg-black/40 hover:opacity-85 transition-opacity ring-1 ring-white/10"
                  >
                    <img src={api.getMediaUrl(m.mediaUrl)} alt="" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            )
          )}

          {activeMediaTab === 'files' && (
            mediaFiles.length === 0 ? (
              <p className="text-center py-6 text-xs text-violet-400/60">Fayllar mavjud emas</p>
            ) : (
              <div className="space-y-2">
                {mediaFiles.map(m => (
                  <a
                    key={m.id}
                    href={api.getMediaUrl(m.mediaUrl)}
                    download={m.mediaMeta?.name || 'file'}
                    className="p-2.5 bg-violet-950/30 hover:bg-violet-900/40 border border-violet-500/15 rounded-2xl flex items-center gap-2 text-xs text-white transition-colors"
                  >
                    <FileText className="w-4 h-4 text-fuchsia-400 flex-shrink-0" />
                    <span className="truncate flex-1 font-medium">{m.mediaMeta?.name || 'Hujjat'}</span>
                  </a>
                ))}
              </div>
            )
          )}

          {activeMediaTab === 'voice' && (
            mediaVoice.length === 0 ? (
              <p className="text-center py-6 text-xs text-violet-400/60">Ovozli xabarlar yo'q</p>
            ) : (
              <div className="space-y-2">
                {mediaVoice.map(m => (
                  <div key={m.id} className="p-2.5 bg-violet-950/30 border border-violet-500/15 rounded-2xl flex items-center gap-2 text-xs text-white">
                    <Mic className="w-4 h-4 text-violet-400" />
                    <span className="font-medium">Ovozli xabar ({m.mediaMeta?.duration || 0}s)</span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
