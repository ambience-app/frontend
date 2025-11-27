/**
 * src/components/__tests__/Chat.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chat } from '../chat/Chat';
import { render } from '@/test-utils';

// Mock the hooks
vi.mock('@/hooks/useChat', () => ({
  useChat: vi.fn(() => ({
    messages: [
      {
        id: '1',
        sender: '0x1234567890123456789012345678901234567890',
        content: 'Test message',
        timestamp: Date.now() - 1000,
        roomId: 'room1',
      },
    ],
    isSending: false,
    sendMessage: vi.fn(),
    fetchMessages: vi.fn(),
  })),
}));

// Mock child components to isolate the Chat component
vi.mock('../chat/message/MessageList', () => ({
  MessageList: ({ children, ...props }: any) => (
    <div data-testid="message-list" {...props}>
      {children}
    </div>
  ),
}));

vi.mock('../chat/message/MessageInput', () => ({
  MessageInput: ({ onSend, disabled, ...props }: any) => (
    <button 
      data-testid="message-input" 
      disabled={disabled}
      onClick={() => onSend && onSend('test message')}
      {...props}
    >
      Send
    </button>
  ),
}));

// Mock cn utility
vi.mock('@/lib/utils', () => ({
  cn: vi.fn((...inputs: any[]) => inputs.filter(Boolean).join(' ')),
}));

describe('Chat', () => {
  const defaultProps = {
    roomId: 'room1',
    className: 'test-chat',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with basic props', () => {
    render(<Chat {...defaultProps} />);

    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.getByTestId('message-input')).toBeInTheDocument();
  });

  it('should pass roomId to MessageList', () => {
    render(<Chat {...defaultProps} />);

    const messageList = screen.getByTestId('message-list');
    expect(messageList).toHaveAttribute('roomId', 'room1');
  });

  it('should pass className correctly', () => {
    render(<Chat {...defaultProps} />);

    const chatContainer = screen.getByRole('main') || screen.getByTestId('message-list').parentElement;
    expect(chatContainer).toHaveClass('test-chat');
  });

  it('should pass currentUserAddress to MessageList', () => {
    render(<Chat {...defaultProps} />);

    const messageList = screen.getByTestId('message-list');
    expect(messageList).toHaveAttribute('currentUserAddress', '');
  });

  it('should pass fetchMessages function to MessageList', () => {
    render(<Chat {...defaultProps} />);

    const messageList = screen.getByTestId('message-list');
    expect(messageList).toHaveAttribute('fetchMessages');
  });

  it('should pass sendMessage function to MessageInput', () => {
    render(<Chat {...defaultProps} />);

    const messageInput = screen.getByTestId('message-input');
    expect(messageInput).not.toBeDisabled();
  });

  it('should disable MessageInput when isSending is true', () => {
    // Mock useChat to return isSending: true
    const mockUseChat = vi.fn();
    vi.mocked(mockUseChat).mockReturnValue({
      messages: [],
      isSending: true,
      sendMessage: vi.fn(),
      fetchMessages: vi.fn(),
    });

    render(<Chat {...defaultProps} />);

    const messageInput = screen.getByTestId('message-input');
    expect(messageInput).toBeDisabled();
  });

  it('should handle custom className', () => {
    render(<Chat roomId="room1" className="custom-class" />);

    const chatElement = screen.getByTestId('message-list').closest('div');
    expect(chatElement).toHaveClass('custom-class');
  });

  it('should render MessageList with flex-1 and overflow-y-auto classes', () => {
    render(<Chat {...defaultProps} />);

    const messageList = screen.getByTestId('message-list');
    expect(messageList).toHaveClass('flex-1');
    expect(messageList).toHaveClass('overflow-y-auto');
  });

  it('should render MessageInput with border-t and border-border classes', () => {
    render(<Chat {...defaultProps} />);

    const messageInput = screen.getByTestId('message-input');
    // The input is inside the MessageInput component, so we need to check the parent
    expect(messageInput.closest('div')).toHaveClass('border-t');
    expect(messageInput.closest('div')).toHaveClass('border-border');
  });

  it('should handle empty roomId', () => {
    render(<Chat roomId="" className="test" />);

    expect(screen.getByTestId('message-list')).toHaveAttribute('roomId', '');
  });

  it('should handle null/undefined className', () => {
    render(<Chat roomId="room1" className={undefined as any} />);

    expect(screen.getByTestId('message-list').closest('div')).toBeInTheDocument();
  });
});

describe('Chat Integration', () => {
  it('should integrate with useChat hook correctly', () => {
    const mockSendMessage = vi.fn();
    const mockFetchMessages = vi.fn();

    vi.mocked(require('@/hooks/useChat').useChat).mockReturnValue({
      messages: [
        {
          id: '1',
          sender: '0x1234567890123456789012345678901234567890',
          content: 'Hello world',
          timestamp: Date.now(),
          roomId: 'room1',
        },
      ],
      isSending: false,
      sendMessage: mockSendMessage,
      fetchMessages: mockFetchMessages,
    });

    render(<Chat roomId="room1" />);

    // Verify that the mock was called with the correct parameters
    expect(require('@/hooks/useChat').useChat).toHaveBeenCalledWith('room1');
  });

  it('should pass correct props through the component hierarchy', () => {
    const mockSendMessage = vi.fn();
    const mockFetchMessages = vi.fn();

    vi.mocked(require('@/hooks/useChat').useChat).mockReturnValue({
      messages: [],
      isSending: false,
      sendMessage: mockSendMessage,
      fetchMessages: mockFetchMessages,
    });

    render(<Chat roomId="test-room" className="test-class" />);

    const messageList = screen.getByTestId('message-list');
    const messageInput = screen.getByTestId('message-input');

    expect(messageList).toHaveAttribute('roomId', 'test-room');
    expect(messageInput).not.toBeDisabled();
  });
});