export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  avatarColor: string;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: number;
  phone?: string;
}

export type ChatType = 'direct' | 'group' | 'saved';

export interface Chat {
  id: string;
  type: ChatType;
  title: string;
  avatar?: string;
  avatarColor?: string;
  description?: string;
  participants: string[]; // user IDs
  pinnedMessageId?: string;
  unreadCount?: number;
  lastMessage?: Message;
  updatedAt: number;
  createdAt: number;
}

export type MessageType = 'text' | 'voice' | 'image' | 'file';

export interface MediaMeta {
  duration?: number; // seconds for voice/audio
  waveform?: number[]; // visual audio bars
  size?: number; // bytes
  name?: string; // original filename
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface ReplyInfo {
  id: string;
  senderName: string;
  text: string;
  type?: MessageType;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  senderColor?: string;
  text: string;
  type: MessageType;
  mediaUrl?: string;
  mediaMeta?: MediaMeta;
  replyTo?: ReplyInfo;
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  isEdited?: boolean;
  createdAt: number;
  readBy: string[]; // user IDs who read it
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type ThemeMode = 'dark' | 'light';
