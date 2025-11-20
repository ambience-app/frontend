import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Address } from 'viem';
import { useContract } from './useContract';

type EventHandler<T = any> = (event: T) => void;

interface EventSubscription<T = any> {
  eventName: string;
  handler: EventHandler<T>;
  filter?: (event: T) => boolean;
  transform?: (event: any) => T;
}

interface UseContractEventsOptions {
  contractName?: string;
  contractAddress?: Address;
  enabled?: boolean;
  reconnectInterval?: number;
}

/**
 * useContractEvents hook
 *
 * A hook that provides a simplified interface for subscribing to events from the messaging smart contract on Base blockchain.
 * It handles subscribing to events, handling event data, and managing event subscriptions.
 *
 * @returns {Object} An object with functions to unsubscribe from events, and the current connection state.
 * @param {string} eventName - The name of the event to subscribe to.
 * @param {EventHandler<T>} handler - The callback to handle the event.
 * @param {UseContractEventsOptions} options - The options for the event subscription.
 * @property {function} unsubscribe - A function to unsubscribe from events.
 * @property {boolean} isSubscribed - Whether the user is subscribed to events.
 * @property {string} contractAddress - The address of the contract.
 * @property {string} connectedAddress - The address of the connected user.
 */

export function useContractEvents<T = any>(
  eventName: string,
  handler: EventHandler<T>,
  options: UseContractEventsOptions & {
    filter?: (event: T) => boolean;
    transform?: (event: any) => T;
  } = {}
) {
  const {
    contractName = 'MESSAGING',
    contractAddress,
    enabled = true,
    reconnectInterval = 5000,
    filter,
    transform,
  } = options;

  const { address: connectedAddress } = useAccount();
  const { contract } = useContract(contractName);
  const handlerRef = useRef<EventHandler<T>>(handler);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  // Update handler ref if handler changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  // Handle event with transformation and filtering
  const handleEvent = useCallback(
    async (event: any) => {
      if (!isMountedRef.current) return;

      try {
        // Apply transformation if provided
        let processedEvent = transform ? transform(event) : event;
        
        // Apply filter if provided
        if (filter && !filter(processedEvent)) {
          return;
        }

        // Call the handler with the processed event
        handlerRef.current(processedEvent);
      } catch (error) {
        console.error(`Error processing ${eventName} event:`, error);
      }
    },
    [eventName, filter, transform]
  );

  // Setup event listener
  useEffect(() => {
    if (!enabled || !contract || !isMountedRef.current) {
      return;
    }

    const setupEventListener = () => {
      try {
        // Clear any existing listeners for this event
        contract.off(eventName, handleEvent);
        
        // Add new listener
        contract.on(eventName, handleEvent);
        
        // Clear any pending reconnect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = undefined;
        }
        
        console.debug(`Subscribed to ${eventName} events`);
      } catch (error) {
        console.error(`Error setting up ${eventName} event listener:`, error);
        
        // Schedule reconnection if component is still mounted
        if (isMountedRef.current) {
          console.debug(`Will attempt to reconnect to ${eventName} in ${reconnectInterval}ms`);
          reconnectTimeoutRef.current = setTimeout(
            setupEventListener,
            reconnectInterval
          );
        }
      }
    };

    setupEventListener();

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (contract) {
        try {
          contract.off(eventName, handleEvent);
          console.debug(`Unsubscribed from ${eventName} events`);
        } catch (error) {
          console.error(`Error cleaning up ${eventName} event listener:`, error);
        }
      }
    };
  }, [contract, eventName, handleEvent, enabled, reconnectInterval]);

  // Return cleanup function for manual control
  const unsubscribe = useCallback(() => {
    if (contract) {
      contract.off(eventName, handleEvent);
    }
  }, [contract, eventName, handleEvent]);

  return {
    unsubscribe,
    isSubscribed: !!contract,
    contractAddress: contract?.address,
    connectedAddress,
  };
}

// Hook to subscribe to multiple events at once
export function useContractEventsMulti<T extends Record<string, any>>(
  subscriptions: Array<{
    eventName: string;
    handler: EventHandler<T>;
    filter?: (event: T) => boolean;
    transform?: (event: any) => T;
  }>,
  options: Omit<UseContractEventsOptions, 'filter' | 'transform'> = {}
) {
  const { contract } = useContract(options.contractName);
  
  // Create a memoized subscription config
  const subscriptionConfigs = useMemo(
    () =>
      subscriptions.map((sub) => ({
        ...sub,
        contractName: options.contractName,
        contractAddress: options.contractAddress,
        enabled: options.enabled,
        reconnectInterval: options.reconnectInterval,
      })),
    [subscriptions, options]
  );

  // Set up each subscription
  const results = subscriptionConfigs.map((config) => {
    const { eventName, handler, filter, transform, ...rest } = config;
    return useContractEvents(eventName, handler, {
      ...rest,
      filter,
      transform,
    });
  });

  // Combined cleanup function
  const unsubscribeAll = useCallback(() => {
    results.forEach(({ unsubscribe }) => unsubscribe());
  }, [results]);

  return {
    results,
    unsubscribeAll,
    contractAddress: contract?.address,
  };
}

// Example usage:
/*
// Single event
useContractEvents(
  'MessageSent',
  (event) => {
    console.log('New message:', event);
  },
  {
    filter: (event) => event.roomId === currentRoomId,
    transform: (event) => ({
      ...event,
      timestamp: new Date(event.timestamp * 1000),
    }),
  }
);

// Multiple events
useContractEventsMulti(
  [
    {
      eventName: 'MessageSent',
      handler: (event) => console.log('Message sent:', event),
    },
    {
      eventName: 'RoomCreated',
      handler: (event) => console.log('Room created:', event),
    },
  ],
  { contractName: 'MESSAGING' }
);
*/
