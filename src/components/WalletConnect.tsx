"use client";

import { useState, useEffect, useMemo } from "react";
import { useAppKitAccount, useAppKit, useWalletInfo, useDisconnect } from "@reown/appkit/react";
import { useAccount, useDisconnect as useWagmiDisconnect } from "wagmi";
import { base, celo, baseSepolia, celoSepolia } from "@reown/appkit/networks";
import { Wallet, ChevronDown, LogOut, Copy, Check, Loader2, WifiOff } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useNameService } from "@/hooks/useNameService";
import { truncateAddress } from "@/lib/utils";

// Environment detection
const isMainnet = process.env.NEXT_PUBLIC_NETWORK === 'mainnet';

// Supported networks based on environment
const SUPPORTED_NETWORKS = isMainnet 
  ? [base, celo] 
  : [baseSepolia, celoSepolia];

// Wallet connection status type
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'wrong_network';

/**
 * WalletConnect Component
 * 
 * Handles wallet connection, network switching, and displays wallet information.
 * Uses Reown AppKit for wallet management and provides a clean UI for connection states.
 */

export default function WalletConnect() {
  // State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [displayName, setDisplayName] = useState<string>('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // AppKit hooks
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const { walletInfo } = useWalletInfo();
  const { disconnect: appkitDisconnect } = useDisconnect();
  
  // Wagmi hooks as fallback
  const { address: wagmiAddress, isConnected: wagmiIsConnected, connector } = useAccount();
  const { disconnect: wagmiDisconnect } = useWagmiDisconnect();
  
  // Use AppKit values first, fallback to Wagmi
  const effectiveAddress = address || wagmiAddress;
  const effectiveIsConnected = isConnected || wagmiIsConnected;
  
  // Name service for ENS resolution
  const { lookupAddress } = useNameService();

  // Check if connected to a supported network
  const isWrongNetwork = useMemo(() => {
    if (!walletInfo?.chainId) return false;
    return !SUPPORTED_NETWORKS.some(network => network.chainId === walletInfo.chainId);
  }, [walletInfo?.chainId]);

  // Update display name when address changes
  useEffect(() => {
    const updateDisplayInfo = async () => {
      if (effectiveAddress) {
        try {
          const { name, avatar } = await lookupAddress(effectiveAddress);
          setDisplayName(name || truncateAddress(effectiveAddress));
          setAvatar(avatar);
        } catch (error) {
          console.error('Error looking up address:', error);
          setDisplayName(truncateAddress(effectiveAddress));
          setAvatar(null);
        }
      } else {
        setDisplayName('');
        setAvatar(null);
      }
    };
    
    updateDisplayInfo();
  }, [effectiveAddress, lookupAddress]);
  
  // Get wallet icon
  const getWalletIcon = () => {
    if (walletInfo?.icon) {
      return (
        <Image
          src={walletInfo.icon}
          alt={walletInfo.name || 'Wallet'}
          width={20}
          height={20}
          className="w-5 h-5 rounded-full"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      );
    }
    
    if (connector?.icon) {
      return (
        <Image
          src={connector.icon}
          alt={connector.name || 'Wallet'}
          width={20}
          height={20}
          className="w-5 h-5 rounded-full"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      );
    }
    
    return <Wallet className="w-5 h-5" />;
  };

  // Update display name when address changes
  useEffect(() => {
    const updateDisplayInfo = async () => {
      if (address) {
        const { name, avatar } = await lookupAddress(address);
        setDisplayName(name || truncateAddress(address));
        setAvatar(avatar);
      } else {
        setDisplayName(null);
        setAvatar(null);
      }
    };
    
    updateDisplayInfo();
  }, [address, lookupAddress]);

  useEffect(() => setMounted(true), []);

  const truncateAddress = (addr: string | undefined) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  const getWalletIcon = () => {
    const sanitizeImageUrl = (url: string) => {
      if (!url) return null;
      try {
        const trimmedUrl = url.trim();
        if (trimmedUrl.startsWith("data:")) return trimmedUrl;
        new URL(trimmedUrl);
        return trimmedUrl;
      } catch {
        console.warn("Invalid wallet icon URL:", url);
        return null;
      }
    };

    if (walletInfo?.icon) {
      const sanitizedUrl = sanitizeImageUrl(walletInfo.icon);
      if (sanitizedUrl) {
        return (
          <Image
            src={sanitizedUrl}
            alt={walletInfo.name || "Wallet"}
            width={20}
            height={20}
            className="w-5 h-5 rounded-full"
            onError={(e) => {
              (e.currentTarget.style.display = "none");
            }}
            unoptimized
          />
        );
      }
    }

    if (connector?.icon) {
      const sanitizedUrl = sanitizeImageUrl(connector.icon);
      if (sanitizedUrl) {
        return (
          <Image
            src={sanitizedUrl}
            alt={connector.name || "Wallet"}
            width={20}
            height={20}
            className="w-5 h-5 rounded-full"
            onError={(e) => {
              (e.currentTarget.style.display = "none");
            }}
            unoptimized
          />
        );
      }
    }

    return <Wallet className="w-5 h-5" />;
  };

  const getWalletName = () => walletInfo?.name || connector?.name || "Connected Wallet";

  // 🟢 UPDATED: show spinner & disable button during connect
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await open();
    } catch (error: unknown) {
      console.error("Connection error:", error instanceof Error ? error.message : String(error));
    } finally {
      setIsConnecting(false);
    }
  };

  // Optional disconnect loading
  const handleDisconnect = async () => {
    setIsDropdownOpen(false);
    setIsDisconnecting(true);
    try {
      if (appkitIsConnected) {
        await appkitDisconnect();
      }
      if (wagmiIsConnected) {
        await wagmiDisconnect();
      }
    } catch (error: unknown) {
      console.error("Disconnect error:", error instanceof Error ? error.message : String(error));
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleCopyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        toast.success('Address copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy address:', err);
        toast.error('Failed to copy address');
      }
    }
  };

  // Example function to create a new chat room
  const handleCreateRoom = async () => {
    if (!address) return;
    
    try {
      const roomName = `Room ${Math.floor(Math.random() * 1000)}`;
      const txHash = await createRoom(roomName, false);
      
      if (txHash) {
        setLastTxHash(txHash);
        toast.success(`Creating room: ${roomName}`);
      }
    } catch (err) {
      console.error('Failed to create room:', err);
      toast.error('Failed to create room');
    }
  };

  // Handle transaction status changes
  useEffect(() => {
    if (isPending) {
      setShowTxStatus(true);
      toast.loading('Transaction pending...');
    }

    if (isConfirmed) {
      setShowTxStatus(false);
      toast.success('Transaction confirmed!');
    }

    if (isContractError && contractError) {
      setShowTxStatus(false);
      toast.error(`Transaction failed: ${contractError}`);
    }
  }, [isPending, isConfirmed, isContractError, contractError]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const dropdown = document.querySelector('[data-wallet-dropdown]');
      
      // Check if click is outside the dropdown and the dropdown is open
      if (dropdown && !dropdown.contains(target) && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    // Use capture phase to catch events before they bubble up
    document.addEventListener('mousedown', handleClickOutside, true);
    
    // Cleanup function to remove the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isDropdownOpen]);

  // Handle wallet connection
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await open();
      // No need for success toast as AppKit handles its own UI
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle network switching
  const handleSwitchNetwork = async () => {
    try {
      await open('network');
      // AppKit will handle the network switching UI
    } catch (error) {
      console.error('Network switch error:', error);
      toast.error('Failed to switch network');
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    try {
      if (isConnected) {
        await appkitDisconnect();
      } else if (wagmiIsConnected) {
        await wagmiDisconnect();
      }
      toast.success('Wallet disconnected');
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect wallet');
    }
  };

  // Handle address copy
  const handleCopyAddress = async () => {
    if (!effectiveAddress) return;
    
    try {
      await navigator.clipboard.writeText(effectiveAddress);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
      toast.error('Failed to copy address');
    }
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const dropdown = document.querySelector('[data-wallet-dropdown]');
      
      if (dropdown && !dropdown.contains(target) && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isDropdownOpen]);

  // Render connect button when not connected
  if (!effectiveIsConnected) {
    return (
      <div className="relative" data-wallet-dropdown>
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className={`px-6 py-2 flex items-center gap-2 rounded-full font-medium text-white transition-all duration-200 ${
            isConnecting
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:scale-105'
          }`}
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </>
          )}
        </button>
      </div>
    );
  }

  // Render connected wallet state
  return (
    <div className="relative" data-wallet-dropdown>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-full px-4 py-2 hover:shadow-lg transition-all duration-200 border ${
          isWrongNetwork 
            ? 'border-red-500 dark:border-red-500/50' 
            : 'border-slate-200 dark:border-slate-700'
        }`}
      >
        {isWrongNetwork && (
          <span className="w-2 h-2 rounded-full bg-red-500 mr-1" />
        )}
        <span className="font-medium text-sm">
          {isWrongNetwork ? 'Wrong Network' : displayName}
        </span>
        {avatar ? (
          <img 
            src={avatar} 
            alt="Profile" 
            className="w-5 h-5 rounded-full ml-2"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="flex items-center ml-2">
            {getWalletIcon()}
          </div>
        )}
        <ChevronDown className="w-4 h-4 ml-1" />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl z-50 border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Network status */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {isWrongNetwork ? (
                  <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/30">
                    <WifiOff className="w-4 h-4 text-red-500" />
                  </div>
                ) : (
                  <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30">
                    <div className="w-4 h-4 rounded-full bg-green-500" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    {isWrongNetwork ? 'Wrong Network' : (walletInfo?.chainName || 'Unknown Network')}
                  </p>
                  {isWrongNetwork && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      Unsupported
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {walletInfo?.chainId ? `Chain ID: ${walletInfo.chainId}` : 'Not connected'}
                </p>
              </div>
            </div>
          </div>

          {/* Account info */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt="" 
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm">
                  {effectiveAddress?.slice(2, 4).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                  {displayName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {truncateAddress(effectiveAddress || '')}
                  </p>
                  <button 
                    onClick={handleCopyAddress}
                    className="text-slate-400 hover:text-blue-500 transition-colors"
                    aria-label="Copy address"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-2 space-y-1">
            {/* Switch Network Button */}
            {isWrongNetwork && (
              <button
                onClick={handleSwitchNetwork}
                className="w-full flex items-center gap-2 p-2.5 text-sm font-medium rounded-lg text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                <WifiOff className="w-4 h-4" />
                Switch Network
              </button>
            )}
            
            {/* View on Explorer */}
            <a
              href={`https://${isMainnet ? '' : 'sepolia.'}basescan.org/address/${effectiveAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2.5 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              View on Explorer
            </a>
            
            {/* Disconnect Button */}
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-2 p-2.5 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Disconnect Wallet
            </button>
                ) : (
                  'Create Chat Room'
                )}
              </button>
            </div>

            {/* Account Actions */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-1">
              <p className="text-xs text-slate-500 dark:text-slate-400 px-2 mb-1">Account</p>
              <button
                onClick={handleCopyAddress}
                className="w-full flex items-center gap-3 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Address
                  </>
                )}
              </button>
            <a
              href={`https://basescan.org/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              View on Explorer
            </a>
            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mt-1 ${
                isDisconnecting
                  ? "cursor-not-allowed opacity-70 bg-red-100 dark:bg-red-900/20 text-red-500"
                  : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              }`}
            >
              {isDisconnecting ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4 text-red-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  Disconnecting...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  Disconnect
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
