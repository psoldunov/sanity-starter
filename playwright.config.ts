import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end specs for complex functionality only: forms, search, filters,
 * multi-step flows, anything that sends data. `.agents/rules/testing.md` says
 * what qualifies; appearance is never asserted here.
 *
 * No `webServer` on purpose: the specs run against a server that is already up
 * (`bun dev`, a preview deployment), named by `E2E_BASE_URL`.
 */
export default defineConfig({
	testDir: './tests/e2e',
	forbidOnly: !!process.env.CI,
	use: {
		baseURL:
			process.env.E2E_BASE_URL ??
			`http://localhost:${process.env.PORT ?? 3000}`,
		trace: 'retain-on-failure',
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
