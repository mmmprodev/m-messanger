import { User, Chat, Message, MediaMeta, ReplyInfo } from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('tg_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('tg_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('tg_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Noma\'lum xatolik' }));
    throw new Error(errorData.error || `Server xatosi: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  async register(data: { username: string; displayName: string; password: string; avatarColor?: string; bio?: string }) {
    return request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async login(data: { username: string; password: string }) {
    return request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async guestLogin(name?: string) {
    return request<{ token: string; user: User }>('/auth/guest', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  },

  async getMe() {
    return request<{ user: User }>('/auth/me');
  },

  async updateProfile(data: Partial<User>) {
    return request<{ user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Users
  async getUsers(query?: string) {
    const params = query ? `?q=${encodeURIComponent(query)}` : '';
    return request<{ users: User[] }>(`/users${params}`);
  },

  async getUserByUsername(username: string) {
    return request<{ user: User }>(`/users/by-username/${encodeURIComponent(username)}`);
  },

  // Chats
  async getChats() {
    return request<{ chats: Chat[] }>('/chats');
  },

  async createDirectChat(targetUserId: string) {
    return request<{ chat: Chat }>('/chats', {
      method: 'POST',
      body: JSON.stringify({ type: 'direct', targetUserId })
    });
  },

  async createGroupChat(title: string, participantIds: string[]) {
    return request<{ chat: Chat }>('/chats', {
      method: 'POST',
      body: JSON.stringify({ type: 'group', title, participantIds })
    });
  },

  // Messages
  async getMessages(chatId: string) {
    return request<{ messages: Message[] }>(`/chats/${chatId}/messages`);
  },

  async sendMessage(chatId: string, data: {
    text: string;
    type?: string;
    mediaUrl?: string;
    mediaMeta?: MediaMeta;
    replyTo?: ReplyInfo;
  }) {
    return request<{ message: Message }>(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async editMessage(messageId: string, text: string) {
    return request<{ message: Message }>(`/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ text })
    });
  },

  async deleteMessage(messageId: string) {
    return request<{ success: boolean }>(`/messages/${messageId}`, {
      method: 'DELETE'
    });
  },

  async toggleReaction(messageId: string, emoji: string) {
    return request<{ reactions: Record<string, string[]> }>(`/messages/${messageId}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji })
    });
  },

  async pinMessage(chatId: string, messageId?: string) {
    return request<{ success: boolean; pinnedMessageId?: string }>(`/chats/${chatId}/pin`, {
      method: 'POST',
      body: JSON.stringify({ messageId })
    });
  },

  // Media / File Upload
  async uploadFile(base64Data: string, fileName: string, mimeType: string, chatId?: string) {
    return request<{ url: string; fileName: string; size: number; mimeType: string }>('/upload', {
      method: 'POST',
      body: JSON.stringify({ base64Data, fileName, mimeType, chatId })
    });
  },

  getMediaUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http')) return url;
    const token = getAuthToken();
    if (!token) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${encodeURIComponent(token)}`;
  }
};
