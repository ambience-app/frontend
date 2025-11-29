import { EventNames, PlausibleOptions } from 'next-plausible';

type EventProps = {
  category?: string;
  label?: string;
  value?: string | number;
  [key: string]: string | number | boolean | undefined;
};

/**
 * Track a custom event with Plausible
 * @param eventName - The name of the event to track
 * @param props - Additional properties to track with the event
 * @param options - Plausible options
 */
export const trackEvent = (
  eventName: EventNames | string,
  props?: EventProps,
  options?: PlausibleOptions
) => {
  if (typeof window === 'undefined') return;
  
  // Cast to any to bypass TypeScript type checking for window.plausible
  const plausible = (window as any).plausible;
  
  if (plausible) {
    // If props are provided, track with properties
    if (props) {
      plausible(eventName, { props, ...options });
    } else {
      // Otherwise track without properties
      plausible(eventName, options);
    }
  }
};

// Common event names
export const EVENTS = {
  // Page views
  PAGE_VIEW: 'page_view',
  
  // Auth events
  WALLET_CONNECTED: 'wallet_connected',
  WALLET_DISCONNECTED: 'wallet_disconnected',
  
  // Chat events
  MESSAGE_SENT: 'message_sent',
  MESSAGE_RECEIVED: 'message_received',
  ROOM_CREATED: 'room_created',
  ROOM_JOINED: 'room_joined',
  
  // Navigation
  NAVIGATION: 'navigation',
  
  // UI interactions
  THEME_TOGGLED: 'theme_toggled',
  
  // Error events
  ERROR: 'error_occurred',
} as const;

// Track page views with custom properties
export const trackPageView = (url: string, props?: Record<string, string>) => {
  trackEvent(EVENTS.PAGE_VIEW, {
    url,
    ...props,
  });
};

// Track wallet connection
export const trackWalletConnected = (walletName: string, address: string) => {
  trackEvent(EVENTS.WALLET_CONNECTED, {
    wallet: walletName,
    address: address,
  });
};

// Track message sent
export const trackMessageSent = (roomId: string, messageLength: number) => {
  trackEvent(EVENTS.MESSAGE_SENT, {
    roomId,
    messageLength,
  });
};

// Track room created
export const trackRoomCreated = (roomId: string, isPublic: boolean) => {
  trackEvent(EVENTS.ROOM_CREATED, {
    roomId,
    isPublic,
  });
};

// Track errors
export const trackError = (error: Error, context?: Record<string, unknown>) => {
  trackEvent(EVENTS.ERROR, {
    error: error.message,
    errorName: error.name,
    context: JSON.stringify(context),
  });
};
