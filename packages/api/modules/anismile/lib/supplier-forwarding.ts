import {
	db,
	getOrderById,
	getSupplierOrderEmailRecipients,
} from "@repo/database";
import { sendEmail } from "@repo/mail";

import { generateOrdersCsv } from "./csv-export";

export async function forwardOrderToSupplier({
	orderId,
	actorUserId,
}: {
	orderId: string;
	actorUserId: string;
}) {
	const order = await getOrderById(orderId);
	if (!order) {
		throw new Error("Order not found");
	}
	if (order.status !== "confirmed") {
		throw new Error("訂單必須先確認無誤，才能轉發供應商");
	}

	const recipients = await getSupplierOrderEmailRecipients();
	if (recipients.length === 0) {
		throw new Error("尚未設定供應商 Email");
	}

	const csv = generateOrdersCsv([order]);
	const shortId = order.id.slice(0, 8);
	const subject = `AM 確認訂單 #${shortId}`;
	const text = [
		`訂單編號：${order.id}`,
		`客戶：${order.user.name}`,
		`金額：¥${Number(order.totalAmount).toFixed(2)}`,
		"",
		"管理者已確認訂單無誤，CSV 已附在此 Email。",
	].join("\n");
	const attachments = [
		{
			type: "text/csv",
			name: `am-order-${shortId}.csv`,
			content: Buffer.from(csv, "utf8").toString("base64"),
		},
	];

	const results = await Promise.all(
		recipients.map((to) =>
			sendEmail({
				to,
				subject,
				text,
				html: text.replace(/\n/g, "<br />"),
				attachments,
			}),
		),
	);

	const sent = results.filter(Boolean).length;
	if (sent === 0) {
		await db.anismileOrder.update({
			where: { id: orderId },
			data: { supplierForwardingError: "供應商 Email 發送失敗" },
		});
		throw new Error("供應商 Email 發送失敗");
	}

	return await db.anismileOrder.update({
		where: { id: orderId },
		data: {
			supplierForwardedAt: new Date(),
			supplierForwardedById: actorUserId,
			supplierForwardingError: null,
		},
	});
}
