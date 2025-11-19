import { useState, useEffect, useCallback, useRef } from 'react';
import { useProvider, useBlockNumber } from '@reown/appkit/react';
import { ethers } from 'ethers';

type Block = {
  number: number;
  timestamp: number;
  hash: string;
  parentHash: string;
};

type SyncOptions<T> = {
  // How often to check for new blocks (in milliseconds)
  pollInterval?: number;
  
  // Number of blocks to wait before considering data stale
  staleBlockCount?: number;
  
  // Maximum number of blocks to process in a single update
  maxBlocksPerUpdate?: number;
  
  // Callback when new blocks are detected
  onBlock?: (block: Block) => Promise<void> | void;
  
  // Callback to fetch data that needs to be kept in sync
  fetchData: (blockNumber: number) => Promise<T>;
  
  // Callback to handle chain reorganizations
  onReorg?: (currentBlock: Block, oldBlock: Block) => Promise<boolean>;
};

type SyncResult<T> = {
  // Current block number
  blockNumber: number | null;
  
  // Latest synced block
  latestBlock: Block | null;
  
  // Current data
  data: T | null;
  
  // Loading state
  isLoading: boolean;
  
  // Error state
  error: Error | null;
  
  // Whether the data is considered stale
  isStale: boolean;
  
  // Manually trigger a data refresh
  refresh: () => Promise<void>;
  
  // Pause/resume syncing
  pause: () => void;
  resume: () => void;
};

// Cache for block data
const blockCache = new Map<number, Block>();
const CACHE_SIZE = 200; // Keep last 200 blocks in cache

// Helper to fetch block data with caching
async function fetchBlock(provider: ethers.Provider, blockNumber: number): Promise<Block> {
  const cached = blockCache.get(blockNumber);
  if (cached) return cached;
  
  const block = await provider.getBlock(blockNumber);
  if (!block) {
    throw new Error(`Block ${blockNumber} not found`);
  }
  
  const blockData: Block = {
    number: block.number,
    timestamp: block.timestamp,
    hash: block.hash,
    parentHash: block.parentHash,
  };
  
  // Update cache
  blockCache.set(blockNumber, blockData);
  
  // Limit cache size
  if (blockCache.size > CACHE_SIZE) {
    const firstKey = blockCache.keys().next().value;
    blockCache.delete(firstKey);
  }
  
  return blockData;
}

export function useBlockchainSync<T>({
  pollInterval = 5000,
  staleBlockCount = 5,
  maxBlocksPerUpdate = 10,
  onBlock,
  fetchData,
  onReorg,
}: SyncOptions<T>): SyncResult<T> {
  const provider = useProvider();
  const latestBlockNumber = useBlockNumber();
  
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [latestBlock, setLatestBlock] = useState<Block | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);
  
  const lastProcessedBlockRef = useRef<number | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track the latest data fetch
  const fetchDataForBlock = useCallback(async (blockNumber: number) => {
    if (!provider || !isMountedRef.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const blockData = await fetchBlock(provider, blockNumber);
      const result = await fetchData(blockNumber);
      
      if (!isMountedRef.current) return;
      
      setLatestBlock(blockData);
      setBlockNumber(blockNumber);
      setData(result);
      lastProcessedBlockRef.current = blockNumber;
      
      // Check if data is stale
      if (latestBlockNumber && blockNumber < latestBlockNumber - staleBlockCount) {
        setIsStale(true);
      } else {
        setIsStale(false);
      }
      
      if (onBlock) {
        await Promise.resolve(onBlock(blockData));
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [provider, fetchData, onBlock, latestBlockNumber, staleBlockCount]);
  
  // Handle new blocks and chain reorgs
  const handleNewBlock = useCallback(async () => {
    if (!provider || !latestBlockNumber || isPaused || !isMountedRef.current) return;
    
    try {
      const currentBlock = await fetchBlock(provider, latestBlockNumber);
      
      // If we don't have any block yet, fetch data for the latest block
      if (lastProcessedBlockRef.current === null) {
        await fetchDataForBlock(latestBlockNumber);
        return;
      }
      
      // Check for chain reorg by verifying the parent hash
      const lastBlock = latestBlock || await fetchBlock(provider, lastProcessedBlockRef.current);
      
      if (currentBlock.number <= lastBlock.number) {
        // No new blocks
        return;
      }
      
      // Check for reorg by walking back the chain
      let blockToCheck = currentBlock;
      let blocksToReplay: Block[] = [];
      
      while (blockToCheck.number > lastBlock.number && blocksToReplay.length < maxBlocksPerUpdate) {
        blocksToReplay.unshift(blockToCheck);
        
        // If we've reached the last processed block, check for reorg
        if (blockToCheck.parentHash === lastBlock.hash) {
          // No reorg, just new blocks
          break;
        }
        
        if (blockToCheck.number === lastBlock.number) {
          // Reorg detected at this block
          if (onReorg) {
            const shouldContinue = await onReorg(blockToCheck, lastBlock);
            if (!shouldContinue) return;
          }
          break;
        }
        
        // Move to parent block
        blockToCheck = await fetchBlock(provider, blockToCheck.number - 1);
      }
      
      // Process new blocks in order
      for (const block of blocksToReplay) {
        if (!isMountedRef.current) return;
        await fetchDataForBlock(block.number);
      }
      
    } catch (err) {
      console.error('Error processing new block:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to process new block'));
      }
    }
  }, [provider, latestBlockNumber, isPaused, latestBlock, onReorg, maxBlocksPerUpdate, fetchDataForBlock]);
  
  // Set up polling for new blocks
  useEffect(() => {
    if (!provider || isPaused) return;
    
    const poll = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      refreshTimeoutRef.current = setTimeout(async () => {
        await handleNewBlock();
        if (isMountedRef.current && !isPaused) {
          poll();
        }
      }, pollInterval);
    };
    
    poll();
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [provider, pollInterval, isPaused, handleNewBlock]);
  
  // Handle component unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);
  
  // Manual refresh
  const refresh = useCallback(async () => {
    if (latestBlockNumber) {
      await fetchDataForBlock(latestBlockNumber);
    }
  }, [latestBlockNumber, fetchDataForBlock]);
  
  // Pause/resume syncing
  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => {
    setIsPaused(false);
    handleNewBlock();
  }, [handleNewBlock]);
  
  return {
    blockNumber,
    latestBlock,
    data,
    isLoading,
    error,
    isStale,
    refresh,
    pause,
    resume,
  };
}

export default useBlockchainSync;
