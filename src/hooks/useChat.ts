import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAppKitAccount } from '@reown/appkit/react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { parseEther } from 'viem';
import type { Message } from '@/types/message';
import { SecureContractClient } from '@/lib/security/contracts';
import { CONTRACT_ADDRESSES } from '@/contracts/addresses';
import { toast } from 'sonner';

// Number of messages to fetch per page
const MESSAGES_PER_PAGE = 20;

interface ContractMessage {
  sender: string;
  content: string;
  timestamp: number;
  roomId: number;
}

export function useChat(roomId: string) {
  // Use AppKit account first, fallback to wagmi
  const { address: appkitAddress } = useAppKitAccount();
  const { address: wagmiAddress } = useAccount();
  const address = appkitAddress || wagmiAddress;
  
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contractClient, setContractClient] = useState<SecureContractClient | null>(null);
  
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Initialize contract client
  useEffect(() => {
    if (!publicClient || !walletClient) return;
    
    try {
      const client = new SecureContractClient(publicClient.chain?.id as any || 8453);
      if (walletClient) {
        client.initializeWalletClient(walletClient as any);
      }
      setContractClient(client);
    } catch (err) {
      console.error('Failed to initialize contract client:', err);
      setError('Failed to initialize Web3 client');
    }
  }, [publicClient, walletClient]);

  // Convert contract message to app message format
  const toMessage = (msg: ContractMessage, id: number): Message => ({
    id: id.toString(),
    sender: msg.sender,
    content: msg.content,
    timestamp: Number(msg.timestamp) * 1000, // Convert to milliseconds
    roomId: msg.roomId.toString(),
  });

  // Send a new message to the chat room
  const sendMessage = useCallback(async (content: string) => {
    if (!address || !contractClient) {
      setError('Wallet not connected');
      return;
    }

    if (!content.trim()) {
      setError('Message cannot be empty');
      return;
    }

    const roomIdNum = parseInt(roomId, 10);
    if (isNaN(roomIdNum)) {
      setError('Invalid room ID');
      return;
    }

    setIsSending(true);
    setError(null);
    
    try {
      // Send the message to the contract
      const result = await contractClient.writeContract({
        address: CONTRACT_ADDRESSES.celo.AMBIENCE_CHAT as `0x${string}`,
        abi: [{
          "inputs": [
            { "name": "roomId", "type": "uint256" },
            { "name": "content", "type": "string" }
          ],
          "name": "sendMessage",
          "outputs": [{ "name": "", "type": "uint256" }],
          "stateMutability": "nonpayable",
          "type": "function"
        }],
        functionName: 'sendMessage',
        args: [BigInt(roomIdNum), content],
      });

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to send message');
      }

      // Wait for transaction receipt
      const receipt = await contractClient.waitForTransactionReceipt(
        result.data as `0x${string}`
      );

      if (!receipt.success) {
        throw new Error(receipt.error?.message || 'Transaction failed');
      }

      // Get the new message ID from the transaction receipt
      const messageId = await contractClient.readContract({
        address: CONTRACT_ADDRESSES.celo.AMBIENCE_CHAT as `0x${string}`,
        abi: [{
          "inputs": [],
          "name": "getTotalMessages",
          "outputs": [{ "name": "", "type": "uint256" }],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'getTotalMessages',
        args: [],
      });

      if (messageId.success) {
        // Fetch the new message
        const messageResult = await contractClient.readContract({
          address: CONTRACT_ADDRESSES.celo.AMBIENCE_CHAT as `0x${string}`,
          abi: [{
            "inputs": [{ "name": "messageId", "type": "uint256" }],
            "name": "getMessage",
            "outputs": [{
              "components": [
                { "name": "sender", "type": "address" },
                { "name": "content", "type": "string" },
                { "name": "timestamp", "type": "uint256" },
                { "name": "roomId", "type": "uint256" }
              ],
              "internalType": "struct AmbienceChat.Message",
              "name": "",
              "type": "tuple"
            }],
            "stateMutability": "view",
            "type": "function"
          }],
          functionName: 'getMessage',
          args: [messageId.data as bigint - 1n], // Get the last message
        });

        if (messageResult.success) {
          const newMessage = toMessage(messageResult.data as any, Number(messageId.data) - 1);
          setMessages(prev => [newMessage, ...prev]);
          toast.success('Message sent successfully');
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [address, contractClient, roomId]);

  // Fetch messages for the current room
  const fetchMessages = useCallback(async (page: number = 0) => {
    if (!contractClient) return [];
    
    setIsLoading(true);
    setError(null);
    
    try {
      const roomIdNum = parseInt(roomId, 10);
      if (isNaN(roomIdNum)) {
        throw new Error('Invalid room ID');
      }

      // Get total messages in the room
      const totalResult = await contractClient.readContract({
        address: CONTRACT_ADDRESSES.celo.AMBIENCE_CHAT as `0x${string}`,
        abi: [{
          "inputs": [{ "name": "roomId", "type": "uint256" }],
          "name": "getRoomMessageCount",
          "outputs": [{ "name": "", "type": "uint256" }],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'getRoomMessageCount',
        args: [BigInt(roomIdNum)],
      });

      if (!totalResult.success) {
        throw new Error('Failed to fetch message count');
      }

      const totalMessages = Number(totalResult.data);
      if (totalMessages === 0) return [];

      // Calculate pagination
      const start = Math.max(0, totalMessages - (page + 1) * MESSAGES_PER_PAGE);
      const count = Math.min(MESSAGES_PER_PAGE, totalMessages - page * MESSAGES_PER_PAGE);

      if (count <= 0) return [];

      // Fetch messages for the current page
      const messagesResult = await contractClient.readContract({
        address: CONTRACT_ADDRESSES.celo.AMBIENCE_CHAT as `0x${string}`,
        abi: [{
          "inputs": [
            { "name": "roomId", "type": "uint256" },
            { "name": "offset", "type": "uint256" },
            { "name": "limit", "type": "uint256" }
          ],
          "name": "getRoomMessages",
          "outputs": [{
            "components": [
              { "name": "sender", "type": "address" },
              { "name": "content", "type": "string" },
              { "name": "timestamp", "type": "uint256" },
              { "name": "roomId", "type": "uint256" }
            ],
            "internalType": "struct AmbienceChat.Message[]",
            "name": "",
            "type": "tuple[]"
          }],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'getRoomMessages',
        args: [BigInt(roomIdNum), BigInt(start), BigInt(count)],
      });

      if (!messagesResult.success) {
        throw new Error('Failed to fetch messages');
      }

      // Convert and return messages
      return (messagesResult.data as ContractMessage[])
        .map((msg, i) => toMessage(msg, start + i))
        .reverse(); // Show newest first
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch messages');
      toast.error('Failed to load messages');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [contractClient, roomId]);

  // Load initial messages
  useEffect(() => {
    if (!contractClient) return;
    
    const loadInitialMessages = async () => {
      const initialMessages = await fetchMessages(0);
      setMessages(initialMessages);
    };
    
    loadInitialMessages();
    
    // Set up polling for new messages
    const interval = setInterval(loadInitialMessages, 30000);
    
    return () => clearInterval(interval);
  }, [contractClient, fetchMessages]);

  return {
    // State
    messages: messages || [],
    isLoading: isLoadingMessages,
    isSending,
    isLoading,
    error,
    sendMessage,
    createRoom,
    joinRoom,
    fetchNextPage,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    refetch: refetchMessages,
    invalidateMessages,

    // Advanced operations
    batchOperations,
    clearPendingBatches: contract.clearPendingBatches,
  };
}
