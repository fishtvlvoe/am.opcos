import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("public catalog visibility contract", () => {
	it("prevents manual sync from marking missing products out of stock during a partial batch", () => {
		const source = read("packages/api/modules/anismile/procedures/sync.ts");

		expect(source).toContain("markMissingOutOfStock: false");
	});

	it("makes products.list respect showUnavailable and inStock inputs instead of hard-coding public visibility", () => {
		const source = read("packages/api/modules/anismile/procedures/products.ts");

		expect(source).toContain("const includeUnavailableMatches = input.showUnavailable === true");
		expect(source).toContain("const onlyInStock = includeUnavailableMatches ? input.inStock === true : true");
		expect(source).toContain("showUnavailable: includeUnavailableMatches");
		expect(source).not.toContain("showUnavailable: false");
	});

	it("lets keyword search fall back to synced unavailable matches when no orderable results remain", () => {
		const querySource = read("packages/database/prisma/queries/anismile.ts");

		expect(querySource).toContain("fallbackResult");
		expect(querySource).toContain("usedUnavailableFallback");
		expect(querySource).toContain("showUnavailable: true");
		expect(querySource).toContain("result.total > 0");
	});
});
