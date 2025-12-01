# Ambience Chat dApp

A decentralized, blockchain-based chat application built on Base blockchain that enables secure, transparent, and censorship-resistant communication. All messages are stored onchain, ensuring immutability and verifiability.

## 🚀 Quick Start

Get started with Ambience Chat in minutes:

```bash
# Clone the repository
git clone https://github.com/ambience-app/frontend.git
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser to see the app running.

## 📋 Prerequisites

- Node.js 20.x or higher
- npm (v7+) or yarn (v1.22+)
- Git
- Web3 wallet (MetaMask, Coinbase Wallet, etc.)
- Test ETH on Base Sepolia (for testing)

## 🔧 Environment Setup

1. Create a `.env.local` file in the root directory with the following variables:

```env
# Required
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Optional (with defaults)
NEXT_PUBLIC_CHAIN_ID=84532  # Base Sepolia testnet
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_APP_NAME=Ambience Chat
```

2. Get your Alchemy API key from [Alchemy](https://www.alchemy.com/)
3. Get your WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)

## 🛠 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

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
- **The Graph** - Indexing and querying blockchain data (optional)

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

## 🏗 Project Structure

```
frontend/
├── src/                    # Source code
│   ├── app/               # Next.js app directory (pages)
│   ├── components/        # Reusable UI components
│   ├── context/           # React context providers
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions and config
│   └── styles/            # Global styles
├── public/                # Static assets
├── contracts/             # Smart contracts
├── tests/                 # Test files
└── docs/                  # Documentation
```


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