"use client";

import Image from "next/image";
import Link from "next/link";

import { DeadlineBadge } from "./DeadlineBadge";
import { PriceDisplay } from "./PriceDisplay";

type NewArrivalItem = {
	id: string;
	titleTranslated: string;
	titleOriginal: string;
	imageUrls: unknown;
	originalPrice?: number | null;
	sellingPrice: number | null;
	orderDeadline: Date | string | null;
};

type NewArrivalsScrollProps = {
	items: NewArrivalItem[];
};

export function NewArrivalsScroll({ items }: NewArrivalsScrollProps) {
	return (
		<div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 no-scrollbar md:gap-4">
			{items.map((item) => {
				const firstImage = Array.isArray(item.imageUrls) ? String(item.imageUrls[0] ?? "") : "";
				const title = item.titleTranslated || item.titleOriginal;
				return (
					<Link
						key={item.id}
						href={`/products/${item.id}`}
						className="card-hover min-w-[42vw] snap-start rounded-xl border border-stone-200 bg-white p-3 md:min-w-[220px]"
					>
						<div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-stone-100">
							{firstImage ? <Image src={firstImage} alt={title} fill sizes="160px" className="object-cover" /> : null}
						</div>
						<div className="mt-2">
							<DeadlineBadge orderDeadline={item.orderDeadline} />
						</div>
						<p className="mt-2 line-clamp-2 text-sm text-stone-800">{title}</p>
						<PriceDisplay
							className="mt-1"
							originalPrice={item.originalPrice}
							memberPrice={item.sellingPrice}
						/>
					</Link>
				);
			})}
		</div>
	);
}
