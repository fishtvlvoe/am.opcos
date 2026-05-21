// Vercel Cron Route — 每月 1 日 20:00 UTC 觸發會員等級批量調整
// 由 vercel.json 的 crons 設定排程，也可手動呼叫（需 CRON_SECRET 驗證）
import { NextResponse } from "next/server";

import { adjustAllTiers } from "@repo/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 等級調整通常在 1 分鐘內完成

export async function GET(request: Request) {
	// 驗證 Cron Secret（防止外部觸發）
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const result = await adjustAllTiers();
		return NextResponse.json({ success: true, ...result });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Tier adjust failed";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
