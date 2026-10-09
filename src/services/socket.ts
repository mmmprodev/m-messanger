import { getAuthToken } from './api';

type SocketListener = (data: any) => void;

class RealtimeSocket {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<SocketListener>> = new Map();
  private reconnectTimeout: any = null;
  private isConnecting: boolean = false;
  private shouldConnect: boolean = false;

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', this.handleVisibilityChange);
      window.addEventListener('online', () => this.connect());
    }
  }

  private handleVisibilityChange() {
    if (document.visibilityState === 'visible' && this.shouldConnect && (!this.ws || this.ws.readyState !== WebSocket.OPEN)) {
      this.connect();
    }
  }

  public connect() {
    this.shouldConnect = true;
    const token = getAuthToken();
    if (!token) return;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        // Authenticate immediately
        this.send('auth', { token });
        this.emit('connection:open', {});
      };

      this.ws.onmessage = (event) => {
        try {
          const { event: evtName, data } = JSON.parse(event.data);
          this.emit(evtName, data);
        } catch (err) {
          console.error('Socket message parse error:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.ws = null;
        this.emit('connection:close', {});
        if (this.shouldConnect) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = setTimeout(() => this.connect(), 2500);
        }
      };

      this.ws.onerror = (err) => {
        this.isConnecting = false;
        console.warn('WebSocket connection error:', err);
      };
    } catch (e) {
      this.isConnecting = false;
      if (this.shouldConnect) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
      }
    }
  }

  public disconnect() {
    this.shouldConnect = false;
    clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public send(event: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    }
  }

  public on(event: string, listener: SocketListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  public off(event: string, listener: SocketListener) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
    }
  }

  private emit(event: string, data: any) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in socket listener for ${event}:`, e);
        }
      });
    }
  }

  public sendTyping(chatId: string, isTyping: boolean) {
    this.send('typing', { chatId, isTyping });
  }

  public markAsRead(chatId: string, messageIds: string[]) {
    this.send('message:read', { chatId, messageIds });
  }
}

export const socket = new RealtimeSocket();
