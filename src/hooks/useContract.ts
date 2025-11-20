import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Address } from "viem";

import CONTRACT_ABI from "@/contracts/Messaging.json";
import { CONTRACT_ADDRESS } from "@/config/contracts"; // ensure you export address


/**
 * useContract hook
 *
 * A hook that provides a simplified interface for interacting with the messaging smart contract on Base blockchain.
 * It handles reading from and writing to the contract, managing transaction states, and managing contract interactions.
 *
 * @returns {Object} An object with functions to read and write to the contract, and the current connection state.
 * @property {boolean} loading - Whether a transaction is in progress.
 * @property {unknown} error - The error object if a transaction fails.
 * @property {boolean} isConnected - Whether the user is connected to the blockchain.
 * @property {function} getMessages - A function to get messages from a room.
 * @property {function} createRoom - A function to create a new room.
 * @property {function} joinRoom - A function to join a room.
 * @property {function} sendMessage - A function to send a message to a room.
 */

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