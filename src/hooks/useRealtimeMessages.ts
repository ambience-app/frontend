import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { websocket } from '@/lib/websocket';
import { Message as BaseMessage } from '@/types';
import { 
  EncryptedMessage, 
  decryptMessage, 
  publicKeyFromBase64,
  encryptMessage
} from '@/lib/encryption';
import { 
  EncryptedMessage, 
  decryptMessage, 
  publicKeyFromBase64 
} from '@/lib/encryption';

export type MessageStatus =
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export interface Message extends BaseMessage {
  status: MessageStatus;
  tempId?: string; // For optimistic updates
  error?: string; // Error message if sending failed
  isEncrypted?: boolean; // Whether the message is encrypted
  decryptionError?: boolean; // Whether decryption failed
}

export type MessageHandler = (message: Message) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RoomUpdateHandler = (roomId: string, updates: any) => void;

interface MessageCache {
  [roomId: string]: Message[];
}

interface UseRealtimeMessagesOptions {
  roomId?: string;
  onNewMessage?: MessageHandler;
  onRoomUpdate?: RoomUpdateHandler;
  onError?: (error: Error) => void;
  enableCaching?: boolean;
  cacheExpiry?: number; // in milliseconds
  encryptionKeys?: {
    privateKey: Uint8Array; // Current user's private key
    getPublicKey: (userId: string) => Promise<Uint8Array>; // Function to get recipient's public key
  };
}

export function useRealtimeMessages({
  roomId,
  onNewMessage,
  onRoomUpdate,
  onError,
  enableCaching = true,
  cacheExpiry = 1000 * 60 * 30, // 30 minutes
  encryptionKeys,
}: UseRealtimeMessagesOptions) {
  // Message cache state
  const [messageCache, setMessageCache] = useState<MessageCache>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Store callbacks in refs to avoid recreating them on every render
  const callbacksRef = useRef({
    onNewMessage,
    onRoomUpdate,
    onError,
  });

  // Update callbacks when they change
  useEffect(() => {
    callbacksRef.current = { onNewMessage, onRoomUpdate, onError };
  }, [onNewMessage, onRoomUpdate, onError]);

  // Load messages from cache or API
  const loadMessages = useCallback(
    async (roomId: string) => {
      if (!enableCaching) return;

      setIsLoading(true);
      setError(null);

      try {
        // Check if we have cached messages
        const cachedMessages = messageCache[roomId];
        const lastUpdated = cachedMessages?.[0]?.timestamp || 0;
        const isCacheValid = Date.now() - lastUpdated < cacheExpiry;

        if (cachedMessages && isCacheValid) {
          return cachedMessages;
        }

        // TODO: Fetch messages from API if cache is invalid or empty
        // const response = await api.getMessages({ roomId });
        // const messages = response.data.messages.map((msg: any) => ({
        //   ...msg,
        //   status: 'delivered' as const
        // }));

        // Update cache
        // setMessageCache(prev => ({
        //   ...prev,
        //   [roomId]: messages
        // }));

        // return messages;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to load messages');
        setError(error);
        callbacksRef.current.onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [enableCaching, messageCache, cacheExpiry]
  );

  // Add a new message to the cache
  const addMessageToCache = useCallback(
    (message: Message) => {
      if (!enableCaching) return;

      setMessageCache((prev) => ({
        ...prev,
        [message.roomId]: [...(prev[message.roomId] || []), message],
      }));
    },
    [enableCaching]
  );

  // Update message status in cache
  const updateMessageStatus = useCallback(
    (messageId: string, status: MessageStatus, error?: string) => {
      if (!enableCaching || !roomId) return;

      setMessageCache((prev) => {
        const roomMessages = prev[roomId] || [];
        const messageIndex = roomMessages.findIndex(
          (msg) => msg.id === messageId || msg.tempId === messageId
        );

        if (messageIndex === -1) return prev;

        const updatedMessages = [...roomMessages];
        updatedMessages[messageIndex] = {
          ...updatedMessages[messageIndex],
          status,
          ...(error && { error }),
        };

        return {
          ...prev,
          [roomId]: updatedMessages,
        };
      });
    },
    [enableCaching, roomId]
  );

  // Handle new messages from WebSocket
  useEffect(() => {
    if (!onNewMessage) return;

    const handleNewMessage = async (message: Message & { encryptedData?: EncryptedMessage }) => {
      // Only process messages for the current room
      if (message.roomId === roomId) {
        let decryptedContent = message.content;
        let decryptionError = false;
        let isEncrypted = false;

        // Handle encrypted messages
        if (message.encryptedData && encryptionKeys?.privateKey) {
          try {
            isEncrypted = true;
            const senderPublicKey = publicKeyFromBase64(message.encryptedData.publicKey);
            decryptedContent = await decryptMessage(
              message.encryptedData,
              encryptionKeys.privateKey,
              senderPublicKey
            );
          } catch (error) {
            console.error('Failed to decrypt message:', error);
            decryptionError = true;
          }
        }

        const messageWithStatus: Message = {
          ...message,
          content: decryptedContent,
          status: 'delivered', // Messages from server are considered delivered
          isEncrypted,
          decryptionError,
        };

        if (enableCaching) {
          addMessageToCache(messageWithStatus);
        }

        callbacksRef.current.onNewMessage?.(messageWithStatus);
      }
    };

    const unsubscribe = websocket.on('message', handleNewMessage);
    return () => unsubscribe();
  }, [roomId, onNewMessage, enableCaching, addMessageToCache]);

  // Handle room updates
  useEffect(() => {
    if (!onRoomUpdate) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleRoomUpdate = (update: { roomId: string; updates: any }) => {
      if (!roomId || update.roomId === roomId) {
        callbacksRef.current.onRoomUpdate?.(update.roomId, update.updates);
      }
    };

    const unsubscribe = websocket.on('room_update', handleRoomUpdate);
    return () => unsubscribe();
  }, [roomId, onRoomUpdate]);

  // Handle errors
  useEffect(() => {
    if (!onError) return;

    const handleError = (error: { message: string }) => {
      const errorObj = new Error(error.message);
      callbacksRef.current.onError?.(errorObj);
    };

    const unsubscribe = websocket.on('error', handleError);
    return () => unsubscribe();
  }, [onError]);

  // Send a new message with optimistic updates
  const sendMessage = useCallback(
    async (content: string): Promise<Message> => {
      if (!roomId) {
        throw new Error('No room selected');
      }

      // Create a temporary message for optimistic updates
      const tempId = `temp-${Date.now()}`;
      const tempMessage: Message = {
        id: tempId,
        tempId,
        content,
        roomId,
        senderId: 'current-user', // This should be replaced with actual user ID
        timestamp: Date.now(),
        status: 'sending',
        isEncrypted: !!encryptionKeys,
      };

      // Add to cache immediately for optimistic UI update
      if (enableCaching) {
        addMessageToCache(tempMessage);
      }

      try {
        let messageToSend: any = { roomId, content };
        
        // Encrypt the message if encryption is enabled
        if (encryptionKeys) {
          try {
            // Get the recipient's public key
            const recipientPublicKey = await encryptionKeys.getPublicKey(roomId);
            const encrypted = await encryptMessage(
              content,
              recipientPublicKey,
              encryptionKeys.privateKey
            );
            messageToSend = {
              ...messageToSend,
              content: '🔒 [Encrypted message]',
              encryptedData: encrypted
            };
            tempMessage.isEncrypted = true;
          } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('Failed to encrypt message');
          }
        }

        // Send message via WebSocket
        const success = await websocket.send('message', messageToSend);

        if (!success) {
          throw new Error('Failed to send message');
        }

        // Update message status to sending (we'll update to 'sent' when we get the server's ack)
        const sendingMessage: Message = {
          ...tempMessage,
          status: 'sending',
        };

        if (enableCaching) {
          updateMessageStatus(tempId, 'sending');
        }

        return sendingMessage;
      } catch (error) {
        // Update message status to failed
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to send message';

        if (enableCaching) {
          updateMessageStatus(tempId, 'failed', errorMessage);
        }

        throw new Error(errorMessage);
      }
    },
    [roomId, enableCaching, addMessageToCache, updateMessageStatus]
  );

  // Get messages for current room
  const messages = useMemo(() => {
    if (!roomId || !enableCaching) return [];
    return messageCache[roomId] || [];
  }, [roomId, messageCache, enableCaching]);

  // Update room settings
  const updateRoom = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updates: any) => {
      if (!roomId) {
        throw new Error('No room selected');
      }
      return websocket.send('room_update', { roomId, updates });
    },
    [roomId]
  );

  return {
    // Message state
    messages,
    isLoading,
    error,

    // Actions
    sendMessage,
    updateRoom,
    loadMessages: roomId ? () => loadMessages(roomId) : undefined,

    // Cache management
    clearCache: useCallback(() => {
      if (roomId) {
        setMessageCache((prev) => {
          const newCache = { ...prev };
          delete newCache[roomId];
          return newCache;
        });
      }
    }, [roomId]),
  };
}
