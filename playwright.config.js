// Playwright config — browser smoke against live bleu.live (Mission 8.1).
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/browser',
  timeout: 90000,            // streaming chat + OpenAI latency
  expect: { timeout: 45000 },
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'https://bleu.live',
    headless: true,
    actionTimeout: 30000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
});
