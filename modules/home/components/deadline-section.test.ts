// 紅燈測試 — 元件尚未實作
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("DeadlineSection 元件", () => {
	const filePath = "apps/anismile/modules/home/components/DeadlineSection.tsx";

	it("檔案存在且可讀", () => {
		expect(() => read(filePath)).not.toThrow();
	});

	it("包含「即將截單」標題文案", () => {
		const source = read(filePath);
		expect(source).toContain("即將截單");
	});

	it("包含紅色 border badge 樣式（border-red）", () => {
		const source = read(filePath);
		expect(source).toContain("border-red");
	});

	it("包含紅色背景 badge 樣式（bg-red）", () => {
		const source = read(filePath);
		expect(source).toContain("bg-red");
	});

	it("包含紅色文字 badge 樣式（text-red）", () => {
		const source = read(filePath);
		expect(source).toContain("text-red");
	});

	it("包含 SeriesCard 元件引用", () => {
		const source = read(filePath);
		expect(source).toContain("SeriesCard");
	});
});
