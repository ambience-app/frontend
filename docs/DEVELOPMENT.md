# Development Guide

This guide provides detailed information for developers working on the Ambience Chat dApp.

## 🛠 Getting Started

### Prerequisites

- Node.js 20.x or later
- npm (v7+) or yarn (v1.22+)
- Git
- A Web3 wallet (MetaMask, Coinbase Wallet, etc.)
- Test ETH on Base Sepolia testnet

### Local Development

1. **Fork and clone** the repository
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Update the values in `.env.local` with your own.

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Project Structure

```
src/
├── app/                # Next.js app directory
│   ├── chat/          # Chat interface pages
│   ├── profile/       # User profile pages
│   └── rooms/         # Chat room management
├── components/        # Reusable UI components
│   ├── Chat/         # Chat-related components
│   ├── Wallet/       # Wallet connection UI
│   └── UI/           # Common UI components
├── context/          # React context providers
├── hooks/            # Custom React hooks
│   ├── useChat.ts    # Chat functionality
│   └── useWallet.ts  # Wallet connection logic
└── lib/              # Utility functions and config
    ├── contracts/    # Contract ABIs and addresses
    └── utils/        # Helper functions
```

## 🔗 Blockchain Integration

### Smart Contracts

- **Network**: Base Sepolia Testnet (Chain ID: 84532)
- **RPC URL**: `https://sepolia.base.org`

### Wallet Connection

We use [Wagmi](https://wagmi.sh/) and [ConnectKit](https://docs.family.co/connectkit) for wallet connection. The wallet connection is managed in `src/context/Web3Provider.tsx`.

### Interacting with Contracts

Use the `useContract` hook to interact with smart contracts:

```typescript
import { useContract } from '../lib/contracts';

function MyComponent() {
  const { contract } = useContract('ChatContract');
  
  const sendMessage = async (content: string) => {
    if (!contract) return;
    const tx = await contract.sendMessage(content);
    await tx.wait();
  };
  
  // ...
}
```

## 🧪 Testing

Run tests with:

```bash
npm test
```

### Testing Guidelines

- Write unit tests for all utility functions
- Add integration tests for complex components
- Test wallet interactions using `@testing-library/react`
- Use `vi` for mocking

## 🧹 Code Quality

- **Linting**: `npm run lint`
- **Formatting**: `npm run format`
- **Type Checking**: `npm run type-check`

## 🔄 Git Workflow

1. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes and commit them:
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```
3. Push your branch and open a pull request

### Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style/formatting
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

## 🚀 Deployment

The application is automatically deployed to Vercel on pushes to the `main` branch.

### Manual Deployment

1. Build the production version:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm start
   ```

## 🆘 Getting Help

If you need help or have questions:

1. Check the [documentation](https://github.com/ambience-app/frontend#readme)
2. Search the [issues](https://github.com/ambience-app/frontend/issues)
3. Open a new issue if your problem isn't addressed
