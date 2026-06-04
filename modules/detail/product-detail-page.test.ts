import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("Product detail public flow", () => {
	it("provides public route and login redirect contract", () => {
		const routeSource = read("app/(public)/products/[id]/page.tsx");
		const pageSource = read("modules/detail/ProductDetailPage.tsx");

		expect(routeSource).toContain("ProductDetailPage");
		expect(pageSource).toContain("NEXT_PUBLIC_OPCOS_URL");
		expect(pageSource).toContain("/login?redirect=");
		expect(pageSource).toContain("cart.add");
	});

	it("includes image gallery and quantity selector boundaries", () => {
		const pageSource = read("modules/detail/ProductDetailPage.tsx");
		const quantitySource = read("modules/detail/components/QuantitySelector.tsx");

		expect(pageSource).toContain("ImageGallery");
		expect(pageSource).toContain("QuantitySelector");
		expect(quantitySource).toContain("min = 1");
		expect(quantitySource).toContain("max = 99");
	});

	it("shows public original price and member price contract", () => {
		const pageSource = read("modules/detail/ProductDetailPage.tsx");

		expect(pageSource).toContain("原價");
		expect(pageSource).toContain("會員價");
		expect(pageSource).toContain("登入查看會員價");
		expect(pageSource).toContain("目前未加成");
		expect(pageSource).toContain("sm:grid-cols-2");
	});

	it("formats discount fold labels without trailing .0", () => {
		const pageSource = read("modules/detail/ProductDetailPage.tsx");

		expect(pageSource).toContain("function formatDiscountFoldLabel");
		expect(pageSource).toContain("Number.isInteger(fold) ? String(fold) : fold.toFixed(1)");
	});

	it("uses next/image for related products", () => {
		const pageSource = read("modules/detail/ProductDetailPage.tsx");

		expect(pageSource).toContain('import { SafeImage } from "../shared/components/SafeImage"');
		expect(pageSource).toContain("<SafeImage");
		expect(pageSource).not.toContain("img src={String(rp.imageUrls[0])}");
	});
});

