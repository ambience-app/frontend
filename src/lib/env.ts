import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
  // Required environment variables
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().min(1, {
    message: 'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required',
  }),
  NEXT_PUBLIC_NETWORK: z.enum(['mainnet', 'testnet', 'local'] as const).default('mainnet'),
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

// Function to validate environment variables
export function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const { fieldErrors } = error.flatten();
      const errorMessage = Object.entries(fieldErrors)
        .map(([field, errors]) => 
          `- ${field}: ${errors?.join(', ')}`
        )
        .join('\n');
      
      throw new Error(`❌ Invalid environment variables:\n${errorMessage}`);
    }
    throw error;
  }
}

// Validate environment variables on application start
const env = validateEnv();

// Export the validated environment variables
export default env;

// Export the type for type safety
export type Env = z.infer<typeof envSchema>;
