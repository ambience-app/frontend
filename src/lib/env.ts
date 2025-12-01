import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
  // Required environment variables
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().min(1, {
    message: 'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required',
  }),
  NEXT_PUBLIC_NETWORK: z.enum(['mainnet', 'testnet', 'local'] as const, {
    errorMap: () => ({ message: 'NEXT_PUBLIC_NETWORK is required and must be one of: mainnet, testnet, local' }),
  }),
  NEXT_PUBLIC_CONTRACT_ADDRESS: z.string().min(1, {
    message: 'NEXT_PUBLIC_CONTRACT_ADDRESS is required',
  }),
  NEXT_PUBLIC_BASE_RPC_URL: z.string().url({
    message: 'NEXT_PUBLIC_BASE_RPC_URL must be a valid URL',
  }),
  NEXT_PUBLIC_GRAPH_API_URL: z.string().url({
    message: 'NEXT_PUBLIC_GRAPH_API_URL must be a valid URL',
  }),
  
  // Optional environment variables with defaults
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().default('ambience-chat.vercel.app'),
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

// Validate the environment variables
export const env = envSchema.parse({
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  NEXT_PUBLIC_NETWORK: process.env.NEXT_PUBLIC_NETWORK,
  NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  NEXT_PUBLIC_BASE_RPC_URL: process.env.NEXT_PUBLIC_BASE_RPC_URL,
  NEXT_PUBLIC_GRAPH_API_URL: process.env.NEXT_PUBLIC_GRAPH_API_URL,
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
  SENTRY_DSN: process.env.SENTRY_DSN,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

// Export the type for type safety
export type Env = z.infer<typeof envSchema>;
