import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const productsProcedureSource = readFileSync(
	resolve(__dirname, "products.ts"),
	"utf8",
);

describe("public pricing visibility contract", () => {
	it("exposes originalPrice to public list/search/detail responses", () => {
		expect(productsProcedureSource).toContain("originalPrice: item.originalPrice ? toNumber(item.originalPrice) : null");
		expect(productsProcedureSource).toContain("originalPrice: product.originalPrice ? Number(product.originalPrice) : null");
		expect(productsProcedureSource).toContain("originalPrice: p.originalPrice ? toNumber(p.originalPrice) : null");
	});

	it("keeps sellingPrice gated behind login visibility checks", () => {
		expect(productsProcedureSource).toContain("sellingPrice: publicPrice(toNumberRequired(item.sellingPrice), showPrices)");
		expect(productsProcedureSource).toContain("sellingPrice: publicPrice(toNumberRequired(product.sellingPrice), showPrices)");
		expect(productsProcedureSource).toContain("sellingPrice: publicPrice(toNumberRequired(p.sellingPrice), showPrices)");
	});
});
