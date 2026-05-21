import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("CatalogPage", () => {
	it("implements URL state and pagination contract", () => {
		const source = read("apps/anismile/modules/catalog/CatalogPage.tsx");

		expect(source).toContain("parseAsString.withDefault(\"\")");
		expect(source).toContain("useQueryState(\"q\"");
		expect(source).toContain("useQueryState(\"category\"");
		expect(source).toContain("useQueryState(\"date\"");
		expect(source).toContain("pageSize: 24");
	});

	it("wires required catalog components", () => {
		const source = read("apps/anismile/modules/catalog/CatalogPage.tsx");

		expect(source).toContain("NewArrivalsScroll");
		expect(source).toContain("CategorySidebar");
		expect(source).toContain("DateChipFilter");
		expect(source).toContain("ProductCard");
	});
});
