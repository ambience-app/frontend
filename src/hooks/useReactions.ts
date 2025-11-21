import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { Reaction, Message } from '@/types/message';

export function useReactions() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const toggleReaction = useCallback(async (
    message: Message,
    emoji: string,
    onUpdate: (updatedMessage: Message) => void
  ) => {
    if (!address) return;

    const messageId = message.id;
    setIsLoading(prev => ({ ...prev, [messageId]: true }));

    try {
      // Clone the message to avoid direct state mutation
      const updatedMessage = { ...message };
      
      // Initialize reactions array if it doesn't exist
      if (!updatedMessage.reactions) {
        updatedMessage.reactions = [];
      }

      // Find if the user has already reacted with this emoji
      const reactionIndex = updatedMessage.reactions.findIndex(
        r => r.emoji === emoji
      );

      if (reactionIndex >= 0) {
        // Reaction exists, check if user has already reacted
        const userIndex = updatedMessage.reactions[reactionIndex].users.indexOf(address);
        
        if (userIndex >= 0) {
          // User has already reacted, remove their reaction
          updatedMessage.reactions[reactionIndex].count -= 1;
          updatedMessage.reactions[reactionIndex].users.splice(userIndex, 1);
          
          // Remove the reaction if count reaches zero
          if (updatedMessage.reactions[reactionIndex].count === 0) {
            updatedMessage.reactions.splice(reactionIndex, 1);
          }
        } else {
          // User hasn't reacted, add their reaction
          updatedMessage.reactions[reactionIndex].count += 1;
          updatedMessage.reactions[reactionIndex].users.push(address);
        }
      } else {
        // New reaction
        updatedMessage.reactions.push({
          emoji,
          count: 1,
          users: [address],
        });
      }

      // Call the update handler with the updated message
      onUpdate(updatedMessage);
    } catch (error) {
      console.error('Error toggling reaction:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, [messageId]: false }));
    }
  }, [address]);

  return { toggleReaction, isLoading };
}

export default useReactions;
