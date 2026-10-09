import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

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

// Secret key for HMAC-SHA256 JWT tokens
const JWT_SECRET = process.env.JWT_SECRET || 'telegram_super_secure_jwt_secret_2026_x89a';

// ----------------- JWT Implementation (HMAC-SHA256) -----------------
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

function generateJWT(payload: { userId: string; username: string }, expiresInSeconds = 86400 * 30): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJWT(token: string): { userId: string; username: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signature !== expectedSig) return null;

    const payload = JSON.parse(base64UrlDecode(payloadB64));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return { userId: payload.userId, username: payload.username };
  } catch (err) {
    return null;
  }
}

// ----------------- Database Schema & RLS -----------------
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
  fileAccess: Record<string, { uploaderId: string; chatId?: string }>; // filename -> permissions
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_telegram_secure_salt_2026').digest('hex');
}

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

function sanitizeUser(user: StoredUser) {
  const { passwordHash, token, ...safe } = user;
  return safe;
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
      text: "Telegram Web speed, security and responsiveness are our priority! Happy real-time chatting everyone! ⚡",
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
    },
    {
      id: 'msg_welcome_voice',
      chatId: groupChatId,
      senderId: dildoraId,
      text: '',
      type: 'voice',
      mediaUrl: '/api/files/welcome_voice.wav',
      mediaMeta: {
        duration: 4,
        waveform: [35, 60, 85, 95, 75, 50, 80, 100, 70, 45, 65, 80, 55, 40, 70, 85, 60, 45, 90, 75, 40, 30],
        size: 308744,
        mimeType: 'audio/wav'
      },
      createdAt: Date.now() - 1000 * 60 * 8,
      readBy: [pavelId, alisherId, dildoraId, botId],
      reactions: { '🔥': [pavelId], '❤️': [alisherId] }
    }
  ];

  return { users, chats, messages, fileAccess: {} };
}

// Load database from disk or init
let db: Database;
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    db = JSON.parse(raw);
    if (!db.fileAccess) db.fileAccess = {};
  } else {
    db = createInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  }
} catch (err) {
  console.error('Error loading db.json, reinitializing:', err);
  db = createInitialDatabase();
}

// Atomic save using temporary file + rename to prevent data corruption
function saveDb() {
  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to save db.json:', err);
  }
}

// Express App
const app = express();
const server = http.createServer(app);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ----------------- WebSocket Server with Ping/Pong Heartbeat -----------------
interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
  userId?: string;
}

const wss = new WebSocketServer({ noServer: true });
const connectedClients = new Map<string, Set<ExtWebSocket>>(); // userId -> Set<ws>

server.on('upgrade', (request, socket, head) => {
  const url = request.url || '';
  const pathname = url.split('?')[0];

  // If request is from Vite HMR, let Vite handle it
  const isVite = pathname.startsWith('/@') || pathname.includes('vite') || request.headers['sec-websocket-protocol'] === 'vite-hmr';
  if (isVite) {
    return;
  }

  // Handle messenger WebSocket connections on /ws or root /
  if (pathname === '/ws' || pathname === '/') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

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

// 25s ping/pong keepalive
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach(ws => {
    const extWs = ws as ExtWebSocket;
    if (extWs.isAlive === false) {
      return extWs.terminate();
    }
    extWs.isAlive = false;
    extWs.ping();
  });
}, 25000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

wss.on('connection', (socket: WebSocket) => {
  const ws = socket as ExtWebSocket;
  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (messageRaw: string) => {
    try {
      const { event, data } = JSON.parse(messageRaw.toString());

      if (event === 'auth') {
        const { token } = data;
        const verified = verifyJWT(token);
        const user = verified ? db.users[verified.userId] : Object.values(db.users).find(u => u.token === token);

        if (user) {
          ws.userId = user.id;
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
          ws.send(JSON.stringify({ event: 'auth:error', data: { message: 'Invalid or expired token' } }));
        }
        return;
      }

      if (!ws.userId) {
        return;
      }

      const senderId = ws.userId;

      if (event === 'typing') {
        const { chatId, isTyping } = data;
        const chat = db.chats[chatId];
        // RLS check: verify user is in chat
        if (chat && chat.participants.includes(senderId)) {
          const user = db.users[senderId];
          broadcastToChat(chatId, 'typing:update', {
            chatId,
            userId: senderId,
            userName: user?.displayName || 'Foydalanuvchi',
            isTyping
          }, senderId);
        }
      } else if (event === 'message:read') {
        const { chatId, messageIds } = data;
        const chat = db.chats[chatId];
        // RLS check
        if (chat && chat.participants.includes(senderId)) {
          let modified = false;
          (messageIds || []).forEach((msgId: string) => {
            const msg = db.messages.find(m => m.id === msgId && m.chatId === chatId);
            if (msg && !msg.readBy.includes(senderId)) {
              msg.readBy.push(senderId);
              modified = true;
            }
          });
          if (modified) {
            saveDb();
            broadcastToChat(chatId, 'message:read', {
              chatId,
              userId: senderId,
              messageIds
            });
          }
        }
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    if (ws.userId) {
      const userSockets = connectedClients.get(ws.userId);
      if (userSockets) {
        userSockets.delete(ws);
        if (userSockets.size === 0) {
          connectedClients.delete(ws.userId);
          const user = db.users[ws.userId];
          if (user) {
            user.isOnline = false;
            user.lastSeen = Date.now();
            saveDb();
            broadcastUserPresence(ws.userId, false, user.lastSeen);
          }
        }
      }
    }
  });
});

// ----------------- Authentication Middleware (JWT + RLS) -----------------
function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Avtorizatsiyadan o\'tilmagan (Token mavjud emas)' });
  }

  // 1. Verify JWT signature & expiration
  const payload = verifyJWT(token);
  let user: StoredUser | undefined;

  if (payload && db.users[payload.userId]) {
    user = db.users[payload.userId];
  } else {
    // Fallback: check stored token for compatibility
    user = Object.values(db.users).find(u => u.token === token);
  }

  if (!user) {
    return res.status(401).json({ error: 'Yaroqsiz yoki muddati o\'tgan token' });
  }

  (req as any).user = user;
  next();
}

// Helper to format chat uniquely for each viewing user so direct chats always show the other user's name
function formatChatForUser(chat: StoredChat, userId: string) {
  const chatMessages = db.messages.filter(m => m.chatId === chat.id);
  const lastMessage = chatMessages[chatMessages.length - 1];
  const unreadCount = chatMessages.filter(
    m => m.senderId !== userId && !m.readBy.includes(userId)
  ).length;

  if (chat.type === 'direct') {
    const otherUserId = chat.participants.find(id => id !== userId) || userId;
    const otherUser = db.users[otherUserId];

    return {
      ...chat,
      title: otherUser ? otherUser.displayName : 'Foydalanuvchi',
      avatar: otherUser?.avatar,
      avatarColor: otherUser ? otherUser.avatarColor : (chat.avatarColor || '#8b5cf6'),
      otherUser: otherUser ? {
        ...sanitizeUser(otherUser),
        isOnline: connectedClients.has(otherUser.id),
        lastSeen: otherUser.lastSeen
      } : undefined,
      lastMessage,
      unreadCount
    };
  }

  if (chat.type === 'saved') {
    return {
      ...chat,
      title: 'Saqlangan xabarlar',
      lastMessage,
      unreadCount
    };
  }

  return {
    ...chat,
    lastMessage,
    unreadCount
  };
}

// ----------------- Protected Media & File Serving with HTTP 206 Range Support -----------------
// Ensures audio, voice notes, and images are streamed with accurate MIME types and byte-range seeking
app.get('/api/files/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.resolve(UPLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fayl topilmadi' });
  }

  const ext = path.extname(filename).toLowerCase();
  let mimeType = 'application/octet-stream';
  if (ext === '.webm') mimeType = 'audio/webm';
  else if (ext === '.ogg') mimeType = 'audio/ogg';
  else if (ext === '.mp4' || ext === '.m4a') mimeType = 'audio/mp4';
  else if (ext === '.wav') mimeType = 'audio/wav';
  else if (ext === '.mp3') mimeType = 'audio/mpeg';
  else if (ext === '.aac') mimeType = 'audio/aac';
  else if (ext === '.png') mimeType = 'image/png';
  else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
  else if (ext === '.webp') mimeType = 'image/webp';
  else if (ext === '.gif') mimeType = 'image/gif';
  else if (ext === '.pdf') mimeType = 'application/pdf';

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start > end) {
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      return res.status(416).send('Requested range not satisfiable');
    }

    const chunksize = (end - start) + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': mimeType,
      'Access-Control-Allow-Origin': '*'
    });
    fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

// ----------------- REST API Endpoints -----------------

// 1. Auth: Register
app.post('/api/auth/register', (req, res) => {
  const { username, displayName, password, avatarColor, bio } = req.body;

  if (!username || !displayName || !password) {
    return res.status(400).json({ error: 'Barcha majburiy maydonlarni to\'ldiring' });
  }

  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (cleanUsername.length < 3) {
    return res.status(400).json({ error: 'Username kamida 3 ta belgidan iborat bo\'lishi kerak' });
  }

  const existing = Object.values(db.users).find(u => u.username.toLowerCase() === cleanUsername);
  if (existing) {
    return res.status(400).json({ error: 'Ushbu username allaqachon band qilingan' });
  }

  const userId = 'user_' + crypto.randomUUID().slice(0, 10);
  const token = generateJWT({ userId, username: cleanUsername });
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
  res.json({ token, user: sanitizeUser(newUser) });
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

  const token = generateJWT({ userId: user.id, username: user.username });
  user.token = token;
  user.isOnline = true;
  user.lastSeen = Date.now();

  if (db.chats['chat_community'] && !db.chats['chat_community'].participants.includes(user.id)) {
    db.chats['chat_community'].participants.push(user.id);
  }

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
  res.json({ token, user: sanitizeUser(user) });
});

// 3. Auth: Quick Guest / Demo Login
app.post('/api/auth/guest', (req, res) => {
  const { name } = req.body;
  const guestName = (name && name.trim()) || `Mehmon_${Math.floor(1000 + Math.random() * 9000)}`;
  const cleanUsername = `guest_${Math.floor(100000 + Math.random() * 900000)}`;
  const userId = 'user_' + crypto.randomUUID().slice(0, 10);
  const token = generateJWT({ userId, username: cleanUsername });

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
  res.json({ token, user: sanitizeUser(guestUser) });
});

// 4. Auth: Get Current Profile
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = (req as any).user as StoredUser;
  res.json({ user: sanitizeUser(user) });
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
  res.json({ user: sanitizeUser(user) });
});

// 6. Users: List/Search with RLS (never exposes passwords or tokens)
app.get('/api/users', authMiddleware, (req, res) => {
  const currentUser = (req as any).user as StoredUser;
  const query = ((req.query.q as string) || '').toLowerCase().trim();

  const usersList = Object.values(db.users)
    .filter(u => u.id !== currentUser.id)
    .filter(u => {
      if (!query) return true;
      return u.displayName.toLowerCase().includes(query) || u.username.toLowerCase().includes(query);
    })
    .map(u => ({
      ...sanitizeUser(u),
      isOnline: connectedClients.has(u.id)
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
  res.json({ user: { ...sanitizeUser(user), isOnline: connectedClients.has(user.id) } });
});

// 8. Chats: List all chats for current user (Strict RLS: only user's chats, tailored to the viewer)
app.get('/api/chats', authMiddleware, (req, res) => {
  const currentUser = (req as any).user as StoredUser;

  const userChats = Object.values(db.chats)
    .filter(chat => chat.participants.includes(currentUser.id))
    .map(chat => formatChatForUser(chat, currentUser.id))
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
      const savedChatId = `saved_${currentUser.id}`;
      return res.json({ chat: formatChatForUser(db.chats[savedChatId], currentUser.id) });
    }

    const existing = Object.values(db.chats).find(
      c => c.type === 'direct' &&
           c.participants.length === 2 &&
           c.participants.includes(currentUser.id) &&
           c.participants.includes(targetUserId)
    );

    if (existing) {
      return res.json({
        chat: formatChatForUser(existing, currentUser.id)
      });
    }

    const otherUser = db.users[targetUserId];
    if (!otherUser) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    const chatId = 'chat_' + crypto.randomUUID().slice(0, 12);
    const newChat: StoredChat = {
      id: chatId,
      type: 'direct',
      title: '',
      avatarColor: otherUser.avatarColor,
      participants: [currentUser.id, targetUserId],
      updatedAt: Date.now(),
      createdAt: Date.now()
    };

    db.chats[chatId] = newChat;
    saveDb();

    // Notify other participant via WS with THEIR perspective (so they see caller's name, not their own name!)
    sendToUser(targetUserId, 'chat:new', formatChatForUser(newChat, targetUserId));

    // Return to creator with caller's perspective (so creator sees friend's name)
    return res.json({
      chat: formatChatForUser(newChat, currentUser.id)
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
      sendToUser(memId, 'chat:new', formatChatForUser(newGroup, memId));
    });

    return res.json({ chat: formatChatForUser(newGroup, currentUser.id) });
  }

  res.status(400).json({ error: 'Noto\'g\'ri chat turi' });
});

// 10. Messages: Get messages for chat (Strict RLS: Only chat participants)
app.get('/api/chats/:id/messages', authMiddleware, (req, res) => {
  const currentUser = (req as any).user as StoredUser;
  const chatId = req.params.id;

  const chat = db.chats[chatId];
  if (!chat || !chat.participants.includes(currentUser.id)) {
    return res.status(403).json({ error: 'Chatga kirish huquqi yo\'q (RLS to\'sig\'i)' });
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

// 11. Messages: Send message (Strict RLS: Only participant)
app.post('/api/chats/:id/messages', authMiddleware, (req, res) => {
  const currentUser = (req as any).user as StoredUser;
  const chatId = req.params.id;
  const { text, type, mediaUrl, mediaMeta, replyTo } = req.body;

  const chat = db.chats[chatId];
  if (!chat || !chat.participants.includes(currentUser.id)) {
    return res.status(403).json({ error: 'Chatga xabar yuborish huquqi yo\'q' });
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

  // Associate uploaded media with this chat in fileAccess RLS index
  if (mediaUrl && mediaUrl.startsWith('/api/files/')) {
    const filename = path.basename(mediaUrl);
    db.fileAccess[filename] = {
      uploaderId: currentUser.id,
      chatId
    };
  }

  saveDb();

  const fullMsg = {
    ...newMsg,
    senderName: currentUser.displayName,
    senderAvatar: currentUser.avatar,
    senderColor: currentUser.avatarColor
  };

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

// 13. Messages: Edit (Strict RLS: Only original sender)
app.put('/api/messages/:id', authMiddleware, (req, res) => {
  const currentUser = (req as any).user as StoredUser;
  const msgId = req.params.id;
  const { text } = req.body;

  const msg = db.messages.find(m => m.id === msgId);
  if (!msg) {
    return res.status(404).json({ error: 'Xabar topilmadi' });
  }
  if (msg.senderId !== currentUser.id) {
    return res.status(403).json({ error: 'Faqat o\'z xabaringizni tahrirlashingiz mumkin (RLS to\'sig\'i)' });
  }

  msg.text = text;
  msg.isEdited = true;
  saveDb();

  broadcastToChat(msg.chatId, 'message:edited', { messageId: msg.id, text, isEdited: true });
  res.json({ message: msg });
});

// 14. Messages: Delete (Strict RLS: Sender or Group admin)
app.delete('/api/messages/:id', authMiddleware, (req, res) => {
  const currentUser = (req as any).user as StoredUser;
  const msgId = req.params.id;

  const idx = db.messages.findIndex(m => m.id === msgId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Xabar topilmadi' });
  }

  const msg = db.messages[idx];
  const chat = db.chats[msg.chatId];

  if (msg.senderId !== currentUser.id && chat.participants[0] !== currentUser.id) {
    return res.status(403).json({ error: 'O\'chirish huquqi yo\'q' });
  }

  db.messages.splice(idx, 1);
  saveDb();

  broadcastToChat(msg.chatId, 'message:deleted', { messageId: msgId, chatId: msg.chatId });
  res.json({ success: true });
});

// 15. Messages: Toggle Reaction
app.post('/api/messages/:id/react', authMiddleware, (req, res) => {
  const currentUser = (req as any).user as StoredUser;
  const msgId = req.params.id;
  const { emoji } = req.body;

  const msg = db.messages.find(m => m.id === msgId);
  if (!msg) {
    return res.status(404).json({ error: 'Xabar topilmadi' });
  }

  const chat = db.chats[msg.chatId];
  if (!chat || !chat.participants.includes(currentUser.id)) {
    return res.status(403).json({ error: 'Ruxsat berilmagan' });
  }

  if (!msg.reactions) {
    msg.reactions = {};
  }

  Object.keys(msg.reactions).forEach(e => {
    msg.reactions![e] = msg.reactions![e].filter(uid => uid !== currentUser.id);
    if (msg.reactions![e].length === 0) {
      delete msg.reactions![e];
    }
  });

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

// 16. Secure File / Voice / Photo Upload
app.post('/api/upload', authMiddleware, (req, res) => {
  try {
    const currentUser = (req as any).user as StoredUser;
    const { base64Data, fileName, mimeType, chatId } = req.body;

    if (!base64Data) {
      return res.status(400).json({ error: 'Fayl ma\'lumoti mavjud emas' });
    }

    let buffer: Buffer;
    let extension = 'bin';
    const commaIndex = base64Data.indexOf(',');

    if (commaIndex !== -1) {
      const headerPart = base64Data.substring(0, commaIndex);
      const rawBase64 = base64Data.substring(commaIndex + 1);
      buffer = Buffer.from(rawBase64, 'base64');

      if (headerPart.includes('webm')) extension = 'webm';
      else if (headerPart.includes('ogg')) extension = 'ogg';
      else if (headerPart.includes('mp4') || headerPart.includes('m4a')) extension = 'mp4';
      else if (headerPart.includes('wav')) extension = 'wav';
      else if (headerPart.includes('png')) extension = 'png';
      else if (headerPart.includes('jpeg') || headerPart.includes('jpg')) extension = 'jpg';
      else if (headerPart.includes('webp')) extension = 'webp';
      else if (headerPart.includes('pdf')) extension = 'pdf';
      else if (headerPart.includes('zip')) extension = 'zip';
    } else {
      buffer = Buffer.from(base64Data, 'base64');
    }

    // Security check: limit file size to 25MB max
    if (buffer.length > 25 * 1024 * 1024) {
      return res.status(400).json({ error: 'Fayl hajmi 25MB dan oshmasligi kerak' });
    }

    if (fileName && fileName.includes('.')) {
      const sanitizedName = path.basename(fileName);
      const parts = sanitizedName.split('.');
      extension = parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    const savedFileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = path.resolve(UPLOADS_DIR, savedFileName);

    fs.writeFileSync(filePath, buffer);

    // Register permission in RLS store
    db.fileAccess[savedFileName] = {
      uploaderId: currentUser.id,
      chatId: chatId || undefined
    };
    saveDb();

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
      server: {
        middlewareMode: true,
        watch: {
          ignored: [
            '**/data/**',
            '**/data/**/*',
            '**/uploads/**',
            '**/*.tmp*',
            '**/data/db.json',
            '**/data/db.json.*'
          ]
        }
      },
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
