import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("FilterSidebar quickFilters 契約", () => {
	const filePath = "apps/anismile/modules/shared/components/FilterSidebar.tsx";

	it("檔案存在且可讀", () => {
		expect(() => read(filePath)).not.toThrow();
	});

	it("定義 QuickFilter 型別，含 key/label/checked 欄位", () => {
		const source = read(filePath);
		expect(source).toContain("QuickFilter");
		expect(source).toContain("checked");
	});

	it("FilterSidebarProps 包含 quickFilters 可選屬性", () => {
		const source = read(filePath);
		expect(source).toContain("quickFilters");
	});

	it("包含 onQuickFilterChange 回呼", () => {
		const source = read(filePath);
		expect(source).toContain("onQuickFilterChange");
	});

	it("渲染「快速篩選」heading", () => {
		const source = read(filePath);
		expect(source).toContain("快速篩選");
	});
});
