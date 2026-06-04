import { describe, expect, it } from "vitest";

import { classifySeriesVisibility, detectSourceDateIndexStuck, isPlaceholderImageUrl } from "./am-catalog-visibility-lib";

describe("am catalog visibility helpers", () => {
	it("detects source dateIndex drift when targetDate stays on the wrong day", () => {
		expect(detectSourceDateIndexStuck("2026-06-02", "2026-06-03")).toBe(true);
		expect(detectSourceDateIndexStuck("2026-06-02", "2026-06-02")).toBe(false);
	});

	it("treats empty and placeholder images as unusable", () => {
		expect(isPlaceholderImageUrl("")).toBe(true);
		expect(isPlaceholderImageUrl("https://img.anismile.jp/files/length_shadow_white.png")).toBe(true);
		expect(isPlaceholderImageUrl("https://img.anismile.jp/files/cover.jpg")).toBe(false);
	});

	it("classifies stock-gated empty series pages and fully unavailable synced series", () => {
		expect(
			classifySeriesVisibility({
				cardProductCount: 10,
				liveDefaultTotal: 0,
				liveShowUnavailableTotal: 10,
				exactDbTotal: 10,
				exactDbInStock: 0,
				homepageImageUrl: "",
				hasUsableDbImage: false,
			}),
		).toEqual([
			"series-card-missing-image",
			"series-page-hidden-by-stock-gate",
			"series-all-products-unavailable",
		]);
	});

	it("does not flag stock-gate when fallback db has in-stock products (cross-batch series)", () => {
		expect(
			classifySeriesVisibility({
				cardProductCount: 26,
				liveDefaultTotal: 0,
				liveShowUnavailableTotal: 84,
				exactDbTotal: 0,
				exactDbInStock: 0,
				fallbackDbTotal: 84,
				fallbackDbInStock: 42,
				homepageImageUrl: "https://img.anismile.jp/cover.jpg",
				hasUsableDbImage: true,
			}),
		).toEqual([]);
	});

	it("still flags stock-gate when both exact and fallback in-stock are zero", () => {
		expect(
			classifySeriesVisibility({
				cardProductCount: 10,
				liveDefaultTotal: 0,
				liveShowUnavailableTotal: 10,
				exactDbTotal: 0,
				exactDbInStock: 0,
				fallbackDbTotal: 10,
				fallbackDbInStock: 0,
				homepageImageUrl: "",
				hasUsableDbImage: false,
			}),
		).toEqual(["series-card-missing-image", "series-page-hidden-by-stock-gate"]);
	});
});
