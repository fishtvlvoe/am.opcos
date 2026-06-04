import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

// 紅燈測試 — 元件尚未實作
describe("TableView 表格模式結構契約", () => {
	it("檔案存在且可讀", () => {
		const source = read(
			"modules/catalog/components/TableView.tsx",
		);
		expect(source.length).toBeGreaterThan(0);
	});

	it("包含 HTML table 或 Table 元件標籤", () => {
		const source = read(
			"modules/catalog/components/TableView.tsx",
		);
		const hasTable =
			source.includes("<table") ||
			source.includes("Table") ||
			source.includes("<Table");
		expect(hasTable).toBe(true);
	});

	it("包含商品名稱欄位標頭", () => {
		const source = read(
			"modules/catalog/components/TableView.tsx",
		);
		expect(source).toContain("商品名稱");
	});

	it("包含價格欄位標頭", () => {
		const source = read(
			"modules/catalog/components/TableView.tsx",
		);
		expect(source).toContain("價格");
	});

	it("包含會員價欄位標頭", () => {
		const source = read(
			"modules/catalog/components/TableView.tsx",
		);
		expect(source).toContain("會員價");
	});

	it("包含 JAN 條碼欄位標頭", () => {
		const source = read(
			"modules/catalog/components/TableView.tsx",
		);
		expect(source).toContain("JAN");
	});

	it("包含快速下單操作圖示（Heart 或 ShoppingCart）", () => {
		const source = read(
			"modules/catalog/components/TableView.tsx",
		);
		const hasOrderAction =
			source.includes("Heart") || source.includes("ShoppingCart");
		expect(hasOrderAction).toBe(true);
	});

	it("包含下單單位或規格欄位", () => {
		const source = read(
			"modules/catalog/components/TableView.tsx",
		);
		const hasUnit =
			source.includes("下單單位") ||
			source.includes("unitType") ||
			source.includes("boxSpec") ||
			source.includes("unit_type") ||
			source.includes("box_spec");
		expect(hasUnit).toBe(true);
	});
});
