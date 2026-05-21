import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("Order history UI contract", () => {
	it("uses OrderCard and empty state guidance", () => {
		const source = read("modules/orders/OrdersPage.tsx");
		expect(source).toContain("OrderCard");
		expect(source).toContain("目前還沒有訂單");
		expect(source).toContain("前往商品目錄");
	});

	it("maps status badge colors and texts", () => {
		const source = read("modules/orders/components/OrderCard.tsx");
		expect(source).toContain("pending");
		expect(source).toContain("amber");
		expect(source).toContain("shipped");
		expect(source).toContain("blue");
		expect(source).toContain("completed");
		expect(source).toContain("green");
		expect(source).toContain("cancelled");
		expect(source).toContain("red");
	});
});
