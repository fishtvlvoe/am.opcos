import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workspaceRoot = resolve(__dirname, "../../../../..");
const rootFile = (path: string) => resolve(workspaceRoot, path);

const procedureSource = readFileSync(
	rootFile("packages/api/modules/anismile/procedures/cart.ts"),
	"utf8",
);
const routerSource = readFileSync(
	rootFile("packages/api/modules/anismile/router.ts"),
	"utf8",
);
const querySource = readFileSync(
	rootFile("packages/database/prisma/queries/anismile.ts"),
	"utf8",
);

describe("anismile cart contract", () => {
	it("exposes cart API shape for addItem/getItems/updateQuantity/removeItem/checkout", () => {
		expect(procedureSource).toContain("export const addCartItem");
		expect(procedureSource).toContain("export const getCartItems");
		expect(procedureSource).toContain("export const updateCartItemQuantity");
		expect(procedureSource).toContain("export const removeCartItemProcedure");
		expect(procedureSource).toContain("export const checkoutCart");
		expect(routerSource).toContain("addItem");
		expect(routerSource).toContain("getItems");
		expect(routerSource).toContain("updateQuantity");
		expect(routerSource).toContain("removeItem");
		expect(routerSource).toContain("checkout");
	});

	it("guards add-to-cart by order deadline", () => {
		expect(querySource).toContain("orderDeadline");
		expect(querySource).toContain("Product order deadline has passed");
	});
});
