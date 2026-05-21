import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

// 紅燈測試 — 元件尚未實作
describe("SeriesDetailPage 系列詳情頁結構契約", () => {
	it("檔案存在且可讀", () => {
		const source = read(
			"apps/anismile/modules/catalog/SeriesDetailPage.tsx",
		);
		expect(source.length).toBeGreaterThan(0);
	});

	it("引用 FeaturedCarousel 輪播元件", () => {
		const source = read(
			"apps/anismile/modules/catalog/SeriesDetailPage.tsx",
		);
		expect(source).toContain("FeaturedCarousel");
	});

	it("引用 ToolbarRow 工具列元件", () => {
		const source = read(
			"apps/anismile/modules/catalog/SeriesDetailPage.tsx",
		);
		expect(source).toContain("ToolbarRow");
	});

	it("包含 orpc API 串接", () => {
		const source = read(
			"apps/anismile/modules/catalog/SeriesDetailPage.tsx",
		);
		expect(source).toContain("orpc");
	});

	it("包含 CSV 下載（Blob 建構）", () => {
		const source = read(
			"apps/anismile/modules/catalog/SeriesDetailPage.tsx",
		);
		const hasCsvExport =
			source.includes("Blob") ||
			source.includes("blob") ||
			source.includes("createObjectURL");
		expect(hasCsvExport).toBe(true);
	});

	it("包含卡片與表格雙模式切換邏輯", () => {
		const source = read(
			"apps/anismile/modules/catalog/SeriesDetailPage.tsx",
		);
		const hasGridMode =
			source.includes("grid") || source.includes("card") || source.includes("Grid");
		const hasTableMode =
			source.includes("table") || source.includes("Table");
		expect(hasGridMode).toBe(true);
		expect(hasTableMode).toBe(true);
	});
});
