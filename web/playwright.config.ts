import { defineConfig } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

mkdirSync('.test-artifacts', { recursive: true });
export default defineConfig({
  testDir: './tests',
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: [['list'], ['json', { outputFile: '.test-artifacts/results.json' }]],
  use: { baseURL: 'http://127.0.0.1:13000', browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'go run ./cmd/server', cwd: '../api',
      url: 'http://127.0.0.1:18080/health', timeout: 120_000,
      reuseExistingServer: false,
      env: { PORT: '18080', DATABASE_URL: `sqlite:${path.resolve('.test-artifacts/ui.db')}`, JWT_SECRET: 'local-ui-test-only' },
    },
    {
      command: 'npm run dev -- --hostname 127.0.0.1 --port 13000',
      url: 'http://127.0.0.1:13000', timeout: 120_000,
      reuseExistingServer: false,
      env: { NEXT_PUBLIC_API_URL: 'http://127.0.0.1:18080', NEXT_TELEMETRY_DISABLED: '1', INKWELL_UI_TEST: '1' },
    },
  ],
});
