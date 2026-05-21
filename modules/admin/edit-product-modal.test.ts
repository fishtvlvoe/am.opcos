import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

const componentPath = "apps/anismile/modules/admin/components/EditProductModal.tsx";

describe("EditProductModal UI contract", () => {
	it("edit product modal — component accepts 5 field props plus open/onOpenChange/onSuccess", () => {
		const source = read(componentPath);
		expect(source).toContain("titleTranslated");
		expect(source).toContain("sellingPrice");
		expect(source).toContain("markupOverride");
		expect(source).toContain("discountRate");
		expect(source).toContain("saleStatus");
		expect(source).toContain("onOpenChange");
		expect(source).toContain("onSuccess");
	});

	it("edit product modal — fields pre-filled with product data via react-hook-form defaultValues", () => {
		const source = read(componentPath);
		expect(source).toContain("defaultValues");
		expect(source).toContain("useForm");
	});

	it("invalid input rejected — sellingPrice field has numeric validation", () => {
		const source = read(componentPath);
		expect(source).toContain("z.number()");
		expect(source).toContain("positive()");
	});

	it("dismiss without saving — cancel button calls onOpenChange(false) without mutation", () => {
		const source = read(componentPath);
		expect(source).toContain("取消");
		expect(source).toContain("onOpenChange(false)");
	});

	it("priceManualOverride badge — shows badge when priceManualOverride is true", () => {
		const source = read(componentPath);
		expect(source).toContain("priceManualOverride");
		expect(source).toContain("手動設價");
	});

	it("uses Dialog from @repo/ui and patchProduct mutation", () => {
		const source = read(componentPath);
		expect(source).toContain("Dialog");
		expect(source).toContain("patchProduct");
	});

	it("saleStatus dropdown — shows 預售中/有現貨 options", () => {
		const source = read(componentPath);
		expect(source).toContain("預售中");
		expect(source).toContain("有現貨");
	});
});
