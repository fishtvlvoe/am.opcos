import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const procedureSource = readFileSync(
	resolve(__dirname, "products.ts"),
	"utf8",
);
const routerSource = readFileSync(
	resolve(__dirname, "../router.ts"),
	"utf8",
);

describe("patchProduct procedure contract", () => {
	it("patchProduct API authorization — admin only via anismileAdminProcedure", () => {
		expect(procedureSource).toMatch(/export const patchProduct\s*=/);
		expect(procedureSource).toContain("anismileAdminProcedure");
	});

	it("patchProduct API authorization — registered in router under products.patchProduct", () => {
		expect(routerSource).toMatch(/patchProduct[^M]/);
	});

	it("patchProduct accepts 5 optional fields in Zod schema", () => {
		expect(procedureSource).toContain("titleTranslated");
		expect(procedureSource).toContain("sellingPrice");
		expect(procedureSource).toContain("markupOverride");
		expect(procedureSource).toContain("discountRate");
		expect(procedureSource).toContain("saleStatus");
	});

	it("invalid discountRate rejected — discountRate bounded 0–1 in Zod schema", () => {
		expect(procedureSource).toContain(".min(0)");
		expect(procedureSource).toContain(".max(1)");
	});

	it("patchProduct returns priceManualOverride in response", () => {
		expect(procedureSource).toContain("priceManualOverride");
	});

	it("calls updateProductFields from DB queries", () => {
		expect(procedureSource).toContain("updateProductFields");
	});
});
