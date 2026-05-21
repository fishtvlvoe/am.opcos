// 會員等級月度批量調整
// 每月 1 日凌晨根據上月訂貨額升降等級
import { db, getTierSettingsValues } from "@repo/database";
import { logger } from "@repo/logs";

// 等級順序（用於比較升降）
const TIER_ORDER = ["NORMAL", "WHOLESALE", "VIP"] as const;
type MemberTier = (typeof TIER_ORDER)[number];

export type TierAdjustResult = {
	upgraded: number;
	downgraded: number;
	unchanged: number;
};

async function determineTier(amount: number): Promise<MemberTier> {
	const tierSettings = await getTierSettingsValues();
	if (amount >= tierSettings.vipThreshold) return "VIP";
	if (amount >= tierSettings.wholesaleThreshold) return "WHOLESALE";
	return "NORMAL";
}

function compareTier(a: MemberTier, b: MemberTier): number {
	return TIER_ORDER.indexOf(a) - TIER_ORDER.indexOf(b);
}

/**
 * 批量調整所有用戶的會員等級
 * 依據上個月的訂貨額計算應有等級，並更新差異
 */
export async function adjustAllTiers(): Promise<TierAdjustResult> {
	const now = new Date();
	const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

	// 查詢所有有訂單紀錄的用戶
	const users = await db.user.findMany({
		where: {
			anismileOrders: { some: {} },
		},
		select: {
			id: true,
			anismileTier: true,
		},
	});

	logger.info(`[tier-adjuster] processing ${users.length} users`);

	let upgraded = 0;
	let downgraded = 0;
	let unchanged = 0;

	for (const user of users) {
		// 計算上月訂貨額（不含取消訂單）
		const result = await db.anismileOrder.aggregate({
			where: {
				userId: user.id,
				status: { not: "cancelled" },
				createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
			},
			_sum: { totalAmount: true },
		});

		const amount = Number(result._sum.totalAmount ?? 0);
		const newTier = await determineTier(amount);
		const oldTier = (user.anismileTier ?? "NORMAL") as MemberTier;

		if (newTier !== oldTier) {
			await db.user.update({
				where: { id: user.id },
				data: {
					anismileTier: newTier,
					anismileTierUpdatedAt: now,
				},
			});

			const tierDiff = compareTier(newTier, oldTier);
			if (tierDiff > 0) {
				upgraded++;
			} else {
				downgraded++;
			}

			logger.info(`[tier-adjuster] user ${user.id}: ${oldTier} → ${newTier} (¥${amount.toLocaleString()})`);
		} else {
			unchanged++;
		}
	}

	logger.info(`[tier-adjuster] done — upgraded: ${upgraded}, downgraded: ${downgraded}, unchanged: ${unchanged}`);

	return { upgraded, downgraded, unchanged };
}
