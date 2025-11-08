import type { Meta, StoryObj } from '@storybook/react';
import { Hash, Users, Clock } from 'lucide-react';

/**
 * Room Component Story
 *
 * This is a placeholder story for the Room component.
 * Update this file once the actual Room component is created.
 */

// Placeholder Room component
const Room = ({
  name,
  members,
  lastActive,
  description
}: {
  name: string;
  members: number;
  lastActive: string;
  description?: string;
}) => (
  <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer max-w-sm">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
        <Hash className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">#{name}</h3>
      </div>
    </div>
    {description && (
      <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{description}</p>
    )}
    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
      <div className="flex items-center gap-1">
        <Users className="w-4 h-4" />
        <span>{members} members</span>
      </div>
      <div className="flex items-center gap-1">
        <Clock className="w-4 h-4" />
        <span>{lastActive}</span>
      </div>
    </div>
  </div>
);

const meta = {
  title: 'Components/Room',
  component: Room,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text' },
    members: { control: 'number' },
    lastActive: { control: 'text' },
    description: { control: 'text' },
  },
} satisfies Meta<typeof Room>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'General',
    members: 1234,
    lastActive: '2 hours ago',
    description: 'General discussion about Ambience and decentralized chat',
  },
};

export const TechRoom: Story = {
  args: {
    name: 'Tech Talk',
    members: 567,
    lastActive: '5 min ago',
    description: 'Discuss Web3 development, smart contracts, and blockchain tech',
  },
};

export const ActiveRoom: Story = {
  args: {
    name: 'Trading',
    members: 2341,
    lastActive: 'Just now',
    description: 'Real-time crypto trading discussions and market analysis',
  },
};

export const NoDescription: Story = {
  args: {
    name: 'Random',
    members: 890,
    lastActive: '1 day ago',
  },
};
