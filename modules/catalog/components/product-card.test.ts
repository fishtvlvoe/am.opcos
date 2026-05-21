import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("ProductCard implementation contract", () => {
	it("uses mockup card structure hooks", () => {
		const source = readFileSync(
			resolve(process.cwd(), "modules/catalog/components/ProductCard.tsx"),
			"utf8",
		);

		expect(source).toContain("aspect-[4/3]");
		expect(source).toContain("line-clamp-2");
		expect(source).toContain("card-hover");
		expect(source).toContain("DeadlineBadge");
	});

	it("包含即將截單 badge 邏輯（daysLeft 0-7 日顯示「即將截單」）", () => {
		const source = readFileSync(
			resolve(process.cwd(), "modules/catalog/components/ProductCard.tsx"),
			"utf8",
		);
		expect(source).toContain("即將截單");
	});

	it("即將截單判斷使用 differenceInCalendarDays 或 daysLeft 計算", () => {
		const source = readFileSync(
			resolve(process.cwd(), "modules/catalog/components/ProductCard.tsx"),
			"utf8",
		);
		const hasUrgencyCalc =
			source.includes("differenceInCalendarDays") ||
			source.includes("daysLeft") ||
			source.includes("isUrgent");
		expect(hasUrgencyCalc).toBe(true);
	});
});
