import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';

// Create a test query client
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

// Create a test Wagmi config
const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
});

type AppProviderProps = {
  children: React.ReactNode;
};

// Create a custom render function that includes all the necessary providers
const AllTheProviders = ({ children }: AppProviderProps) => {
  const queryClient = createTestQueryClient();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
// Override render method
export { customRender as render };

// Mock for next/navigation
const mockedUsePathname = vi.fn();
const mockedUseSearchParams = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => mockedUseSearchParams(),
  usePathname: () => mockedUsePathname(),
}));

// Mock for next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { name: 'Test User', email: 'test@example.com' } },
    status: 'authenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock for wagmi
vi.mock('wagmi', async () => {
  const original = await vi.importActual('wagmi');
  return {
    ...original,
    useAccount: vi.fn(() => ({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      isConnecting: false,
    })),
    useConnect: vi.fn(() => ({
      connect: vi.fn(),
      connectors: [],
    })),
    useDisconnect: vi.fn(() => ({
      disconnect: vi.fn(),
    })),
    useNetwork: vi.fn(() => ({
      chain: { id: 1, name: 'Ethereum' },
      chains: [{ id: 1, name: 'Ethereum' }],
    })),
    useSwitchNetwork: vi.fn(() => ({
      switchNetwork: vi.fn(),
    })),
  };
});

// Mock for @reown/appkit
vi.mock('@reown/appkit', () => ({
  useAppKit: vi.fn(() => ({
    isConnected: true,
    address: '0x1234567890123456789012345678901234567890',
    chainId: 1,
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

// Mock for @tanstack/react-query
vi.mock('@tanstack/react-query', async () => {
  const original = await vi.importActual('@tanstack/react-query');
  return {
    ...original,
    useQuery: vi.fn((...args) => original.useQuery(...args)),
    useMutation: vi.fn((...args) => original.useMutation(...args)),
  };
});
