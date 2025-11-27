/**
 * src/types/message.ts
 */
import type { Address } from './index';
import type { User } from './user';

export interface Reaction {
  emoji: string;
  count: number;
  users: string[]; // Array of user addresses who reacted with this emoji
}

export interface Message {
  id: string;
  sender: Address | User; // allow either a simple Address or a User object
  content: string;
  timestamp: number; // epoch milliseconds
  roomId: string;
  edited?: boolean;
  deleted?: boolean;
  reactions?: Reaction[];
  meta?: Record<string, unknown>; // extensible metadata
}

export type Emoji = {
  name: string;
  emoji: string;
  shortcodes: string[];
};

export const EMOJIS: Emoji[] = [
  { name: 'thumbs up', emoji: '👍', shortcodes: ['+1', 'thumbsup'] },
  { name: 'heart', emoji: '❤️', shortcodes: ['heart'] },
  { name: 'laughing', emoji: '😂', shortcodes: ['joy', 'laughing'] },
  { name: 'fire', emoji: '🔥', shortcodes: ['fire'] },
  { name: 'rocket', emoji: '🚀', shortcodes: ['rocket'] },
  { name: 'eyes', emoji: '👀', shortcodes: ['eyes'] },
  { name: 'check mark', emoji: '✅', shortcodes: ['white_check_mark'] },
  { name: 'party popper', emoji: '🎉', shortcodes: ['tada'] },
];
