import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("category listing null fallback", () => {
	it("其他分類包含 category 為 null 的商品，避免首頁入口導到空頁", () => {
		const source = readFileSync(resolve(process.cwd(), "packages/database/prisma/queries/anismile.ts"), "utf8");

		expect(source).toContain('slug === "其他"');
		expect(source).toContain("category: null");
		expect(source).toContain("andConditions");
	});
});
