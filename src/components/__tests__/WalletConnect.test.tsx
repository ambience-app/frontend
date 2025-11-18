import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';

import WalletConnect from '../WalletConnect';

const mockUseAppKitAccount = vi.fn();
const mockUseAppKit = vi.fn();
const mockUseWalletInfo = vi.fn();
const mockUseDisconnect = vi.fn();
const mockUseAccount = vi.fn();
const mockUseWagmiDisconnect = vi.fn();

vi.mock('@reown/appkit/react', () => ({
  useAppKitAccount: () => mockUseAppKitAccount(),
  useAppKit: () => mockUseAppKit(),
  useWalletInfo: () => mockUseWalletInfo(),
  useDisconnect: () => mockUseDisconnect(),
}));

vi.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
  useDisconnect: () => mockUseWagmiDisconnect(),
}));

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: ComponentProps<'img'>) => <img {...props} />,
}));

const ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const TRUNCATED_ADDRESS = '0x1234...5678';
const TRUNCATED_PATTERN = new RegExp(TRUNCATED_ADDRESS.replace(/\./g, '\\.'));

const openMock = vi.fn();
const appkitDisconnectMock = vi.fn();
const wagmiDisconnectMock = vi.fn();
let clipboardWriteMock: ReturnType<typeof vi.fn>;

type ConnectionOverrides = {
  appkit?: { address?: string; isConnected?: boolean };
  wagmi?: {
    address?: string;
    isConnected?: boolean;
    connector?: { name?: string; icon?: string };
  };
  walletInfo?: { name?: string; icon?: string };
};

const setConnectionState = (overrides: ConnectionOverrides = {}) => {
  mockUseAppKitAccount.mockReturnValue({
    address: overrides.appkit?.address,
    isConnected: overrides.appkit?.isConnected ?? Boolean(overrides.appkit?.address),
  });
  mockUseAccount.mockReturnValue({
    address: overrides.wagmi?.address,
    isConnected: overrides.wagmi?.isConnected ?? Boolean(overrides.wagmi?.address),
    connector: overrides.wagmi?.connector,
  });
  mockUseWalletInfo.mockReturnValue({
    walletInfo: overrides.walletInfo,
  });
};

describe('WalletConnect', () => {
  beforeEach(() => {
    openMock.mockReset();
    openMock.mockResolvedValue(undefined);
    appkitDisconnectMock.mockReset();
    appkitDisconnectMock.mockResolvedValue(undefined);
    wagmiDisconnectMock.mockReset();
    wagmiDisconnectMock.mockResolvedValue(undefined);

    mockUseAppKit.mockReturnValue({ open: openMock });
    mockUseDisconnect.mockReturnValue({ disconnect: appkitDisconnectMock });
    mockUseWagmiDisconnect.mockReturnValue({ disconnect: wagmiDisconnectMock });
    setConnectionState();

    clipboardWriteMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: clipboardWriteMock },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('renders the connect button when disconnected', async () => {
    render(<WalletConnect />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument(),
    );
  });

  it('shows the truncated address when connected', async () => {
    setConnectionState({
      appkit: { address: ADDRESS, isConnected: true },
    });
    render(<WalletConnect />);

    await waitFor(() => expect(screen.getByText(TRUNCATED_ADDRESS)).toBeInTheDocument());
  });

  it('copies the address and resets the label after the timeout', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    setConnectionState({
      appkit: { address: ADDRESS, isConnected: true },
    });
    render(<WalletConnect />);

    await user.click(screen.getByRole('button', { name: TRUNCATED_PATTERN }));
    const copyButton = await screen.findByRole('button', { name: /copy address/i });
    await user.click(copyButton);

    expect(clipboardWriteMock).toHaveBeenCalledWith(ADDRESS);
    await waitFor(() => expect(copyButton).toHaveTextContent(/copied!/i));

    vi.advanceTimersByTime(2000);
    await waitFor(() => expect(copyButton).toHaveTextContent(/copy address/i));
  });

  it('toggles the dropdown and closes it on outside clicks', async () => {
    const user = userEvent.setup();
    setConnectionState({
      appkit: { address: ADDRESS, isConnected: true },
    });
    render(<WalletConnect />);

    await user.click(screen.getByRole('button', { name: TRUNCATED_PATTERN }));
    expect(await screen.findByText(/view on explorer/i)).toBeInTheDocument();

    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await waitFor(() => expect(screen.queryByText(/view on explorer/i)).not.toBeInTheDocument());
  });

  it('disconnects from both providers when requested', async () => {
    const user = userEvent.setup();
    setConnectionState({
      appkit: { address: ADDRESS, isConnected: true },
      wagmi: {
        address: ADDRESS,
        isConnected: true,
        connector: { name: 'Wagmi Wallet', icon: '' },
      },
    });
    render(<WalletConnect />);

    await user.click(screen.getByRole('button', { name: TRUNCATED_PATTERN }));
    const disconnectButton = await screen.findByRole('button', { name: /disconnect/i });
    await user.click(disconnectButton);

    await waitFor(() => {
      expect(appkitDisconnectMock).toHaveBeenCalled();
      expect(wagmiDisconnectMock).toHaveBeenCalled();
    });
  });

  it('shows the wallet icon when provided by AppKit', async () => {
    setConnectionState({
      appkit: { address: ADDRESS, isConnected: true },
      walletInfo: { name: 'Primary Wallet', icon: 'data:image/svg+xml;base64,PHN2Zy8+' },
    });
    render(<WalletConnect />);

    await waitFor(() => expect(screen.getByAltText('Primary Wallet')).toBeInTheDocument());
  });

  it('logs a connection error when the connect modal fails to open', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    openMock.mockRejectedValueOnce(new Error('connect failure'));

    render(<WalletConnect />);
    await user.click(screen.getByRole('button', { name: /connect wallet/i }));

    await waitFor(() =>
      expect(consoleErrorSpy).toHaveBeenCalledWith('Connection error:', 'connect failure'),
    );
    consoleErrorSpy.mockRestore();
  });
});

