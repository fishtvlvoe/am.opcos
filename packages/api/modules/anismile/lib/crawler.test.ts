import { describe, expect, it } from "vitest";

import { crawlAnismileProductsBySeriesName, parseProductApiForTest, parseProductEntriesFromSeriesPageForTest } from "./crawler";

const BASE_ITEM = {
	hash: "test001",
	name: "テスト商品",
	price: "1000.00",
	deadline_date: "2026年06月02日",
	description: "",
	main_image_url: "https://example.com/img.jpg",
	albums: [{ url: "https://example.com/img.jpg" }],
	work_title: [] as string[],
	manufacturer: { name: "" },
	bundles: null,
	percent: null,
};

describe("parseProductApi — new field extraction", () => {
	it("extracts discountRate from percent.status=1", () => {
		const res = {
			code: 1,
			item: { ...BASE_ITEM, percent: { status: 1, percent: "85.00" } },
		};
		const result = parseProductApiForTest(res);
		expect(result?.discountRate).toBe(85);
	});

	it("sets discountRate to null when percent.status !== 1", () => {
		const res = {
			code: 1,
			item: { ...BASE_ITEM, percent: { status: 0, percent: "85.00" } },
		};
		const result = parseProductApiForTest(res);
		expect(result?.discountRate).toBeNull();
	});

	it("extracts brand from manufacturer.name", () => {
		const res = {
			code: 1,
			item: { ...BASE_ITEM, manufacturer: { name: "AGW" } },
		};
		const result = parseProductApiForTest(res);
		expect(result?.brand).toBe("AGW");
	});

	it("extracts franchise from work_title[0]", () => {
		const res = {
			code: 1,
			item: { ...BASE_ITEM, work_title: ["死亡遊戯で飯を食う。"] },
		};
		const result = parseProductApiForTest(res);
		expect(result?.franchise).toBe("死亡遊戯で飯を食う。");
	});

	it("extracts janCode from jancode field", () => {
		const res = {
			code: 1,
			item: { ...BASE_ITEM, jancode: "4573684703414" },
		};
		const result = parseProductApiForTest(res);
		expect(result?.janCode).toBe("4573684703414");
	});
});

describe("series page product discovery", () => {
	it("extracts unique item ids with the source listing date", () => {
		const listingDate = new Date("2026-05-20T00:00:00.000Z");
		const html = `
			<a href="/item/123/">A</a>
			<a href="https://www.anismile.jp/item/456/">B</a>
			<a href="/item/123/">A again</a>
		`;

		expect(parseProductEntriesFromSeriesPageForTest(html, listingDate)).toEqual([
			{ id: "456", listingDate },
			{ id: "123", listingDate },
		]);
	});

	it("exports on-demand series crawler for source series fallback", () => {
		expect(typeof crawlAnismileProductsBySeriesName).toBe("function");
	});
});
