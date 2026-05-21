import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workspaceRoot = resolve(__dirname, "../../../../..");
const rootFile = (path: string) => resolve(workspaceRoot, path);

const cartSource = readFileSync(
	rootFile("packages/api/modules/anismile/procedures/cart.ts"),
	"utf8",
);
const importOrderSource = readFileSync(
	rootFile("packages/api/modules/anismile/procedures/import-order.ts"),
	"utf8",
);
const databaseSource = readFileSync(
	rootFile("packages/database/prisma/queries/anismile.ts"),
	"utf8",
);
const tierAdjusterSource = readFileSync(
	rootFile("packages/sync/src/tier-adjuster.ts"),
	"utf8",
);

describe("tier settings sync contract", () => {
	it("uses shared getTierSettingsValues helper with fallback defaults", () => {
		expect(databaseSource).toContain("export async function getTierSettingsValues()");
		expect(databaseSource).toContain("tier_wholesale_discount");
		expect(databaseSource).toContain("tier_vip_discount");
		expect(databaseSource).toContain("tier_wholesale_threshold");
		expect(databaseSource).toContain("tier_vip_threshold");
		expect(databaseSource).toContain("wholesaleDiscount: 0.03");
		expect(databaseSource).toContain("vipDiscount: 0.05");
		expect(databaseSource).toContain("wholesaleThreshold: 5_000_000");
		expect(databaseSource).toContain("vipThreshold: 10_000_000");
	});

	it("removes hardcoded tier discounts from cart and import-order procedures", () => {
		expect(cartSource).not.toContain("const TIER_DISCOUNTS");
		expect(importOrderSource).not.toContain("const TIER_DISCOUNTS");
		expect(cartSource).toContain("await getTierSettingsValues()");
		expect(importOrderSource).toContain("await getTierSettingsValues()");
	});

	it("removes hardcoded tier discounts from createOrderFromCart", () => {
		expect(databaseSource).not.toContain("const TIER_DISCOUNTS");
		expect(databaseSource).toContain("const tierSettings = await getTierSettingsValues()");
	});

	it("reads tier thresholds from DB in tier adjuster", () => {
		expect(tierAdjusterSource).not.toContain("const TIER_THRESHOLDS");
		expect(tierAdjusterSource).toContain("async function determineTier(amount: number)");
		expect(tierAdjusterSource).toContain("await getTierSettingsValues()");
		expect(tierAdjusterSource).toContain("tierSettings.vipThreshold");
		expect(tierAdjusterSource).toContain("tierSettings.wholesaleThreshold");
	});
});
