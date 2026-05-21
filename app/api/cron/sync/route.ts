// Vercel Cron Route — 每日 19:00 UTC（台灣時間 03:00）觸發商品同步
// 由 vercel.json 的 crons 設定排程，也可手動呼叫（需 CRON_SECRET 驗證）
import { db } from "@repo/database";
import { NextResponse } from "next/server";

import { runSync } from "@repo/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 分鐘（Vercel Pro 最長）
const STALE_RUNNING_SYNC_MS = 10 * 60 * 1000;

export async function GET(request: Request) {
	// 驗證 Cron Secret（防止外部觸發）
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const staleCutoff = new Date(Date.now() - STALE_RUNNING_SYNC_MS);
	await db.anismileSyncLog.updateMany({
		where: {
			status: "running",
			startedAt: { lt: staleCutoff },
		},
		data: {
			status: "failed",
			finishedAt: new Date(),
			productsFailed: 1,
			errorMessage: "Sync timed out or was interrupted before completion; stale running log cleared before retry.",
		},
	});

	// 防重複：只阻擋仍在 Vercel 執行時間窗內的同步，避免 timeout 殘留卡住後續 cron
	const running = await db.anismileSyncLog.findFirst({
		where: {
			status: "running",
			startedAt: { gte: staleCutoff },
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
