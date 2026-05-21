import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workspaceRoot = resolve(__dirname, "../../../../..");
const rootFile = (path: string) => resolve(workspaceRoot, path);

const templateSource = readFileSync(
	rootFile("packages/mail/emails/OrderConfirmation.tsx"),
	"utf8",
);

const ordersSource = readFileSync(
	resolve(__dirname, "orders.ts"),
	"utf8",
);

const mailIndexSource = readFileSync(
	rootFile("packages/mail/emails/index.ts"),
	"utf8",
);

describe("OrderConfirmation email template contract", () => {
	it("exports OrderConfirmation named function with correct props", () => {
		expect(templateSource).toContain("export function OrderConfirmation");
		expect(templateSource).toContain("orderId");
		expect(templateSource).toContain("customerName");
		expect(templateSource).toContain("items");
		expect(templateSource).toContain("totalAmount");
		expect(templateSource).toContain("notes");
	});

	it("subject uses first 8 chars of orderId", () => {
		expect(templateSource).toContain("訂單確認 #");
		expect(templateSource).toContain("orderId");
		expect(templateSource).toMatch(/slice\(0,\s*8\)/);
	});

	it("registered in mail index as orderConfirmation", () => {
		expect(mailIndexSource).toContain("orderConfirmation");
		expect(mailIndexSource).toContain("OrderConfirmation");
	});
});

describe("createOrder handler email integration contract", () => {
	it("imports sendEmail from @repo/mail", () => {
		expect(ordersSource).toContain('sendEmail');
		expect(ordersSource).toContain("@repo/mail");
	});

	it("calls sendEmail with orderConfirmation templateId after createOrderFromCart", () => {
		expect(ordersSource).toContain('"orderConfirmation"');
	});

	it("sends to user.email with orderId, items, totalAmount in context", () => {
		expect(ordersSource).toContain("user.email");
		expect(ordersSource).toContain("order.id");
		expect(ordersSource).toContain("order.items");
		expect(ordersSource).toContain("order.totalAmount");
	});
});
