import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readSource() {
	return readFileSync(resolve(process.cwd(), "packages/database/prisma/queries/anismile.ts"), "utf8");
}

describe("anismile series query exact-match contract", () => {
	it("prefers exact series matches before falling back to startsWith root expansion", () => {
		const source = readSource();

		expect(source).toContain("const exactSeriesMatch = await db.anismileProduct.findFirst");
		expect(source).toContain("series: {\n\t\t\t\t\tin: seriesTerms,");
		expect(source).toContain("exactSeriesMatch");
		expect(source).toContain("series: { startsWith: term }");
	});
});
