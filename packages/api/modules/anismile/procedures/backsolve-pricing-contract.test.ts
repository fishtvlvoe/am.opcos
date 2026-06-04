import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("backsolve pricing contract", () => {
	it("settings route exposes backsolvePercent instead of markup multiplier", () => {
		const source = read("packages/api/modules/anismile/procedures/settings.ts");
		expect(source).toContain("backsolvePercent");
	});

	it("cart and import order stop applying tier discount to product unit pricing", () => {
		const cartSource = read("packages/api/modules/anismile/procedures/cart.ts");
		const importOrderSource = read("packages/api/modules/anismile/procedures/import-order.ts");

		expect(cartSource).not.toContain("sellingPrice * (1 - tierDiscount)");
		expect(importOrderSource).not.toContain("product.sellingPrice.mul(1 - tierDiscount)");
	});

	it("default backsolve recompute avoids large catalog-wide transactions", () => {
		const querySource = read("packages/database/prisma/queries/anismile.ts");
		const functionStart = querySource.indexOf("export async function setDefaultBacksolvePercent");
		const functionEnd = querySource.indexOf("export async function createSyncLog");
		const functionSource = querySource.slice(functionStart, functionEnd);

		expect(functionSource).toContain("WHERE \"price_manual_override\" = false");
		expect(functionSource).toContain("await db.$executeRaw`");
		expect(functionSource).toContain("UPDATE \"anismile_products\"");
		expect(functionSource).toContain("COALESCE(\"markup_override\"");
		expect(functionSource).not.toContain("findMany({");
		expect(functionSource).not.toContain("const chunkSize = 20");
	});
});
