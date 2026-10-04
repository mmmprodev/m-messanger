import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
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
  Info
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
      <div className="flex-1 h-full telegram-chat-bg hidden md:flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-24 h-24 rounded-full bg-[#17212b]/80 border border-white/5 flex items-center justify-center mb-4 shadow-xl">
          <Send className="w-12 h-12 text-[#2481cc] -rotate-12 translate-x-0.5" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Telegram Web</h3>
        <p className="text-xs text-[#708499] max-w-sm leading-relaxed">
          Suhbatlashish uchun chap paneldan chatni tanlang yoki yangi lichka boshlash uchun havolangizni do'stlaringizga yuboring.
        </p>
      </div>
    );
  }

  const isDirect = activeChat.type === 'direct';
  const otherUser = (activeChat as any).otherUser;
  const isSavedMessages = activeChat.type === 'saved';

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

  const formatMessageTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filter messages if search in chat is active
  const displayedMessages = messageSearchQuery.trim()
    ? messages.filter(m => m.text.toLowerCase().includes(messageSearchQuery.toLowerCase()))
    : messages;

  return (
    <div className="flex-1 h-full flex flex-col bg-[#0e1621] relative min-w-0">
      {/* 1. Chat Header */}
      <div className="h-14 px-3 sm:px-4 bg-[#17212b] border-b border-white/5 flex items-center justify-between select-none z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Back button on mobile */}
          <button
            onClick={onBackMobile}
            className="md:hidden p-1.5 rounded-full text-[#708499] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Avatar */}
          <div className="cursor-pointer" onClick={onOpenInfo}>
            <Avatar
              name={activeChat.title}
              avatarUrl={activeChat.avatar}
              color={activeChat.avatarColor || '#65aadd'}
              size="sm"
              isOnline={isDirect ? isOnline : undefined}
            />
          </div>

          {/* Title & Status */}
          <div className="min-w-0 flex-1 cursor-pointer" onClick={onOpenInfo}>
            <h3 className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
              {isSavedMessages && <Bookmark className="w-3.5 h-3.5 text-[#65aadd]" />}
              {activeChat.title}
            </h3>
            <p className="text-[11px] truncate">
              {chatTyping ? (
                <span className="text-[#65aadd] font-medium animate-pulse">{chatTyping}</span>
              ) : isDirect ? (
                isOnline ? (
                  <span className="text-[#65aadd] font-medium">onlayn</span>
                ) : (
                  <span className="text-[#708499]">yaqinda bo'lgan</span>
                )
              ) : isSavedMessages ? (
                <span className="text-[#708499]">Shaxsiy bulut xotirasi</span>
              ) : (
                <span className="text-[#708499]">{activeChat.participants.length} ta a'zo</span>
              )}
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 text-[#708499]">
          {!isSavedMessages && (
            <>
              <button
                onClick={() => onStartCall(false)}
                className="p-2 rounded-full hover:text-white hover:bg-white/10 transition-colors"
                title="Ovozli qo'ng'iroq"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => onStartCall(true)}
                className="p-2 rounded-full hover:text-white hover:bg-white/10 transition-colors"
                title="Video qo'ng'iroq"
              >
                <Video className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={() => setShowSearchInChat(!showSearchInChat)}
            className={`p-2 rounded-full transition-colors ${
              showSearchInChat ? 'text-[#65aadd] bg-[#2481cc]/20' : 'hover:text-white hover:bg-white/10'
            }`}
            title="Chatda qidirish"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenInfo}
            className="p-2 rounded-full hover:text-white hover:bg-white/10 transition-colors"
            title="Profil ma'lumotlari"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search in chat bar if toggled */}
      {showSearchInChat && (
        <div className="px-4 py-2 bg-[#17212b]/95 border-b border-white/5 flex items-center gap-2 animate-in fade-in">
          <Search className="w-4 h-4 text-[#708499]" />
          <input
            type="text"
            value={messageSearchQuery}
            onChange={e => setMessageSearchQuery(e.target.value)}
            placeholder="Xabarlarni qidirish..."
            className="flex-1 bg-transparent text-xs text-white placeholder-[#708499] focus:outline-none"
            autoFocus
          />
          {messageSearchQuery && (
            <button
              onClick={() => setMessageSearchQuery('')}
              className="text-[#708499] hover:text-white text-xs"
            >
              Tozalash
            </button>
          )}
          <button
            onClick={() => { setShowSearchInChat(false); setMessageSearchQuery(''); }}
            className="text-[#708499] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pinned message banner */}
      {pinnedMessage && (
        <div className="px-4 py-2 bg-[#17212b]/90 border-b border-white/5 flex items-center justify-between text-xs cursor-pointer hover:bg-[#17212b] transition-colors">
          <div className="flex items-center gap-2.5 truncate flex-1">
            <Pin className="w-3.5 h-3.5 text-[#65aadd] flex-shrink-0" />
            <div className="truncate">
              <span className="text-[#65aadd] font-semibold mr-1.5">Qadalgan xabar:</span>
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
            className="p-1 text-[#708499] hover:text-white transition-colors"
            title="Qadalgan xabarni olib tashlash"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Messages Stream */}
      <div className="flex-1 overflow-y-auto telegram-chat-bg p-3 sm:p-4 space-y-2.5">
        {isLoadingMessages ? (
          <div className="py-8 text-center text-xs text-[#708499]">Xabarlar yuklanmoqda...</div>
        ) : displayedMessages.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#708499] flex flex-col items-center gap-2">
            <span className="px-3 py-1 bg-black/40 rounded-full text-white/70">
              Ushbu chatda hali xabarlar yo'q. Birinchi bo'lib yozing!
            </span>
          </div>
        ) : (
          displayedMessages.map((msg, index) => {
            const isOutgoing = Boolean(currentUser && msg.senderId === currentUser.id);
            const isRead = msg.readBy && msg.readBy.length > 1;
            const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;
            const isMenuOpen = activeMenuMsgId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col group ${isOutgoing ? 'items-end' : 'items-start'}`}
              >
                {/* Bubble Container */}
                <div className="relative max-w-[85%] sm:max-w-[70%]">
                  {/* Sender name in group for incoming messages */}
                  {!isOutgoing && activeChat.type === 'group' && (
                    <span
                      className="text-[11px] font-semibold mb-0.5 ml-2 block truncate"
                      style={{ color: msg.senderColor || '#65aadd' }}
                    >
                      {msg.senderName}
                    </span>
                  )}

                  <div
                    className={`rounded-2xl px-3 py-2 shadow-sm relative ${
                      isOutgoing
                        ? 'bg-[#2b5278] text-white rounded-br-xs'
                        : 'bg-[#182533] text-white rounded-bl-xs'
                    }`}
                  >
                    {/* Reply banner if replied to another msg */}
                    {msg.replyTo && (
                      <div className="mb-1.5 pl-2 border-l-2 border-[#65aadd] bg-black/15 py-1 pr-2 rounded text-[11px]">
                        <span className="font-semibold text-[#65aadd] block truncate">
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
                        className="mb-1.5 rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => onOpenLightbox(msg.mediaUrl!, msg.mediaMeta?.name || 'photo.jpg')}
                      >
                        <img
                          src={msg.mediaUrl}
                          alt="Photo"
                          className="max-h-72 w-full object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Content: Voice message */}
                    {msg.type === 'voice' && msg.mediaUrl && (
                      <VoiceMessagePlayer
                        audioUrl={msg.mediaUrl}
                        duration={msg.mediaMeta?.duration}
                        waveform={msg.mediaMeta?.waveform}
                        isOutgoing={isOutgoing}
                      />
                    )}

                    {/* Content: File / Document */}
                    {msg.type === 'file' && msg.mediaUrl && (
                      <div className="flex items-center gap-3 p-2 bg-black/20 rounded-xl mb-1">
                        <div className="w-10 h-10 rounded-lg bg-[#2481cc]/30 flex items-center justify-center text-[#65aadd]">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{msg.mediaMeta?.name || 'Fayl'}</p>
                          <p className="text-[10px] opacity-70">
                            {msg.mediaMeta?.size ? `${(msg.mediaMeta.size / 1024).toFixed(1)} KB` : 'Hujjat'}
                          </p>
                        </div>
                        <a
                          href={msg.mediaUrl}
                          download={msg.mediaMeta?.name || 'file'}
                          className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                          <Download className="w-4 h-4 text-white" />
                        </a>
                      </div>
                    )}

                    {/* Content: Text */}
                    {msg.text && (
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed select-text">
                        {msg.text}
                      </p>
                    )}

                    {/* Footer: Time + Edited + Read checks */}
                    <div className="flex items-center justify-end gap-1 mt-0.5 text-[10px] opacity-70 select-none">
                      {msg.isEdited && <span className="italic mr-0.5">tahrirlangan</span>}
                      <span>{formatMessageTime(msg.createdAt)}</span>
                      {isOutgoing && (
                        <span>
                          {isRead ? (
                            <CheckCheck className="w-3.5 h-3.5 text-[#65aadd]" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reaction Badges row */}
                  {hasReactions && (
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {Object.entries(msg.reactions!).map(([emoji, userIds]) => {
                        const hasReacted = currentUser && userIds.includes(currentUser.id);
                        return (
                          <button
                            key={emoji}
                            onClick={() => toggleReaction(msg.id, emoji)}
                            className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border transition-all ${
                              hasReacted
                                ? 'bg-[#2481cc]/30 border-[#2481cc] text-white shadow-xs'
                                : 'bg-[#17212b]/80 border-white/10 text-white/80 hover:bg-[#202b36]'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="text-[10px] font-semibold">{userIds.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Hover Floating Action Bar (Telegram-style fast reaction and reply) */}
                  <div
                    className={`absolute top-0 ${
                      isOutgoing ? '-left-28' : '-right-28'
                    } hidden group-hover:flex items-center gap-1 bg-[#17212b] border border-white/10 rounded-full px-2 py-1 shadow-lg z-20`}
                  >
                    <button
                      onClick={() => toggleReaction(msg.id, '👍')}
                      className="hover:scale-125 transition-transform text-xs"
                      title="Reaksiya"
                    >
                      👍
                    </button>
                    <button
                      onClick={() => toggleReaction(msg.id, '❤️')}
                      className="hover:scale-125 transition-transform text-xs"
                      title="Reaksiya"
                    >
                      ❤️
                    </button>
                    <button
                      onClick={() => toggleReaction(msg.id, '🔥')}
                      className="hover:scale-125 transition-transform text-xs"
                      title="Reaksiya"
                    >
                      🔥
                    </button>
                    <button
                      onClick={() => setReplyingTo(msg)}
                      className="p-1 hover:text-white text-[#708499] transition-colors"
                      title="Javob qaytarish"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => pinMessage(msg.id)}
                      className="p-1 hover:text-white text-[#708499] transition-colors"
                      title="Xabarni qadash"
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
                            className="p-1 hover:text-white text-[#708499] transition-colors"
                            title="Tahrirlash"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          className="p-1 hover:text-red-400 text-[#708499] transition-colors"
                          title="O'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Reply / Edit Banner above input */}
      {(replyingTo || editingMessage) && (
        <div className="px-4 py-2 bg-[#17212b] border-t border-white/5 flex items-center justify-between select-none">
          <div className="flex items-center gap-3 truncate">
            {replyingTo ? (
              <Reply className="w-4 h-4 text-[#65aadd] flex-shrink-0" />
            ) : (
              <Edit2 className="w-4 h-4 text-[#7bc862] flex-shrink-0" />
            )}
            <div className="truncate text-xs">
              <span className="font-semibold text-[#65aadd] mr-1.5">
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
            className="p-1 text-[#708499] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. Emoji Picker Popup */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 z-30 p-3 bg-[#17212b] border border-white/10 rounded-2xl shadow-2xl select-none animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
            <span className="text-xs font-semibold text-[#708499]">Emojilar</span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="text-[#708499] hover:text-white"
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
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-transform hover:scale-125"
              >
                {em}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Bottom Input Bar */}
      <div className="p-2 sm:p-3 bg-[#17212b] border-t border-white/5 flex items-center gap-2 select-none relative z-10">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />

        {isRecording ? (
          /* Voice Recording Active UI */
          <div className="flex-1 flex items-center justify-between bg-[#0e1621] rounded-2xl px-4 py-2 border border-red-500/20">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse-record" />
              <span className="text-xs font-mono text-white font-semibold">
                {Math.floor(recordDuration / 60)}:{Math.floor(recordDuration % 60) < 10 ? '0' : ''}
                {Math.floor(recordDuration % 60)}
              </span>
              {/* Dynamic waveform during recording */}
              <div className="flex items-center gap-[2px] h-5 ml-2">
                {waveformData.map((h, i) => (
                  <div
                    key={i}
                    className="w-[2.5px] bg-[#65aadd] rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(15, h)}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCancelVoice}
                className="p-1.5 text-[#708499] hover:text-red-400 transition-colors"
                title="Bekor qilish"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleSendVoice}
                className="px-4 py-1.5 bg-[#2481cc] hover:bg-[#1f73b8] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#2481cc]/30"
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
              className="p-2 text-[#708499] hover:text-white hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
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
                placeholder="Xabar yozing..."
                className="w-full bg-[#0e1621] border border-white/5 rounded-2xl py-2.5 pl-4 pr-10 text-sm text-white placeholder-[#708499] focus:outline-none focus:border-[#2481cc]/60 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-2.5 text-[#708499] hover:text-white transition-colors"
                title="Emojilar"
              >
                <Smile className="w-5 h-5" />
              </button>
            </form>

            {/* Action button: Send or Voice Record */}
            {inputText.trim() || editingMessage ? (
              <button
                onClick={() => handleSend()}
                className="w-10 h-10 rounded-full bg-[#2481cc] hover:bg-[#1f73b8] text-white flex items-center justify-center shadow-md shadow-[#2481cc]/25 transition-transform active:scale-95 flex-shrink-0"
                title="Yuborish"
              >
                <Send className="w-4 h-4 translate-x-0.5" />
              </button>
            ) : (
              <button
                onClick={handleStartVoice}
                className="w-10 h-10 rounded-full text-[#708499] hover:text-white hover:bg-white/10 flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
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
