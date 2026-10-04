import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Chat, Message, User, ReplyInfo, MediaMeta } from '../types';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { useAuth } from './AuthContext';

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
      setChats(res.chats);
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  }, [isAuthenticated]);

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
      // If message is in currently open chat
      if (newMsg.chatId === activeChatId) {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
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
              lastMessage: newMsg,
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
      setChats(prev => {
        if (prev.some(c => c.id === newChat.id)) return prev;
        return [newChat, ...prev];
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

  // Send regular text message
  const sendMessage = async (text: string) => {
    if (!activeChatId || !text.trim()) return;

    let replyToData: ReplyInfo | undefined = undefined;
    if (replyingTo) {
      replyToData = {
        id: replyingTo.id,
        senderName: replyingTo.senderName || 'Foydalanuvchi',
        text: replyingTo.text || (replyingTo.type === 'voice' ? '🎤 Ovozli xabar' : '📷 Rasm'),
        type: replyingTo.type
      };
    }

    try {
      await api.sendMessage(activeChatId, {
        text: text.trim(),
        type: 'text',
        replyTo: replyToData
      });
      setReplyingTo(null);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Send voice message
  const sendVoiceMessage = async (blob: Blob, duration: number, waveform: number[]) => {
    if (!activeChatId) return;

    // Convert blob to base64
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      try {
        const uploadRes = await api.uploadFile(base64Data, `voice_${Date.now()}.webm`, 'audio/webm');
        const mediaMeta: MediaMeta = {
          duration: Math.round(duration),
          waveform,
          size: uploadRes.size,
          mimeType: uploadRes.mimeType
        };

        await api.sendMessage(activeChatId, {
          text: '',
          type: 'voice',
          mediaUrl: uploadRes.url,
          mediaMeta,
          replyTo: replyingTo ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName || 'Foydalanuvchi',
            text: replyingTo.text || 'Xabar',
            type: replyingTo.type
          } : undefined
        });

        setReplyingTo(null);
      } catch (err) {
        console.error('Voice send failed:', err);
      }
    };
  };

  // Send media/document file
  const sendMediaMessage = async (file: File) => {
    if (!activeChatId) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      const isImage = file.type.startsWith('image/');
      const msgType = isImage ? 'image' : 'file';

      try {
        const uploadRes = await api.uploadFile(base64Data, file.name, file.type);
        const mediaMeta: MediaMeta = {
          size: file.size,
          name: file.name,
          mimeType: file.type
        };

        await api.sendMessage(activeChatId, {
          text: isImage ? '' : file.name,
          type: msgType,
          mediaUrl: uploadRes.url,
          mediaMeta,
          replyTo: replyingTo ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName || 'Foydalanuvchi',
            text: replyingTo.text || 'Xabar',
            type: replyingTo.type
          } : undefined
        });

        setReplyingTo(null);
      } catch (err) {
        console.error('File send failed:', err);
      }
    };
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
    setActiveChatId(res.chat.id);
    return res.chat;
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
