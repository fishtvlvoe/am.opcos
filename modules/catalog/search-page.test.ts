import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("SearchPage all-products mode", () => {
	const filePath = "modules/catalog/SearchPage.tsx";

	it("空查詢時仍載入商品結果而不是只要求輸入關鍵字", () => {
		const source = read(filePath);

		expect(source).toContain("orpc.anismile.products.list.queryOptions");
		expect(source).toContain("const isAllProductsMode = trimmed.length === 0");
		expect(source).not.toContain("showUnavailable: true");
		expect(source).toContain("搜尋結果");
		expect(source).toContain("共 {total} 件");
		expect(source).not.toContain("請輸入搜尋關鍵字");
	});

	it("商品 API 失敗時顯示 production 同步/資料庫狀態提示", () => {
		const source = read(filePath);

		expect(source).toContain("activeQuery.isError");
		expect(source).toContain("production 同步與資料庫狀態");
	});

	it("有關鍵字時保留搜尋 endpoint 與搜尋標題", () => {
		const source = read(filePath);

		expect(source).toContain("orpc.anismile.products.search.queryOptions");
		expect(source).toContain("enabled: !isAllProductsMode");
		expect(source).toContain("<h1 className=\"font-semibold text-2xl text-stone-950\">搜尋結果</h1>");
		expect(source).toContain("query: trimmed");
	});
});
