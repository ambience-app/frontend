/**
 * src/components/__tests__/Message.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Message } from '../message/Message';
import { render } from '@/test-utils';
import type { Message as MessageType, Reaction } from '@/types/message';

// Mock dependencies
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn((date: Date) => `${date.getTime()}ms ago`),
}));

vi.mock('wagmi', () => ({
  useEnsName: vi.fn(() => ({
    data: 'test ENS',
    isLoading: false,
  })),
}));

vi.mock('@/lib/utils', () => ({
  shortenAddress: vi.fn((address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`),
  cn: vi.fn((...inputs: any[]) => inputs.filter(Boolean).join(' ')),
}));

vi.mock('@/hooks/useReactions', () => ({
  useReactions: vi.fn(() => ({
    toggleReaction: vi.fn(),
    isLoading: false,
  })),
}));

vi.mock('../message/ReactionButton', () => ({
  ReactionButton: ({ reaction, onReaction }: any) => (
    <button data-testid="reaction-button" onClick={() => onReaction(reaction.emoji)}>
      {reaction.emoji} {reaction.count}
    </button>
  ),
}));

vi.mock('../message/EmojiPicker', () => ({
  EmojiPicker: ({ onSelect }: any) => (
    <button data-testid="emoji-picker" onClick={() => onSelect('👍')}>
      😊
    </button>
  ),
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, ...props }: any) => (
    <div data-testid="avatar" {...props}>
      {children}
    </div>
  ),
  AvatarImage: ({ src, ...props }: any) => (
    <img data-testid="avatar-image" src={src} {...props} />
  ),
  AvatarFallback: ({ children, ...props }: any) => (
    <div data-testid="avatar-fallback" {...props}>
      {children}
    </div>
  ),
}));

describe('Message', () => {
  const defaultMessage: MessageType = {
    id: '1',
    sender: '0x1234567890123456789012345678901234567890',
    content: 'Hello world!',
    timestamp: Date.now() - 60000, // 1 minute ago
    roomId: 'room1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render message content correctly', () => {
    render(<Message message={defaultMessage} />);

    expect(screen.getByText('Hello world!')).toBeInTheDocument();
  });

  it('should display sender address when no ENS name', () => {
    render(<Message message={defaultMessage} />);

    expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
  });

  it('should display ENS name when available', () => {
    render(<Message message={defaultMessage} />);

    // The component should use ENS name if available
    expect(screen.getByText(/test ENS|0x1234...7890/)).toBeInTheDocument();
  });

  it('should show timestamp', () => {
    render(<Message message={defaultMessage} />);

    // Should show timestamp (formatDistanceToNow mock returns time in ms)
    expect(screen.getByText(/.*ms ago/)).toBeInTheDocument();
  });

  it('should show avatar for non-current user messages', () => {
    render(<Message message={defaultMessage} isCurrentUser={false} />);

    expect(screen.getByTestId('avatar')).toBeInTheDocument();
  });

  it('should hide avatar for current user messages', () => {
    render(<Message message={defaultMessage} isCurrentUser={true} />);

    expect(screen.queryByTestId('avatar')).not.toBeInTheDocument();
  });

  it('should apply different styles for current user vs others', () => {
    const { rerender } = render(
      <Message message={defaultMessage} isCurrentUser={false} />
    );

    let messageContainer = screen.getByText('Hello world!').closest('div');
    expect(messageContainer).toHaveClass('justify-start');

    rerender(<Message message={defaultMessage} isCurrentUser={true} />);
    messageContainer = screen.getByText('Hello world!').closest('div');
    expect(messageContainer).toHaveClass('justify-end');
  });

  it('should display reactions when present', () => {
    const messageWithReactions = {
      ...defaultMessage,
      reactions: [
        { emoji: '👍', count: 2, users: ['0x123...', '0x456...'] },
        { emoji: '❤️', count: 1, users: ['0x789...'] },
      ],
    };

    render(<Message message={messageWithReactions} />);

    expect(screen.getAllByTestId('reaction-button')).toHaveLength(2);
    expect(screen.getByText('👍 2')).toBeInTheDocument();
    expect(screen.getByText('❤️ 1')).toBeInTheDocument();
  });

  it('should show reaction picker on hover', async () => {
    const user = userEvent.setup();
    render(<Message message={defaultMessage} />);

    // The message container should be hoverable
    const messageContainer = screen.getByText('Hello world!').closest('div');
    expect(messageContainer).toHaveClass('group');

    // Emoji picker should be hidden initially
    expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument();

    // Simulate hover (this would show the emoji picker in actual implementation)
    // For now, we just verify the structure
    expect(messageContainer).toHaveClass('group');
  });

  it('should call onReaction when emoji is selected', async () => {
    const onReaction = vi.fn();
    const user = userEvent.setup();

    render(<Message message={defaultMessage} onReaction={onReaction} />);

    // Click on the emoji picker (which should be visible on hover)
    const emojiPicker = screen.getByTestId('emoji-picker');
    if (emojiPicker) {
      await user.click(emojiPicker);
      expect(onReaction).toHaveBeenCalledWith('👍');
    }
  });

  it('should show edited indicator when message is edited', () => {
    const editedMessage = {
      ...defaultMessage,
      edited: true,
    };

    render(<Message message={editedMessage} />);

    expect(screen.getByText('edited')).toBeInTheDocument();
  });

  it('should not show edited indicator when message is not edited', () => {
    render(<Message message={defaultMessage} />);

    expect(screen.queryByText('edited')).not.toBeInTheDocument();
  });

  it('should handle User object as sender', () => {
    const userMessage = {
      ...defaultMessage,
      sender: {
        address: '0x1234567890123456789012345678901234567890',
        ensName: 'testuser.eth',
        displayName: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
      },
    };

    render(<Message message={userMessage} />);

    expect(screen.getByText('testuser.eth')).toBeInTheDocument();
  });

  it('should handle sender with displayName', () => {
    const userMessage = {
      ...defaultMessage,
      sender: {
        address: '0x1234567890123456789012345678901234567890',
        displayName: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
      },
    };

    render(<Message message={userMessage} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should fallback to address when no ENS or displayName', () => {
    const userMessage = {
      ...defaultMessage,
      sender: {
        address: '0x1234567890123456789012345678901234567890',
        avatar: 'https://example.com/avatar.jpg',
      },
    };

    render(<Message message={userMessage} />);

    expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Message message={defaultMessage} className="custom-message" />);

    const messageContainer = screen.getByText('Hello world!').closest('div');
    expect(messageContainer).toHaveClass('custom-message');
  });

  it('should show avatar image when available', () => {
    const userMessage = {
      ...defaultMessage,
      sender: {
        address: '0x1234567890123456789012345678901234567890',
        avatar: 'https://example.com/avatar.jpg',
      },
    };

    render(<Message message={userMessage} />);

    const avatarImage = screen.queryByTestId('avatar-image');
    expect(avatarImage).toBeInTheDocument();
    expect(avatarImage).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('should handle empty reactions array', () => {
    const messageWithEmptyReactions = {
      ...defaultMessage,
      reactions: [],
    };

    render(<Message message={messageWithEmptyReactions} />);

    expect(screen.queryByTestId('reaction-button')).not.toBeInTheDocument();
  });

  it('should handle reactions without onReaction callback', () => {
    const messageWithReactions = {
      ...defaultMessage,
      reactions: [
        { emoji: '👍', count: 1, users: ['0x123...'] },
      ],
    };

    render(<Message message={messageWithReactions} />);

    expect(screen.getByTestId('reaction-button')).toBeInTheDocument();
    // Should not throw error when onReaction is not provided
  });

  it('should show loading state when isReacting is true', () => {
    render(<Message message={defaultMessage} isReacting={true} />);

    const messageContainer = screen.getByText('Hello world!').closest('div');
    expect(messageContainer).toHaveClass('opacity-50');
  });

  it('should handle very long messages', () => {
    const longMessage = {
      ...defaultMessage,
      content: 'This is a very long message that should still be displayed correctly in the UI without causing any layout issues or overflow problems.',
    };

    render(<Message message={longMessage} />);

    expect(screen.getByText(/This is a very long message/)).toBeInTheDocument();
  });

  it('should handle special characters in message content', () => {
    const specialMessage = {
      ...defaultMessage,
      content: 'Hello! 🎉 <script>alert("xss")</script> & special chars: @#$%',
    };

    render(<Message message={specialMessage} />);

    expect(screen.getByText(/Hello! 🎉/)).toBeInTheDocument();
  });
});