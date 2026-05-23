import {
	getAdminOrderEmailRecipients,
	getOrdersForExport,
} from "@repo/database";
import { sendEmail } from "@repo/mail";

import { generateOrdersCsv } from "./csv-export";

function taipeiDateLabel(date: Date) {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Taipei",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(date);
}

function startOfTaipeiDate(date: Date) {
	const [year, month, day] = taipeiDateLabel(date).split("-").map(Number);
	return new Date(Date.UTC(year, month - 1, day, -8, 0, 0, 0));
}

function endOfDay(start: Date) {
	return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export async function sendDailyOrderSummaryEmail(targetDate = new Date()) {
	const recipients = await getAdminOrderEmailRecipients();
	const dateStart = startOfTaipeiDate(targetDate);
	const dateEnd = endOfDay(dateStart);
	const orders = await getOrdersForExport({ startDate: dateStart, endDate: dateEnd });
	const csv = generateOrdersCsv(orders);
	const totalAmount = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
	const date = taipeiDateLabel(targetDate);
	const dateLabel = targetDate.toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei" });
	const filename = `am-orders-${date}.csv`;
	const subject = `AM 每日訂單彙整 ${dateLabel}（${orders.length} 筆）`;
	const text = [
		`日期：${dateLabel}`,
		`訂單數：${orders.length}`,
		`訂單總額：¥${totalAmount.toFixed(2)}`,
		"",
		"CSV 已附在此 Email。也可以登入 AM 後台訂單管理頁確認訂單內容。",
	].join("\n");

	const attachments = [
		{
			type: "text/csv",
			name: filename,
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

	return {
		date,
		recipients: recipients.length,
		orders: orders.length,
		sent: results.filter(Boolean).length,
	};
}
