# 1. Use Reown AppKit for Wallet Authentication

- **Status**: Accepted
- **Date**: 2025-11-21

## Context
We needed a robust solution for handling wallet authentication and interactions with the Ethereum blockchain in our Next.js application. Several options were considered including direct Web3.js/Ethers.js implementations, third-party auth providers, and various wallet connection libraries.

## Decision
We chose to use Reown AppKit for the following reasons:
1. **Seamless Integration**: Provides a smooth integration with Next.js and React 19
2. **Wallet Agnostic**: Supports multiple wallet providers (MetaMask, WalletConnect, etc.)
3. **TypeScript Support**: First-class TypeScript support aligns with our tech stack
4. **Ease of Use**: Simplified API for common wallet operations
5. **Active Maintenance**: Actively maintained with regular updates

## Consequences
### Positive
- Faster development time for wallet-related features
- Consistent wallet connection experience
- Type safety for wallet interactions
- Easier testing with built-in testing utilities

### Negative
- Additional dependency to maintain
- Learning curve for the team
- Potential limitations if we need very specific wallet behaviors

### Neutral
- Requires proper error handling for wallet disconnections and network changes
