"use client";

import Link from "next/link";

import { SafeImage } from "../../shared/components/SafeImage";

interface SeriesCardProps {
	series: {
		id: string;
		name: string;
		ip: string;
		maker: string;
		count: number;
		image?: string;
		href?: string;
	};
}

export function SeriesCard({ series }: SeriesCardProps) {
	return (
		<Link href={series.href ?? `/series/${encodeURIComponent(series.id)}`} className="block">
			<div className="card-hover overflow-hidden rounded-xl border border-stone-200 bg-white transition-shadow hover:shadow-md">
				<div className="relative aspect-square bg-stone-100">
					{series.image ? (
						<SafeImage
							src={series.image}
							alt={series.name}
							fill
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
							className="object-cover"
						/>
					) : (
						<div className="flex size-full items-center justify-center text-xs text-stone-500">系列圖片</div>
					)}
				</div>
				<div className="space-y-1.5 p-3">
					<p className="line-clamp-2 text-sm font-medium leading-5 text-stone-800">{series.name}</p>
					<div className="flex flex-wrap gap-1">
						<span className="inline-flex items-center rounded-md bg-stone-100 px-1.5 py-0.5 text-[11px] text-stone-600">
							{series.ip}
						</span>
						<span className="inline-flex items-center rounded-md bg-stone-100 px-1.5 py-0.5 text-[11px] text-stone-600">
							{series.maker}
						</span>
					</div>
					<p className="text-xs text-stone-500">{series.count} 件商品</p>
				</div>
			</div>
		</Link>
	);
}
