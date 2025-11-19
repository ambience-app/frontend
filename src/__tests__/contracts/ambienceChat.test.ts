import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContract } from '@/hooks/useContract';
import { useAccount, useNetwork, useProvider, useSigner } from '@reown/appkit/react';
import { ethers } from 'ethers';
import { waitFor } from '@testing-library/dom';

// Mock the contract ABI and addresses
vi.mock('@/contracts/ambienceChat.json', () => ({
  abi: [
    'function getMessage(uint256) view returns (tuple(address,string,uint256,uint256))',
    'function sendMessage(uint256,string) returns (uint256)',
    'function getRoom(uint256) view returns (tuple(string,address,bool,uint256,uint256))',
  ],
}));

// Mock the provider and signer
const mockProvider = {
  getNetwork: vi.fn().mockResolvedValue({ chainId: 44787 }), // Celo Alfajores
  getSigner: vi.fn().mockReturnValue({
    getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
  }),
};

// Mock the contract instance
const mockContract = {
  getMessage: vi.fn(),
  sendMessage: vi.fn(),
  getRoom: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
};

// Mock the ethers.Contract constructor
vi.mock('ethers', async () => {
  const actual = await vi.importActual('ethers');
  return {
    ...actual,
    Contract: vi.fn().mockImplementation(() => mockContract),
  };
});

// Mock the wallet connection
vi.mock('@reown/appkit/react', () => ({
  useAccount: vi.fn(),
  useNetwork: vi.fn(),
  useProvider: vi.fn(),
  useSigner: vi.fn(),
}));

describe('AmbienceChat Contract Integration', () => {
  const mockAccount = '0x1234567890123456789012345678901234567890';
  
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Setup default mocks
    (useAccount as jest.Mock).mockReturnValue({ address: mockAccount });
    (useNetwork as jest.Mock).mockReturnValue({ chain: { id: 44787 } });
    (useProvider as jest.Mock).mockReturnValue(mockProvider);
    (useSigner as jest.Mock).mockReturnValue({ data: mockProvider.getSigner() });
    
    // Default mock implementations
    mockContract.getMessage.mockResolvedValue([
      '0x1234567890123456789012345678901234567890',
      'Hello, world!',
      Math.floor(Date.now() / 1000),
      1, // roomId
    ]);
    
    mockContract.sendMessage.mockResolvedValue({
      wait: vi.fn().mockResolvedValue({
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      }),
    });
    
    mockContract.getRoom.mockResolvedValue([
      'Test Room',
      '0x1234567890123456789012345678901234567890',
      false,
      Math.floor(Date.now() / 1000) - 3600,
      5, // messageCount
    ]);
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('Read Operations', () => {
    it('should fetch a message', async () => {
      const { result } = renderHook(() => useContract('AMBIENCE_CHAT'));
      
      await waitFor(() => {
        expect(result.current.contract).toBeDefined();
      });
      
      const messageId = 1;
      const message = await result.current.contract?.getMessage(messageId);
      
      expect(mockContract.getMessage).toHaveBeenCalledWith(messageId);
      expect(message).toBeDefined();
      expect(message[1]).toBe('Hello, world!');
    });
    
    it('should fetch room information', async () => {
      const { result } = renderHook(() => useContract('AMBIENCE_CHAT'));
      
      await waitFor(() => {
        expect(result.current.contract).toBeDefined();
      });
      
      const roomId = 1;
      const room = await result.current.contract?.getRoom(roomId);
      
      expect(mockContract.getRoom).toHaveBeenCalledWith(roomId);
      expect(room).toBeDefined();
      expect(room[0]).toBe('Test Room');
    });
  });
  
  describe('Write Operations', () => {
    it('should send a message', async () => {
      const { result } = renderHook(() => useContract('AMBIENCE_CHAT'));
      
      await waitFor(() => {
        expect(result.current.contract).toBeDefined();
      });
      
      const roomId = 1;
      const content = 'Test message';
      
      const tx = await result.current.contract?.sendMessage(roomId, content);
      await tx?.wait();
      
      expect(mockContract.sendMessage).toHaveBeenCalledWith(roomId, content);
      expect(tx).toBeDefined();
    });
  });
  
  describe('Error Handling', () => {
    it('should handle read operation errors', async () => {
      mockContract.getMessage.mockRejectedValueOnce(new Error('Failed to fetch message'));
      
      const { result } = renderHook(() => useContract('AMBIENCE_CHAT'));
      
      await waitFor(() => {
        expect(result.current.contract).toBeDefined();
      });
      
      await expect(result.current.contract?.getMessage(999)).rejects.toThrow('Failed to fetch message');
    });
    
    it('should handle write operation errors', async () => {
      mockContract.sendMessage.mockRejectedValueOnce(new Error('Insufficient gas'));
      
      const { result } = renderHook(() => useContract('AMBIENCE_CHAT'));
      
      await waitFor(() => {
        expect(result.current.contract).toBeDefined();
      });
      
      await expect(
        result.current.contract?.sendMessage(1, 'Should fail')
      ).rejects.toThrow('Insufficient gas');
    });
  });
  
  describe('Wallet Interactions', () => {
    it('should handle disconnected wallet', async () => {
      (useAccount as jest.Mock).mockReturnValueOnce({ address: undefined });
      
      const { result } = renderHook(() => useContract('AMBIENCE_CHAT'));
      
      await waitFor(() => {
        expect(result.current.contract).toBeNull();
      });
      
      expect(result.current.error).toBeDefined();
    });
    
    it('should handle network changes', async () => {
      const { result, rerender } = renderHook(() => useContract('AMBIENCE_CHAT'));
      
      await waitFor(() => {
        expect(result.current.contract).toBeDefined();
      });
      
      // Simulate network change
      (useNetwork as jest.Mock).mockReturnValueOnce({ chain: { id: 1 } }); // Ethereum Mainnet
      rerender();
      
      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });
  
  describe('Event Handling', () => {
    it('should handle contract events', async () => {
      const { result } = renderHook(() => useContract('AMBIENCE_CHAT'));
      
      await waitFor(() => {
        expect(result.current.contract).toBeDefined();
      });
      
      const eventHandler = vi.fn();
      result.current.contract?.on('MessageSent', eventHandler);
      
      // Simulate event emission
      const mockEvent = {
        args: [1, 1, mockAccount, 'Test message', Math.floor(Date.now() / 1000)],
      };
      const eventCallback = mockContract.on.mock.calls[0][1];
      await eventCallback(...mockEvent.args);
      
      expect(eventHandler).toHaveBeenCalledWith(...mockEvent.args);
      
      // Cleanup
      result.current.contract?.off('MessageSent', eventHandler);
    });
  });
});
