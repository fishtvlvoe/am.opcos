import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("SearchPage reference parity contract", () => {
	const searchPageSource = () => read("modules/catalog/SearchPage.tsx");

	it("renders procurement search layout controls and AM brand boundary", () => {
		const source = searchPageSource();

		expect(source).toContain("首頁");
		expect(source).toContain("搜尋結果");
		expect(source).toContain("共 {total} 件");
		expect(source).toContain("顯示不可購買商品");
		expect(source).toContain("現貨");
		expect(source).toContain("即將截單");
		expect(source).toContain("確認篩選");
		expect(source).toContain("下載CSV");
		expect(source).toContain("沒有符合條件的商品");
		expect(source).not.toContain("AniSmile");
	});

	it("persists card and table display modes in URL state", () => {
		const source = searchPageSource();

		expect(source).toContain("parseAsStringLiteral");
		expect(source).toContain("[\"card\", \"table\"]");
		expect(source).toContain("view=table");
		expect(source).toContain("SearchResultTable");
		expect(source).toContain("setView(\"table\")");
		expect(source).toContain("setView(\"card\")");
	});

	it("passes search filters and sort state to product queries", () => {
		const source = searchPageSource();

		expect(source).toContain("sort: normalizedSort");
		expect(source).toContain("showUnavailable");
		expect(source).toContain("inStock");
		expect(source).toContain("urgentDeadline");
		expect(source).toContain("filters: activeFilters");
	});

	it("exports current visible search result rows as customer-safe CSV", () => {
		const source = searchPageSource();

		expect(source).toContain("function downloadSearchCsv");
		expect(source).toContain("商品名稱,JAN Code,作品系列,品牌,售價,庫存狀態,截止日期,發售日期,商品URL");
		expect(source).toContain("new Blob([csv]");
		expect(source).toContain("am-search-products");
	});
});
