import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readSource() {
	return readFileSync(resolve(process.cwd(), "packages/database/prisma/queries/anismile.ts"), "utf8");
}

describe("anismile Japanese search visibility contract", () => {
	it("keeps Japanese title matches visible and allows showUnavailable to expose synced unavailable matches", () => {
		const source = readSource();

		expect(source).toContain("titleOriginal: { contains: normalizedQuery, mode: \"insensitive\" as const }");
		expect(source).toContain("franchise: { contains: normalizedQuery, mode: \"insensitive\" as const }");
		expect(source).toContain("const includeUnavailableMatches = filters?.showUnavailable === true");
		expect(source).toContain("const inStockFilter = filters?.inStock === false ? undefined : true");
		expect(source).toContain("if (!showUnavailable) {");
	});
});
