import { Prisma } from "../generated/client";
import { describe, expect, it } from "vitest";

import { calculateBacksolveSellingPrice } from "./backsolve-pricing";

describe("backsolve pricing calculation", () => {
	it("來源 8 折 + 回推 10% = 客戶 9 折", () => {
		const sellingPrice = calculateBacksolveSellingPrice({
			originalPrice: new Prisma.Decimal(1000),
			costPrice: new Prisma.Decimal(800),
			backsolvePercent: new Prisma.Decimal(10),
		});

		expect(sellingPrice.toNumber()).toBe(900);
	});

	it("回推後超過原價時封頂為原價", () => {
		const sellingPrice = calculateBacksolveSellingPrice({
			originalPrice: new Prisma.Decimal(1000),
			costPrice: new Prisma.Decimal(950),
			backsolvePercent: new Prisma.Decimal(10),
		});

		expect(sellingPrice.toNumber()).toBe(1000);
	});
});
