"use client";

import { cn } from "@repo/ui";
import Image from "next/image";
import { useMemo, useState } from "react";

type ImageGalleryProps = {
	images: string[];
	title: string;
};

export function ImageGallery({ images, title }: ImageGalleryProps) {
	const normalized = useMemo(() => images.filter(Boolean), [images]);
	const [activeIndex, setActiveIndex] = useState(0);

	const active = normalized[activeIndex];

	return (
		<div className="space-y-3">
			<div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
				{active ? <Image src={active} alt={title} fill className="object-cover" /> : null}
			</div>

			{normalized.length > 1 ? (
				<div className="grid grid-cols-5 gap-2">
					{normalized.map((src, index) => (
						<button
							key={src}
							type="button"
							onClick={() => setActiveIndex(index)}
							className={cn(
								"relative aspect-square overflow-hidden rounded-md border border-stone-200",
								index === activeIndex && "ring-2 ring-stone-900",
							)}
						>
							<Image src={src} alt={`${title}-${index + 1}`} fill className="object-cover" />
						</button>
					))}
				</div>
			) : null}
		</div>
	);
}
