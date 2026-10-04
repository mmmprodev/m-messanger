import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
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

  const userStatus = otherUser ? userStatusMap[otherUser.id] : undefined;
  const isOnline = userStatus ? userStatus.isOnline : otherUser?.isOnline;

  // Filter media from chat messages
  const mediaPhotos = messages.filter(m => m.type === 'image' && m.mediaUrl);
  const mediaFiles = messages.filter(m => m.type === 'file' && m.mediaUrl);
  const mediaVoice = messages.filter(m => m.type === 'voice' && m.mediaUrl);

  // Link for direct chat or group
  const shareLink = isDirect && otherUser
    ? `${window.location.origin}/?user=${otherUser.username}`
    : `${window.location.origin}/?chat=${activeChat.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="w-80 h-full bg-[#17212b] border-l border-white/5 flex flex-col select-none flex-shrink-0 z-20">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/5">
        <h3 className="text-sm font-semibold text-white">Ma'lumotlar</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-[#708499] hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile Card */}
        <div className="p-6 flex flex-col items-center text-center border-b border-white/5 bg-[#17212b]">
          <Avatar
            name={activeChat.title}
            avatarUrl={activeChat.avatar}
            color={activeChat.avatarColor || '#65aadd'}
            size="xl"
            isOnline={isDirect ? isOnline : undefined}
            className="mb-3 shadow-lg"
          />
          <h2 className="text-lg font-bold text-white leading-snug">{activeChat.title}</h2>
          <p className="text-xs text-[#708499] mt-0.5">
            {isDirect ? (
              isOnline ? <span className="text-[#65aadd] font-medium">onlayn</span> : 'yaqinda bo\'lgan'
            ) : isSavedMessages ? (
              'Shaxsiy xotira buluti'
            ) : (
              `${activeChat.participants.length} ta a'zo`
            )}
          </p>

          {/* Direct chat link button */}
          <button
            onClick={handleCopyLink}
            className="mt-4 px-3.5 py-1.5 bg-[#2481cc]/15 hover:bg-[#2481cc]/25 text-[#65aadd] rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors border border-[#2481cc]/30"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            {copiedLink ? 'Havola nusxalandi!' : 'Chat havolasini ulashish'}
          </button>
        </div>

        {/* Info list */}
        <div className="p-4 space-y-4 border-b border-white/5 text-xs">
          {otherUser?.username && (
            <div>
              <span className="text-[#708499] block mb-0.5">Foydalanuvchi nomi</span>
              <span className="text-white font-mono select-all">@{otherUser.username}</span>
            </div>
          )}

          {otherUser?.bio && (
            <div>
              <span className="text-[#708499] block mb-0.5">Bio</span>
              <span className="text-white leading-relaxed">{otherUser.bio}</span>
            </div>
          )}

          {activeChat.description && (
            <div>
              <span className="text-[#708499] block mb-0.5">Guruh tavsifi</span>
              <span className="text-white leading-relaxed">{activeChat.description}</span>
            </div>
          )}

          {/* Notifications toggle */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-white font-medium flex items-center gap-2">
              {isMuted ? <BellOff className="w-4 h-4 text-[#708499]" /> : <Bell className="w-4 h-4 text-[#65aadd]" />}
              Bildirishnomalar
            </span>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                isMuted ? 'bg-[#708499]' : 'bg-[#2481cc]'
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
          <div className="grid grid-cols-3 bg-[#0e1621] p-1 rounded-xl gap-1 text-[11px] mb-3">
            <button
              onClick={() => setActiveMediaTab('media')}
              className={`py-1.5 rounded-lg font-medium transition-all ${
                activeMediaTab === 'media'
                  ? 'bg-[#2481cc] text-white'
                  : 'text-[#708499] hover:text-white'
              }`}
            >
              Rasmlar ({mediaPhotos.length})
            </button>
            <button
              onClick={() => setActiveMediaTab('files')}
              className={`py-1.5 rounded-lg font-medium transition-all ${
                activeMediaTab === 'files'
                  ? 'bg-[#2481cc] text-white'
                  : 'text-[#708499] hover:text-white'
              }`}
            >
              Fayllar ({mediaFiles.length})
            </button>
            <button
              onClick={() => setActiveMediaTab('voice')}
              className={`py-1.5 rounded-lg font-medium transition-all ${
                activeMediaTab === 'voice'
                  ? 'bg-[#2481cc] text-white'
                  : 'text-[#708499] hover:text-white'
              }`}
            >
              Ovozlar ({mediaVoice.length})
            </button>
          </div>

          {/* Media tab content */}
          {activeMediaTab === 'media' && (
            mediaPhotos.length === 0 ? (
              <p className="text-center py-6 text-xs text-[#708499]">Rasmlar hali yuklanmagan</p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {mediaPhotos.map(m => (
                  <a
                    key={m.id}
                    href={m.mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-square rounded-lg overflow-hidden bg-black/40 hover:opacity-85 transition-opacity"
                  >
                    <img src={m.mediaUrl} alt="" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            )
          )}

          {activeMediaTab === 'files' && (
            mediaFiles.length === 0 ? (
              <p className="text-center py-6 text-xs text-[#708499]">Fayllar mavjud emas</p>
            ) : (
              <div className="space-y-2">
                {mediaFiles.map(m => (
                  <a
                    key={m.id}
                    href={m.mediaUrl}
                    download={m.mediaMeta?.name || 'file'}
                    className="p-2 bg-[#0e1621] hover:bg-[#202b36] rounded-xl flex items-center gap-2 text-xs text-white transition-colors"
                  >
                    <FileText className="w-4 h-4 text-[#65aadd] flex-shrink-0" />
                    <span className="truncate flex-1">{m.mediaMeta?.name || 'Hujjat'}</span>
                  </a>
                ))}
              </div>
            )
          )}

          {activeMediaTab === 'voice' && (
            mediaVoice.length === 0 ? (
              <p className="text-center py-6 text-xs text-[#708499]">Ovozli xabarlar yo'q</p>
            ) : (
              <div className="space-y-2">
                {mediaVoice.map(m => (
                  <div key={m.id} className="p-2 bg-[#0e1621] rounded-xl flex items-center gap-2 text-xs text-white">
                    <Mic className="w-4 h-4 text-[#65aadd]" />
                    <span>Ovozli xabar ({m.mediaMeta?.duration || 0}s)</span>
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
