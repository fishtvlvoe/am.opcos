import { getAdminLineNotificationUid } from "@repo/database";

export async function sendLineText(to: string, text: string): Promise<void> {
	const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
	if (!token) return;

	const response = await fetch("https://api.line.me/v2/bot/message/push", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ to, messages: [{ type: "text", text }] }),
	});

	if (!response.ok) {
		const body = await response.text().catch(() => "");
		console.error("[LINE] push failed:", response.status, body);
	}
}

export async function notifyAdminNewOrder(params: {
	orderId: string;
	customerName: string;
	total: string;
	shippingAddress: string;
}): Promise<void> {
	const adminUid = await getAdminLineNotificationUid();
	if (!adminUid) return;

	const message = `🛒 新訂單 #${params.orderId}\n客戶：${params.customerName}\n金額：NT$${params.total}\n配送：${params.shippingAddress}`;
	await sendLineText(adminUid, message);
}
