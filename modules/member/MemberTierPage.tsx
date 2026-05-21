"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { CrownIcon, StarIcon, UserIcon } from "lucide-react";

const TIER_CONFIG = {
	NORMAL: {
		label: "普通用戶",
		icon: UserIcon,
		color: "text-stone-500",
		bg: "bg-stone-100",
	},
	WHOLESALE: {
		label: "批發用戶",
		icon: StarIcon,
		color: "text-blue-600",
		bg: "bg-blue-50",
	},
	VIP: {
		label: "VIP 會員",
		icon: CrownIcon,
		color: "text-amber-600",
		bg: "bg-amber-50",
	},
} as const;

type TierKey = keyof typeof TIER_CONFIG;

function ProgressBar({ current, max, color }: { current: number; max: number; color: string }) {
	const percent = max > 0 ? Math.min((current / max) * 100, 100) : 0;
	return (
		<div className="h-2 w-full rounded-full bg-stone-200">
			<div
				className={`h-2 rounded-full transition-all ${color}`}
				style={{ width: `${percent}%` }}
			/>
		</div>
	);
}

export function MemberTierPage() {
	const tierQuery = useQuery(orpc.anismile.memberTier.getMyTier.queryOptions({ input: {} }));
	const settingsQuery = useQuery(orpc.anismile.settings.getTierSettings.queryOptions({ input: {} }));
	const data = tierQuery.data;
	const settings = settingsQuery.data;

	const tierTable = [
		{ tier: "普通用戶", threshold: "—", discount: "定價" },
		{
			tier: "批發用戶",
			threshold: settings ? `¥${settings.wholesaleThreshold.toLocaleString()} / 月` : "—",
			discount: settings ? `${Math.round(settings.wholesaleDiscount * 100)}% 折扣` : "—",
		},
		{
			tier: "VIP 會員",
			threshold: settings ? `¥${settings.vipThreshold.toLocaleString()} / 月` : "—",
			discount: settings ? `${Math.round(settings.vipDiscount * 100)}% 折扣` : "—",
		},
	];

	if (tierQuery.isPending) {
		return (
			<div className="container py-12 text-center text-muted-foreground">載入中...</div>
		);
	}

	const tier = (data?.tier ?? "NORMAL") as TierKey;
	const config = TIER_CONFIG[tier] ?? TIER_CONFIG.NORMAL;
	const Icon = config.icon;
	const monthlyOrderAmount = data?.monthlyOrderAmount ?? 0;
	const nextTierThreshold = data?.nextTierThreshold ?? null;
	const discountRate = data?.discount ?? 0;
	const discountLabel = discountRate > 0 ? `享 ${Math.round(discountRate * 100)}% 折扣優惠` : "一般定價";

	return (
		<div className="container max-w-2xl py-10">
			<h1 className="mb-6 text-2xl font-bold">會員等級</h1>

			{/* 等級卡片 */}
			<div className={`mb-6 flex flex-col items-center gap-3 rounded-2xl p-8 ${config.bg}`}>
				<Icon className={`size-12 ${config.color}`} />
				<p className={`text-3xl font-bold ${config.color}`}>{config.label}</p>
				<p className={`text-sm font-medium ${config.color}`}>{discountLabel}</p>
				<p className="text-sm text-muted-foreground">本月訂貨額</p>
				<p className="text-2xl font-semibold">¥{monthlyOrderAmount.toLocaleString()}</p>
			</div>

			{/* 升級進度 */}
			{nextTierThreshold !== null && (
				<div className="mb-8 rounded-lg border p-5">
					<div className="mb-2 flex items-center justify-between text-sm">
						<span className="font-medium">升級進度</span>
						<span className="text-muted-foreground">
							¥{monthlyOrderAmount.toLocaleString()} / ¥{nextTierThreshold.toLocaleString()}
						</span>
					</div>
					<ProgressBar
						current={monthlyOrderAmount}
						max={nextTierThreshold}
						color="bg-amber-500"
					/>
					<p className="mt-2 text-xs text-muted-foreground">
						再訂 ¥{Math.max(0, nextTierThreshold - monthlyOrderAmount).toLocaleString()} 即可升級
					</p>
				</div>
			)}

			{/* 等級說明表格 */}
			<div className="rounded-lg border">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b bg-muted/40">
							<th className="px-4 py-3 text-left font-medium">等級</th>
							<th className="px-4 py-3 text-left font-medium">月訂貨門檻</th>
							<th className="px-4 py-3 text-left font-medium">折扣</th>
						</tr>
					</thead>
					<tbody>
						{tierTable.map((row) => (
							<tr key={row.tier} className="border-b last:border-0">
								<td className="px-4 py-3">{row.tier}</td>
								<td className="px-4 py-3 text-muted-foreground">{row.threshold}</td>
								<td className="px-4 py-3">{row.discount}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
