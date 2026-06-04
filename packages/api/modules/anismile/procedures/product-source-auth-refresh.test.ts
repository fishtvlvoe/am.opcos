import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const crawlerSource = readFileSync(
	resolve(__dirname, "../lib/crawler.ts"),
	"utf8",
);
const productProcedureSource = readFileSync(
	resolve(__dirname, "products.ts"),
	"utf8",
);
const cartProcedureSource = readFileSync(
	resolve(__dirname, "cart.ts"),
	"utf8",
);

describe("authenticated source refresh contract", () => {
	it("single-product crawler defaults to authenticated source mode", () => {
		expect(crawlerSource).toContain('{ authMode = "authenticated" }');
		expect(crawlerSource).toContain("headers.cookie = await getAuthenticatedCookie()");
	});

	it("product detail refresh uses authenticated crawler before writing back to DB", () => {
		expect(productProcedureSource).toContain('authMode: "authenticated"');
	});

	it("cart refresh uses authenticated crawler before writing back to DB", () => {
		expect(cartProcedureSource).toContain('authMode: "authenticated"');
	});
});
