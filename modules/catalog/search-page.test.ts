import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("SearchPage all-products mode", () => {
	const filePath = "modules/catalog/SearchPage.tsx";

	it("空查詢時顯示所有產品而不是只要求輸入關鍵字", () => {
		const source = read(filePath);

		expect(source).toContain("orpc.anismile.products.list.queryOptions");
		expect(source).toContain("const isAllProductsMode = trimmed.length === 0");
		expect(source).toContain("所有產品");
		expect(source).toContain("瀏覽目前同步的 anismile.jp 商品");
		expect(source).not.toContain("請輸入搜尋關鍵字");
	});

	it("有關鍵字時保留搜尋 endpoint 與搜尋標題", () => {
		const source = read(filePath);

		expect(source).toContain("orpc.anismile.products.search.queryOptions");
		expect(source).toContain("enabled: !isAllProductsMode");
		expect(source).toContain("isAllProductsMode ? \"所有產品\" : \"搜尋\"");
		expect(source).toContain("query: trimmed");
	});
});
