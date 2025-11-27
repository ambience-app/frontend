import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { formatGwei as viemFormatGwei, parseGwei as viemParseGwei } from 'viem';

type GasSettings = {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  gasLimit: bigint;
  baseFee?: bigint;
  estimatedTime?: number; // in seconds
};

type GasEstimationOptions = {
  // Transaction parameters
  to?: `0x${string}`;
  data?: `0x${string}`;
  value?: bigint | string;
  
  // Gas estimation options
  multiplier?: number; // Gas limit multiplier (e.g., 1.2 for 20% buffer)
  priorityLevel?: 'low' | 'medium' | 'high' | 'custom';
  customPriorityFee?: bigint;
  
  // Callback for custom estimation logic
  estimateGas?: (client: ReturnType<typeof usePublicClient>) => Promise<bigint>;
};

// Default priority fee percentages (of base fee)
const PRIORITY_FEE_PERCENTAGES = {
  low: 0.5,    // 50% of base fee
  medium: 1.0, // 100% of base fee
  high: 1.5,   // 150% of base fee
} as const;

// Estimated block times in seconds
const BLOCK_TIMES = {
  ethereum: 12,
  polygon: 2,
  arbitrum: 0.26,
  optimism: 2,
  celo: 5,
  base: 2,
} as const;

/**
 * useGasEstimation hook
 *
 * A hook that provides gas estimation functionality.
 * It allows estimating gas for a transaction, getting suggested gas settings,
 * and formatting gas prices.
 *
 * @returns {Object} An object with functions to estimate gas, get suggested gas settings, get fee data, format gas price, parse gas price, and the current network.
 * @property {GasSettings | null} gasSettings - The current gas settings.
 * @property {boolean} isLoading - Whether the gas estimation is loading.
 * @property {Error | null} error - The error object if the gas estimation fails.
 * @property {function} estimateGas - A function to estimate gas for a transaction.
 * @property {function} getSuggestedGasSettings - A function to get suggested gas settings.
 * @property {function} getFeeData - A function to get fee data.
 * @property {function} formatGwei - A function to format a gas price in gwei.
 * @property {function} parseGwei - A function to parse a gwei string to a BigNumber.
 * @property {keyof typeof BLOCK_TIMES} network - The current network.
 */

export function useGasEstimation() {
  const client = usePublicClient();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [gasSettings, setGasSettings] = useState<GasSettings | null>(null);
  const [network, setNetwork] = useState<keyof typeof BLOCK_TIMES>('ethereum');

  // Detect network
  useEffect(() => {
    if (!client.chain) return;
    
    try {
      // Map chainId to network name
      const networkMap: { [key: number]: keyof typeof BLOCK_TIMES } = {
        1: 'ethereum',
        137: 'polygon',
        42161: 'arbitrum',
        10: 'optimism',
        42220: 'celo',
        8453: 'base',
        11155111: 'ethereum', // Sepolia
      };
      
      setNetwork(networkMap[client.chain.id] || 'ethereum');
    } catch (err) {
      console.error('Error detecting network:', err);
    }
  }, [client.chain]);

  // Get current base fee and suggest priority fee
  const getFeeData = useCallback(async (): Promise<{
    baseFee: bigint;
    maxPriorityFeePerGas: bigint;
    priorityLevel: 'low' | 'medium' | 'high';
  }> => {
    if (!client) {
      throw new Error('Client not available');
    }

    try {
      const block = await client.getBlock();
      if (!block.baseFeePerGas) {
        throw new Error('Could not fetch base fee');
      }

      const baseFee = block.baseFeePerGas;
      const priorityLevel: 'low' | 'medium' | 'high' = 'medium'; // Default to medium
      
      // Calculate priority fee as a percentage of base fee
      const priorityFeePercentage = PRIORITY_FEE_PERCENTAGES[priorityLevel];
      const maxPriorityFeePerGas = (baseFee * BigInt(Math.floor(priorityFeePercentage * 100))) / BigInt(100);
      
      return {
        baseFee,
        maxPriorityFeePerGas,
        priorityLevel,
      };
    } catch (err) {
      console.error('Error getting fee data:', err);
      throw new Error('Failed to get fee data');
    }
  }, [client]);

  // Estimate gas for a transaction
  const estimateGas = useCallback(async (options: GasEstimationOptions): Promise<GasSettings> => {
    if (!client) {
      throw new Error('Client not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const {
        to,
        data = '0x',
        value = BigInt(0),
        multiplier = 1.2, // 20% buffer by default
        priorityLevel = 'medium',
        customPriorityFee,
        estimateGas: customEstimateGas,
      } = options;

      // Get fee data
      const feeData = await getFeeData();
      
      // Use custom priority fee if provided
      const maxPriorityFeePerGas = customPriorityFee || feeData.maxPriorityFeePerGas;
      
      // Calculate max fee per gas (base fee * 2 + priority fee)
      const maxFeePerGas = (feeData.baseFee * BigInt(2)) + maxPriorityFeePerGas;
      
      // Estimate gas limit
      let gasLimit: bigint;
      if (customEstimateGas) {
        gasLimit = await customEstimateGas(client);
      } else if (to) {
        const valueBigInt = typeof value === 'string' ? BigInt(value) : value;
        gasLimit = await client.estimateGas({
          account: client.account,
          to,
          data: data as `0x${string}`,
          value: valueBigInt,
        });
      } else {
        throw new Error('Either to address or custom estimateGas function must be provided');
      }
      
      // Apply multiplier to gas limit (with buffer)
      const bufferedGasLimit = (gasLimit * BigInt(Math.floor(multiplier * 100))) / BigInt(100);
      
      // Estimate time (very rough estimate based on network)
      const estimatedTime = BLOCK_TIMES[network] * 2; // Assuming 2 blocks to be safe
      
      const settings: GasSettings = {
        maxFeePerGas,
        maxPriorityFeePerGas,
        gasLimit: bufferedGasLimit,
        baseFee: feeData.baseFee,
        estimatedTime,
      };
      
      setGasSettings(settings);
      return settings;
      
    } catch (err) {
      console.error('Error estimating gas:', err);
      const error = err instanceof Error ? err : new Error('Failed to estimate gas');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [client, getFeeData, network]);

  // Get suggested gas settings without estimating a specific transaction
  const getSuggestedGasSettings = useCallback(async (): Promise<GasSettings> => {
    if (!client) {
      throw new Error('Client not available');
    }

    try {
      const feeData = await getFeeData();
      
      // Default gas limit (can be overridden by the user)
      const defaultGasLimit = BigInt(21000); // Standard ETH transfer
      
      // Calculate max fee per gas (base fee * 2 + priority fee)
      const maxFeePerGas = (feeData.baseFee * BigInt(2)) + feeData.maxPriorityFeePerGas;
      
      return {
        maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        gasLimit: defaultGasLimit,
        baseFee: feeData.baseFee,
        estimatedTime: BLOCK_TIMES[network] * 2,
      };
    } catch (err) {
      console.error('Error getting suggested gas settings:', err);
      throw err instanceof Error ? err : new Error('Failed to get suggested gas settings');
    }
  }, [client, getFeeData, network]);

  // Format gas price in gwei
  const formatGwei = useCallback((value: bigint): string => {
    return viemFormatGwei(value);
  }, []);

  // Parse gwei string to bigint
  const parseGwei = useCallback((value: string): bigint => {
    return viemParseGwei(value);
  }, []);

  return {
    // State
    gasSettings,
    isLoading,
    error,
    
    // Methods
    estimateGas,
    getSuggestedGasSettings,
    getFeeData,
    formatGwei,
    parseGwei,
    
    // Constants
    PRIORITY_FEE_PERCENTAGES,
    BLOCK_TIMES,
    network,
  };
}

export default useGasEstimation;
