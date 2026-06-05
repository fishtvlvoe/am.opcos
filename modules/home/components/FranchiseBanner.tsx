"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface FranchiseBannerItem {
	name: string;
	image: string;
	href?: string;
	copyrightText?: string;
	copyrightColor?: string;
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
				{group.map((item) => {
					const content = (
						<>
						<Image
							src={item.image}
							alt={item.name}
							fill
							sizes="(max-width: 768px) 100vw, 33vw"
							className="object-cover"
						/>
							{item.copyrightText && (
								<span
									className="absolute bottom-2 left-2 right-2 text-[11px] font-medium drop-shadow"
									style={{ color: item.copyrightColor ?? "white" }}
								>
									{item.copyrightText}
								</span>
							)}
						</>
					);

					return item.href ? (
						<Link
							key={item.href}
							href={item.href}
							className="relative flex-1 overflow-hidden rounded-xl"
						>
							{content}
						</Link>
					) : (
						<div
							key={item.name}
							className="relative flex-1 overflow-hidden rounded-xl"
						>
							{content}
						</div>
					);
				})}
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
