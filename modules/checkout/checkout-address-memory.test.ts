import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "modules/checkout/CheckoutPage.tsx"), "utf8");

describe("Checkout address memory", () => {
	it("shows identity number field for new shipping data", () => {
		expect(source).toContain("shippingIdNumber");
		expect(source).toContain("身份證字號");
		expect(source).toContain("清關用，可留空");
	});

	it("stores new shipping data as the default address after checkout", () => {
		expect(source).toContain("orpc.anismile.addresses.create.mutationOptions");
		expect(source).toContain("orpc.anismile.addresses.setDefault.mutationOptions");
		expect(source).toContain('selectedAddressId === "new"');
		expect(source).toContain("createAddressMutation.mutateAsync");
		expect(source).toContain("setDefaultAddressMutation.mutateAsync");
		expect(source).toContain("idNumber: shippingIdNumber.trim() || undefined");
	});
});
