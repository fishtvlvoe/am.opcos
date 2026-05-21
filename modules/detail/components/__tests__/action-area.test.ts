import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("ProductDetailPage 操作區契約", () => {
	const filePath = "modules/detail/ProductDetailPage.tsx";

	it("引用 Heart icon", () => {
		const source = read(filePath);
		expect(source).toContain("Heart");
	});

	it("引用 ShoppingCart icon（非 ShoppingCartIcon）", () => {
		const source = read(filePath);
		expect(source).toContain("ShoppingCart");
		expect(source).not.toContain("ShoppingCartIcon");
	});

	it("愛心按鈕使用 h-10 w-10 尺寸（40x40）", () => {
		const source = read(filePath);
		const hasHeartSize = source.includes("h-10") && source.includes("w-10");
		expect(hasHeartSize).toBe(true);
	});

	it("購物車按鈕使用 h-10 w-10 尺寸（40x40）", () => {
		const source = read(filePath);
		const buttonPattern = /bg-primary[\s\S]*?h-10[\s\S]*?w-10|h-10[\s\S]*?w-10[\s\S]*?bg-primary/;
		expect(buttonPattern.test(source)).toBe(true);
	});

	it("愛心 toggle 支援 fill-current", () => {
		const source = read(filePath);
		expect(source).toContain("fill-current");
	});

	it("不包含「加入購物車」文字按鈕（toast 訊息除外）", () => {
		const source = read(filePath);
		const lines = source.split("\n");
		const jsxLines = lines.filter(
			(line) => !line.includes("toastSuccess") && !line.includes("toastError"),
		);
		const jsxSource = jsxLines.join("\n");
		expect(jsxSource).not.toContain("加入購物車");
	});
});
