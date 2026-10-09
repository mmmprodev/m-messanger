import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Avatar } from '../common/Avatar';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { Message } from '../../types';
import {
  ArrowLeft,
  Phone,
  Video,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
  Mic,
  Trash2,
  X,
  Reply,
  Pin,
  Edit2,
  Check,
  CheckCheck,
  Download,
  FileText,
  Volume2,
  Bookmark,
  Share2,
  Info,
  UploadCloud,
  Sparkles,
  Loader2,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

interface ChatAreaProps {
  onBackMobile: () => void;
  onOpenInfo: () => void;
  onStartCall: (isVideo: boolean) => void;
  onOpenLightbox: (imageUrl: string, imageName?: string) => void;
}

const EMOJI_LIST = ['👍', '❤️', '🔥', '😂', '👏', '🎉', '😢', '😍', '🤔', '🚀', '✨', '💯', '🤝', '⚡', '🙏', '🙌', '😎', '🤩', '🥳', '💪'];

export const ChatArea: React.FC<ChatAreaProps> = ({
  onBackMobile,
  onOpenInfo,
  onStartCall,
  onOpenLightbox
}) => {
  const { user: currentUser } = useAuth();
  const {
    activeChat,
    messages,
    sendMessage,
    sendVoiceMessage,
    sendMediaMessage,
    retrySendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    pinMessage,
    replyingTo,
    setReplyingTo,
    typingMap,
    userStatusMap,
    sendTyping,
    isLoadingMessages
  } = useChat();

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [showSearchInChat, setShowSearchInChat] = useState(false);
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Voice recorder hook
  const {
    isRecording,
    duration: recordDuration,
    waveformData,
    startRecording,
    stopRecording,
    cancelRecording
  } = useVoiceRecorder();

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!activeChat) {
    return (
      <div className="flex-1 h-full m-messages-chat-bg hidden md:flex flex-col items-center justify-center p-8 text-center select-none relative overflow-hidden">
        {/* Glowing aura circles */}
        <div className="absolute w-96 h-96 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />
        <div className="absolute w-80 h-80 rounded-full bg-fuchsia-600/10 blur-3xl pointer-events-none -bottom-10 -right-10" />

        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-violet-600/25 to-fuchsia-600/20 border border-violet-500/30 backdrop-blur-xl flex items-center justify-center mb-5 shadow-[0_0_35px_rgba(139,92,246,0.3)]">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl font-black">m.</span>
          </div>
        </div>

        <h3 className="text-2xl font-black tracking-tight bg-gradient-to-r from-violet-200 via-white to-purple-200 bg-clip-text text-transparent mb-2">
          m.messages
        </h3>
        <p className="text-xs text-violet-300/70 max-w-sm leading-relaxed mb-6">
          Ultra-tezkor, xavfsiz va zamonaviy real-time messenjer. Suhbatlashish uchun chap paneldan do'stingizni tanlang yoki shaxsiy havolangiz orqali suhbat boshlang.
        </p>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-600/15 border border-violet-500/30 text-violet-300 text-xs font-semibold backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
          End-to-end shifrlangan va real-vaqtda
        </div>
      </div>
    );
  }

  const isDirect = activeChat.type === 'direct';
  const otherUser = (activeChat as any).otherUser;
  const isSavedMessages = activeChat.type === 'saved';

  // GUARANTEE: For direct chat, ALWAYS use the other user's identity
  const displayTitle = isDirect && otherUser ? otherUser.displayName : activeChat.title;
  const displayAvatar = isDirect && otherUser ? otherUser.avatar : activeChat.avatar;
  const displayColor = isDirect && otherUser ? otherUser.avatarColor : (activeChat.avatarColor || '#8b5cf6');

  const userStatus = otherUser ? userStatusMap[otherUser.id] : undefined;
  const isOnline = userStatus ? userStatus.isOnline : otherUser?.isOnline;
  const chatTyping = typingMap[activeChat.id];

  // Pinned message
  const pinnedMessage = activeChat.pinnedMessageId
    ? messages.find(m => m.id === activeChat.pinnedMessageId)
    : null;

  // Handle typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    sendTyping(true);

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 2500);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (editingMessage) {
      if (inputText.trim()) {
        await editMessage(editingMessage.id, inputText.trim());
      }
      setEditingMessage(null);
      setInputText('');
      return;
    }

    if (!inputText.trim()) return;

    const textToSend = inputText;
    setInputText('');
    setShowEmojiPicker(false);
    sendTyping(false);

    await sendMessage(textToSend);
  };

  const handleStartVoice = async () => {
    await startRecording();
  };

  const handleSendVoice = async () => {
    const res = await stopRecording();
    if (res && res.blob) {
      await sendVoiceMessage(res.blob, res.duration, res.waveform);
    }
  };

  const handleCancelVoice = () => {
    cancelRecording();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sendMediaMessage(file);
      e.target.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      sendMediaMessage(e.clipboardData.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      sendMediaMessage(e.dataTransfer.files[0]);
    }
  };

  const formatMessageTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const displayedMessages = messageSearchQuery.trim()
    ? messages.filter(m => m.text.toLowerCase().includes(messageSearchQuery.toLowerCase()))
    : messages;

  return (
    <div
      className="flex-1 h-full flex flex-col m-messages-chat-bg relative min-w-0"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-40 bg-[#090714]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 border-2 border-dashed border-violet-500 m-3 rounded-3xl pointer-events-none animate-in fade-in">
          <UploadCloud className="w-16 h-16 text-fuchsia-400 mb-3 animate-bounce" />
          <h3 className="text-lg font-bold text-white mb-1">Fayl yoki rasmni shu yerga tashlang</h3>
          <p className="text-xs text-violet-300">m.messages orqali bir zumda yuborish</p>
        </div>
      )}

      {/* 1. Chat Header */}
      <div className="h-16 px-4 glass-panel border-b flex items-center justify-between select-none z-10">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Back button on mobile */}
          <button
            onClick={onBackMobile}
            className="md:hidden p-2 rounded-xl text-violet-600 dark:text-violet-300 hover:text-violet-950 dark:hover:text-white hover:bg-violet-600/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Avatar */}
          <div className="cursor-pointer" onClick={onOpenInfo}>
            <Avatar
              name={displayTitle}
              avatarUrl={displayAvatar}
              color={displayColor}
              size="sm"
              isOnline={isDirect ? isOnline : undefined}
            />
          </div>

          {/* Title & Status */}
          <div className="min-w-0 flex-1 cursor-pointer" onClick={onOpenInfo}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
              {isSavedMessages && <Bookmark className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />}
              {displayTitle}
            </h3>
            <p className="text-[11px] truncate font-medium">
              {chatTyping ? (
                <span className="text-fuchsia-500 dark:text-fuchsia-400 font-bold animate-pulse">{chatTyping}</span>
              ) : isDirect ? (
                isOnline ? (
                  <span className="text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                    onlayn
                  </span>
                ) : (
                  <span className="text-slate-500 dark:text-violet-400/60">yaqinda bo'lgan</span>
                )
              ) : isSavedMessages ? (
                <span className="text-slate-500 dark:text-violet-400/60">Shaxsiy bulut xotirasi</span>
              ) : (
                <span className="text-slate-500 dark:text-violet-400/60">{activeChat.participants.length} ta a'zo</span>
              )}
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 text-violet-600 dark:text-violet-300">
          {!isSavedMessages && (
            <>
              <button
                onClick={() => onStartCall(false)}
                className="p-2.5 rounded-xl hover:text-violet-950 dark:hover:text-white hover:bg-violet-600/20 transition-all"
                title="Ovozli qo'ng'iroq"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => onStartCall(true)}
                className="p-2.5 rounded-xl hover:text-violet-950 dark:hover:text-white hover:bg-violet-600/20 transition-all"
                title="Video qo'ng'iroq"
              >
                <Video className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={() => setShowSearchInChat(!showSearchInChat)}
            className={`p-2.5 rounded-xl transition-all ${
              showSearchInChat ? 'text-white bg-violet-600' : 'hover:text-violet-950 dark:hover:text-white hover:bg-violet-600/20'
            }`}
            title="Chatda qidirish"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenInfo}
            className="p-2.5 rounded-xl hover:text-violet-950 dark:hover:text-white hover:bg-violet-600/20 transition-all"
            title="Suhbat ma'lumotlari"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search in chat bar if toggled */}
      {showSearchInChat && (
        <div className="px-4 py-2.5 glass-panel border-b flex items-center gap-2 animate-in fade-in">
          <Search className="w-4 h-4 text-violet-400" />
          <input
            type="text"
            value={messageSearchQuery}
            onChange={e => setMessageSearchQuery(e.target.value)}
            placeholder="Xabarlarni qidirish..."
            className="flex-1 bg-transparent text-xs text-white placeholder-violet-400/50 focus:outline-none"
            autoFocus
          />
          {messageSearchQuery && (
            <button
              onClick={() => setMessageSearchQuery('')}
              className="text-violet-400 hover:text-white text-xs font-semibold"
            >
              Tozalash
            </button>
          )}
          <button
            onClick={() => { setShowSearchInChat(false); setMessageSearchQuery(''); }}
            className="text-violet-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pinned message banner */}
      {pinnedMessage && (
        <div className="px-4 py-2 glass-panel border-b flex items-center justify-between text-xs cursor-pointer hover:bg-violet-600/10 transition-colors">
          <div className="flex items-center gap-2.5 truncate flex-1">
            <Pin className="w-3.5 h-3.5 text-fuchsia-400 flex-shrink-0" />
            <div className="truncate">
              <span className="text-fuchsia-400 font-bold mr-1.5">Qadalgan:</span>
              <span className="text-white/90 truncate">
                {pinnedMessage.text || (pinnedMessage.type === 'voice' ? '🎤 Ovozli xabar' : '📷 Rasm')}
              </span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              pinMessage(undefined);
            }}
            className="p-1 text-violet-400 hover:text-white transition-colors"
            title="Qadalgan xabarni olib tashlash"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Messages Stream */}
      <div className="flex-1 overflow-y-auto m-messages-chat-bg p-3 sm:p-5 space-y-3">
        {isLoadingMessages ? (
          <div className="py-8 text-center text-xs text-violet-400 animate-pulse">Xabarlar yuklanmoqda...</div>
        ) : displayedMessages.length === 0 ? (
          <div className="py-12 text-center text-xs text-violet-300 flex flex-col items-center gap-2">
            <span className="px-4 py-1.5 bg-violet-950/60 border border-violet-500/20 backdrop-blur-md rounded-full text-violet-200">
              Bu yerda hali xabarlar yo'q. Birinchi bo'lib yozing! 💬
            </span>
          </div>
        ) : (
          displayedMessages.map((msg) => {
            const isOutgoing = Boolean(currentUser && msg.senderId === currentUser.id);
            const isRead = msg.readBy && msg.readBy.length > 1;
            const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;

            return (
              <div
                key={msg.id}
                className={`flex flex-col group ${isOutgoing ? 'items-end' : 'items-start'}`}
              >
                {/* Bubble Container */}
                <div className="relative max-w-[85%] sm:max-w-[72%]">
                  {/* Sender name in group for incoming messages */}
                  {!isOutgoing && activeChat.type === 'group' && (
                    <span
                      className="text-[11px] font-bold mb-1 ml-3 block truncate"
                      style={{ color: msg.senderColor || '#c084fc' }}
                    >
                      {msg.senderName}
                    </span>
                  )}

                  <div
                    className={`px-4 py-2.5 shadow-md relative transition-all duration-200 ${
                      isOutgoing
                        ? 'msg-bubble-out rounded-3xl rounded-br-xs glow-bubble'
                        : 'msg-bubble-in rounded-3xl rounded-bl-xs'
                    }`}
                  >
                    {/* Reply banner if replied to another msg */}
                    {msg.replyTo && (
                      <div className="mb-2 pl-2.5 border-l-2 border-fuchsia-400 bg-black/20 py-1 pr-2 rounded-xl text-[11px]">
                        <span className="font-bold text-fuchsia-300 block truncate">
                          {msg.replyTo.senderName}
                        </span>
                        <span className="opacity-80 truncate block">
                          {msg.replyTo.text}
                        </span>
                      </div>
                    )}

                    {/* Content: Photo */}
                    {msg.type === 'image' && msg.mediaUrl && (
                      <div
                        className="mb-2 rounded-2xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity ring-1 ring-white/10 relative"
                        onClick={() => msg.status !== 'sending' && onOpenLightbox(api.getMediaUrl(msg.mediaUrl), msg.mediaMeta?.name || 'photo.jpg')}
                      >
                        <img
                          src={api.getMediaUrl(msg.mediaUrl)}
                          alt="Photo"
                          className="max-h-72 w-full object-cover rounded-2xl"
                        />
                        {msg.status === 'sending' && (
                          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 p-3">
                            <div className="w-10 h-10 rounded-full bg-violet-600/90 border border-violet-400 flex items-center justify-center shadow-lg">
                              <Loader2 className="w-5 h-5 text-white animate-spin" />
                            </div>
                            <span className="text-[11px] font-medium text-white px-3 py-1 bg-black/60 rounded-full backdrop-blur-md">
                              Rasm yuklanmoqda...
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content: Voice message */}
                    {msg.type === 'voice' && msg.mediaUrl && (
                      <div className="relative">
                        <VoiceMessagePlayer
                          audioUrl={api.getMediaUrl(msg.mediaUrl)}
                          duration={msg.mediaMeta?.duration}
                          waveform={msg.mediaMeta?.waveform}
                          isOutgoing={isOutgoing}
                        />
                      </div>
                    )}

                    {/* Content: File / Document */}
                    {msg.type === 'file' && (
                      <div className="flex flex-col gap-1.5 p-2.5 bg-black/25 rounded-2xl mb-1.5 border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-violet-600/40 flex items-center justify-center text-violet-200 flex-shrink-0">
                            {msg.status === 'sending' ? (
                              <Loader2 className="w-5 h-5 animate-spin text-fuchsia-300" />
                            ) : (
                              <FileText className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate text-white">{msg.mediaMeta?.name || msg.text || 'Fayl'}</p>
                            <p className="text-[10px] text-violet-200/70">
                              {msg.status === 'sending'
                                ? 'Fayl serverga yuklanmoqda...'
                                : msg.mediaMeta?.size
                                ? `${(msg.mediaMeta.size / 1024).toFixed(1)} KB`
                                : 'Hujjat'}
                            </p>
                          </div>
                          {msg.mediaUrl && msg.status !== 'sending' && (
                            <a
                              href={api.getMediaUrl(msg.mediaUrl)}
                              download={msg.mediaMeta?.name || 'file'}
                              className="p-2 hover:bg-white/15 rounded-xl transition-colors"
                              title="Yuklab olish"
                            >
                              <Download className="w-4 h-4 text-white" />
                            </a>
                          )}
                        </div>
                        {msg.status === 'sending' && (
                          <div className="w-full bg-violet-950/60 rounded-full h-1 mt-1 overflow-hidden border border-violet-500/20">
                            <div className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-purple-400 animate-pulse rounded-full w-4/5" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content: Text */}
                    {msg.text && (
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed select-text font-normal">
                        {msg.text}
                      </p>
                    )}

                    {/* Footer: Time + Status (Sending / Error / Sent / Read) */}
                    <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] opacity-75 select-none font-mono">
                      {msg.isEdited && <span className="italic mr-0.5">tahrirlangan</span>}
                      <span>{formatMessageTime(msg.createdAt)}</span>
                      {isOutgoing && (
                        <span>
                          {msg.status === 'sending' ? (
                            <span className="flex items-center gap-1 text-fuchsia-300" title="Yuborilmoqda...">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            </span>
                          ) : msg.status === 'error' ? (
                            <button
                              onClick={() => retrySendMessage && retrySendMessage(msg.id)}
                              className="flex items-center gap-1 text-rose-300 hover:text-rose-100 transition-colors"
                              title="Yuborilmadi. Qayta urinish uchun bosing"
                            >
                              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                              <RotateCcw className="w-2.5 h-2.5" />
                            </button>
                          ) : isRead ? (
                            <CheckCheck className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <Check className="w-3.5 h-3.5 opacity-70" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Explicit status badge under the bubble */}
                  {isOutgoing && msg.status === 'sending' && (
                    <div className="flex items-center gap-1.5 text-[11px] text-fuchsia-400 dark:text-fuchsia-300 font-medium mt-1 mr-1.5 animate-pulse select-none">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-500"></span>
                      </span>
                      <span>
                        {msg.type === 'voice'
                          ? 'Ovoz yuborilmoqda...'
                          : msg.type === 'image'
                          ? 'Rasm yuklanmoqda...'
                          : msg.type === 'file'
                          ? 'Fayl yuklanmoqda...'
                          : 'Yuborilmoqda...'}
                      </span>
                    </div>
                  )}

                  {isOutgoing && msg.status === 'error' && (
                    <div className="flex items-center gap-1.5 text-[11px] text-rose-400 mt-1 mr-1 select-none font-medium">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Xabar yuborilmadi</span>
                      <button
                        onClick={() => retrySendMessage && retrySendMessage(msg.id)}
                        className="ml-1 text-xs underline text-rose-300 hover:text-rose-100 flex items-center gap-1 font-semibold"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Qayta urinish</span>
                      </button>
                    </div>
                  )}

                  {/* Reaction Badges row */}
                  {hasReactions && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap ml-1">
                      {Object.entries(msg.reactions!).map(([emoji, userIds]) => {
                        const hasReacted = currentUser && userIds.includes(currentUser.id);
                        return (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(msg.id, emoji)}
                            className={`px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1 border transition-all ${
                              hasReacted
                                ? 'bg-violet-600/40 border-violet-400 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                                : 'bg-[#15112c]/80 border-violet-500/20 text-violet-200 hover:bg-violet-600/20'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="text-[10px] font-bold">{userIds.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Hover Floating Action Bar */}
                  {msg.status !== 'sending' && (
                    <div
                      className={`absolute top-0 ${
                        isOutgoing ? '-left-32' : '-right-32'
                      } hidden group-hover:flex items-center gap-1 glass-panel border rounded-full px-2.5 py-1 shadow-xl z-20`}
                    >
                    <button
                      onClick={() => toggleReaction(msg.id, '👍')}
                      className="hover:scale-130 transition-transform text-xs"
                    >
                      👍
                    </button>
                    <button
                      onClick={() => toggleReaction(msg.id, '❤️')}
                      className="hover:scale-130 transition-transform text-xs"
                    >
                      ❤️
                    </button>
                    <button
                      onClick={() => toggleReaction(msg.id, '🔥')}
                      className="hover:scale-130 transition-transform text-xs"
                    >
                      🔥
                    </button>
                    <button
                      onClick={() => setReplyingTo(msg)}
                      className="p-1 hover:text-white text-violet-300 transition-colors"
                      title="Javob qaytarish"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => pinMessage(msg.id)}
                      className="p-1 hover:text-white text-violet-300 transition-colors"
                      title="Qadash"
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    {isOutgoing && (
                      <>
                        {msg.type === 'text' && (
                          <button
                            onClick={() => {
                              setEditingMessage(msg);
                              setInputText(msg.text);
                              inputRef.current?.focus();
                            }}
                            className="p-1 hover:text-white text-violet-300 transition-colors"
                            title="Tahrirlash"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          className="p-1 hover:text-red-400 text-violet-300 transition-colors"
                          title="O'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Reply / Edit Banner above input */}
      {(replyingTo || editingMessage) && (
        <div className="px-4 py-2 glass-panel border-t flex items-center justify-between select-none">
          <div className="flex items-center gap-3 truncate">
            {replyingTo ? (
              <Reply className="w-4 h-4 text-fuchsia-400 flex-shrink-0" />
            ) : (
              <Edit2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <div className="truncate text-xs">
              <span className="font-bold text-fuchsia-300 mr-1.5">
                {replyingTo ? `Javob: ${replyingTo.senderName}` : 'Xabarni tahrirlash'}
              </span>
              <span className="text-white/80 truncate">
                {replyingTo?.text || editingMessage?.text}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setReplyingTo(null);
              setEditingMessage(null);
              if (editingMessage) setInputText('');
            }}
            className="p-1 text-violet-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. Emoji Picker Popup */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 z-30 p-3.5 glass-panel border rounded-3xl shadow-2xl select-none animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-violet-500/20">
            <span className="text-xs font-bold text-violet-300">Emojilar</span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="text-violet-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2 text-xl">
            {EMOJI_LIST.map(em => (
              <button
                key={em}
                onClick={() => {
                  setInputText(prev => prev + em);
                  inputRef.current?.focus();
                }}
                className="w-9 h-9 rounded-xl hover:bg-violet-600/20 flex items-center justify-center transition-transform hover:scale-125"
              >
                {em}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Bottom Input Bar */}
      <div className="p-3 glass-panel border-t flex items-center gap-2.5 select-none relative z-10">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />

        {isRecording ? (
          /* Voice Recording Active UI with glowing fuchsia indicator */
          <div className="flex-1 flex items-center justify-between bg-violet-950/70 border border-fuchsia-500/40 rounded-2xl px-4 py-2.5 shadow-[0_0_20px_rgba(217,70,239,0.2)]">
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-fuchsia-500 animate-pulse-record" />
              <span className="text-xs font-mono text-white font-bold">
                {Math.floor(recordDuration / 60)}:{Math.floor(recordDuration % 60) < 10 ? '0' : ''}
                {Math.floor(recordDuration % 60)}
              </span>
              {/* Dynamic waveform during recording */}
              <div className="flex items-center gap-[2.5px] h-5 ml-2">
                {waveformData.map((h, i) => (
                  <div
                    key={i}
                    className="w-[2.5px] bg-fuchsia-400 rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(18, h)}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCancelVoice}
                className="p-1.5 text-violet-400 hover:text-red-400 transition-colors"
                title="Bekor qilish"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleSendVoice}
                className="px-4 py-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-fuchsia-500/30"
              >
                <Send className="w-3.5 h-3.5" />
                Yuborish
              </button>
            </div>
          </div>
        ) : (
          /* Regular Input UI */
          <>
            {/* Attachment Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-violet-400 hover:text-white hover:bg-violet-600/20 rounded-xl transition-all flex-shrink-0"
              title="Fayl yoki rasm biriktirish"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Input Form */}
            <form onSubmit={handleSend} className="flex-1 flex items-center relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={handleInputChange}
                onPaste={handlePaste}
                placeholder="Xabar yozing..."
                className="w-full glass-input rounded-2xl py-2.5 pl-4 pr-10 text-sm text-white placeholder-violet-400/50 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-3 text-violet-400 hover:text-white transition-colors"
                title="Emojilar"
              >
                <Smile className="w-5 h-5" />
              </button>
            </form>

            {/* Action button: Send or Voice Record */}
            {inputText.trim() || editingMessage ? (
              <button
                onClick={() => handleSend()}
                className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-600 hover:opacity-95 text-white flex items-center justify-center shadow-lg shadow-violet-600/35 transition-transform active:scale-95 flex-shrink-0"
                title="Yuborish"
              >
                <Send className="w-4 h-4 translate-x-0.5" />
              </button>
            ) : (
              <button
                onClick={handleStartVoice}
                className="w-11 h-11 rounded-2xl text-violet-300 hover:text-white bg-violet-600/15 hover:bg-violet-600/30 border border-violet-500/20 flex items-center justify-center transition-all active:scale-95 flex-shrink-0 shadow-sm"
                title="Ovozli xabar yozish (bosing)"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
