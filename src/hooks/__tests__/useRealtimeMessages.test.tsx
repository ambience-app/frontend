import { renderHook, act } from '@testing-library/react';
import { useRealtimeMessages } from '../useRealtimeMessages';
import { generateKeyPair, publicKeyFromBase64 } from '@/lib/encryption';
import { WebSocket } from 'ws';

// Mock WebSocket
class MockWebSocket {
  events: Record<string, Function[]> = {};
  
  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }

  send(event: string, data: any) {
    // Simulate message received back
    if (event === 'message') {
      setTimeout(() => {
        this.trigger('message', {
          ...data,
          id: 'msg-123',
          timestamp: Date.now(),
          status: 'delivered'
        });
      }, 10);
    }
    return Promise.resolve(true);
  }

  trigger(event: string, data: any) {
    (this.events[event] || []).forEach(callback => callback(data));
  }
}

describe('useRealtimeMessages', () => {
  let mockWebSocket: MockWebSocket;
  
  beforeEach(() => {
    // @ts-ignore
    global.WebSocket = MockWebSocket;
    mockWebSocket = new MockWebSocket();
  });

  it('should send and receive encrypted messages', async () => {
    // Generate test keys
    const aliceKeyPair = await generateKeyPair();
    const bobKeyPair = await generateKeyPair();
    
    // Mock getPublicKey function
    const getPublicKey = async (userId: string) => {
      return userId === 'bob' ? bobKeyPair.publicKey : aliceKeyPair.publicKey;
    };

    const { result } = renderHook(() => 
      useRealtimeMessages({
        roomId: 'test-room',
        encryptionKeys: {
          privateKey: aliceKeyPair.privateKey,
          getPublicKey
        }
      })
    );

    // Send a message
    let sentMessage: any;
    await act(async () => {
      sentMessage = await result.current.sendMessage('Hello, Bob!');
    });

    // Check that the message was sent with encrypted content
    expect(sentMessage).toHaveProperty('isEncrypted', true);
    
    // Simulate a response from the server
    await act(async () => {
      // This would be triggered by the WebSocket mock
    });

    // Check that the message was added to the messages list
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Hello, Bob!');
  });

  it('should handle decryption errors', async () => {
    const { result } = renderHook(() => 
      useRealtimeMessages({
        roomId: 'test-room',
        encryptionKeys: {
          privateKey: new Uint8Array(32), // Invalid key
          getPublicKey: async () => new Uint8Array(32)
        }
      })
    );

    // Simulate receiving an encrypted message
    await act(async () => {
      mockWebSocket.trigger('message', {
        id: 'enc-msg-1',
        roomId: 'test-room',
        content: '🔒 [Encrypted message]',
        encryptedData: {
          ciphertext: 'invalid',
          nonce: 'invalid',
          publicKey: 'invalid'
        },
        timestamp: Date.now()
      });
    });

    // Check that the message is marked with decryption error
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].decryptionError).toBe(true);
  });
});
