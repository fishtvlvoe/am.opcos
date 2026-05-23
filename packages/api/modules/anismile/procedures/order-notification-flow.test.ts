import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const routerSource = readFileSync(resolve(__dirname, "../router.ts"), "utf8");
const notificationsSource = readFileSync(resolve(__dirname, "notifications.ts"), "utf8");
const ordersSource = readFileSync(resolve(__dirname, "orders.ts"), "utf8");
const lineSource = readFileSync(resolve(__dirname, "../lib/line-notify.ts"), "utf8");
const summarySource = readFileSync(resolve(__dirname, "../lib/order-summary-email.ts"), "utf8");
const supplierSource = readFileSync(resolve(__dirname, "../lib/supplier-forwarding.ts"), "utf8");
const schemaSource = readFileSync(resolve(process.cwd(), "packages/database/prisma/schema.prisma"), "utf8");

describe("order notification and supplier forwarding contract", () => {
	it("stores admin LINE and email notification settings behind admin procedures", () => {
		expect(routerSource).toContain("notifications");
		expect(notificationsSource).toContain("anismileAdminProcedure");
		expect(notificationsSource).toContain("getOrderNotificationSettings");
		expect(notificationsSource).toContain("updateOrderNotificationSettings");
		expect(notificationsSource).toContain("testLineNotification");
	});

	it("LINE order notification prefers configured admin UID with env fallback", () => {
		expect(lineSource).toContain("getAdminLineNotificationUid");
		expect(lineSource).toContain("LINE_CHANNEL_ACCESS_TOKEN");
		expect(lineSource).toContain("sendLineText");
	});

	it("daily summary email sends CSV attachment to admin recipients", () => {
		expect(summarySource).toContain("getAdminOrderEmailRecipients");
		expect(summarySource).toContain("generateOrdersCsv");
		expect(summarySource).toContain("attachments");
		expect(summarySource).toContain("text/csv");
	});

	it("supplier forwarding requires confirmed order and records forwarding state", () => {
		expect(supplierSource).toContain('order.status !== "confirmed"');
		expect(supplierSource).toContain("getSupplierOrderEmailRecipients");
		expect(supplierSource).toContain("supplierForwardedAt");
		expect(supplierSource).toContain("supplierForwardingError");
	});

	it("orders router exposes supplier forwarding and shipment email path", () => {
		expect(routerSource).toContain("forwardSupplier");
		expect(ordersSource).toContain("forwardOrderToSupplierProcedure");
		expect(ordersSource).toContain("sendShipmentEmail");
		expect(ordersSource).toContain('input.status === "shipped"');
	});

	it("schema tracks confirmation and supplier forwarding fields", () => {
		expect(schemaSource).toContain("confirmedAt");
		expect(schemaSource).toContain("confirmedById");
		expect(schemaSource).toContain("supplierForwardedAt");
		expect(schemaSource).toContain("supplierForwardingError");
	});
});
