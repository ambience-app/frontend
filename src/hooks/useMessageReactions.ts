import { useState, useCallback, useEffect } from 'react';
import { useAccount } from '@reown/appkit/react';

type Reaction = {
  id: string;
  emoji: string;
  count: number;
  users: string[]; // Array of user addresses who reacted
};

type MessageReactions = {
  [messageId: string]: Reaction[];
};

type UseMessageReactionsProps = {
  roomId: string;
  messageIds: string[];
};

export function useMessageReactions({ roomId, messageIds }: UseMessageReactionsProps) {
  const { address } = useAccount();
  const [reactions, setReactions] = useState<MessageReactions>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize reactions for messages
  useEffect(() => {
    const initialReactions: MessageReactions = {};
    
    messageIds.forEach(messageId => {
      initialReactions[messageId] = [
        { id: 'like', emoji: '👍', count: 0, users: [] },
        { id: 'love', emoji: '❤️', count: 0, users: [] },
        { id: 'laugh', emoji: '😂', count: 0, users: [] },
        { id: 'wow', emoji: '😮', count: 0, users: [] },
      ];
    });

    setReactions(initialReactions);
    setIsLoading(false);
  }, [roomId, messageIds]);

  // Toggle a reaction on a message
  const toggleReaction = useCallback((messageId: string, reactionId: string) => {
    if (!address) return;

    setReactions(prevReactions => {
      const messageReactions = [...(prevReactions[messageId] || [])];
      const reactionIndex = messageReactions.findIndex(r => r.id === reactionId);
      
      if (reactionIndex === -1) return prevReactions;

      const reaction = messageReactions[reactionIndex];
      const userIndex = reaction.users.indexOf(address);
      
      const updatedReaction = { ...reaction };
      
      if (userIndex === -1) {
        // Add reaction
        updatedReaction.count += 1;
        updatedReaction.users = [...updatedReaction.users, address];
      } else {
        // Remove reaction
        updatedReaction.count = Math.max(0, updatedReaction.count - 1);
        updatedReaction.users = [
          ...updatedReaction.users.slice(0, userIndex),
          ...updatedReaction.users.slice(userIndex + 1)
        ];
      }

      const updatedReactions = {
        ...prevReactions,
        [messageId]: [
          ...messageReactions.slice(0, reactionIndex),
          updatedReaction,
          ...messageReactions.slice(reactionIndex + 1)
        ]
      };

      // TODO: Persist to your backend/contract here
      // await saveReaction(roomId, messageId, reactionId, userAddress);

      return updatedReactions;
    });
  }, [address]);

  // Check if the current user has reacted with a specific reaction
  const hasReacted = useCallback((messageId: string, reactionId: string) => {
    if (!address) return false;
    const messageReactions = reactions[messageId] || [];
    const reaction = messageReactions.find(r => r.id === reactionId);
    return reaction ? reaction.users.includes(address) : false;
  }, [reactions, address]);

  // Get all reactions for a specific message
  const getMessageReactions = useCallback((messageId: string) => {
    return reactions[messageId] || [];
  }, [reactions]);

  return {
    reactions,
    isLoading,
    error,
    toggleReaction,
    hasReacted,
    getMessageReactions,
  };
}

export default useMessageReactions;
