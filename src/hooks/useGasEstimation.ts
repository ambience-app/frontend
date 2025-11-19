import { useState, useEffect, useCallback } from 'react';
import { useProvider } from '@reown/appkit/react';
import { BigNumber, ethers } from 'ethers';

type GasSettings = {
  maxFeePerGas: BigNumber;
  maxPriorityFeePerGas: BigNumber;
  gasLimit: BigNumber;
  baseFee?: BigNumber;
  estimatedTime?: number; // in seconds
};

type GasEstimationOptions = {
  // Transaction parameters
  to?: string;
  data?: string;
  value?: BigNumber | string;
  
  // Gas estimation options
  multiplier?: number; // Gas limit multiplier (e.g., 1.2 for 20% buffer)
  priorityLevel?: 'low' | 'medium' | 'high' | 'custom';
  customPriorityFee?: BigNumber;
  
  // Callback for custom estimation logic
  estimateGas?: (provider: ethers.Provider) => Promise<BigNumber>;
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
} as const;

export function useGasEstimation() {
  const provider = useProvider();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [gasSettings, setGasSettings] = useState<GasSettings | null>(null);
  const [network, setNetwork] = useState<keyof typeof BLOCK_TIMES>('ethereum');

  // Detect network
  useEffect(() => {
    const detectNetwork = async () => {
      if (!provider) return;
      
      try {
        const network = await provider.getNetwork();
        // Map chainId to network name
        const networkMap: { [key: number]: keyof typeof BLOCK_TIMES } = {
          1: 'ethereum',
          137: 'polygon',
          42161: 'arbitrum',
          10: 'optimism',
          42220: 'celo',
        };
        
        setNetwork(networkMap[Number(network.chainId)] || 'ethereum');
      } catch (err) {
        console.error('Error detecting network:', err);
      }
    };
    
    detectNetwork();
  }, [provider]);

  // Get current base fee and suggest priority fee
  const getFeeData = useCallback(async (): Promise<{
    baseFee: BigNumber;
    maxPriorityFeePerGas: BigNumber;
    priorityLevel: 'low' | 'medium' | 'high';
  }> => {
    if (!provider) {
      throw new Error('Provider not available');
    }

    try {
      const feeData = await provider.getFeeData();
      
      if (!feeData.lastBaseFeePerGas) {
        throw new Error('Could not fetch base fee');
      }

      const baseFee = feeData.lastBaseFeePerGas;
      const priorityLevel: 'low' | 'medium' | 'high' = 'medium'; // Default to medium
      
      // Calculate priority fee as a percentage of base fee
      const priorityFeePercentage = PRIORITY_FEE_PERCENTAGES[priorityLevel];
      const maxPriorityFeePerGas = baseFee.mul(Math.floor(priorityFeePercentage * 100)).div(100);
      
      return {
        baseFee,
        maxPriorityFeePerGas,
        priorityLevel,
      };
    } catch (err) {
      console.error('Error getting fee data:', err);
      throw new Error('Failed to get fee data');
    }
  }, [provider]);

  // Estimate gas for a transaction
  const estimateGas = useCallback(async (options: GasEstimationOptions): Promise<GasSettings> => {
    if (!provider) {
      throw new Error('Provider not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const {
        to,
        data = '0x',
        value = '0x0',
        multiplier = 1.2, // 20% buffer by default
        priorityLevel = 'medium',
        customPriorityFee,
        estimateGas: customEstimateGas,
      } = options;

      // Get fee data
      const feeData = await getFeeData();
      
      // Use custom priority fee if provided
      const maxPriorityFeePerGas = customPriorityFee || feeData.maxPriorityFeePerGas;
      
      // Calculate max fee per gas (base fee + priority fee)
      const maxFeePerGas = feeData.baseFee.mul(2).add(maxPriorityFeePerGas);
      
      // Estimate gas limit
      let gasLimit: BigNumber;
      if (customEstimateGas) {
        gasLimit = await customEstimateGas(provider);
      } else if (to) {
        gasLimit = await provider.estimateGas({
          to,
          data,
          value,
        });
      } else {
        throw new Error('Either to address or custom estimateGas function must be provided');
      }
      
      // Apply multiplier to gas limit (with buffer)
      const bufferedGasLimit = gasLimit.mul(Math.floor(multiplier * 100)).div(100);
      
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
  }, [provider, getFeeData, network]);

  // Get suggested gas settings without estimating a specific transaction
  const getSuggestedGasSettings = useCallback(async (): Promise<GasSettings> => {
    if (!provider) {
      throw new Error('Provider not available');
    }

    try {
      const feeData = await getFeeData();
      
      // Default gas limit (can be overridden by the user)
      const defaultGasLimit = BigNumber.from(21000); // Standard ETH transfer
      
      // Calculate max fee per gas (base fee + priority fee)
      const maxFeePerGas = feeData.baseFee.mul(2).add(feeData.maxPriorityFeePerGas);
      
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
  }, [provider, getFeeData, network]);

  // Format gas price in gwei
  const formatGwei = useCallback((value: BigNumber): string => {
    return ethers.utils.formatUnits(value, 'gwei');
  }, []);

  // Parse gwei string to BigNumber
  const parseGwei = useCallback((value: string): BigNumber => {
    return ethers.utils.parseUnits(value, 'gwei');
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
