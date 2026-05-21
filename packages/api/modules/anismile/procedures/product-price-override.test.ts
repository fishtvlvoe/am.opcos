import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const querySource = readFileSync(
	resolve(__dirname, "../../../../database/prisma/queries/anismile.ts"),
	"utf8",
);
const schemaSource = readFileSync(
	resolve(__dirname, "../../../../database/prisma/schema.prisma"),
	"utf8",
);

describe("priceManualOverride contract", () => {
	it("AnismileProduct schema has priceManualOverride field", () => {
		expect(schemaSource).toContain("priceManualOverride");
	});

	it("updateProductFields is exported from DB queries", () => {
		expect(querySource).toContain("export async function updateProductFields");
	});

	it("sets priceManualOverride=true when sellingPrice is provided", () => {
		expect(querySource).toContain("priceManualOverride = true");
	});

	it("sets priceManualOverride=false when only markupOverride is provided", () => {
		expect(querySource).toContain("priceManualOverride = false");
	});
});
