import { useState, useCallback } from 'react';
import { Address, isAddress } from 'viem';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/contracts/addresses';
import ambienceChatABI from '@/contracts/ambienceChat.json';

type Room = {
  name: string;
  owner: Address;
  isPrivate: boolean;
  createdAt: bigint;
  messageCount: bigint;
};

type Message = {
  sender: Address;
  content: string;
  timestamp: bigint;
  roomId: bigint;
};

export function useAmbienceChat() {
  const { address, chain } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Get the contract address for the current chain
  const getContractAddress = useCallback(() => {
    if (!chain?.id) return null;
    const network = chain.testnet ? 'celoSepolia' : 'celo';
    return CONTRACT_ADDRESSES[network as keyof typeof CONTRACT_ADDRESSES]?.AMBIENCE_CHAT as Address | undefined;
  }, [chain]);

  // Read contract methods
  const { data: messageCooldown } = useReadContract({
    address: getContractAddress(),
    abi: ambienceChatABI.abi,
    functionName: 'MESSAGE_COOLDOWN',
  });

  // Write contract methods
  const { 
    data: writeResult,
    writeContractAsync,
    isError: isWriteError,
    error: writeError,
    isPending: isWritePending,
  } = useWriteContract();

  // Wait for transaction confirmation
  const { isSuccess: isConfirmed, isError: isTxError, error: txError } = 
    useWaitForTransactionReceipt({ hash: writeResult });

  // Generic error handler
  const handleError = useCallback((err: unknown) => {
    console.error('Contract interaction error:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    setError(errorMessage);
    setIsLoading(false);
    setIsPending(false);
    return errorMessage;
  }, []);

  // Create a new room
  const createRoom = useCallback(async (name: string, isPrivate: boolean = false) => {
    if (!address) {
      setError('Please connect your wallet first');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const contractAddress = getContractAddress();
      if (!contractAddress) throw new Error('Unsupported network');

      const result = await writeContractAsync({
        address: contractAddress,
        abi: ambienceChatABI.abi,
        functionName: 'createRoom',
        args: [name, isPrivate],
      });

      return result;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address, getContractAddress, handleError, writeContractAsync]);

  // Send a message to a room
  const sendMessage = useCallback(async (roomId: number, content: string) => {
    if (!address) {
      setError('Please connect your wallet first');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const contractAddress = getContractAddress();
      if (!contractAddress) throw new Error('Unsupported network');

      const result = await writeContractAsync({
        address: contractAddress,
        abi: ambienceChatABI.abi,
        functionName: 'sendMessage',
        args: [BigInt(roomId), content],
      });

      return result;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address, getContractAddress, handleError, writeContractAsync]);

  // Get room details
  const getRoom = useCallback(async (roomId: number): Promise<Room | null> => {
    const contractAddress = getContractAddress();
    if (!contractAddress) {
      setError('Unsupported network');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await readContract({
        address: contractAddress,
        abi: ambienceChatABI.abi,
        functionName: 'getRoom',
        args: [BigInt(roomId)],
      });

      return result as Room;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getContractAddress, handleError]);

  // Get messages for a room
  const getRoomMessages = useCallback(async (roomId: number, limit: number = 50, offset: number = 0): Promise<Message[]> => {
    const contractAddress = getContractAddress();
    if (!contractAddress) {
      setError('Unsupported network');
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);

      const messageCount = await readContract({
        address: contractAddress,
        abi: ambienceChatABI.abi,
        functionName: 'getRoomMessageCount',
        args: [BigInt(roomId)],
      }) as bigint;

      const messages: Message[] = [];
      const start = Math.max(0, Number(messageCount) - offset - limit);
      const end = Math.min(Number(messageCount) - offset, start + limit);

      for (let i = start; i < end; i++) {
        const message = await readContract({
          address: contractAddress,
          abi: ambienceChatABI.abi,
          functionName: 'getRoomMessage',
          args: [BigInt(roomId), BigInt(i)],
        }) as Message;
        messages.push(message);
      }

      return messages;
    } catch (err) {
      handleError(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getContractAddress, handleError]);

  // Add member to a private room
  const addRoomMember = useCallback(async (roomId: number, memberAddress: string) => {
    if (!address) {
      setError('Please connect your wallet first');
      return null;
    }

    if (!isAddress(memberAddress)) {
      setError('Invalid wallet address');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const contractAddress = getContractAddress();
      if (!contractAddress) throw new Error('Unsupported network');

      const result = await writeContractAsync({
        address: contractAddress,
        abi: ambienceChatABI.abi,
        functionName: 'addRoomMember',
        args: [BigInt(roomId), memberAddress as Address],
      });

      return result;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address, getContractAddress, handleError, writeContractAsync]);

  return {
    // State
    isLoading,
    isPending: isPending || isWritePending,
    isConfirmed,
    isError: isWriteError || isTxError,
    error: error || writeError?.message || txError?.message,
    
    // Contract methods
    createRoom,
    sendMessage,
    getRoom,
    getRoomMessages,
    addRoomMember,
    messageCooldown: messageCooldown ? Number(messageCooldown) : 0,
  };
}

export default useAmbienceChat;
