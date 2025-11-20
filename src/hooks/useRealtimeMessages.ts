import { useEffect, useCallback, useRef } from 'react';
import { websocket } from '@/lib/websocket';
import { Message } from '@/types/message';


/**
 * useRealtimeMessages hook
 *
 * A hook that provides real-time messaging functionality for a specific room.
 * It allows subscribing to new messages and room updates, and provides
 * functions to send messages and update room settings.
 *
 * @param {Object} props - Component props.
 * @param {string} props.roomId - The ID of the room to subscribe to.
 * @param {MessageHandler} props.onNewMessage - The callback to handle new messages.
 * @param {RoomUpdateHandler} props.onRoomUpdate - The callback to handle room updates.
 * @param {(error: Error) => void} props.onError - The callback to handle errors.
 * @returns {Object} An object with functions to send messages and update room settings.
 */

type MessageHandler = (message: Message) => void;
type RoomUpdateHandler = (roomId: string, updates: any) => void;

export function useRealtimeMessages({
  roomId,
  onNewMessage,
  onRoomUpdate,
  onError,
}: {
  roomId?: string;
  onNewMessage?: MessageHandler;
  onRoomUpdate?: RoomUpdateHandler;
  onError?: (error: Error) => void;
}) {
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

  // Handle new messages
  useEffect(() => {
    if (!onNewMessage) return;

    const handleNewMessage = (message: Message) => {
      // Only process messages for the current room
      if (message.roomId === roomId) {
        callbacksRef.current.onNewMessage?.(message);
      }
    };

    const unsubscribe = websocket.on('message', handleNewMessage);
    return () => unsubscribe();
  }, [roomId]);

  // Handle room updates
  useEffect(() => {
    if (!onRoomUpdate) return;

    const handleRoomUpdate = (update: { roomId: string; updates: any }) => {
      if (!roomId || update.roomId === roomId) {
        callbacksRef.current.onRoomUpdate?.(update.roomId, update.updates);
      }
    };

    const unsubscribe = websocket.on('room_update', handleRoomUpdate);
    return () => unsubscribe();
  }, [roomId]);

  // Handle errors
  useEffect(() => {
    if (!onError) return;

    const handleError = (error: { message: string }) => {
      callbacksRef.current.onError?.(new Error(error.message));
    };

    const unsubscribe = websocket.on('error', handleError);
    return () => unsubscribe();
  }, []);

  // Send a new message
  const sendMessage = useCallback(
    (content: string) => {
      if (!roomId) {
        throw new Error('No room selected');
      }
      return websocket.send('message', { roomId, content });
    },
    [roomId]
  );

  // Update room settings
  const updateRoom = useCallback(
    (updates: any) => {
      if (!roomId) {
        throw new Error('No room selected');
      }
      return websocket.send('room_update', { roomId, updates });
    },
    [roomId]
  );

  return {
    sendMessage,
    updateRoom,
  };
}
