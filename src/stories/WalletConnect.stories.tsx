import type { Meta, StoryObj } from '@storybook/react';
import WalletConnect from '../components/WalletConnect';
import { Providers } from '../components/Providers';

const meta = {
  title: 'Components/WalletConnect',
  component: WalletConnect,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Providers>
        <Story />
      </Providers>
    ),
  ],
} satisfies Meta<typeof WalletConnect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const InNavigation: Story = {
  args: {},
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  decorators: [
    (Story) => (
      <Providers>
        <nav className="bg-slate-900 p-4">
          <Story />
        </nav>
      </Providers>
    ),
  ],
};
