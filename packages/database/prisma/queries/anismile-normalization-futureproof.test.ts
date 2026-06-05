import { describe, expect, it } from "vitest";
import { normalizeSeriesLookup } from "../../../api/modules/anismile/lib/crawler";
import { normalizeSeriesName, generateSeriesVariants } from "@repo/utils";

describe("Anismile Normalization & Variant Matching Future-proofing", () => {
	const testCases = [
		{
			input: "薫る花は凜と咲く・Yline・6月21日截單",
			expectedBase: "薰る花は凛と咲く・yline・6月21日截单",
		},
		{
			input: "ご注文はうさぎですか？BLOOM・株式会社A3・6月17日截单",
			expectedBase: "ご注文はうさぎですか?bloom・株式会社a3・6月17日截单",
		},
		{
			input: "アニメ『BEASTARS FINAL SEASON』・Medicos Entertainment・6月24日截單",
			expectedBase: "アニメ『beastars final season』・medicos entertainment・6月24日截单",
		},
	];

	it("ensures crawler normalizeSeriesLookup matches shared normalizeSeriesName in @repo/utils", () => {
		for (const { input } of testCases) {
			const crawlerResult = normalizeSeriesLookup(input);
			const sharedResult = normalizeSeriesName(input);
			
			// 兩端的標準化行為必須百分之百一致，防止兩邊邏輯不同步導致找不到產品的問題
			expect(crawlerResult).toBe(sharedResult);
		}
	});

	it("ensures generateSeriesVariants covers both Traditional Chinese, Simplified Chinese and Japanese variations", () => {
		const name = "薫る花は凜と咲く・Yline・6月21日截單";
		const variants = generateSeriesVariants(name);

		// 檢查生成的 variants 集合是否同時包含各種異體字寫法，以便進行資料庫 in 查詢
		expect(variants).toContain("薫る花は凜と咲く・Yline・6月21日截單");
		expect(variants).toContain("薰る花は凛と咲く・Yline・6月21日截单");
		expect(variants).toContain("薫る花は凛と咲く・Yline・6月21日截單");
		expect(variants).toContain("薰る花は凜と咲く・Yline・6月21日截单");
	});
});
