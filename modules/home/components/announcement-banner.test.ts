// 紅燈測試 — 元件尚未實作
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("AnnouncementBanner 元件", () => {
	const filePath =
		"apps/anismile/modules/home/components/AnnouncementBanner.tsx";

	it("檔案存在且可讀", () => {
		expect(() => read(filePath)).not.toThrow();
	});

	it("包含主色背景樣式 bg-primary", () => {
		const source = read(filePath);
		expect(source).toContain("bg-primary");
	});

	it("包含主色前景文字樣式 text-primary-foreground", () => {
		const source = read(filePath);
		expect(source).toContain("text-primary-foreground");
	});

	it("包含上下間距 py-2.5", () => {
		const source = read(filePath);
		expect(source).toContain("py-2.5");
	});

	it("包含置中對齊 text-center", () => {
		const source = read(filePath);
		expect(source).toContain("text-center");
	});

	it("包含「每日上新」文案", () => {
		const source = read(filePath);
		expect(source).toContain("每日上新");
	});
});
