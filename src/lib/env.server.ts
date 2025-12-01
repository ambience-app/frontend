import { validateEnv } from './env';

// This file is used to validate environment variables during the Next.js build process
// It will throw an error if any required environment variables are missing or invalid

try {
  // This will validate environment variables when this module is imported
  validateEnv();
  console.log('✅ Environment variables are valid');
} catch (error) {
  console.error('❌ Invalid environment variables:');
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('Unknown error validating environment variables');
  }
  // Exit with error code 1 to fail the build
  process.exit(1);
}
