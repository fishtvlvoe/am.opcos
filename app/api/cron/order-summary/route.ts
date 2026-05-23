// Vercel Cron Route — 每日管理者訂單摘要 Email（需 CRON_SECRET 驗證）
import { NextResponse } from "next/server";

import { sendDailyOrderSummaryEmail } from "../../../../packages/api/modules/anismile/lib/order-summary-email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const url = new URL(request.url);
	const dateParam = url.searchParams.get("date");
	const targetDate = dateParam ? new Date(`${dateParam}T00:00:00+08:00`) : new Date();

	try {
		const result = await sendDailyOrderSummaryEmail(targetDate);
		return NextResponse.json({ success: true, ...result });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Order summary failed";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
