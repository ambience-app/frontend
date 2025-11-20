import React from 'react';
import { CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Address } from 'viem';
import { formatAddress } from '@/lib/utils';

/**
 * TransactionToast component
 *
 * Displays a toast notification for blockchain transactions,
 * showing different statuses and providing a way to dismiss the toast.
 *
 * @component
 * @param {TransactionToastProps} props - Component props.
 * @param {TransactionStatus} props.status - The current status of the transaction.
 * @param {Address} [props.hash] - The transaction hash.
 * @param {string} [props.message] - The message to display.
 * @param {string} [props.description] - The description to display.
 * @param {() => void} [props.onDismiss] - The function to call when the toast is dismissed.
 * @param {string} [props.className] - The class name to apply to the toast.
 * @returns {JSX.Element} A toast notification for blockchain transactions.
 */

type TransactionStatus = 'pending' | 'success' | 'error' | 'confirming';

interface TransactionToastProps {
  status: TransactionStatus;
  hash?: Address;
  message?: string;
  description?: string;
  onDismiss?: () => void;
  className?: string;
}

export const TransactionToast: React.FC<TransactionToastProps> = ({
  status,
  hash,
  message,
  description,
  onDismiss,
  className,
}) => {
  const statusConfig = {
    pending: {
      icon: <Loader2 className="h-5 w-5 animate-spin text-amber-500" />,
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-800 dark:text-amber-200',
      defaultMessage: 'Transaction in progress',
    },
    confirming: {
      icon: <Loader2 className="h-5 w-5 animate-spin text-blue-500" />,
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      defaultMessage: 'Waiting for confirmation',
    },
    success: {
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      defaultMessage: 'Transaction successful',
    },
    error: {
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      defaultMessage: 'Transaction failed',
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const displayMessage = message || config.defaultMessage;

  return (
    <div
      className={cn(
        'w-full max-w-sm overflow-hidden rounded-lg border shadow-lg',
        config.bg,
        config.border,
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            {config.icon}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-medium ${config.text}`}>
              {displayMessage}
            </p>
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
            {hash && (
              <div className="mt-2">
                <a
                  href={`https://etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View on Etherscan: {formatAddress(hash)}
                </a>
              </div>
            )}
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              type="button"
              className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={onDismiss}
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const showTransactionToast = (
  status: TransactionStatus,
  options: Omit<TransactionToastProps, 'status'> & { duration?: number } = {}
) => {
  const { duration = 5000, ...rest } = options;
  
  return toast.custom(
    (t) => (
      <TransactionToast
        status={status}
        {...rest}
        onDismiss={() => {
          toast.dismiss(t);
          rest.onDismiss?.();
        }}
      />
    ),
    {
      duration: status === 'success' ? duration : status === 'error' ? 10000 : Infinity,
      position: 'top-right',
    }
  );
};

export const showTransactionProgress = (
  hash: Address,
  options: { onSuccess?: () => void; onError?: (error: Error) => void } = {}
) => {
  const toastId = showTransactionToast('pending', {
    message: 'Transaction submitted',
    description: 'Waiting for confirmation...',
    hash,
  });

  // In a real app, you would listen for transaction events here
  // This is a simplified example
  const checkTransaction = async () => {
    try {
      // Simulate transaction confirmation
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Show success
      showTransactionToast('success', {
        message: 'Transaction confirmed!',
        hash,
        onDismiss: options.onSuccess,
      });
    } catch (error) {
      showTransactionToast('error', {
        message: 'Transaction failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        hash,
        onDismiss: () => options.onError?.(error as Error),
      });
    } finally {
      toast.dismiss(toastId);
    }
  };

  checkTransaction();
  return toastId;
};
