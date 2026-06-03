import { defineConfig } from '@playwright/test';
import { join } from 'path';

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  timeout: 60000,
  retries: 1,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'tauri',
      use: {
        browserName: 'chromium',
      },
    },
  ],
  reporter: [
    ['list'],
    ['json', { outputFile: 'reports/test-results.json' }],
  ],
});
