# Ambience Chat dApp

A decentralized, blockchain-based chat application built on Base blockchain that enables secure, transparent, and censorship-resistant communication. All messages are stored onchain, ensuring immutability and verifiability.

## Overview

This project demonstrates how to build a fully onchain messaging platform where:
- All chat messages are stored directly on the blockchain
- Users authenticate with their Web3 wallets
- Messages are immutable and permanently recorded
- Chat history is transparent and verifiable by anyone
- No centralized servers control the data

## Features

- **Wallet Authentication**: Connect with MetaMask, Coinbase Wallet, WalletConnect, and other Web3 wallets
- **Onchain Messages**: All messages stored directly on Base blockchain
- **Real-time Updates**: Live chat interface with automatic message updates
- **User Profiles**: Onchain identity management with ENS/Basename support
- **Message History**: Browse complete immutable chat history
- **Gas Optimization**: Efficient smart contract design to minimize transaction costs
- **Responsive Design**: Mobile-first UI that works across all devices
- **Message Encryption**: Optional end-to-end encryption for private messages
- **Room/Channel Support**: Create and join different chat rooms
- **Moderation Tools**: Decentralized moderation mechanisms

## Tech Stack

### Frontend
- **Next.js 16** - React framework for production
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first CSS framework
- **Wagmi** - React hooks for Ethereum (to be added)
- **Viem** - TypeScript Ethereum interface (to be added)
- **RainbowKit/ConnectKit** - Wallet connection UI (to be added)

### Blockchain
- **Base Blockchain** - Layer 2 network built on Optimism
- **Solidity** - Smart contract development
- **Foundry/Hardhat** - Smart contract development framework
- **The Graph** - Indexing and querying blockchain data 

## Architecture

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
└────────┬────────┘
         │
         ├─── Web3 Provider (Wagmi/Viem)
         │
┌────────▼────────┐
│  Smart Contract │
│   (Solidity)    │
└────────┬────────┘
         │
┌────────▼────────┐
│  Base Blockchain│
│   (L2 Network)  │
└─────────────────┘
```

## Prerequisites

- Node.js 20.x or higher
- npm/yarn/pnpm/bun package manager
- MetaMask or compatible Web3 wallet
- Base Sepolia testnet ETH (for testing)
- Git


### Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── page.tsx           # Homepage
│   │   ├── chat/              # Chat interface
│   │   ├── rooms/             # Room management
│   │   └── profile/           # User profile
│   ├── components/            # React components
│   │   ├── Chat/              # Chat-related components
│   │   ├── Wallet/            # Wallet connection
│   │   └── UI/                # Common UI components
│   ├── hooks/                 # Custom React hooks
│   │   ├── useContract.ts     # Contract interaction hook
│   │   ├── useMessages.ts     # Message management
│   │   └── useProfile.ts      # User profile hook
│   ├── lib/                   # Utility functions
│   │   ├── contract.ts        # Contract ABI and config
│   │   ├── wagmi.ts           # wagmi configuration
│   │   └── utils.ts           # Helper functions
│   ├── types/                 # TypeScript type definitions
│   └── styles/                # Global styles
├── contracts/                 # Smart contracts (Solidity)
│   ├── src/
│   │   ├── ChatContract.sol   # Main chat contract
│   │   └── interfaces/        # Contract interfaces
│   ├── test/                  # Contract tests
│   └── script/                # Deployment scripts
├── public/                    # Static assets
└── config files               # Configuration files
```

### Key Components

- **ChatRoom**: Main chat interface with message display and input
- **MessageList**: Displays messages with sender info and timestamps
- **WalletConnect**: Wallet connection and authentication
- **RoomSelector**: Browse and join different chat rooms
- **UserProfile**: Display and edit user profile information