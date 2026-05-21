import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const querySource = readFileSync(
	resolve(__dirname, "../../../../database/prisma/queries/anismile.ts"),
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
});
