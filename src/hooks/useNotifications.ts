import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';

/**
 * useNotifications hook
 *
 * A hook that provides notification functionality.
 * It allows displaying notifications to the user, managing notification preferences,
 * and managing notification badge.
 *
 * @returns {Object} An object with functions to display notifications, manage notification preferences, and manage notification badge.
 */
interface NotificationPreferences {
  pushEnabled: boolean;
  soundEnabled: boolean;
  showPreview: boolean;
}

type NotificationType = 'message' | 'mention' | 'reaction' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  data?: Record<string, unknown>;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  soundEnabled: true,
  showPreview: true,
};

const NOTIFICATION_SOUND = '/sounds/notification.mp3';

const useNotifications = () => {
  const { address } = useAccount();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  const notificationPermission = useRef<NotificationPermission>('default');

  // Initialize notification sound
  useEffect(() => {
    if (typeof window !== 'undefined') {
      notificationSound.current = new Audio(NOTIFICATION_SOUND);
      notificationPermission.current = window.Notification?.permission || 'denied';
    }

    // Load saved preferences
    const savedPrefs = localStorage.getItem('notificationPreferences');
    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
      } catch (e) {
        console.error('Failed to load notification preferences', e);
      }
    }

    // Load unread count
    const savedUnread = localStorage.getItem('unreadCount');
    if (savedUnread) {
      setUnreadCount(Number(savedUnread));
    }

    // Request notification permission if not already granted/denied
    if (notificationPermission.current === 'default') {
      requestNotificationPermission();
    }

    // Cleanup
    return () => {
      if (notificationSound.current) {
        notificationSound.current.pause();
        notificationSound.current = null;
      }
    };
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (preferences !== DEFAULT_PREFERENCES) {
      localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
    }
  }, [preferences]);

  // Save unread count to localStorage when it changes
  useEffect(() => {
    if (unreadCount > 0) {
      localStorage.setItem('unreadCount', unreadCount.toString());
    } else {
      localStorage.removeItem('unreadCount');
    }
  }, [unreadCount]);

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return false;
    }

    try {
      const permission = await window.Notification.requestPermission();
      notificationPermission.current = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const showNotification = useCallback(
    async (title: string, options?: NotificationOptions) => {
      if (!preferences.pushEnabled || notificationPermission.current !== 'granted') {
        return null;
      }

      try {
        const notification = new Notification(title, {
          icon: '/favicon.ico',
          ...options,
        });

        // Play sound if enabled
        if (preferences.soundEnabled && notificationSound.current) {
          notificationSound.current.currentTime = 0;
          await notificationSound.current.play().catch(console.error);
        }

        return notification;
      } catch (error) {
        console.error('Error showing notification:', error);
        return null;
      }
    },
    [preferences.pushEnabled, preferences.soundEnabled]
  );

  const addNotification = useCallback(
    (type: NotificationType, title: string, message: string, data?: Record<string, unknown>) => {
      const newNotification: Notification = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        title,
        message: preferences.showPreview ? message : 'New notification',
        timestamp: Date.now(),
        read: false,
        data,
      };

      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show browser notification if enabled
      if (preferences.pushEnabled) {
        showNotification(title, {
          body: preferences.showPreview ? message : 'You have a new notification',
          data: newNotification,
        });
      }

      return newNotification;
    },
    [preferences.pushEnabled, preferences.showPreview, showNotification]
  );

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    setPreferences((prev) => ({
      ...prev,
      ...newPreferences,
    }));
  }, []);

  // Reset notification badge when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        // Reset unread count or mark notifications as read when user returns to the app
        // This can be customized based on your requirements
      }
    };

    window.addEventListener('visibilitychange', handleFocus);
    return () => window.removeEventListener('visibilitychange', handleFocus);
  }, []);

  return {
    // State
    notifications,
    unreadCount,
    preferences,
    hasPermission: notificationPermission.current === 'granted',
    
    // Actions
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    updatePreferences,
    requestNotificationPermission,
  };
};

export default useNotifications;
