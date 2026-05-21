import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

// 紅燈測試 — 元件尚未實作
describe("FeaturedCarousel 輪播元件結構契約", () => {
	it("檔案存在且可讀", () => {
		const source = read(
			"apps/anismile/modules/catalog/components/FeaturedCarousel.tsx",
		);
		expect(source.length).toBeGreaterThan(0);
	});

	it("包含 3 卡 grid 佈局", () => {
		const source = read(
			"apps/anismile/modules/catalog/components/FeaturedCarousel.tsx",
		);
		const hasGrid3 =
			source.includes("grid-cols-3") ||
			source.includes("perPage: 3") ||
			source.includes("perPage={3}") ||
			source.includes("slidesPerView: 3") ||
			source.includes("slidesPerView={3}");
		expect(hasGrid3).toBe(true);
	});

	it("包含分頁 dot 按鈕群組", () => {
		const source = read(
			"apps/anismile/modules/catalog/components/FeaturedCarousel.tsx",
		);
		expect(source).toContain("rounded-full");
	});

	it("包含左右箭頭導航圖示", () => {
		const source = read(
			"apps/anismile/modules/catalog/components/FeaturedCarousel.tsx",
		);
		expect(source).toContain("ChevronLeft");
		expect(source).toContain("ChevronRight");
	});

	it("包含垂直縮圖列（flex-col 排列）", () => {
		const source = read(
			"apps/anismile/modules/catalog/components/FeaturedCarousel.tsx",
		);
		expect(source).toContain("flex-col");
	});
});
