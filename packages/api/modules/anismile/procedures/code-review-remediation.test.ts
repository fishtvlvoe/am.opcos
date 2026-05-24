import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readFromRoot(path: string) {
	return readFileSync(resolve(__dirname, "../../../../..", path), "utf8");
}

const memberTierSource = readFileSync(resolve(__dirname, "member-tier.ts"), "utf8");
const productPoolSource = readFileSync(resolve(__dirname, "product-pool.ts"), "utf8");
const importOrderSource = readFileSync(resolve(__dirname, "import-order.ts"), "utf8");
const authenticatedLayoutSource = readFromRoot("app/(authenticated)/layout.tsx");
const orderSummaryCronSource = readFromRoot("app/api/cron/order-summary/route.ts");
const adminOrdersPageSource = readFromRoot("modules/admin/AdminOrdersPage.tsx");
const orderTableSource = readFromRoot("modules/admin/components/OrderTable.tsx");
const importOrderPageSource = readFromRoot("modules/import-order/ImportOrderPage.tsx");
const checkoutPageSource = readFromRoot("modules/checkout/CheckoutPage.tsx");
const settingsRouteSource = readFromRoot("app/(authenticated)/admin/settings/page.tsx");
const adminSettingsPageSource = readFromRoot("modules/admin/AdminSettingsPage.tsx");

describe("code review remediation contracts", () => {
	it("admin member tier and product pool mutations use admin middleware", () => {
		expect(memberTierSource).toContain("adminUpdateTier = anismileAdminProcedure");
		expect(productPoolSource).toContain("adminBatchUpdateItemStatus = anismileAdminProcedure");
	});

	it("batch item status input is restricted to known statuses", () => {
		expect(productPoolSource).toContain('z.enum(["pending", "confirmed", "shipped", "completed", "cancelled"])');
	});

	it("visual auth bypass cannot run in production", () => {
		expect(authenticatedLayoutSource).toContain('process.env.NODE_ENV !== "production"');
		expect(authenticatedLayoutSource).toContain("ANISMILE_VISUAL_TEST_BYPASS_AUTH");
	});

	it("cron route fails closed when CRON_SECRET is missing", () => {
		expect(orderSummaryCronSource).toContain("Cron secret is not configured");
		expect(orderSummaryCronSource).toContain("process.env.CRON_SECRET?.trim()");
	});

	it("CSV import rejects invalid quantities and unavailable products", () => {
		expect(importOrderPageSource).toContain("isValidQuantity");
		expect(importOrderPageSource).toContain("請輸入 1 到 9999 的整數");
		expect(importOrderSource).toContain("getProductUnavailableReason");
		expect(importOrderSource).toContain("inStock: true");
		expect(importOrderSource).toContain("orderDeadline: true");
	});

	it("checkout blocks unavailable cart items before submission", () => {
		expect(checkoutPageSource).toContain("hasUnavailableItems");
		expect(checkoutPageSource).toContain("購物車含有無法下單商品");
		expect(checkoutPageSource).toContain("item.unavailableReason");
	});

	it("admin order export is manual and status select is controlled", () => {
		expect(adminOrdersPageSource).toContain("enabled: false");
		expect(adminOrdersPageSource).toContain("await exportQuery.refetch()");
		expect(adminOrdersPageSource).toContain("value={row.status}");
		expect(orderTableSource).toContain("value={row.status}");
	});

	it("admin settings route allows admins for notification settings while role management stays super admin only", () => {
		expect(settingsRouteSource).toContain('session.user.role !== "admin"');
		expect(settingsRouteSource).toContain('session.user.role !== "super_admin"');
		expect(adminSettingsPageSource).toContain("enabled: isSuperAdmin");
		expect(adminSettingsPageSource).toContain("{isSuperAdmin ? (");
		expect(adminSettingsPageSource).toContain("defaultMarkupQuery.data?.value");
	});
});
