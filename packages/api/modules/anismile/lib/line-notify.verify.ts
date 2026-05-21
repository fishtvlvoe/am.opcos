import { notifyAdminNewOrder } from "./line-notify";

async function main() {
	delete process.env.LINE_CHANNEL_ACCESS_TOKEN;
	delete process.env.LINE_ADMIN_LINE_UID;

	await notifyAdminNewOrder({
		orderId: "TEST-001",
		customerName: "測試用戶",
		total: "1000",
		shippingAddress: "台北市中正區",
	});

	console.log("LINE notify: silent skip (no token) ✓");
}

main().catch(console.error);
