import { describe, expect, it } from "vitest";
import { generateSeriesVariants } from "@repo/utils";

// 測試 generateSeriesVariants 雙 key 策略的核心行為
// 驗證 getDbSeriesImageMap 建立 Map 時，簡繁兩種寫法都能命中相同 imageUrl
describe("getDbSeriesImageMap 雙 key 策略（via generateSeriesVariants）", () => {
	it("截单（簡體）與截單（繁體）都在 variants 裡", () => {
		const variants = generateSeriesVariants("截单");
		expect(variants).toContain("截单");
		expect(variants).toContain("截單");
	});

	it("截單（繁體）與截单（簡體）都在 variants 裡", () => {
		const variants = generateSeriesVariants("截單");
		expect(variants).toContain("截单");
		expect(variants).toContain("截單");
	});

	it("雙 key 策略：用 DB 簡體名稱建 Map，簡繁兩種查法都能取得同一 imageUrl", () => {
		// 模擬 getDbSeriesImageMap 的建立邏輯
		const mockDbRow = { name: "截单", imageUrl: "https://img.anismile.jp/files/series/test.jpg" };
		const map = new Map<string, string>();
		for (const variant of generateSeriesVariants(mockDbRow.name)) {
			map.set(variant, mockDbRow.imageUrl);
		}

		const expectedUrl = "https://img.anismile.jp/files/series/test.jpg";
		expect(map.get("截单")).toBe(expectedUrl);
		expect(map.get("截單")).toBe(expectedUrl);
	});

	it("雙 key 策略：用 DB 繁體名稱建 Map，簡繁兩種查法也都能取得同一 imageUrl", () => {
		const mockDbRow = { name: "截單", imageUrl: "https://img.anismile.jp/files/series/test2.jpg" };
		const map = new Map<string, string>();
		for (const variant of generateSeriesVariants(mockDbRow.name)) {
			map.set(variant, mockDbRow.imageUrl);
		}

		const expectedUrl = "https://img.anismile.jp/files/series/test2.jpg";
		expect(map.get("截单")).toBe(expectedUrl);
		expect(map.get("截單")).toBe(expectedUrl);
	});

	it("多系列不互相干擾，各自的 imageUrl 對應正確", () => {
		const mockSeriesList = [
			{ name: "截单", imageUrl: "https://img.anismile.jp/files/series/a.jpg" },
			{ name: "ご注文はうさぎですか？", imageUrl: "https://img.anismile.jp/files/series/b.jpg" },
		];

		const map = new Map<string, string>();
		for (const s of mockSeriesList) {
			for (const variant of generateSeriesVariants(s.name)) {
				map.set(variant, s.imageUrl);
			}
		}

		expect(map.get("截单")).toBe("https://img.anismile.jp/files/series/a.jpg");
		expect(map.get("截單")).toBe("https://img.anismile.jp/files/series/a.jpg");
		// 全形 ？ 與半形 ? 兩種都能命中第二個系列
		expect(map.get("ご注文はうさぎですか？")).toBe("https://img.anismile.jp/files/series/b.jpg");
		expect(map.get("ご注文はうさぎですか?")).toBe("https://img.anismile.jp/files/series/b.jpg");
	});
});
