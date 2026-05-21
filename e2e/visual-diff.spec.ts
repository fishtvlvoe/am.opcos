import fs from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

type VisualCase = {
	name: "catalog" | "detail" | "cart" | "orders" | "admin" | "login";
	captureApp: (page: Page) => Promise<Buffer | null>;
	mockupPage?: "catalog" | "detail" | "cart" | "orders" | "admin";
};

const mockupFileUrl = "file:///tmp/anismile-mockups/index.html";
const reportPath = path.resolve(process.cwd(), "e2e/visual-diff-report.json");
const similarityThreshold = 0.9;
const mobileRoutes = [
	{ path: "/", readySelector: "h1" },
	{ path: "/cart", readySelector: "h1" },
	{ path: "/orders", readySelector: "h1" },
	{ path: "/admin", readySelector: "table" },
	{ path: "/login", readySelector: "form" },
];

const cases: VisualCase[] = [
	{
		name: "catalog",
		mockupPage: "catalog",
		captureApp: async (page) => {
			await page.goto("/");
			await page.waitForSelector("h1");
			return page.screenshot({ fullPage: true });
		},
	},
	{
		name: "detail",
		mockupPage: "detail",
		captureApp: async (page) => {
			await page.goto("/");
			const productLinks = page.locator('a[href^="/products/"]');
			if ((await productLinks.count()) === 0) {
				return null;
			}
			await productLinks.first().click();
			await page.waitForURL(/\/products\//);
			await page.waitForSelector("h1");
			return page.screenshot({ fullPage: true });
		},
	},
	{
		name: "cart",
		mockupPage: "cart",
		captureApp: async (page) => {
			await page.goto("/cart");
			await page.waitForSelector("h1");
			return page.screenshot({ fullPage: true });
		},
	},
	{
		name: "orders",
		mockupPage: "orders",
		captureApp: async (page) => {
			await page.goto("/orders");
			await page.waitForSelector("h1");
			return page.screenshot({ fullPage: true });
		},
	},
	{
		name: "admin",
		mockupPage: "admin",
		captureApp: async (page) => {
			await page.goto("/admin");
			await page.waitForSelector("table");
			return page.screenshot({ fullPage: true });
		},
	},
	{
		name: "login",
		captureApp: async (page) => {
			await page.goto("/login");
			await page.waitForSelector("form");
			return page.screenshot({ fullPage: true });
		},
	},
];

async function captureMockup(page: Page, mockupPage: NonNullable<VisualCase["mockupPage"]>) {
	await page.goto(mockupFileUrl);
	await page.waitForLoadState("domcontentloaded");
	await page.waitForSelector("#page-catalog");
	await page.evaluate((target) => {
		const fn = (window as unknown as { showPage?: (name: string) => void }).showPage;
		fn?.(target);
	}, mockupPage);
	return page.screenshot({ fullPage: true });
}

function compareBuffers(appImage: Buffer, mockImage: Buffer) {
	const appPng = PNG.sync.read(appImage);
	const mockPng = PNG.sync.read(mockImage);
	const width = Math.min(appPng.width, mockPng.width);
	const height = Math.min(appPng.height, mockPng.height);
	const appCropped = new PNG({ width, height });
	const mockCropped = new PNG({ width, height });
	PNG.bitblt(appPng, appCropped, 0, 0, width, height, 0, 0);
	PNG.bitblt(mockPng, mockCropped, 0, 0, width, height, 0, 0);
	const diff = new PNG({ width, height });
	const mismatchPixels = pixelmatch(appCropped.data, mockCropped.data, diff.data, width, height, {
		threshold: 0.1,
	});
	const totalPixels = width * height;
	const similarity = 1 - mismatchPixels / totalPixels;
	return { mismatchPixels, totalPixels, similarity };
}

test("visual consistency against mockup >= 90%", async ({ page }) => {
	const results: Array<{
		page: string;
		similarity: number;
		mismatchPixels: number;
		totalPixels: number;
		status: "pass" | "fail" | "mockup-missing";
	}> = [];

	for (const visualCase of cases) {
		const appImage = await visualCase.captureApp(page);
		if (!appImage) {
			results.push({
				page: visualCase.name,
				similarity: 0,
				mismatchPixels: 0,
				totalPixels: 0,
				status: "mockup-missing",
			});
			continue;
		}
		if (!visualCase.mockupPage) {
			results.push({
				page: visualCase.name,
				similarity: 0,
				mismatchPixels: 0,
				totalPixels: 0,
				status: "mockup-missing",
			});
			continue;
		}
		const mockImage = await captureMockup(page, visualCase.mockupPage);
		const compared = compareBuffers(appImage, mockImage);
		results.push({
			page: visualCase.name,
			similarity: Number(compared.similarity.toFixed(4)),
			mismatchPixels: compared.mismatchPixels,
			totalPixels: compared.totalPixels,
			status: compared.similarity >= similarityThreshold ? "pass" : "fail",
		});
	}

	fs.mkdirSync(path.dirname(reportPath), { recursive: true });
	fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), "utf8");

	const failed = results.filter((item) => item.status === "fail");
	expect(
		failed,
		`Visual diff report written to ${reportPath}\n${JSON.stringify(results, null, 2)}`,
	).toHaveLength(0);
});

test("mobile layout has no horizontal overflow", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 });

	for (const route of mobileRoutes) {
		await page.goto(route.path);
		await page.waitForSelector(route.readySelector);
		const hasOverflow = await page.evaluate(() => {
			return document.documentElement.scrollWidth > window.innerWidth;
		});
		expect(hasOverflow, `${route.path} has horizontal overflow at 375px`).toBe(false);
	}

	await page.goto("/");
	const productLinks = page.locator('a[href^="/products/"]');
	if ((await productLinks.count()) > 0) {
		await productLinks.first().click();
		await page.waitForURL(/\/products\//);
		await page.waitForSelector("h1");
		const detailHasOverflow = await page.evaluate(() => {
			return document.documentElement.scrollWidth > window.innerWidth;
		});
		expect(detailHasOverflow, "detail page has horizontal overflow at 375px").toBe(false);
	}
});
