import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("anismile public search filters and fallback sort", () => {
	const querySource = () => read("packages/database/prisma/queries/anismile.ts");
	const procedureSource = () => read("packages/api/modules/anismile/procedures/products.ts");

	it("accepts public search availability filters in the API input", () => {
		const source = procedureSource();

		expect(source).toContain("showUnavailable: z.boolean().optional()");
		expect(source).toContain("inStock: z.boolean().optional()");
		expect(source).toContain("urgentDeadline: z.boolean().optional()");
		expect(source).toContain("sort: productSortSchema.optional()");
	});

	it("uses showUnavailable, inStock, and urgentDeadline in search where clauses", () => {
		const source = querySource();

		expect(source).toContain("showUnavailable?: boolean");
		expect(source).toContain("inStock?: boolean");
		expect(source).toContain("urgentDeadline?: boolean");
		expect(source).toContain("const includeUnavailableMatches = filters?.showUnavailable === true");
		expect(source).toContain("const onlyInStock = filters?.inStock === true");
		expect(source).toContain("filters?.urgentDeadline");
		expect(source).toContain("series: { contains: normalizedQuery");
	});

	it("documents sales sort as a deterministic fallback instead of true ranking", () => {
		const source = querySource();

		expect(source).toContain("sales_fallback");
		expect(source).toContain("sales ranking fallback");
		expect(source).toContain("resolveProductOrderBy");
		expect(source).not.toContain("trueSalesRanking");
	});
});
