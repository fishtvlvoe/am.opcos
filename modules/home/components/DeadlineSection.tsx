"use client";
 
import { Button } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";

function formatDeadlineLabel(dateStr: string, earliestDeadline: number | null) {
	if (earliestDeadline) {
		const d = new Date(earliestDeadline * 1000);
		return `${d.getMonth() + 1}月${d.getDate()}日截單`;
	}
	if (dateStr) {
		const match = dateStr.match(/(\d{4})?[年\/]?(\d{1,2})[月\/](\d{1,2})日?/);
		if (match) {
			return `${parseInt(match[2]!)}月${parseInt(match[3]!)}日截單`;
		}
	}
	return "即將截止";
}

export function DeadlineSection({ initialData }: { initialData?: { items: any[] } }) {
	const deadlineQuery = useQuery({
		...orpc.anismile.homepage.getDeadlineList.queryOptions({
			input: {},
		}),
		initialData,
	});
	const items = deadlineQuery.data?.items ?? [];

	if (deadlineQuery.isPending && !initialData) return null;
	if (items.length === 0) return null;

	return (
		<section className="mb-12">
			<h2 className="mb-4 text-lg font-bold text-stone-900">即將截單</h2>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
				{items.map((series) => {
					const label = formatDeadlineLabel(series.deadlineDate, series.earliestDeadline);
					const href = `/search?series=${encodeURIComponent(series.name)}`;

					return (
						<Link
							key={series.id}
							href={href}
							className="group relative flex flex-col overflow-hidden rounded-xl border border-stone-200/80 bg-white p-2 transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-md hover:shadow-red-500/5"
						>
							<div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-stone-100">
								{series.imageUrl ? (
									<Image
										src={series.imageUrl}
										alt={series.name}
										fill
										sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
										className="object-cover transition-transform duration-500 group-hover:scale-105"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center bg-stone-100 text-stone-400 text-xs font-medium">
										系列圖片
									</div>
								)}
								<div className="absolute top-2 left-2">
									<span className="inline-flex items-center rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.02em] text-white">
										{label}
									</span>
								</div>
							</div>
							<div className="flex flex-1 flex-col justify-between pt-2">
								<h3 className="line-clamp-2 text-xs font-semibold text-stone-800 transition-colors group-hover:text-red-600">
									{series.name}
								</h3>
								<div className="mt-1 flex items-center justify-between text-[10px] text-stone-500">
									<span>{series.manufacturer || "Anismile"}</span>
									<span className="font-medium text-stone-700">{series.productCount} 件商品</span>
								</div>
							</div>
						</Link>
					);
				})}
			</div>

			<div className="mt-6 text-center">
				<Button variant="ghost" className="text-sm font-medium text-stone-600 hover:text-stone-900 hover:underline">
					查看更多 »
				</Button>
			</div>
		</section>
	);
}
