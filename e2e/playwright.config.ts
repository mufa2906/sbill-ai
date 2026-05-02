import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off',
  },
  reporter: [['list']],
});
