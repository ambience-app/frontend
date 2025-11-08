import type { Meta, StoryObj } from '@storybook/react';

/**
 * Message Component Story
 *
 * This is a placeholder story for the Message component.
 * Update this file once the actual Message component is created.
 */

// Placeholder Message component
const Message = ({ content, sender, timestamp }: { content: string; sender: string; timestamp: string }) => (
  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 max-w-md">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
        {sender.charAt(0)}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-slate-900 dark:text-slate-100">{sender}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{timestamp}</span>
        </div>
        <p className="text-slate-700 dark:text-slate-300">{content}</p>
      </div>
    </div>
  </div>
);

const meta = {
  title: 'Components/Message',
  component: Message,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    content: { control: 'text' },
    sender: { control: 'text' },
    timestamp: { control: 'text' },
  },
} satisfies Meta<typeof Message>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: 'Hello! Welcome to Ambience Chat.',
    sender: 'Alice',
    timestamp: '2 min ago',
  },
};

export const LongMessage: Story = {
  args: {
    content: 'This is a longer message to show how the component handles more text. It demonstrates the layout and wrapping behavior of the message component in the chat interface.',
    sender: 'Bob',
    timestamp: '5 min ago',
  },
};

export const WithEmoji: Story = {
  args: {
    content: 'GM! ☀️ Ready to chat on the blockchain? 🚀',
    sender: 'Charlie',
    timestamp: '1 hour ago',
  },
};
