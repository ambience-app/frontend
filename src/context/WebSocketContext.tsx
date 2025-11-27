'use client';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { websocket } from '@/lib/websocket';

type WebSocketContextType = {
  isConnected: boolean;
  error: Error | null;
  reconnect: () => Promise<void>;
};

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleConnect = () => {
    setIsConnected(true);
    setError(null);
  };

  // const handleDisconnect = () => {
  //   setIsConnected(false);
  // };

  const handleError = (error: Error) => {
    console.error('WebSocket error:', error);
    setError(error);
  };

  const reconnect = async () => {
    try {
      setError(null);
      await websocket.connect();
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to reconnect');
      handleError(error);
      throw error;
    }
  };

  useEffect(() => {
    // Connect on mount
    const connect = async () => {
      try {
        await websocket.connect();
        handleConnect();
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to connect');
        handleError(error);
      }
    };

    connect();

    // Clean up on unmount
    return () => {
      websocket.disconnect();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, error, reconnect }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
