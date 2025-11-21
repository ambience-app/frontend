'use client';

import { toast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'loading';

interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useToasts = () => {
  const showToast = (
    type: ToastType,
    title: string,
    options: ToastOptions = {}
  ) => {
    const { description, duration = 5000, action } = options;

    const toastConfig = {
      duration,
      ...(action && { action }),
    };

    switch (type) {
      case 'success':
        return toast.success(title, {
          description,
          ...toastConfig,
        });
      case 'error':
        return toast.error(title, {
          description,
          ...toastConfig,
        });
      case 'info':
        return toast.info(title, {
          description,
          ...toastConfig,
        });
      case 'loading':
        return toast.loading(title, {
          description,
          ...toastConfig,
        });
      default:
        return toast(title, {
          description,
          ...toastConfig,
        });
    }
  };

  // Specific toast methods for common actions
  const transactionSubmitted = (txHash?: string) => {
    return showToast('loading', 'Transaction Submitted', {
      description: txHash
        ? `Transaction hash: ${txHash}`
        : 'Your transaction has been submitted',
      duration: 10000, // Longer duration for transactions
    });
  };

  const transactionConfirmed = (txHash?: string) => {
    toast.dismiss(); // Dismiss the loading toast if any
    return showToast('success', 'Transaction Confirmed', {
      description: txHash
        ? `Transaction hash: ${txHash}`
        : 'Your transaction has been confirmed',
    });
  };

  const transactionFailed = (error?: string) => {
    toast.dismiss(); // Dismiss the loading toast if any
    return showToast('error', 'Transaction Failed', {
      description: error || 'There was an error processing your transaction',
    });
  };

  const addressCopied = (address: string) => {
    return showToast('success', 'Address Copied', {
      description: `${address.substring(0, 6)}...${address.substring(address.length - 4)} copied to clipboard`,
      duration: 3000, // Shorter duration for copy actions
    });
  };

  const networkSwitched = (networkName: string) => {
    return showToast('info', 'Network Switched', {
      description: `Connected to ${networkName} network`,
    });
  };

  return {
    // Generic toast methods
    showToast,
    // Specific toast methods
    transactionSubmitted,
    transactionConfirmed,
    transactionFailed,
    addressCopied,
    networkSwitched,
    // Direct access to toast for advanced use cases
    toast: {
      ...toast,
      // Override dismiss to use our custom implementation
      dismiss: toast.dismiss,
      // Add our custom methods
      transactionSubmitted,
      transactionConfirmed,
      transactionFailed,
      addressCopied,
      networkSwitched,
    },
  };
};

export default useToasts;

// /*
// How to use toast in any components

// import { useToasts } from "@/hooks/use-toasts"

// function YourComponent() {
//   const {
//     transactionSubmitted,
//     transactionConfirmed,
//     transactionFailed,
//     addressCopied,
//     networkSwitched
//   } = useToasts()

//   // Example usage:
//   const handleTransaction = async () => {
//     const toastId = transactionSubmitted()
//     try {
//       // Your transaction logic here
//       // const tx = await sendTransaction(...)
//       transactionConfirmed(tx.hash)
//     } catch (error) {
//       transactionFailed(error.message)
//     }
//   }

//   // ... rest of your component
// }
// */

// /*
// You can also include more options in the toast methods to handle multiple states
// */
