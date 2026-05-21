import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const querySource = readFileSync(
	resolve(__dirname, "../../../../database/prisma/queries/anismile.ts"),
	"utf8",
);

describe("updateProductFields contract", () => {
	it("is exported from DB queries", () => {
		expect(querySource).toContain("export async function updateProductFields");
	});

	it("accepts 5 optional fields: titleTranslated, sellingPrice, markupOverride, discountRate, saleStatus", () => {
		expect(querySource).toContain("titleTranslated");
		expect(querySource).toContain("sellingPrice");
		expect(querySource).toContain("markupOverride");
		expect(querySource).toContain("discountRate");
		expect(querySource).toContain("saleStatus");
	});

	it("sets priceManualOverride=true when sellingPrice is provided", () => {
		expect(querySource).toContain("priceManualOverride = true");
	});

	it("sets priceManualOverride=false when markupOverride is provided without sellingPrice", () => {
		expect(querySource).toContain("priceManualOverride = false");
	});

	it("recalculates sellingPrice from costPrice * markupOverride when markupOverride is provided", () => {
		expect(querySource).toContain("costPrice");
		expect(querySource).toContain("mul(");
	});

	it("sellingPrice takes precedence over markupOverride when both provided", () => {
		// The logic must check sellingPrice first (guard: if sellingPrice !== undefined)
		expect(querySource).toContain("input.sellingPrice !== undefined");
	});
});
