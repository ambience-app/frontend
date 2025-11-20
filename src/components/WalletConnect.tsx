"use client";

import { useAppKitAccount, useAppKit } from "@reown/appkit/react";
import { useDisconnect } from "@reown/appkit/react";
import { useWalletInfo } from "@reown/appkit/react";
import { useAccount, useDisconnect as useWagmiDisconnect } from "wagmi";
import { Wallet, ChevronDown, LogOut, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

/**
 * WalletConnect component
 *
 * A component that displays a wallet connection button and dropdown menu.
 * It uses the AppKit and Wagmi libraries to manage wallet connections.
 *
 * @component
 * @returns {JSX.Element} A wallet connection button and dropdown menu.
 */

export default function WalletConnect() {
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false); // 🟢 NEW: Loading state
  const [isDisconnecting, setIsDisconnecting] = useState(false); // optional future UX polish

  // AppKit hooks
  const { address: appkitAddress, isConnected: appkitIsConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const { walletInfo } = useWalletInfo();
  const { disconnect: appkitDisconnect } = useDisconnect();

  // Wagmi hooks
  const { address: wagmiAddress, isConnected: wagmiIsConnected, connector } = useAccount();
  const { disconnect: wagmiDisconnect } = useWagmiDisconnect();

  const address = appkitAddress || wagmiAddress;
  const isConnected = appkitIsConnected || wagmiIsConnected;

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
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest("[data-wallet-dropdown]")) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) {
    return (
      <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-medium">
        Connect Wallet
      </button>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className={`px-6 py-2 flex items-center gap-2 rounded-full font-medium text-white transition-all duration-200 ${
          isConnecting
            ? "bg-blue-400 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:scale-105"
        }`}
      >
        {isConnecting ? (
          <>
            {/* Spinner */}
            <svg
              className="animate-spin h-5 w-5 text-white"
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
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </>
        )}
      </button>
    );
  }

  return (
    <div className="relative" data-wallet-dropdown>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-full px-4 py-2 hover:shadow-lg transition-all duration-200 border border-slate-200 dark:border-slate-700"
      >
        <span className="font-medium text-sm">{truncateAddress(address)}</span>
        <div className="flex items-center">{getWalletIcon()}</div>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl z-50 border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              {getWalletIcon()}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                  {getWalletName()}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {truncateAddress(address)}
                </p>
              </div>
            </div>
          </div>
          <div className="p-2">
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
