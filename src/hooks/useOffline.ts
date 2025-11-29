import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [queuedMessages, setQueuedMessages] = useState<any[]>([]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('You are back online');
      syncQueuedMessages();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are currently offline. Some features may be limited.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Queue messages when offline
  const queueMessage = useCallback((message: any) => {
    setQueuedMessages(prev => [...prev, message]);
    
    // Store in IndexedDB for persistence
    if ('indexedDB' in window) {
      const request = indexedDB.open('ambienceChat', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('queuedMessages')) {
          db.createObjectStore('queuedMessages', { keyPath: 'id', autoIncrement: true });
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['queuedMessages'], 'readwrite');
        const store = transaction.objectStore('queuedMessages');
        store.add({ message, timestamp: new Date().toISOString() });
      };
    }
  }, []);

  // Sync queued messages when back online
  const syncQueuedMessages = useCallback(async () => {
    if (!isOnline || queuedMessages.length === 0) return;

    setIsSyncing(true);
    
    try {
      // Process each queued message
      for (const message of queuedMessages) {
        // Replace with your actual API call
        await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });
      }
      
      // Clear queued messages
      setQueuedMessages([]);
      
      // Clear from IndexedDB
      if ('indexedDB' in window) {
        const request = indexedDB.open('ambienceChat', 1);
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['queuedMessages'], 'readwrite');
          const store = transaction.objectStore('queuedMessages');
          store.clear();
        };
      }
      
      toast.success('Messages synced successfully');
    } catch (error) {
      console.error('Failed to sync messages:', error);
      toast.error('Failed to sync messages. Will retry later.');
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, queuedMessages]);

  // Load queued messages from IndexedDB on mount
  useEffect(() => {
    if ('indexedDB' in window) {
      const request = indexedDB.open('ambienceChat', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('queuedMessages')) {
          db.createObjectStore('queuedMessages', { keyPath: 'id', autoIncrement: true });
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['queuedMessages'], 'readonly');
        const store = transaction.objectStore('queuedMessages');
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          const messages = getAllRequest.result.map(item => item.message);
          setQueuedMessages(messages);
        };
      };
    }
  }, []);

  return {
    isOnline,
    isSyncing,
    queuedMessages,
    queueMessage,
    syncQueuedMessages,
  };
};
