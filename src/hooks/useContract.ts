import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Address } from "viem";

import CONTRACT_ABI from "@/contracts/Messaging.json";
import { CONTRACT_ADDRESS } from "@/config/contracts"; // ensure you export address

export function useContract() {
  const { address: userAddress, isConnected } = useAccount();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const { writeContractAsync } = useWriteContract();

  const getMessages = async (roomId: number) => {
    try {
      const result = await useReadContract({
        address: CONTRACT_ADDRESS as Address,
        abi: CONTRACT_ABI,
        functionName: "getMessages",
        args: [roomId],
      });

      return result.data || [];
    } catch (err) {
      console.error("Error reading messages:", err);
      setError(err);
      return [];
    }
  };

  const waitForReceipt = async (hash: Address) => {
    const receipt = await useWaitForTransactionReceipt({
      hash,
      confirmations: 1,
    });

    return receipt.data;
  };

  const createRoom = async (roomName: string) => {
    setLoading(true);
    setError(null);

    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as Address,
        abi: CONTRACT_ABI,
        functionName: "createRoom",
        args: [roomName],
      });

      return await waitForReceipt(hash);
    } catch (err) {
      console.error("Create room failed:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomId: number) => {
    setLoading(true);
    setError(null);

    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as Address,
        abi: CONTRACT_ABI,
        functionName: "joinRoom",
        args: [roomId],
      });

      return await waitForReceipt(hash);
    } catch (err) {
      console.error("Join room failed:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Write: Send a Message
  // ---------------------------
  const sendMessage = async (roomId: number, content: string) => {
    setLoading(true);
    setError(null);

    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as Address,
        abi: CONTRACT_ABI,
        functionName: "sendMessage",
        args: [roomId, content],
      });

      return await waitForReceipt(hash);
    } catch (err) {
      console.error("Send message error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    // state
    loading,
    error,
    isConnected,

    // read
    getMessages,

    // writes
    createRoom,
    joinRoom,
    sendMessage,
  };
}