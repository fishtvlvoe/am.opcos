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

	it("包含 SeriesCard 元件引用或 series 分組邏輯", () => {
		const source = read(filePath);
		const hasSeriesCard =
			source.includes("SeriesCard") || source.includes("series");
		expect(hasSeriesCard).toBe(true);
	});

	it("包含 group by 邏輯（group、reduce 或 Map）", () => {
		const source = read(filePath);
		const hasGroupBy =
			source.includes("group") ||
			source.includes("reduce") ||
			source.includes("Map");
		expect(hasGroupBy).toBe(true);
	});

	it("包含 3 圖 banner grid 佈局（grid-cols-3）", () => {
		const source = read(filePath);
		expect(source).toContain("grid-cols-3");
	});
});
