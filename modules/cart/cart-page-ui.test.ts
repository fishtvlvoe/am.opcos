import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("Cart page UI contract", () => {
	it("uses CartItem and OrderSummary components", () => {
		const source = read("modules/cart/CartPage.tsx");
		expect(source).toContain("CartItem");
		expect(source).toContain("OrderSummary");
	});

	it("wires quantity update, remove and checkout flow", () => {
		const source = read("modules/cart/CartPage.tsx");
		expect(source).toContain("orpc.anismile.cart.updateQuantity");
		expect(source).toContain("orpc.anismile.cart.removeItem");
		// 結帳 API 在 CheckoutPage，CartPage 只跳轉到 /checkout
		expect(source).toContain("/checkout");
	});

	it("disables checkout on empty cart and includes shipping note", () => {
		const summarySource = read("modules/cart/components/OrderSummary.tsx");
		expect(summarySource).toContain("運費另計");
		expect(summarySource).toContain("disabled={disabled}");
	});

	it("blocks checkout when synced product state makes cart items unavailable", () => {
		const pageSource = read("modules/cart/CartPage.tsx");
		const itemSource = read("modules/cart/components/CartItem.tsx");
		const summarySource = read("modules/cart/components/OrderSummary.tsx");
		expect(pageSource).toContain("hasUnavailableItems");
		expect(pageSource).toContain("unavailableReason={item.unavailableReason}");
		expect(itemSource).toContain("unavailableReason");
		expect(summarySource).toContain("disabledReason");
	});

	it("cart API refreshes stale source products before showing or checking out", () => {
		const apiSource = read("packages/api/modules/anismile/procedures/cart.ts");
		expect(apiSource).toContain("refreshUserCartProducts(user.id)");
		expect(apiSource).toContain("pruneUnavailableCartItems(user.id)");
		expect(apiSource).toContain("crawlAnismileProductBySupplierId");
		expect(apiSource).toContain("getCartProductUnavailableReason");
	});
});
