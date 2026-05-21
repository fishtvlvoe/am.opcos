import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

// 紅燈測試 — 元件尚未實作
describe("ToolbarRow 工具列結構契約", () => {
	it("檔案存在且可讀", () => {
		const source = read(
			"apps/anismile/modules/catalog/components/ToolbarRow.tsx",
		);
		expect(source.length).toBeGreaterThan(0);
	});

	it("包含排序 combobox 控制項", () => {
		const source = read(
			"apps/anismile/modules/catalog/components/ToolbarRow.tsx",
		);
		const hasSort =
			source.includes("select") ||
			source.includes("Select") ||
			source.includes("combobox") ||
			source.includes("排序");
		expect(hasSort).toBe(true);
	});

	it("包含每頁件數選擇", () => {
		const source = read(
			"apps/anismile/modules/catalog/components/ToolbarRow.tsx",
		);
		const hasPerPage =
			source.includes("perPage") ||
			source.includes("per_page") ||
			source.includes("每頁") ||
			source.includes("pageSize");
		expect(hasPerPage).toBe(true);
	});

	it("包含卡片／表格模式切換圖示", () => {
		const source = read(
			"apps/anismile/modules/catalog/components/ToolbarRow.tsx",
		);
		const hasViewToggle =
			source.includes("LayoutGrid") ||
			source.includes("List") ||
			source.includes("Table") ||
			source.includes("viewMode") ||
			source.includes("view_mode");
		expect(hasViewToggle).toBe(true);
	});

	it("包含 CSV 下載功能", () => {
		const source = read(
			"apps/anismile/modules/catalog/components/ToolbarRow.tsx",
		);
		const hasCsv =
			source.includes("CSV") ||
			source.includes("csv") ||
			source.includes(".csv");
		expect(hasCsv).toBe(true);
	});

	it("包含篩選入口", () => {
		const source = read(
			"apps/anismile/modules/catalog/components/ToolbarRow.tsx",
		);
		const hasFilter =
			source.includes("篩選") ||
			source.includes("Filter") ||
			source.includes("filter");
		expect(hasFilter).toBe(true);
	});
});
