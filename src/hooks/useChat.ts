import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import type { Message } from '@/types/message';

export function useChat(roomId: string) {
  const { address } = useAccount();
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const sendMessage = useCallback(async (content: string) => {
    if (!address) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: address,
      content,
      timestamp: Date.now(),
      roomId,
    };

    setIsSending(true);
    
    try {
      // TODO: Replace with actual API call to send message
      // await sendMessageToAPI(roomId, content);
      
      setMessages(prev => [newMessage, ...prev]);
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Show error to user
    } finally {
      setIsSending(false);
    }
  }, [address, roomId]);

  const fetchMessages = useCallback(async (roomId: string, page: number) => {
    try {
      // TODO: Replace with actual API call to fetch messages
      // const response = await fetchMessagesFromAPI(roomId, page, MESSAGES_PER_PAGE);
      // return response;
      return [];
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      throw error;
    }
  }, []);

  return {
    messages,
    isSending,
    sendMessage,
    fetchMessages,
  };
}
