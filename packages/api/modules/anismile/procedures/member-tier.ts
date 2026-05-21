import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

const TIER_SETTING_KEYS = [
	"tier_wholesale_discount",
	"tier_vip_discount",
	"tier_wholesale_threshold",
	"tier_vip_threshold",
] as const;

const TIER_SETTING_DEFAULTS = {
	tier_wholesale_discount: 0.03,
	tier_vip_discount: 0.05,
	tier_wholesale_threshold: 5_000_000,
	tier_vip_threshold: 10_000_000,
};

async function loadTierSettings() {
	const rows = await db.anismileSetting.findMany({
		where: { key: { in: [...TIER_SETTING_KEYS] } },
	});
	const get = (k: keyof typeof TIER_SETTING_DEFAULTS) => {
		const row = rows.find((r) => r.key === k);
		return row ? Number(row.value) : TIER_SETTING_DEFAULTS[k];
	};
	return {
		wholesaleDiscount: get("tier_wholesale_discount"),
		vipDiscount: get("tier_vip_discount"),
		wholesaleThreshold: get("tier_wholesale_threshold"),
		vipThreshold: get("tier_vip_threshold"),
	};
}

export const getMyTier = protectedProcedure
	.route({
		method: "GET",
		path: "/anismile/member-tier/me",
		tags: ["Anismile"],
		summary: "Get my member tier info",
	})
	.handler(async ({ context: { user } }) => {
		const [userRecord, tierSettings] = await Promise.all([
			db.user.findUnique({
				where: { id: user.id },
				select: { anismileTier: true },
			}),
			loadTierSettings(),
		]);

		const tier = (userRecord?.anismileTier ?? "NORMAL") as "NORMAL" | "WHOLESALE" | "VIP";

		const discountMap = {
			NORMAL: 0,
			WHOLESALE: tierSettings.wholesaleDiscount,
			VIP: tierSettings.vipDiscount,
		};

		const now = new Date();
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

		const monthlyOrders = await db.anismileOrder.aggregate({
			where: {
				userId: user.id,
				status: { in: ["confirmed", "shipped", "completed"] },
				createdAt: { gte: monthStart, lte: monthEnd },
			},
			_sum: { totalAmount: true },
		});

		const monthlyOrderAmount = monthlyOrders._sum.totalAmount?.toNumber() ?? 0;

		let nextTierThreshold: number | null = null;
		if (tier === "NORMAL") {
			nextTierThreshold = tierSettings.wholesaleThreshold;
		} else if (tier === "WHOLESALE") {
			nextTierThreshold = tierSettings.vipThreshold;
		}

		const progressPercent =
			nextTierThreshold !== null
				? Math.min(Math.round((monthlyOrderAmount / nextTierThreshold) * 100), 100)
				: 100;

		return {
			tier,
			discount: discountMap[tier],
			monthlyOrderAmount,
			nextTierThreshold,
			progressPercent,
		};
	});

export const adminUpdateTier = protectedProcedure
	.route({
		method: "PATCH",
		path: "/anismile/member-tier/{userId}",
		tags: ["Anismile"],
		summary: "Admin: update user tier",
	})
	.input(
		z.object({
			userId: z.string().min(1),
			tier: z.enum(["NORMAL", "WHOLESALE", "VIP"]),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		if (user.role !== "admin" && user.role !== "super_admin") {
			throw new ORPCError("FORBIDDEN", { message: "無管理員權限" });
		}
		if (user.role === "admin" && input.tier === "VIP") {
			throw new ORPCError("FORBIDDEN", { message: "管理員無法設定 VIP 等級" });
		}

		await db.user.update({
			where: { id: input.userId },
			data: {
				anismileTier: input.tier,
				anismileTierUpdatedAt: new Date(),
			},
		});

		return { success: true, tier: input.tier };
	});
