import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Chat, Message, User, ReplyInfo, MediaMeta, MessageType, MessageStatus } from '../types';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { useAuth } from './AuthContext';

function playNotificationSound(type: 'sent' | 'received') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'sent') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    }
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
}

interface TypingStatus {
  chatId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

interface ChatContextType {
  chats: Chat[];
  activeChatId: string | null;
  activeChat: Chat | null;
  messages: Message[];
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  activeTab: 'all' | 'personal' | 'groups' | 'unread';
  searchQuery: string;
  typingMap: Record<string, string>; // chatId -> "Alisher yozmoqda..."
  userStatusMap: Record<string, { isOnline: boolean; lastSeen: number }>;
  replyingTo: Message | null;
  setActiveTab: (tab: 'all' | 'personal' | 'groups' | 'unread') => void;
  setSearchQuery: (q: string) => void;
  setActiveChatId: (id: string | null) => void;
  setReplyingTo: (msg: Message | null) => void;
  sendMessage: (text: string) => Promise<void>;
  sendVoiceMessage: (blob: Blob, duration: number, waveform: number[]) => Promise<void>;
  sendMediaMessage: (file: File) => Promise<void>;
  retrySendMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, text: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  pinMessage: (messageId?: string) => Promise<void>;
  createDirectChat: (targetUserId: string) => Promise<Chat>;
  createGroupChat: (title: string, participantIds: string[]) => Promise<Chat>;
  openChatWithUsername: (username: string) => Promise<boolean>;
  sendTyping: (isTyping: boolean) => void;
  refreshChats: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

function resolveChatForClient(chat: Chat, currentUserId?: string): Chat {
  if (chat.type !== 'direct' || !currentUserId) return chat;
  const otherUser = (chat as any).otherUser;

  if (otherUser) {
    return {
      ...chat,
      title: otherUser.displayName || 'Foydalanuvchi',
      avatar: otherUser.avatar,
      avatarColor: otherUser.avatarColor || chat.avatarColor || '#8b5cf6'
    };
  }
  return chat;
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'groups' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [typingMap, setTypingMap] = useState<Record<string, string>>({});
  const [userStatusMap, setUserStatusMap] = useState<Record<string, { isOnline: boolean; lastSeen: number }>>({});

  const typingTimeouts = useRef<Record<string, any>>({});

  // Fetch all chats
  const refreshChats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getChats();
      setChats(res.chats.map(c => resolveChatForClient(c, user?.id)));
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoadingChats(true);
      refreshChats().finally(() => setIsLoadingChats(false));
    } else {
      setChats([]);
      setActiveChatId(null);
      setMessages([]);
    }
  }, [isAuthenticated, refreshChats]);

  // Handle URL query parameters for direct links (e.g. ?user=username or ?chat=chatId)
  useEffect(() => {
    if (!isAuthenticated || chats.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const userParam = params.get('user');
    const chatParam = params.get('chat');

    if (userParam) {
      openChatWithUsername(userParam.replace('@', ''));
    } else if (chatParam) {
      const found = chats.find(c => c.id === chatParam);
      if (found) {
        setActiveChatId(found.id);
      }
    }
  }, [isAuthenticated, chats.length]);

  // Load messages when activeChatId changes
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setIsLoadingMessages(true);
    setReplyingTo(null);

    api.getMessages(activeChatId)
      .then(res => {
        if (isMounted) {
          setMessages(res.messages);
          // Mark as read locally in chat list
          setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, unreadCount: 0 } : c));
        }
      })
      .catch(err => {
        console.error('Failed to load messages:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingMessages(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeChatId]);

  // Setup WebSocket listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. New message
    const unsubNewMsg = socket.on('message:new', (newMsg: Message) => {
      // Play sound
      if (user && newMsg.senderId !== user.id) {
        playNotificationSound('received');
      }

      // If message is in currently open chat
      if (newMsg.chatId === activeChatId) {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) {
            return prev.map(m => m.id === newMsg.id ? { ...newMsg, status: 'sent' } : m);
          }

          // If current user sent it, reconcile with any pending optimistic message
          if (user && newMsg.senderId === user.id) {
            const tempIdx = prev.findIndex(m =>
              m.id.startsWith('temp_') &&
              m.type === newMsg.type &&
              (newMsg.type === 'text' ? m.text === newMsg.text : true)
            );
            if (tempIdx !== -1) {
              const updated = [...prev];
              updated[tempIdx] = { ...newMsg, status: 'sent' };
              return updated;
            }
          }

          return [...prev, { ...newMsg, status: 'sent' }];
        });
        // Mark message as read
        if (user && newMsg.senderId !== user.id) {
          socket.markAsRead(activeChatId, [newMsg.id]);
        }
      }

      // Update chats list
      setChats(prev => {
        const found = prev.find(c => c.id === newMsg.chatId);
        if (!found) {
          refreshChats();
          return prev;
        }

        return prev.map(c => {
          if (c.id === newMsg.chatId) {
            const isCurrentChat = c.id === activeChatId;
            const isFromOther = user && newMsg.senderId !== user.id;
            const newUnread = isCurrentChat ? 0 : (c.unreadCount || 0) + (isFromOther ? 1 : 0);
            return {
              ...c,
              lastMessage: { ...newMsg, status: 'sent' as MessageStatus },
              updatedAt: newMsg.createdAt,
              unreadCount: newUnread
            };
          }
          return c;
        }).sort((a, b) => (b.lastMessage?.createdAt || b.updatedAt) - (a.lastMessage?.createdAt || a.updatedAt));
      });
    });

    // 2. Message read receipt
    const unsubMsgRead = socket.on('message:read', (data: { chatId: string; userId: string; messageIds: string[] }) => {
      if (data.chatId === activeChatId) {
        setMessages(prev => prev.map(m => {
          if (data.messageIds.includes(m.id) && !m.readBy.includes(data.userId)) {
            return { ...m, readBy: [...m.readBy, data.userId] };
          }
          return m;
        }));
      }
    });

    // 3. Message edited
    const unsubMsgEdited = socket.on('message:edited', (data: { messageId: string; text: string; isEdited: boolean }) => {
      setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, text: data.text, isEdited: true } : m));
      setChats(prev => prev.map(c => {
        if (c.lastMessage?.id === data.messageId) {
          return { ...c, lastMessage: { ...c.lastMessage, text: data.text, isEdited: true } };
        }
        return c;
      }));
    });

    // 4. Message deleted
    const unsubMsgDeleted = socket.on('message:deleted', (data: { messageId: string; chatId: string }) => {
      setMessages(prev => prev.filter(m => m.id !== data.messageId));
      refreshChats();
    });

    // 5. Message reaction
    const unsubMsgReaction = socket.on('message:reaction', (data: { messageId: string; reactions: Record<string, string[]> }) => {
      setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, reactions: data.reactions } : m));
    });

    // 6. Typing update
    const unsubTyping = socket.on('typing:update', (data: TypingStatus) => {
      const { chatId, userName, isTyping } = data;
      if (isTyping) {
        setTypingMap(prev => ({ ...prev, [chatId]: `${userName} yozmoqda...` }));
        clearTimeout(typingTimeouts.current[chatId]);
        typingTimeouts.current[chatId] = setTimeout(() => {
          setTypingMap(prev => {
            const next = { ...prev };
            delete next[chatId];
            return next;
          });
        }, 4000);
      } else {
        setTypingMap(prev => {
          const next = { ...prev };
          delete next[chatId];
          return next;
        });
      }
    });

    // 7. User online status
    const unsubUserStatus = socket.on('user:status', (data: { userId: string; isOnline: boolean; lastSeen: number }) => {
      setUserStatusMap(prev => ({
        ...prev,
        [data.userId]: { isOnline: data.isOnline, lastSeen: data.lastSeen }
      }));
    });

    // 8. New chat added
    const unsubNewChat = socket.on('chat:new', (newChat: Chat) => {
      const resolved = resolveChatForClient(newChat, user?.id);
      setChats(prev => {
        if (prev.some(c => c.id === resolved.id)) return prev;
        return [resolved, ...prev];
      });
    });

    // 9. Pinned message update
    const unsubPinned = socket.on('chat:pinned', (data: { chatId: string; pinnedMessageId?: string }) => {
      setChats(prev => prev.map(c => c.id === data.chatId ? { ...c, pinnedMessageId: data.pinnedMessageId } : c));
    });

    return () => {
      unsubNewMsg();
      unsubMsgRead();
      unsubMsgEdited();
      unsubMsgDeleted();
      unsubMsgReaction();
      unsubTyping();
      unsubUserStatus();
      unsubNewChat();
      unsubPinned();
    };
  }, [isAuthenticated, activeChatId, user, refreshChats]);

  // Send regular text message with INSTANT optimistic UI
  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!activeChatId || !trimmed || !user) return;

    let replyToData: ReplyInfo | undefined = undefined;
    if (replyingTo) {
      replyToData = {
        id: replyingTo.id,
        senderName: replyingTo.senderName || 'Foydalanuvchi',
        text: replyingTo.text || (replyingTo.type === 'voice' ? '🎤 Ovozli xabar' : '📷 Rasm'),
        type: replyingTo.type
      };
    }

    const tempId = `temp_msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const optimisticMsg: Message = {
      id: tempId,
      chatId: activeChatId,
      senderId: user.id,
      senderName: user.displayName,
      senderAvatar: user.avatar,
      senderColor: user.avatarColor,
      text: trimmed,
      type: 'text',
      replyTo: replyToData,
      reactions: {},
      createdAt: Date.now(),
      readBy: [user.id],
      status: 'sending'
    };

    // 1. Immediately drop message into chat
    setMessages(prev => [...prev, optimisticMsg]);
    setReplyingTo(null);

    // 2. Immediately update sidebar chat preview
    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          lastMessage: optimisticMsg,
          updatedAt: optimisticMsg.createdAt
        };
      }
      return c;
    }).sort((a, b) => (b.lastMessage?.createdAt || b.updatedAt) - (a.lastMessage?.createdAt || a.updatedAt)));

    try {
      const res = await api.sendMessage(activeChatId, {
        text: trimmed,
        type: 'text',
        replyTo: replyToData
      });

      playNotificationSound('sent');

      setMessages(prev => {
        if (prev.some(m => m.id === res.message.id)) {
          return prev.filter(m => m.id !== tempId);
        }
        return prev.map(m => m.id === tempId ? { ...res.message, status: 'sent' } : m);
      });

      setChats(prev => prev.map(c => {
        if (c.id === activeChatId && c.lastMessage?.id === tempId) {
          return { ...c, lastMessage: { ...res.message, status: 'sent' as MessageStatus } };
        }
        return c;
      }));
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    }
  };

  // Send voice message with INSTANT waveform & audio bubble + sending state
  const sendVoiceMessage = async (blob: Blob, duration: number, waveform: number[]) => {
    if (!activeChatId || !user) return;

    let replyToData: ReplyInfo | undefined = undefined;
    if (replyingTo) {
      replyToData = {
        id: replyingTo.id,
        senderName: replyingTo.senderName || 'Foydalanuvchi',
        text: replyingTo.text || 'Xabar',
        type: replyingTo.type
      };
    }

    const localBlobUrl = URL.createObjectURL(blob);
    const tempId = `temp_voice_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const roundedDuration = Math.max(1, Math.round(duration));
    const safeWaveform = waveform && waveform.length > 0 ? waveform : [30, 60, 45, 80, 50, 90, 70, 40, 85, 60, 30];

    const optimisticMsg: Message = {
      id: tempId,
      chatId: activeChatId,
      senderId: user.id,
      senderName: user.displayName,
      senderAvatar: user.avatar,
      senderColor: user.avatarColor,
      text: '',
      type: 'voice',
      mediaUrl: localBlobUrl,
      mediaMeta: {
        duration: roundedDuration,
        waveform: safeWaveform,
        size: blob.size,
        mimeType: blob.type || 'audio/webm'
      },
      replyTo: replyToData,
      reactions: {},
      createdAt: Date.now(),
      readBy: [user.id],
      status: 'sending'
    };

    // 1. Drop into chat immediately
    setMessages(prev => [...prev, optimisticMsg]);
    setReplyingTo(null);

    // 2. Update sidebar chat preview
    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          lastMessage: optimisticMsg,
          updatedAt: optimisticMsg.createdAt
        };
      }
      return c;
    }).sort((a, b) => (b.lastMessage?.createdAt || b.updatedAt) - (a.lastMessage?.createdAt || a.updatedAt)));

    // 3. Process upload in background
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      const mime = blob.type || 'audio/webm';
      let ext = 'webm';
      if (mime.includes('mp4') || mime.includes('m4a') || mime.includes('aac')) ext = 'mp4';
      else if (mime.includes('ogg')) ext = 'ogg';
      else if (mime.includes('wav')) ext = 'wav';

      try {
        const uploadRes = await api.uploadFile(base64Data, `voice_${Date.now()}.${ext}`, mime, activeChatId);
        const mediaMeta: MediaMeta = {
          duration: roundedDuration,
          waveform: safeWaveform,
          size: uploadRes.size,
          mimeType: uploadRes.mimeType
        };

        const res = await api.sendMessage(activeChatId, {
          text: '',
          type: 'voice',
          mediaUrl: uploadRes.url,
          mediaMeta,
          replyTo: replyToData
        });

        playNotificationSound('sent');

        setMessages(prev => {
          if (prev.some(m => m.id === res.message.id)) {
            return prev.filter(m => m.id !== tempId);
          }
          return prev.map(m => m.id === tempId ? { ...res.message, status: 'sent' } : m);
        });

        setChats(prev => prev.map(c => {
          if (c.id === activeChatId && c.lastMessage?.id === tempId) {
            return { ...c, lastMessage: { ...res.message, status: 'sent' as MessageStatus } };
          }
          return c;
        }));
      } catch (err) {
        console.error('Voice send failed:', err);
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
      }
    };
    reader.onerror = () => {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    };
  };

  // Send media/document file with INSTANT preview and sending status
  const sendMediaMessage = async (file: File) => {
    if (!activeChatId || !user) return;

    let replyToData: ReplyInfo | undefined = undefined;
    if (replyingTo) {
      replyToData = {
        id: replyingTo.id,
        senderName: replyingTo.senderName || 'Foydalanuvchi',
        text: replyingTo.text || 'Xabar',
        type: replyingTo.type
      };
    }

    const isImage = file.type.startsWith('image/');
    const msgType: MessageType = isImage ? 'image' : 'file';
    const localUrl = URL.createObjectURL(file);
    const tempId = `temp_media_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const optimisticMsg: Message = {
      id: tempId,
      chatId: activeChatId,
      senderId: user.id,
      senderName: user.displayName,
      senderAvatar: user.avatar,
      senderColor: user.avatarColor,
      text: isImage ? '' : file.name,
      type: msgType,
      mediaUrl: localUrl,
      mediaMeta: {
        size: file.size,
        name: file.name,
        mimeType: file.type
      },
      replyTo: replyToData,
      reactions: {},
      createdAt: Date.now(),
      readBy: [user.id],
      status: 'sending'
    };

    // 1. Drop into chat immediately
    setMessages(prev => [...prev, optimisticMsg]);
    setReplyingTo(null);

    // 2. Update sidebar chat preview
    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          lastMessage: optimisticMsg,
          updatedAt: optimisticMsg.createdAt
        };
      }
      return c;
    }).sort((a, b) => (b.lastMessage?.createdAt || b.updatedAt) - (a.lastMessage?.createdAt || a.updatedAt)));

    // 3. Process upload in background
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Data = reader.result as string;

      try {
        const uploadRes = await api.uploadFile(base64Data, file.name, file.type, activeChatId);
        const mediaMeta: MediaMeta = {
          size: file.size,
          name: file.name,
          mimeType: file.type
        };

        const res = await api.sendMessage(activeChatId, {
          text: isImage ? '' : file.name,
          type: msgType,
          mediaUrl: uploadRes.url,
          mediaMeta,
          replyTo: replyToData
        });

        playNotificationSound('sent');

        setMessages(prev => {
          if (prev.some(m => m.id === res.message.id)) {
            return prev.filter(m => m.id !== tempId);
          }
          return prev.map(m => m.id === tempId ? { ...res.message, status: 'sent' } : m);
        });

        setChats(prev => prev.map(c => {
          if (c.id === activeChatId && c.lastMessage?.id === tempId) {
            return { ...c, lastMessage: { ...res.message, status: 'sent' as MessageStatus } };
          }
          return c;
        }));
      } catch (err) {
        console.error('File send failed:', err);
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
      }
    };
    reader.onerror = () => {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    };
  };

  // Retry sending an error message
  const retrySendMessage = async (messageId: string) => {
    const failedMsg = messages.find(m => m.id === messageId);
    if (!failedMsg || !activeChatId) return;

    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'sending' } : m));

    try {
      const res = await api.sendMessage(activeChatId, {
        text: failedMsg.text,
        type: failedMsg.type,
        mediaUrl: failedMsg.mediaUrl,
        mediaMeta: failedMsg.mediaMeta,
        replyTo: failedMsg.replyTo
      });
      playNotificationSound('sent');
      setMessages(prev => prev.map(m => m.id === messageId ? { ...res.message, status: 'sent' } : m));
    } catch (err) {
      console.error('Retry failed:', err);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'error' } : m));
    }
  };

  const editMessage = async (messageId: string, text: string) => {
    try {
      await api.editMessage(messageId, text);
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await api.deleteMessage(messageId);
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    try {
      await api.toggleReaction(messageId, emoji);
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  const pinMessage = async (messageId?: string) => {
    if (!activeChatId) return;
    try {
      await api.pinMessage(activeChatId, messageId);
    } catch (err) {
      console.error('Failed to pin message:', err);
    }
  };

  const createDirectChat = async (targetUserId: string): Promise<Chat> => {
    const res = await api.createDirectChat(targetUserId);
    await refreshChats();
    const resolved = resolveChatForClient(res.chat, user?.id);
    setActiveChatId(resolved.id);
    return resolved;
  };

  const createGroupChat = async (title: string, participantIds: string[]): Promise<Chat> => {
    const res = await api.createGroupChat(title, participantIds);
    await refreshChats();
    setActiveChatId(res.chat.id);
    return res.chat;
  };

  const openChatWithUsername = async (rawUsername: string): Promise<boolean> => {
    const clean = rawUsername.toLowerCase().replace('@', '').trim();
    try {
      const res = await api.getUserByUsername(clean);
      if (res.user) {
        await createDirectChat(res.user.id);
        return true;
      }
    } catch (err) {
      console.error('User not found by username:', clean, err);
    }
    return false;
  };

  const sendTyping = (isTyping: boolean) => {
    if (activeChatId) {
      socket.sendTyping(activeChatId, isTyping);
    }
  };

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChatId,
        activeChat,
        messages,
        isLoadingChats,
        isLoadingMessages,
        activeTab,
        searchQuery,
        typingMap,
        userStatusMap,
        replyingTo,
        setActiveTab,
        setSearchQuery,
        setActiveChatId,
        setReplyingTo,
        sendMessage,
        sendVoiceMessage,
        sendMediaMessage,
        retrySendMessage,
        editMessage,
        deleteMessage,
        toggleReaction,
        pinMessage,
        createDirectChat,
        createGroupChat,
        openChatWithUsername,
        sendTyping,
        refreshChats
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
