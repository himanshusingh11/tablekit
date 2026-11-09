import { defineConfig } from '@playwright/test';

const port = Number(process.env.PORT ?? 5199);

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${port}`,
    // Locally use the installed Google Chrome; CI installs Playwright's Chromium.
    channel: process.env.CI ? undefined : 'chrome',
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: `pnpm exec vite --port ${port} --strictPort`,
    port,
    reuseExistingServer: true,
  },
});
