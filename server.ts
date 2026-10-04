import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory setup
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Database schema interfaces
interface StoredUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  avatarColor: string;
  bio?: string;
  passwordHash: string;
  token?: string;
  createdAt: number;
  isOnline: boolean;
  lastSeen: number;
}

interface StoredChat {
  id: string;
  type: 'direct' | 'group' | 'saved';
  title: string;
  avatar?: string;
  avatarColor?: string;
  description?: string;
  participants: string[];
  pinnedMessageId?: string;
  updatedAt: number;
  createdAt: number;
}

interface StoredMessage {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  type: 'text' | 'voice' | 'image' | 'file';
  mediaUrl?: string;
  mediaMeta?: any;
  replyTo?: any;
  reactions?: Record<string, string[]>;
  isEdited?: boolean;
  createdAt: number;
  readBy: string[];
}

interface Database {
  users: Record<string, StoredUser>;
  chats: Record<string, StoredChat>;
  messages: StoredMessage[];
}

// Helper to hash password
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_telegram_salt_2026').digest('hex');
}

// Default colors for avatars
const AVATAR_COLORS = [
  '#e17076', '#faa357', '#a695e7', '#7bc862', '#6ec9cb', '#65aadd', '#ee7aae'
];

function getRandomColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Seed initial database
function createInitialDatabase(): Database {
  const pavelId = 'user_pavel';
  const alisherId = 'user_alisher';
  const dildoraId = 'user_dildora';
  const botId = 'user_telegram_bot';

  const users: Record<string, StoredUser> = {
    [pavelId]: {
      id: pavelId,
      username: 'durov',
      displayName: 'Pavel Durov',
      avatarColor: '#65aadd',
      bio: 'Building Telegram. Freedom and privacy for all.',
      passwordHash: hashPassword('123456'),
      createdAt: Date.now() - 86400000 * 30,
      isOnline: true,
      lastSeen: Date.now()
    },
    [alisherId]: {
      id: alisherId,
      username: 'alisher_dev',
      displayName: 'Alisher Qodirov',
      avatarColor: '#7bc862',
      bio: 'Fullstack developer | Telegram botlari va web dasturchi',
      passwordHash: hashPassword('123456'),
      createdAt: Date.now() - 86400000 * 10,
      isOnline: false,
      lastSeen: Date.now() - 1000 * 60 * 15
    },
    [dildoraId]: {
      id: dildoraId,
      username: 'dildora_art',
      displayName: 'Dildora Karimova',
      avatarColor: '#ee7aae',
      bio: 'UI/UX Dizayner | Figma sevgisi ✨',
      passwordHash: hashPassword('123456'),
      createdAt: Date.now() - 86400000 * 5,
      isOnline: true,
      lastSeen: Date.now()
    },
    [botId]: {
      id: botId,
      username: 'telegram_uz_bot',
      displayName: 'Telegram News & Bot',
      avatarColor: '#faa357',
      bio: 'Rasmiy yangiliklar va tizim xabarlari boti 🤖',
      passwordHash: hashPassword('bot_secure_password'),
      createdAt: Date.now() - 86400000 * 60,
      isOnline: true,
      lastSeen: Date.now()
    }
  };

  const groupChatId = 'chat_community';
  const chats: Record<string, StoredChat> = {
    [groupChatId]: {
      id: groupChatId,
      type: 'group',
      title: "O'zbekiston IT & Dasturchilar Hamjamiyati 🇺🇿",
      avatarColor: '#65aadd',
      description: "Dasturchilar, startaplar va texnologiya ixlosmandlari uchun ochiq guruh.",
      participants: [pavelId, alisherId, dildoraId, botId],
      updatedAt: Date.now() - 1000 * 60 * 5,
      createdAt: Date.now() - 86400000 * 20
    }
  };

  const messages: StoredMessage[] = [
    {
      id: 'msg_welcome_1',
      chatId: groupChatId,
      senderId: botId,
      text: "Assalomu alaykum! Telegram Web Real-Time Messenger platformasiga xush kelibsiz! 🚀\n\nBu yerda barcha foydalanuvchilar real-vaqtda yozishishi, maxsus havola (link) orqali lichka chat ochishi, ovozli xabarlar va media fayllarni erkin yuborishi mumkin.",
      type: 'text',
      createdAt: Date.now() - 1000 * 60 * 60 * 2,
      readBy: [pavelId, alisherId, dildoraId, botId],
      reactions: { '🔥': [pavelId, alisherId], '👍': [dildoraId] }
    },
    {
      id: 'msg_welcome_2',
      chatId: groupChatId,
      senderId: pavelId,
      text: "Telegram Web speed and responsiveness are our priority! Happy real-time chatting everyone! ⚡",
      type: 'text',
      createdAt: Date.now() - 1000 * 60 * 30,
      readBy: [alisherId, dildoraId, botId],
      reactions: { '❤️': [dildoraId], '👏': [alisherId] }
    },
    {
      id: 'msg_welcome_3',
      chatId: groupChatId,
      senderId: dildoraId,
      text: "Dizayn juda zamonaviy va qulay bo'libdi! Ayniqsa ovozli xabar yozish va uning to'lqin shakli (waveform) pleyeri ajoyib ishlayapti 🎧✨",
      type: 'text',
      createdAt: Date.now() - 1000 * 60 * 10,
      readBy: [pavelId, alisherId, botId],
      reactions: { '👍': [pavelId] }
    }
  ];

  return { users, chats, messages };
}

// Load database from disk or init
let db: Database;
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    db = JSON.parse(raw);
  } else {
    db = createInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  }
} catch (err) {
  console.error('Error loading db.json, reinitializing:', err);
  db = createInitialDatabase();
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save db.json:', err);
  }
}

// Express App
const app = express();
const server = http.createServer(app);

// Increase JSON limit for voice/base64 uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploaded media
app.use('/api/files', express.static(UPLOADS_DIR));

// WebSocket Server
const wss = new WebSocketServer({ server });
const connectedClients = new Map<string, Set<WebSocket>>(); // userId -> Set<ws>

function sendToUser(userId: string, event: string, data: any) {
  const userSockets = connectedClients.get(userId);
  if (userSockets) {
    const payload = JSON.stringify({ event, data });
    userSockets.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  }
}

function broadcastToChat(chatId: string, event: string, data: any, exceptUserId?: string) {
  const chat = db.chats[chatId];
  if (!chat) return;

  const payload = JSON.stringify({ event, data });
  chat.participants.forEach(userId => {
    if (userId === exceptUserId) return;
    const userSockets = connectedClients.get(userId);
    if (userSockets) {
      userSockets.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
        }
      });
    }
  });
}

function broadcastUserPresence(userId: string, isOnline: boolean, lastSeen: number) {
  const payload = JSON.stringify({
    event: 'user:status',
    data: { userId, isOnline, lastSeen }
  });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// WebSocket Connection Management
wss.on('connection', (ws: WebSocket) => {
  let authenticatedUserId: string | null = null;

  ws.on('message', (messageRaw: string) => {
    try {
      const { event, data } = JSON.parse(messageRaw.toString());

      if (event === 'auth') {
        const { token } = data;
        const user = Object.values(db.users).find(u => u.token === token);
        if (user) {
          authenticatedUserId = user.id;
          if (!connectedClients.has(user.id)) {
            connectedClients.set(user.id, new Set());
          }
          connectedClients.get(user.id)!.add(ws);

          user.isOnline = true;
          user.lastSeen = Date.now();
          saveDb();

          broadcastUserPresence(user.id, true, user.lastSeen);
          ws.send(JSON.stringify({ event: 'auth:success', data: { userId: user.id } }));
        } else {
          ws.send(JSON.stringify({ event: 'auth:error', data: { message: 'Invalid token' } }));
        }
        return;
      }

      if (!authenticatedUserId) {
        return;
      }

      if (event === 'typing') {
        const { chatId, isTyping } = data;
        const chat = db.chats[chatId];
        if (chat && chat.participants.includes(authenticatedUserId)) {
          const user = db.users[authenticatedUserId];
          broadcastToChat(chatId, 'typing:update', {
            chatId,
            userId: authenticatedUserId,
            userName: user?.displayName || 'Foydalanuvchi',
            isTyping
          }, authenticatedUserId);
        }
      } else if (event === 'message:read') {
        const { chatId, messageIds } = data;
        let modified = false;
        (messageIds || []).forEach((msgId: string) => {
          const msg = db.messages.find(m => m.id === msgId && m.chatId === chatId);
          if (msg && !msg.readBy.includes(authenticatedUserId!)) {
            msg.readBy.push(authenticatedUserId!);
            modified = true;
          }
        });
        if (modified) {
          saveDb();
          broadcastToChat(chatId, 'message:read', {
            chatId,
            userId: authenticatedUserId,
            messageIds
          });
        }
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    if (authenticatedUserId) {
      const userSockets = connectedClients.get(authenticatedUserId);
      if (userSockets) {
        userSockets.delete(ws);
        if (userSockets.size === 0) {
          connectedClients.delete(authenticatedUserId);
          const user = db.users[authenticatedUserId];
          if (user) {
            user.isOnline = false;
            user.lastSeen = Date.now();
            saveDb();
            broadcastUserPresence(authenticatedUserId, false, user.lastSeen);
          }
        }
      }
    }
  });
});

// Authentication Middleware for Express
function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Avtorizatsiyadan o\'tilmagan' });
  }
  const token = authHeader.substring(7);
  const user = Object.values(db.users).find(u => u.token === token);
  if (!user) {
    return res.status(401).json({ error: 'Yaroqsiz token' });
  }
  (req as any).user = user;
  next();
}

// ----------------- REST API Endpoints -----------------

// 1. Auth: Register
app.post('/api/auth/register', (req, res) => {
  const { username, displayName, password, avatarColor, bio } = req.body;

  if (!username || !displayName || !password) {
    return res.status(400).json({ error: 'Barcha maydonlarni to\'ldiring' });
  }

  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (cleanUsername.length < 3) {
    return res.status(400).json({ error: 'Username kamida 3 ta belgidan iborat bo\'lishi kerak' });
  }

  const existing = Object.values(db.users).find(u => u.username.toLowerCase() === cleanUsername);
  if (existing) {
    return res.status(400).json({ error: 'Bu username allaqachon band qilingan' });
  }

  const userId = 'user_' + crypto.randomUUID().slice(0, 10);
  const token = crypto.randomBytes(32).toString('hex');
  const chosenColor = avatarColor || getRandomColor(cleanUsername);

  const newUser: StoredUser = {
    id: userId,
    username: cleanUsername,
    displayName: displayName.trim(),
    avatarColor: chosenColor,
    bio: bio || 'Telegram orqali bog\'laning',
    passwordHash: hashPassword(password),
    token,
    createdAt: Date.now(),
    isOnline: true,
    lastSeen: Date.now()
  };

  db.users[userId] = newUser;

  // Add new user to public community group automatically
  if (db.chats['chat_community']) {
    if (!db.chats['chat_community'].participants.includes(userId)) {
      db.chats['chat_community'].participants.push(userId);
    }
  }

  // Create personal "Saved Messages" chat
  const savedChatId = `saved_${userId}`;
  db.chats[savedChatId] = {
    id: savedChatId,
    type: 'saved',
    title: 'Saqlangan xabarlar',
    avatarColor: '#65aadd',
    participants: [userId],
    updatedAt: Date.now(),
    createdAt: Date.now()
  };

  saveDb();

  const { passwordHash, ...safeUser } = newUser;
  res.json({ token, user: safeUser });
});

// 2. Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username va parolni kiriting' });
  }

  const cleanUsername = username.toLowerCase().replace('@', '').trim();
  const user = Object.values(db.users).find(u => u.username.toLowerCase() === cleanUsername);

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(400).json({ error: 'Username yoki parol noto\'g\'ri' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  user.token = token;
  user.isOnline = true;
  user.lastSeen = Date.now();

  // Ensure user is in community chat
  if (db.chats['chat_community'] && !db.chats['chat_community'].participants.includes(user.id)) {
    db.chats['chat_community'].participants.push(user.id);
  }

  // Ensure user has saved messages chat
  const savedChatId = `saved_${user.id}`;
  if (!db.chats[savedChatId]) {
    db.chats[savedChatId] = {
      id: savedChatId,
      type: 'saved',
      title: 'Saqlangan xabarlar',
      avatarColor: '#65aadd',
      participants: [user.id],
      updatedAt: Date.now(),
      createdAt: Date.now()
    };
  }

  saveDb();

  const { passwordHash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// 3. Auth: Quick Guest / Demo Login
app.post('/api/auth/guest', (req, res) => {
  const { name } = req.body;
  const guestName = (name && name.trim()) || `Mehmon_${Math.floor(1000 + Math.random() * 9000)}`;
  const cleanUsername = `guest_${Math.floor(100000 + Math.random() * 900000)}`;
  const userId = 'user_' + crypto.randomUUID().slice(0, 10);
  const token = crypto.randomBytes(32).toString('hex');

  const guestUser: StoredUser = {
    id: userId,
    username: cleanUsername,
    displayName: guestName,
    avatarColor: getRandomColor(guestName),
    bio: 'Telegram Web mehmon foydalanuvchisi',
    passwordHash: hashPassword('guest_pass'),
    token,
    createdAt: Date.now(),
    isOnline: true,
    lastSeen: Date.now()
  };

  db.users[userId] = guestUser;

  if (db.chats['chat_community']) {
    db.chats['chat_community'].participants.push(userId);
  }

  const savedChatId = `saved_${userId}`;
  db.chats[savedChatId] = {
    id: savedChatId,
    type: 'saved',
    title: 'Saqlangan xabarlar',
    avatarColor: '#65aadd',
    participants: [userId],
    updatedAt: Date.now(),
    createdAt: Date.now()
  };

  saveDb();

  const { passwordHash, ...safeUser } = guestUser;
  res.json({ token, user: safeUser });
});

// 4. Auth: Get Current Profile
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = (req as any).user as StoredUser;
  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser });
});

// 5. Auth: Update Profile
app.put('/api/auth/profile', authMiddleware, (req, res) => {
  const user = (req as any).user as StoredUser;
  const { displayName, bio, avatar, avatarColor, username } = req.body;

  if (displayName) user.displayName = displayName.trim();
  if (bio !== undefined) user.bio = bio.trim();
  if (avatar !== undefined) user.avatar = avatar;
  if (avatarColor) user.avatarColor = avatarColor;

  if (username) {
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername !== user.username) {
      const existing = Object.values(db.users).find(u => u.username.toLowerCase() === cleanUsername && u.id !== user.id);
      if (existing) {
        return res.status(400).json({ error: 'Bu username band' });
      }
      user.username = cleanUsername;
    }
  }

  saveDb();
  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser });
});

// 6. Users: List/Search
app.get('/api/users', authMiddleware, (req, res) => {
  const currentUser = (req as any).user as StoredUser;
  const query = ((req.query.q as string) || '').toLowerCase().trim();

  const usersList = Object.values(db.users)
    .filter(u => u.id !== currentUser.id)
    .filter(u => {
      if (!query) return true;
      return u.displayName.toLowerCase().includes(query) || u.username.toLowerCase().includes(query);
    })
    .map(({ passwordHash, token, ...safe }) => ({
      ...safe,
      isOnline: connectedClients.has(safe.id)
    }));

  res.json({ users: usersList });
});

// 7. Users: Get by username (for direct links ?user=@name)
app.get('/api/users/by-username/:username', authMiddleware, (req, res) => {
  const reqUsername = req.params.username.toLowerCase().replace('@', '').trim();
  const user = Object.values(db.users).find(u => u.username.toLowerCase() === reqUsername);
  if (!user) {
    return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  }
  const { passwordHash, token, ...safeUser } = user;
  res.json({ user: { ...safeUser, isOnline: connectedClients.has(safeUser.id) } });
});

// 8. Chats: List all chats for current user
app.get('/api/chats', authMiddleware, (req, res) => {
  const currentUser = (req as any).user as StoredUser;

  const userChats = Object.values(db.chats)
    .filter(chat => chat.participants.includes(currentUser.id))
    .map(chat => {
      // Find last message
      const chatMessages = db.messages.filter(m => m.chatId === chat.id);
      const lastMessage = chatMessages[chatMessages.length - 1];

      // Calculate unread count for current user
      const unreadCount = chatMessages.filter(
        m => m.senderId !== currentUser.id && !m.readBy.includes(currentUser.id)
      ).length;

      // For direct chat, customize title, avatar, and online status based on other participant
      if (chat.type === 'direct') {
        const otherUserId = chat.participants.find(id => id !== currentUser.id);
        const otherUser = otherUserId ? db.users[otherUserId] : null;

        return {
          ...chat,
          title: otherUser ? otherUser.displayName : chat.title,
          avatar: otherUser?.avatar,
          avatarColor: otherUser ? otherUser.avatarColor : chat.avatarColor,
          otherUser: otherUser ? {
            id: otherUser.id,
            username: otherUser.username,
            displayName: otherUser.displayName,
            avatar: otherUser.avatar,
            avatarColor: otherUser.avatarColor,
            isOnline: connectedClients.has(otherUser.id),
            lastSeen: otherUser.lastSeen,
            bio: otherUser.bio
          } : undefined,
          lastMessage,
          unreadCount
        };
      }

      return {
        ...chat,
        lastMessage,
        unreadCount
      };
    })
    .sort((a, b) => (b.lastMessage?.createdAt || b.updatedAt) - (a.lastMessage?.createdAt || a.updatedAt));

  res.json({ chats: userChats });
});

// 9. Chats: Create or get Direct / Group Chat
app.post('/api/chats', authMiddleware, (req, res) => {
  const currentUser = (req as any).user as StoredUser;
  const { type, targetUserId, title, participantIds } = req.body;

  if (type === 'direct') {
    if (!targetUserId) {
      return res.status(400).json({ error: 'Muloqotdoshingiz ko\'rsatilmadi' });
    }

    if (targetUserId === currentUser.id) {
      // Return Saved Messages
      const savedChatId = `saved_${currentUser.id}`;
      return res.json({ chat: db.chats[savedChatId] });
    }

    // Check if direct chat already exists between these two
    const existing = Object.values(db.chats).find(
      c => c.type === 'direct' &&
           c.participants.length === 2 &&
           c.participants.includes(currentUser.id) &&
           c.participants.includes(targetUserId)
    );

    if (existing) {
      const otherUser = db.users[targetUserId];
      return res.json({
        chat: {
          ...existing,
          title: otherUser?.displayName || existing.title,
          avatar: otherUser?.avatar,
          avatarColor: otherUser?.avatarColor || existing.avatarColor,
          otherUser
        }
      });
    }

    // Create new direct chat
    const otherUser = db.users[targetUserId];
    if (!otherUser) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    const chatId = 'chat_' + crypto.randomUUID().slice(0, 12);
    const newChat: StoredChat = {
      id: chatId,
      type: 'direct',
      title: otherUser.displayName,
      avatarColor: otherUser.avatarColor,
      participants: [currentUser.id, targetUserId],
      updatedAt: Date.now(),
      createdAt: Date.now()
    };

    db.chats[chatId] = newChat;
    saveDb();

    // Notify other participant via WS
    sendToUser(targetUserId, 'chat:new', newChat);

    return res.json({
      chat: {
        ...newChat,
        otherUser
      }
    });
  } else if (type === 'group') {
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Guruh nomini kiriting' });
    }

    const members = Array.from(new Set([currentUser.id, ...(participantIds || [])]));
    const chatId = 'group_' + crypto.randomUUID().slice(0, 12);

    const newGroup: StoredChat = {
      id: chatId,
      type: 'group',
      title: title.trim(),
      avatarColor: getRandomColor(title),
      participants: members,
      updatedAt: Date.now(),
      createdAt: Date.now()
    };

    db.chats[chatId] = newGroup;

    // Welcome message into the group
    const initialMsg: StoredMessage = {
      id: 'msg_' + crypto.randomUUID().slice(0, 12),
      chatId,
      senderId: currentUser.id,
      text: `${currentUser.displayName} "${title.trim()}" guruhini yaratdi.`,
      type: 'text',
      createdAt: Date.now(),
      readBy: [currentUser.id]
    };
    db.messages.push(initialMsg);

    saveDb();

    members.forEach(memId => {
      sendToUser(memId, 'chat:new', newGroup);
    });

    return res.json({ chat: newGroup });
  }

  res.status(400).json({ error: 'Noto\'g\'ri chat turi' });
});

// 10. Messages: Get messages for chat
app.get('/api/chats/:id/messages', authMiddleware, (req, res) => {
  const currentUser = (req as any).user as StoredUser;
  const chatId = req.params.id;

  const chat = db.chats[chatId];
  if (!chat || !chat.participants.includes(currentUser.id)) {
    return res.status(403).json({ error: 'Chatga kirish huquqi yo\'q' });
  }

  const messages = db.messages
    .filter(m => m.chatId === chatId)
    .map(m => {
      const sender = db.users[m.senderId];
      return {
        ...m,
        senderName: sender?.displayName || 'Foydalanuvchi',
        senderAvatar: sender?.avatar,
        senderColor: sender?.avatarColor || '#65aadd'
      };
    });

  // Mark all unread messages in this chat as read by this user
  let changed = false;
  messages.forEach(m => {
    if (!m.readBy.includes(currentUser.id)) {
      m.readBy.push(currentUser.id);
      const original = db.messages.find(orig => orig.id === m.id);
      if (original && !original.readBy.includes(currentUser.id)) {
        original.readBy.push(currentUser.id);
        changed = true;
      }
    }
  });

  if (changed) {
    saveDb();
    broadcastToChat(chatId, 'message:read', {
      chatId,
      userId: currentUser.id,
      messageIds: messages.map(m => m.id)
    }, currentUser.id);
  }

  res.json({ messages });
});

// 11. Messages: Send message (REST fallback + WS broadcast)
app.post('/api/chats/:id/messages', authMiddleware, (req, res) => {
  const currentUser = (req as any).user as StoredUser;
  const chatId = req.params.id;
  const { text, type, mediaUrl, mediaMeta, replyTo } = req.body;

  const chat = db.chats[chatId];
  if (!chat || !chat.participants.includes(currentUser.id)) {
    return res.status(403).json({ error: 'Chatga kirish huquqi yo\'q' });
  }

  if (!text && !mediaUrl) {
    return res.status(400).json({ error: 'Xabar matni yoki fayl bo\'lishi shart' });
  }

  const msgId = 'msg_' + crypto.randomUUID().slice(0, 12);
  const now = Date.now();

  const newMsg: StoredMessage = {
    id: msgId,
    chatId,
    senderId: currentUser.id,
    text: text || '',
    type: type || 'text',
    mediaUrl,
    mediaMeta,
    replyTo,
    reactions: {},
    createdAt: now,
    readBy: [currentUser.id]
  };

  db.messages.push(newMsg);
  chat.updatedAt = now;
  saveDb();

  const fullMsg = {
    ...newMsg,
    senderName: currentUser.displayName,
    senderAvatar: currentUser.avatar,
    senderColor: currentUser.avatarColor
  };

  // Broadcast to all participants in this chat
  broadcastToChat(chatId, 'message:new', fullMsg);

  res.json({ message: fullMsg });
});

// 12. Messages: Pin / Unpin
app.post('/api/chats/:id/pin', authMiddleware, (req, res) => {
  const currentUser = (req as any).user as StoredUser;
  const chatId = req.params.id;
  const { messageId } = req.body;

  const chat = db.chats[chatId];
  if (!chat || !chat.participants.includes(currentUser.id)) {
    return res.status(403).json({ error: 'Ruxsat berilmagan' });
  }

  chat.pinnedMessageId = messageId || undefined;
  saveDb();

  broadcastToChat(chatId, 'chat:pinned', { chatId, pinnedMessageId: chat.pinnedMessageId });
  res.json({ success: true, pinnedMessageId: chat.pinnedMessageId });
});

// 13. Messages: Edit
app.put('/api/messages/:id', authMiddleware, (req, res) => {
  const currentUser = (req as any).user as StoredUser;
  const msgId = req.params.id;
  const { text } = req.body;

  const msg = db.messages.find(m => m.id === msgId);
  if (!msg) {
    return res.status(404).json({ error: 'Xabar topilmadi' });
  }
  if (msg.senderId !== currentUser.id) {
    return res.status(403).json({ error: 'Faqat o\'z xabaringizni tahrirlashingiz mumkin' });
  }

  msg.text = text;
  msg.isEdited = true;
  saveDb();

  broadcastToChat(msg.chatId, 'message:edited', { messageId: msg.id, text, isEdited: true });
  res.json({ message: msg });
});

// 14. Messages: Delete
app.delete('/api/messages/:id', authMiddleware, (req, res) => {
  const currentUser = (req as any).user as StoredUser;
  const msgId = req.params.id;

  const idx = db.messages.findIndex(m => m.id === msgId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Xabar topilmadi' });
  }

  const msg = db.messages[idx];
  const chat = db.chats[msg.chatId];

  // In direct chat or group, sender can delete, or group creator
  if (msg.senderId !== currentUser.id && chat.participants[0] !== currentUser.id) {
    return res.status(403).json({ error: 'O\'chirish huquqi yo\'q' });
  }

  db.messages.splice(idx, 1);
  saveDb();

  broadcastToChat(msg.chatId, 'message:deleted', { messageId: msgId, chatId: msg.chatId });
  res.json({ success: true });
});

// 15. Messages: Toggle Reaction (👍, ❤️, 🔥, 😂, 👏, 🎉)
app.post('/api/messages/:id/react', authMiddleware, (req, res) => {
  const currentUser = (req as any).user as StoredUser;
  const msgId = req.params.id;
  const { emoji } = req.body;

  const msg = db.messages.find(m => m.id === msgId);
  if (!msg) {
    return res.status(404).json({ error: 'Xabar topilmadi' });
  }

  if (!msg.reactions) {
    msg.reactions = {};
  }

  // Remove existing reactions from this user on this message
  Object.keys(msg.reactions).forEach(e => {
    msg.reactions![e] = msg.reactions![e].filter(uid => uid !== currentUser.id);
    if (msg.reactions![e].length === 0) {
      delete msg.reactions![e];
    }
  });

  // Toggle given reaction
  if (emoji) {
    if (!msg.reactions[emoji]) {
      msg.reactions[emoji] = [];
    }
    msg.reactions[emoji].push(currentUser.id);
  }

  saveDb();

  broadcastToChat(msg.chatId, 'message:reaction', {
    messageId: msg.id,
    reactions: msg.reactions
  });

  res.json({ reactions: msg.reactions });
});

// 16. File / Voice / Photo Upload
app.post('/api/upload', authMiddleware, (req, res) => {
  try {
    const { base64Data, fileName, mimeType } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'Fayl ma\'lumoti mavjud emas' });
    }

    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let extension = 'bin';

    if (matches && matches.length === 3) {
      buffer = Buffer.from(matches[2], 'base64');
      const detectedMime = matches[1];
      if (detectedMime.includes('webm')) extension = 'webm';
      else if (detectedMime.includes('ogg')) extension = 'ogg';
      else if (detectedMime.includes('mp4') || detectedMime.includes('m4a')) extension = 'mp4';
      else if (detectedMime.includes('png')) extension = 'png';
      else if (detectedMime.includes('jpeg') || detectedMime.includes('jpg')) extension = 'jpg';
      else if (detectedMime.includes('webp')) extension = 'webp';
      else if (detectedMime.includes('pdf')) extension = 'pdf';
      else if (detectedMime.includes('zip')) extension = 'zip';
    } else {
      buffer = Buffer.from(base64Data, 'base64');
    }

    if (fileName && fileName.includes('.')) {
      const parts = fileName.split('.');
      extension = parts[parts.length - 1];
    }

    const savedFileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = path.resolve(UPLOADS_DIR, savedFileName);

    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/api/files/${savedFileName}`;
    res.json({
      url: fileUrl,
      fileName: fileName || savedFileName,
      size: buffer.length,
      mimeType: mimeType || 'application/octet-stream'
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Fayl yuklashda xatolik: ' + err.message });
  }
});

// Serve frontend in production or Vite middleware in development
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Telegram Web Server running on port ${PORT} [${isProduction ? 'PRODUCTION' : 'DEV'}]`);
  });
}

startServer().catch(err => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
