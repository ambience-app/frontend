import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const setupFile = path.join(dirname, 'vitest.setup.ts');

const unitProject = {
  test: {
    name: 'unit',
    environment: 'jsdom',
    globals: true,
    setupFiles: [setupFile],
    deps: {
      inline: ['lucide-react'],
    },
  },
};

const storybookProject = {
  extends: true,
  plugins: [
    // The plugin will run tests for the stories defined in your Storybook config
    // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
    storybookTest({ configDir: path.join(dirname, '.storybook') }),
  ],
  test: {
    name: 'storybook',
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({}),
      instances: [{ browser: 'chromium' }],
    },
    setupFiles: [path.join(dirname, '.storybook/vitest.setup.ts')],
  },
};

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects: [unitProject, storybookProject],
  },
});
