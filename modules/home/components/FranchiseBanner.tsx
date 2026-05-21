"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface FranchiseBannerItem {
	franchise: string;
	image: string;
	category: string;
}

interface FranchiseBannerProps {
	items: FranchiseBannerItem[];
}

export function FranchiseBanner({ items }: FranchiseBannerProps) {
	const [groupIndex, setGroupIndex] = useState(0);

	if (items.length === 0) return null;

	const group = items.slice(groupIndex * 3, groupIndex * 3 + 3);
	const canPrev = groupIndex > 0;
	const canNext = (groupIndex + 1) * 3 < items.length;

	return (
		<div className="relative mb-4 h-[200px]">
			<div className="flex h-full gap-2">
				{group.map((item) => (
					<Link
						key={item.category}
						href={`/categories/${encodeURIComponent(item.category)}`}
						className="flex-1 overflow-hidden rounded-xl"
					>
						<img
							src={item.image}
							alt={item.franchise}
							className="size-full object-cover"
						/>
					</Link>
				))}
			</div>

			{canPrev && (
				<button
					type="button"
					onClick={() => setGroupIndex((g) => g - 1)}
					className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow hover:bg-white"
					aria-label="上一組"
				>
					<ChevronLeftIcon className="size-5 text-stone-700" />
				</button>
			)}

			{canNext && (
				<button
					type="button"
					onClick={() => setGroupIndex((g) => g + 1)}
					className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow hover:bg-white"
					aria-label="下一組"
				>
					<ChevronRightIcon className="size-5 text-stone-700" />
				</button>
			)}
		</div>
	);
}
