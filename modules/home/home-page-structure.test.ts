// 紅燈測試 — HomePage 結構即將重構，斷言新結構尚未實作
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("HomePage 頁面結構", () => {
	const filePath = "modules/home/HomePage.tsx";

	it("包含 AnnouncementBanner 元件引用", () => {
		const source = read(filePath);
		expect(source).toContain("AnnouncementBanner");
	});

	it("包含 CategoryNav 元件引用", () => {
		const source = read(filePath);
		expect(source).toContain("CategoryNav");
	});

	it("包含 DeadlineSection 元件引用", () => {
		const source = read(filePath);
		expect(source).toContain("DeadlineSection");
	});

	it("首頁最新區塊直接顯示商品卡，讓未登入客戶也能看到商品", () => {
		const source = read(filePath);
		expect(source).toContain("ProductCard");
		expect(source).toContain("最新商品");
	});

	it("包含 3 圖 banner grid 佈局（grid-cols-3）", () => {
		const source = read(filePath);
		expect(source).toContain("grid-cols-3");
	});
});
