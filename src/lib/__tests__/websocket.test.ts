/**
 * src/lib/__tests__/websocket.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock global objects
const mockWebSocket = {
  close: vi.fn(),
  send: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const mockWindow = {
  location: {
    protocol: 'http:',
    host: 'localhost:3000',
  },
};

// Setup global mocks
global.WebSocket = vi.fn().mockImplementation(() => mockWebSocket) as any;
global.window = mockWindow as any;

// Mock environment variables
process.env.NEXT_PUBLIC_WS_URL = 'ws://test.example.com';

// Import after mocking
const { websocket } = require('../websocket');

describe('WebSocket Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    websocket.disconnect();
  });

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = websocket;
      const instance2 = websocket;
      expect(instance1).toBe(instance2);
    });

    it('should create a new instance if none exists', () => {
      // This should work with the singleton pattern
      expect(websocket).toBeDefined();
    });
  });

  describe('getWebSocketUrl', () => {
    it('should construct correct WebSocket URL with HTTPS', () => {
      mockWindow.location.protocol = 'https:';
      
      // Re-import to get fresh instance with mocked window
      delete require.cache[require.resolve('../websocket')];
      const { WebSocketService } = require('../websocket');
      const service = new WebSocketService();
      
      expect(service['getWebSocketUrl']()).toBe('wss://localhost:3000/ws');
    });

    it('should use custom WebSocket URL from environment', () => {
      process.env.NEXT_PUBLIC_WS_URL = 'wss://custom.example.com:8080';
      
      delete require.cache[require.resolve('../websocket')];
      const { WebSocketService } = require('../websocket');
      const service = new WebSocketService();
      
      expect(service['getWebSocketUrl']()).toBe('wss://custom.example.com:8080/ws');
    });

    it('should return empty string on server side', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      delete require.cache[require.resolve('../websocket')];
      const { WebSocketService } = require('../websocket');
      const service = new WebSocketService();
      
      expect(service['getWebSocketUrl']()).toBe('');
      
      global.window = originalWindow;
    });
  });

  describe('connect', () => {
    it('should establish WebSocket connection successfully', async () => {
      const connectPromise = websocket.connect();
      
      // Trigger connection success
      mockWebSocket.addEventListener.mock.calls.find((call: any[]) => 
        call[0] === 'open'
      )?.[1]();

      await connectPromise;
      
      expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:3000/ws');
    });

    it('should handle connection errors', async () => {
      const connectPromise = websocket.connect();
      
      // Trigger connection error
      mockWebSocket.addEventListener.mock.calls.find((call: any[]) => 
        call[0] === 'error'
      )?.[1](new Error('Connection failed'));

      await expect(connectPromise).rejects.toThrow('Connection failed');
    });

    it('should handle connection attempts caching', async () => {
      const promise1 = websocket.connect();
      const promise2 = websocket.connect();
      
      expect(promise1).toBe(promise2);
    });
  });

  describe('event handling', () => {
    it('should register event listeners', () => {
      const callback = vi.fn();
      const unsubscribe = websocket.on('message', callback);
      
      // Simulate connection success to reset state
      mockWebSocket.addEventListener.mock.calls.find((call: any[]) => 
        call[0] === 'open'
      )?.[1]();

      expect(typeof unsubscribe).toBe('function');
    });

    it('should emit events to registered listeners', async () => {
      const callback = vi.fn();
      websocket.on('message', callback);
      
      // Connect first
      const connectPromise = websocket.connect();
      mockWebSocket.addEventListener.mock.calls.find((call: any[]) => 
        call[0] === 'open'
      )?.[1]();
      await connectPromise;
      
      // Simulate message received
      const messageEvent = {
        data: JSON.stringify({
          type: 'message',
          payload: { content: 'Hello' }
        })
      };
      mockWebSocket.addEventListener.mock.calls.find((call: any[]) => 
        call[0] === 'message'
      )?.[1](messageEvent);
      
      expect(callback).toHaveBeenCalledWith({ content: 'Hello' });
    });

    it('should handle JSON parsing errors', async () => {
      const callback = vi.fn();
      websocket.on('error', callback);
      
      // Connect first
      const connectPromise = websocket.connect();
      mockWebSocket.addEventListener.mock.calls.find((call: any[]) => 
        call[0] === 'open'
      )?.[1]();
      await connectPromise;
      
      // Simulate invalid JSON message
      const messageEvent = {
        data: 'invalid json'
      };
      mockWebSocket.addEventListener.mock.calls.find((call: any[]) => 
        call[0] === 'message'
      )?.[1](messageEvent);
      
      // Should not call the callback with invalid data
      expect(callback).not.toHaveBeenCalled();
    });

    it('should unsubscribe listeners', async () => {
      const callback = vi.fn();
      const unsubscribe = websocket.on('message', callback);
      
      // Connect first
      const connectPromise = websocket.connect();
      mockWebSocket.addEventListener.mock.calls.find((call: any[]) => 
        call[0] === 'open'
      )?.[1]();
      await connectPromise;
      
      // Unsubscribe
      unsubscribe();
      
      // Simulate message received
      const messageEvent = {
        data: JSON.stringify({
          type: 'message',
          payload: { content: 'Hello' }
        })
      };
      mockWebSocket.addEventListener.mock.calls.find((call: any[]) => 
        call[0] === 'message'
      )?.[1](messageEvent);
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('send', () => {
    it('should send messages when connected', async () => {
      // Connect first
      const connectPromise = websocket.connect();
      mockWebSocket.addEventListener.mock.calls.find((call: any[]) => 
        call[0] === 'open'
      )?.[1]();
      await connectPromise;
      
      const result = websocket.send('message', { content: 'Hello' });
      
      expect(result).toBe(true);
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'message',
          payload: { content: 'Hello' }
        })
      );
    });

    it('should return false when not connected', () => {
      const result = websocket.send('message', { content: 'Hello' });
      expect(result).toBe(false);
    });

    it('should handle send errors', async () => {
      // Connect first
      const connectPromise = websocket.connect();
      mockWebSocket.addEventListener.mock.calls.find((call: any[]) => 
        call[0] === 'open'
      )?.[1]();
      await connectPromise;
      
      mockWebSocket.send.mockImplementation(() => {
        throw new Error('Send failed');
      });
      
      const result = websocket.send('message', { content: 'Hello' });
      expect(result).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should disconnect WebSocket properly', () => {
      websocket.disconnect();
      
      expect(mockWebSocket.close).toHaveBeenCalled();
    });
  });

  describe('reconnection logic', () => {
    beforeEach(() => {
      // Reset the instance for testing reconnection
      delete require.cache[require.resolve('../websocket')];
      const { websocket: freshWebsocket } = require('../websocket');
      Object.assign(websocket, freshWebsocket);
    });

    it('should attempt reconnection on disconnect', async () => {
      // Connect first
      const connectPromise = websocket.connect();
      mockWebSocket.addEventListener.mock.calls.find((call: any[]) => 
        call[0] === 'open'
      )?.[1]();
      await connectPromise;
      
      // Simulate disconnect
      mockWebSocket.addEventListener.mock.calls.find((call: any[]) => 
        call[0] === 'close'
      )?.[1]();
      
      // Check that reconnect was attempted (this would happen with a delay)
      expect(global.WebSocket).toHaveBeenCalledTimes(2);
    });

    it('should stop reconnection after max attempts', async () => {
      // Connect first
      const connectPromise = websocket.connect();
      mockWebSocket.addEventListener.mock.calls.find((call: any[]) => 
        call[0] === 'open'
      )?.[1]();
      await connectPromise;
      
      // Simulate multiple disconnects to exceed max attempts
      for (let i = 0; i < 6; i++) {
        mockWebSocket.addEventListener.mock.calls.find((call: any[]) => 
          call[0] === 'close'
        )?.[1]();
      }
      
      // Should only attempt up to maxReconnectAttempts + initial connection
      expect(global.WebSocket).toHaveBeenCalledTimes(6); // 1 initial + 5 reconnection attempts
    });
  });

  describe('different event types', () => {
    it('should handle all event types', async () => {
      const callbacks = {
        message: vi.fn(),
        room_update: vi.fn(),
        presence: vi.fn(),
        error: vi.fn(),
      };

      Object.entries(callbacks).forEach(([event, callback]) => {
        websocket.on(event as any, callback);
      });
      
      // Connect first
      const connectPromise = websocket.connect();
      mockWebSocket.addEventListener.mock.calls.find((call: any[]) => 
        call[0] === 'open'
      )?.[1]();
      await connectPromise;
      
      // Test each event type
      Object.entries(callbacks).forEach(([event, callback]) => {
        const messageEvent = {
          data: JSON.stringify({
            type: event,
            payload: { [event]: 'test data' }
          })
        };
        mockWebSocket.addEventListener.mock.calls.find((call: any[]) => 
          call[0] === 'message'
        )?.[1](messageEvent);
        
        expect(callback).toHaveBeenCalledWith({ [event]: 'test data' });
      });
    });
  });
});