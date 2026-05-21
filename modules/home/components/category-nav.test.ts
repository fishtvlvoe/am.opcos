// 紅燈測試 — 元件尚未實作
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("CategoryNav 元件", () => {
	const filePath = "modules/home/components/CategoryNav.tsx";

	it("檔案存在且可讀", () => {
		expect(() => read(filePath)).not.toThrow();
	});

	it("包含分類「周邊收藏」", () => {
		const source = read(filePath);
		expect(source).toContain("周邊收藏");
	});

	it("包含分類「手辦・卡牌」", () => {
		const source = read(filePath);
		expect(source).toContain("手辦・卡牌");
	});

	it("包含分類「裝飾・服飾」", () => {
		const source = read(filePath);
		expect(source).toContain("裝飾・服飾");
	});

	it("包含分類「生活雜貨」", () => {
		const source = read(filePath);
		expect(source).toContain("生活雜貨");
	});

	it("包含分類「全部系列」", () => {
		const source = read(filePath);
		expect(source).toContain("全部系列");
	});

	it("包含 useState 管理展開狀態", () => {
		const source = read(filePath);
		expect(source).toContain("useState");
	});

	it("包含 ChevronDown 圖示（展開/收合用）", () => {
		const source = read(filePath);
		const hasChevronDown =
			source.includes("ChevronDownIcon") || source.includes("ChevronDown");
		expect(hasChevronDown).toBe(true);
	});

	it("子分類項目使用 Link 元件（非純 button），滿足 Category Navigation Subcategory Routing 需求", () => {
		const source = read(filePath);
		expect(source).toContain("next/link");
	});

	it("子分類 Link 指向 /categories/ 路徑", () => {
		const source = read(filePath);
		expect(source).toContain("/categories/");
	});

	it("子分類點擊後關閉 dropdown（setOpenIndex(null)）", () => {
		const source = read(filePath);
		expect(source).toContain("setOpenIndex(null)");
	});
});
