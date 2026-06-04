// 紅燈測試 — 元件尚未實作
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("SeriesCard 元件", () => {
	const filePath =
		"modules/catalog/components/SeriesCard.tsx";

	it("檔案存在且可讀", () => {
		expect(() => read(filePath)).not.toThrow();
	});

	it("包含 line-clamp-2（系列名稱截斷樣式）", () => {
		const source = read(filePath);
		expect(source).toContain("line-clamp-2");
	});

	it("包含 name prop（系列名稱）", () => {
		const source = read(filePath);
		expect(source).toContain("name");
	});

	it("包含 ip prop（IP 授權來源）", () => {
		const source = read(filePath);
		expect(source).toContain("ip");
	});

	it("包含 maker prop（製造商）", () => {
		const source = read(filePath);
		expect(source).toContain("maker");
	});

	it("包含 count prop（商品數量）", () => {
		const source = read(filePath);
		expect(source).toContain("count");
	});

	it("包含 Link 元件引用（點擊跳轉系列頁）", () => {
		const source = read(filePath);
		expect(source).toContain("Link");
	});

	it("包含「件商品」文字（商品數量標示）", () => {
		const source = read(filePath);
		expect(source).toContain("件商品");
	});

	it("引入 SafeImage 元件", () => {
		const source = read(filePath);
		expect(source).toContain('import { SafeImage } from "../../shared/components/SafeImage"');
	});

	it("使用 SafeImage 元件並啟用 fill, sizes, object-cover 屬性/樣式", () => {
		const source = read(filePath);
		expect(source).toContain("<SafeImage");
		expect(source).toContain("fill");
		expect(source).toContain("sizes");
		expect(source).toContain("object-cover");
	});

	it("當無可用圖片時，有顯示 placeholder 文字「系列圖片」的機制", () => {
		const source = read(filePath);
		expect(source).toContain("系列圖片");
	});
});
