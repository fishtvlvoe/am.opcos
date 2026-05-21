"use client";

import { cn } from "@repo/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type FeaturedProduct = {
	id: string;
	title: string;
	imageUrl?: string | null;
	sellingPrice: number;
	originalPrice?: number | null;
	discountRate?: number | null;
};

interface FeaturedCarouselProps {
	products: FeaturedProduct[];
}

const ITEMS_PER_PAGE = 3;
const MAX_THUMBS = 5;

export function FeaturedCarousel({ products }: FeaturedCarouselProps) {
	const [currentPage, setCurrentPage] = useState(0);
	const [selectedThumb, setSelectedThumb] = useState(0);
	const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
	const currentProducts = products.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);
	const thumbProducts = products.slice(0, MAX_THUMBS);

	const prev = () => setCurrentPage((c) => (c - 1 + totalPages) % totalPages);
	const next = () => setCurrentPage((c) => (c + 1) % totalPages);

	if (products.length === 0) return null;

	return (
		<div className="mb-8 flex gap-4">
			{/* 左側垂直縮圖列 */}
			<div className="flex flex-col gap-2 w-20 flex-shrink-0">
				{thumbProducts.map((p, i) => (
					<button
						key={p.id}
						type="button"
						onClick={() => {
							setSelectedThumb(i);
							setCurrentPage(Math.floor(i / ITEMS_PER_PAGE));
						}}
						className={cn(
							"aspect-square w-full overflow-hidden rounded-lg border bg-stone-100 transition-colors",
							selectedThumb === i ? "border-primary ring-1 ring-primary" : "border-stone-200 hover:border-stone-300",
						)}
					>
						{p.imageUrl ? (
							<Image src={p.imageUrl} alt={p.title} width={80} height={80} className="size-full object-cover" />
						) : (
							<div className="flex size-full items-center justify-center text-xs text-stone-500">縮圖</div>
						)}
					</button>
				))}
			</div>

			{/* 右側 3 卡 grid */}
			<div className="flex-1 relative">
				<div className="grid grid-cols-3 gap-3">
					{currentProducts.map((p) => (
						<Link key={p.id} href={`/products/${p.id}`} className="block">
							<div className="overflow-hidden rounded-xl border border-stone-200 bg-white transition-shadow hover:shadow-md">
								<div className="relative aspect-square bg-stone-100">
									{p.imageUrl ? (
										<Image src={p.imageUrl} alt={p.title} fill className="object-cover" />
									) : (
										<div className="flex size-full items-center justify-center text-xs text-stone-500">商品圖片</div>
									)}
								</div>
								<div className="space-y-1 p-3">
									<p className="line-clamp-2 text-sm font-medium leading-5 text-stone-800">{p.title}</p>
									<div className="flex items-center gap-2">
										{p.originalPrice && (
											<span className="text-xs text-stone-500 line-through">¥{p.originalPrice}</span>
										)}
									</div>
									<div className="flex items-center gap-2 text-sm">
										<span className="font-semibold text-stone-900">¥{p.sellingPrice}</span>
										{p.discountRate && (
											<span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
												{Math.round(p.discountRate * 100)}折
											</span>
										)}
									</div>
								</div>
							</div>
						</Link>
					))}
				</div>

				{/* 左右箭頭 */}
				{totalPages > 1 && (
					<>
						<button
							type="button"
							onClick={prev}
							className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm hover:bg-black/60"
						>
							<ChevronLeft className="size-4" />
						</button>
						<button
							type="button"
							onClick={next}
							className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm hover:bg-black/60"
						>
							<ChevronRight className="size-4" />
						</button>
					</>
				)}

				{/* 分頁 dot */}
				{totalPages > 1 && (
					<div className="mt-3 flex justify-center gap-1.5">
						{Array.from({ length: totalPages }).map((_, i) => (
							<button
								key={i}
								type="button"
								onClick={() => setCurrentPage(i)}
								className={cn(
									"size-2 rounded-full transition-colors",
									i === currentPage ? "bg-primary" : "bg-stone-300",
								)}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
