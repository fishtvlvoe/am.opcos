import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readSource() {
	return readFileSync(resolve(__dirname, "homepage.ts"), "utf8");
}

describe("homepage series visibility contract", () => {
	it("reuses synced product images when source series covers are empty", () => {
		const source = readSource();

		expect(source).toContain("getSyncedSeriesFallbackImageMap");
		expect(source).toContain("db.anismileProduct.findMany");
		expect(source).toContain("imageUrl: normalizeSourceImageUrl(item.file?.url || item.file?.thumb) || syncedSeriesFallbackImageMap.get(item.name) || \"\"");
	});

	it("falls back to synced listingDate buckets when source API is unavailable", () => {
		const source = readSource();
 
		expect(source).toContain("getSyncedSeriesListByDate");
		expect(source).toContain("catch (error)");
		expect(source).toContain("usedFallback");
	});

	it("falls back to cross-batch synced images when exact series match has no usable cover", () => {
		const source = readSource();

		expect(source).toContain("getSeriesRoot");
		expect(source).toContain('seriesName.split("・")[0]');
		expect(source).toContain("Cross-batch fallback: same series root");
		expect(source).toContain("const allTerms = Array.from(new Set([...uniqueSeriesNames, ...seriesRoots]))");
	});
});
