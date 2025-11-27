import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
// No need to import defineBrowser, using direct configuration

const dirname = typeof __dirname !== 'undefined' 
  ? __dirname 
  : path.dirname(fileURLToPath(import.meta.url));

const setupFile = path.join(dirname, 'vitest.setup.ts');
const coverageDir = path.join(dirname, 'coverage');

// Common test configuration
const commonTestConfig = {
  globals: true,
  environment: 'jsdom',
  setupFiles: [setupFile],
  clearMocks: true,
  mockReset: true,
  restoreMocks: true,
  coverage: {
    provider: 'v8' as const,
    reporter: ['text', 'json', 'html'],
    reportsDirectory: coverageDir,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.next/**',
      '**/.storybook/**',
      '**/*.stories.*',
      '**/__tests__/utils/**',
      '**/types/**',
      '**/types/**/*',
    ],
    thresholds: {
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
};

// Unit tests configuration
const unitTestConfig = {
  ...commonTestConfig,
  name: 'unit',
  include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  exclude: [
    ...(configDefaults.exclude || []),
    '**/e2e/**',
    '**/playwright-tests/**',
    '**/*.e2e.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
  ],
  environment: 'jsdom',
  deps: {
    inline: ['lucide-react', '@testing-library/user-event'],
  },
  watchExclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
};

// E2E tests configuration
const e2eTestConfig = {
  ...commonTestConfig,
  name: 'e2e',
  include: ['**/e2e/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  environment: 'jsdom',
  browser: {
    enabled: true,
    headless: true,
    name: 'chromium' as const,
    provider: 'playwright' as const,
  },
  setupFiles: [path.join(dirname, 'vitest.e2e.setup.ts')],
};

// Storybook tests configuration
const storybookTestConfig = {
  ...commonTestConfig,
  name: 'storybook',
  include: ['**/*.stories.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  browser: {
    enabled: true,
    headless: true,
    name: 'chromium' as const,
    provider: 'playwright' as const,
  },
  setupFiles: [path.join(dirname, '.storybook/vitest.setup.ts')],
};

export default defineConfig({
  plugins: [react()],
  test: {
    ...commonTestConfig,
    environment: 'jsdom',
    globals: true,
    setupFiles: [setupFile],
    coverage: commonTestConfig.coverage,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
