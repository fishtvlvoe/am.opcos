import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	reporter: [["list"]],
	use: {
		baseURL: "http://localhost:3001",
		trace: "on-first-retry",
		viewport: { width: 1366, height: 900 },
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: {
		command: "ANISMILE_VISUAL_TEST_BYPASS_AUTH=1 pnpm --filter anismile dev",
		url: "http://localhost:3001",
		reuseExistingServer: false,
		timeout: 180 * 1000,
	},
});
