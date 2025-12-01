import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { cn } from '../../lib/utils';

interface ProfileAddressProps {
  address: string;
  ensName?: string;
  className?: string;
  showCopy?: boolean;
  truncate?: boolean;
}

export function ProfileAddress({ 
  address, 
  ensName, 
  className = '',
  showCopy = true,
  truncate = true
}: ProfileAddressProps) {
  const { isCopied, copy } = useCopyToClipboard();
  
  const displayAddress = truncate 
    ? `${address.slice(0, 6)}...${address.slice(-4)}` 
    : address;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="font-mono text-sm text-muted-foreground">
        {ensName || displayAddress}
      </span>
      {showCopy && (
        <button
          onClick={() => copy(address)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title={isCopied ? 'Copied!' : 'Copy address'}
          disabled={isCopied}
        >
          {isCopied ? '✅' : '📋'}
        </button>
      )}
    </div>
  );
}
