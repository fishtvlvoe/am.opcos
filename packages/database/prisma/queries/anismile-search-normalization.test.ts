import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("anismile product search normalization", () => {
	it("strips trailing source search slashes before matching product fields", () => {
		const source = read("packages/database/prisma/queries/anismile.ts");
		expect(source).toContain("function normalizeProductSearchQuery");
		expect(source).toMatch(/return query\.trim\(\)\.replace\(\s*\/\[\\?\/／\]\+\$\/g,\s*""\s*\)\.trim\(\)/);
		expect(source).toContain("const normalizedSearch = search ? normalizeProductSearchQuery(search) : \"\"");
		expect(source).toContain("const normalizedQuery = normalizeProductSearchQuery(query)");
		expect(source).toContain("contains: normalizedQuery");
		expect(source).toContain("contains: normalizedSearch");
	});
});
