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

	it("首頁依照 anismile.jp 結構顯示 Series 分組卡", () => {
		const source = read(filePath);
		expect(source).toContain("getSeriesList");
		expect(source).toContain("SeriesCard");
		expect(source).toContain("商品系列");
	});

	it("首頁 banner 使用原站 banner API，不依賴商品卡替代", () => {
		const source = read(filePath);
		expect(source).toContain("getBanners");
		expect(source).toContain("BannerCarousel");
	});
});
