// Vercel Cron Route — 每日 19:00 UTC（台灣時間 03:00）觸發商品同步
// 由 vercel.json 的 crons 設定排程，也可手動呼叫（需 CRON_SECRET 驗證）
import { db } from "@repo/database";
import { NextResponse } from "next/server";

import { runSync } from "@repo/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 分鐘（Vercel Pro 最長）

export async function GET(request: Request) {
	// 驗證 Cron Secret（防止外部觸發）
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// 防重複：如果 2 小時內有進行中的同步，跳過
	const running = await db.anismileSyncLog.findFirst({
		where: {
			status: "running",
			startedAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
		},
	});

	if (running) {
		return NextResponse.json({
			message: "Skipped: previous sync still running",
			syncLogId: running.id,
		});
	}

	try {
		const result = await runSync();
		return NextResponse.json({ success: true, ...result });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Sync failed";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
