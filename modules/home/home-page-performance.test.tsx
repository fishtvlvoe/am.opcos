import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("HomePage performance recovery contract", () => {
	it("prefetches public homepage data on the route and hydrates the client page with initial props", () => {
		const pageSource = read("app/(public)/page.tsx");

		expect(pageSource).toContain("fetchPublicJson");
		expect(pageSource).toContain("/api/anismile/homepage/banners");
		expect(pageSource).toContain("/api/anismile/homepage/series-list?dateIndex=0&limit=30");
		expect(pageSource).toContain("initialBannerData");
		expect(pageSource).toContain("initialSeriesData");
	});

	it("keeps the previous series grid visible while the next tab is updating", () => {
		const source = read("modules/home/HomePage.tsx");

		expect(source).toContain("useState<HomePageSeriesData | undefined>(initialSeriesData)");
		expect(source).toContain("const currentSeriesData = seriesQuery.data ?? visibleSeriesData");
		expect(source).toContain("seriesQuery.isFetching && !!currentSeriesData");
		expect(source).toContain("更新中...");
		expect(source).toContain("seriesQuery.isPending && !currentSeriesData");
	});
});
