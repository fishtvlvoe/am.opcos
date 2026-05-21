import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("Product detail public flow", () => {
	it("provides public route and login redirect contract", () => {
		const routeSource = read("apps/anismile/app/(authenticated)/products/[id]/page.tsx");
		const pageSource = read("apps/anismile/modules/detail/ProductDetailPage.tsx");

		expect(routeSource).toContain("ProductDetailPage");
		expect(pageSource).toContain("NEXT_PUBLIC_OPCOS_URL");
		expect(pageSource).toContain("/login?redirect=");
		expect(pageSource).toContain("cart.add");
	});

	it("includes image gallery and quantity selector boundaries", () => {
		const pageSource = read("apps/anismile/modules/detail/ProductDetailPage.tsx");
		const quantitySource = read("apps/anismile/modules/detail/components/QuantitySelector.tsx");

		expect(pageSource).toContain("ImageGallery");
		expect(pageSource).toContain("QuantitySelector");
		expect(quantitySource).toContain("min = 1");
		expect(quantitySource).toContain("max = 99");
	});
});
