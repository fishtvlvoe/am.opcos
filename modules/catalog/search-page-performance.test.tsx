import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("SearchPage performance recovery contract", () => {
	it("prefetches the first public search payload on the route", () => {
		const pageSource = read("app/(public)/search/page.tsx");

		expect(pageSource).toContain("searchParams: Promise<Record<string, string | string[] | undefined>>");
		expect(pageSource).toContain("searchAnismileProducts");
		expect(pageSource).toContain("listAnismileProducts");
		expect(pageSource).toContain("initialSearchData");
		expect(pageSource).toContain("initialAllProductsData");
	});

	it("retains the previous result set during filter and pagination updates", () => {
		const source = read("modules/catalog/SearchPage.tsx");

		expect(source).toContain("useState<SearchPageSearchResult | undefined>(initialSearchData)");
		expect(source).toContain("useState<SearchPageAllProductsResult | undefined>(initialAllProductsData)");
		expect(source).toContain("const activeResult = isAllProductsMode ? visibleAllProductsResult : visibleSearchResult");
		expect(source).toContain("activeQuery.isFetching && !!activeResult");
		expect(source).toContain("更新中...");
		expect(source).toContain("activeQuery.isPending && !activeResult");
	});
});
