import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

// 紅燈測試 — 元件尚未實作（快速下單版 ProductCard 結構）
describe("ProductCard 快速下單結構契約", () => {
	it("包含愛心收藏圖示引用", () => {
		const source = read(
			"apps/anismile/modules/catalog/components/ProductCard.tsx",
		);
		const hasHeart =
			source.includes("Heart") || source.includes("HeartIcon");
		expect(hasHeart).toBe(true);
	});

	it("包含購物車圖示引用", () => {
		const source = read(
			"apps/anismile/modules/catalog/components/ProductCard.tsx",
		);
		const hasCart =
			source.includes("ShoppingCart") ||
			source.includes("ShoppingCartIcon");
		expect(hasCart).toBe(true);
	});

	it("Heart 按鈕為 32x32（w-8 h-8）", () => {
		const source = read(
			"apps/anismile/modules/catalog/components/ProductCard.tsx",
		);
		expect(source).toContain("w-8");
		expect(source).toContain("h-8");
	});

	it("Cart 按鈕為 32x32（w-8 h-8）", () => {
		const source = read(
			"apps/anismile/modules/catalog/components/ProductCard.tsx",
		);
		// w-8 h-8 已由上面斷言覆蓋，此處確認 ShoppingCart 與尺寸共存
		const hasCart =
			source.includes("ShoppingCart") ||
			source.includes("ShoppingCartIcon");
		expect(hasCart).toBe(true);
		expect(source).toContain("w-8");
		expect(source).toContain("h-8");
	});

	it("不包含文字「加入購物車」（純圖示操作）", () => {
		const source = read(
			"apps/anismile/modules/catalog/components/ProductCard.tsx",
		);
		expect(source).not.toContain("加入購物車");
	});

	it("包含 fill-current（Heart toggle 填色）", () => {
		const source = read(
			"apps/anismile/modules/catalog/components/ProductCard.tsx",
		);
		expect(source).toContain("fill-current");
	});
});
