import { render, screen } from '../test-utils';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit';

// Mock the hooks
vi.mock('wagmi');
vi.mock('@reown/appkit');

describe('Example Test', () => {
  beforeEach(() => {
    // Set up mock implementations
    (useAccount as jest.Mock).mockReturnValue({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
    });

    (useAppKit as jest.Mock).mockReturnValue({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
      chainId: 1,
    });
  });

  it('renders without crashing', () => {
    render(<div>Test Component</div>);
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });
});
