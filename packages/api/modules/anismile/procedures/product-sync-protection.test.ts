import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const querySource = readFileSync(
	resolve(__dirname, "../../../../database/prisma/queries/anismile.ts"),
	"utf8",
);
const productProcedureSource = readFileSync(
	resolve(__dirname, "products.ts"),
	"utf8",
);

describe("upsertProductsFromSync sync protection contract", () => {
	it("selects priceManualOverride in existing product lookup", () => {
		expect(querySource).toContain("priceManualOverride");
	});

	it("skips sellingPrice update when priceManualOverride is true", () => {
		// The update payload must conditionally exclude sellingPrice
		expect(querySource).toContain("existing?.priceManualOverride");
	});

	it("skips markupOverride update when priceManualOverride is true", () => {
		// Both sellingPrice and markupOverride must be protected
		expect(querySource).toContain("existing?.priceManualOverride");
	});

	it("preserves verified source pricing truth when a degraded payload is written back", () => {
		expect(querySource).toContain("sourceAuthState");
		expect(querySource).toContain("preserveExistingSourcePricingTruth");
		expect(querySource).toContain("existing?.discountRate != null");
	});

	it("allows sync to correct stale listingDate and source availability", () => {
		expect(querySource).toContain("listingDate: product.listingDate ?? existing?.listingDate ?? now");
		expect(querySource).toContain("product.inStock ??");
	});

	it("keeps expired and unavailable products out of listing APIs", () => {
		// 商品列表 API 仍在資料庫層過濾過期/缺貨商品
		expect(productProcedureSource).toContain("const onlyInStock = includeUnavailableMatches ? input.inStock === true : true;");
		expect(productProcedureSource).toContain("showUnavailable: includeUnavailableMatches");
		expect(querySource).toContain("inStock: true");
		expect(querySource).toContain("orderDeadline: { gte: today }");
	});

	it("allows viewing expired products on detail page", () => {
		// getById 不再有可購性過濾；已截止商品仍可瀏覽，加入購物車由 UI 層禁用
		expect(productProcedureSource).toContain("getProductById");
		expect(productProcedureSource).not.toContain("isPubliclyOrderableProduct");
	});

	it("triggers background crawler when result.total < 5 without blocking", () => {
		expect(productProcedureSource).toContain("result.total < 5");
		// 驗證使用 IIFE 非同步包裝
		expect(productProcedureSource).toContain("(async () => {");
		expect(productProcedureSource).toContain("crawlAnismileProductsBySeriesName(seriesName, 200)");
	});
});
