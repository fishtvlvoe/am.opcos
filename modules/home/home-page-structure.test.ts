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

	it("首頁提供 AnnouncementBanner 使用手冊連結", () => {
		const source = read(filePath);
		expect(source).toContain('<AnnouncementBanner helpUrl="#" />');
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

	it("首頁不渲染 Breadcrumb", () => {
		const source = read(filePath);
		expect(source).not.toContain("function Breadcrumb");
		expect(source).not.toContain("<Breadcrumb />");
	});

	it("日期 Tab 使用中文上架格式", () => {
		const source = read(filePath);
		expect(source).toContain("date-fns");
		expect(source).toContain("M月d日上架");
		expect(source).not.toContain("{date.display}");
	});

	it("商品系列的查看更多在標題列右側並連到搜尋頁", () => {
		const source = read(filePath);
		expect(source).toContain('href="/search"');
		expect(source).toContain("» 查看更多");
		expect(source).not.toContain("查看更多 »");
	});

	it("首頁使用 source banner feed 驅動三欄 FranchiseBanner", () => {
		const source = read(filePath);
		expect(source).toContain("FranchiseBanner");
		expect(source).toContain("getBanners");
		expect(source).toContain("sourceBannerItems");
		expect(source).not.toContain("franchiseQuery");
		expect(source).not.toContain("function BannerCarousel");
		expect(source).not.toContain("<BannerCarousel />");
		expect(source).not.toContain("useEmblaCarousel");
		expect(source).not.toContain("Autoplay");
	});
});
