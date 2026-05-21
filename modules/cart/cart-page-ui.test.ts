import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("Cart page UI contract", () => {
	it("uses CartItem and OrderSummary components", () => {
		const source = read("apps/anismile/modules/cart/CartPage.tsx");
		expect(source).toContain("CartItem");
		expect(source).toContain("OrderSummary");
	});

	it("wires quantity update, remove and checkout flow", () => {
		const source = read("apps/anismile/modules/cart/CartPage.tsx");
		expect(source).toContain("orpc.anismile.cart.updateQuantity");
		expect(source).toContain("orpc.anismile.cart.removeItem");
		// 結帳 API 在 CheckoutPage，CartPage 只跳轉到 /checkout
		expect(source).toContain("/checkout");
	});

	it("disables checkout on empty cart and includes shipping note", () => {
		const summarySource = read("apps/anismile/modules/cart/components/OrderSummary.tsx");
		expect(summarySource).toContain("運費另計");
		expect(summarySource).toContain("disabled={disabled}");
	});
});
