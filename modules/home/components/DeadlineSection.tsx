"use client";

import { Button } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { SeriesCard } from "../../catalog/components/SeriesCard";

function groupToSeries(products: Array<{ id: string; title: string | null; sellingPrice: number; imageUrls: unknown; category: string | null; franchise: string | null; brand: string | null }>) {
	const groups = new Map<string, { id: string; name: string; ip: string; maker: string; count: number; image?: string }>();
	for (const p of products) {
		const key = p.category ?? "其他";
		const existing = groups.get(key);
		if (existing) {
			existing.count++;
		} else {
			const firstImage = Array.isArray(p.imageUrls) ? String(p.imageUrls[0] ?? "") : "";
			groups.set(key, {
				id: key,
				name: key,
				ip: p.franchise ?? "",
				maker: p.brand ?? "",
				count: 1,
				image: firstImage || undefined,
			});
		}
	}
	return Array.from(groups.values());
}

export function DeadlineSection() {
	const deadlineQuery = useQuery(orpc.anismile.homepage.getDeadlineProducts.queryOptions({ input: {} }));
	const products = deadlineQuery.data?.products ?? [];
	const seriesList = groupToSeries(products);

	if (deadlineQuery.isPending) return null;
	if (products.length === 0) return null;

	const earliestDeadline = products[0]?.orderDeadline;
	const deadlineLabel = earliestDeadline ? format(new Date(earliestDeadline), "M月d日截止") : "";

	return (
		<section className="mb-12">
			<h2 className="mb-4 text-lg font-bold text-stone-900">即將截單</h2>
			{deadlineLabel && (
				<div className="mb-4">
					<span className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium tracking-[0.02em] text-red-700">
						{deadlineLabel}
					</span>
				</div>
			)}

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
				{seriesList.map((s) => (
					<SeriesCard key={s.id} series={s} />
				))}
			</div>

			<div className="mt-6 text-center">
				<Button variant="ghost" className="text-sm font-medium text-primary hover:text-primary/80 hover:underline">
					查看更多 »
				</Button>
			</div>
		</section>
	);
}
