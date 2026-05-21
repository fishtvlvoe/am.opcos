"use client";

import { useSession } from "@auth/hooks/use-session";
import { cn } from "@repo/ui";
import { differenceInCalendarDays, format } from "date-fns";
import { Heart, MinusIcon, PlusIcon, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { StockBadge } from "../../shared/components/StockBadge";
import { DeadlineBadge } from "./DeadlineBadge";

type ProductCardProps = {
	id: string;
	title: string;
	price: number | null;
	originalPrice?: number | null;
	sellingPrice?: number | null;
	discountRate?: number | null;
	saleStatus?: string | null;
	imageUrl?: string | null;
	orderDeadline?: Date | string | null;
	listingDate?: Date | string | null;
	inStock?: boolean;
	stockQuantity?: number | null;
	className?: string;
	onAddToCart?: (quantity: number) => void;
	onToggleWishlist?: () => void;
	wishlisted?: boolean;
	priority?: boolean;
};

function getSaleStatusBadgeClass(status: string | null) {
	if (status === "預售中") {
		return "bg-amber-100 text-amber-700";
	}
	if (status === "有現貨") {
		return "bg-green-100 text-green-700";
	}
	return "bg-stone-100 text-stone-500";
}

export function ProductCard({
	id,
	title,
	price,
	originalPrice,
	sellingPrice,
	discountRate,
	saleStatus,
	imageUrl,
	orderDeadline,
	listingDate,
	inStock,
	stockQuantity,
	className,
	onAddToCart,
	onToggleWishlist,
	wishlisted,
	priority = false,
}: ProductCardProps) {
	const { user } = useSession();
	const [quantity, setQuantity] = useState(1);
	const [isFavorited, setIsFavorited] = useState(wishlisted ?? false);
	const listingLabel = listingDate ? format(new Date(listingDate), "M/d") : null;
	const isNewProduct = listingDate ? (Date.now() - new Date(listingDate).getTime()) / (1000 * 60 * 60 * 24) <= 7 : false;
	const currentSellingPrice = sellingPrice ?? price;
	const canOrder = !!user && currentSellingPrice !== null;
	const isPastDeadline = orderDeadline ? new Date(orderDeadline).getTime() < Date.now() : false;
	const daysLeft = orderDeadline ? differenceInCalendarDays(new Date(orderDeadline), new Date()) : null;
	const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
	const normalizedSaleStatus = isPastDeadline ? "已截止" : (saleStatus ?? null);
	const addDisabled = normalizedSaleStatus === "已截止" || !canOrder;

	return (
		<div className={cn("card-hover overflow-hidden rounded-xl border border-stone-200 bg-white", className)}>
			<Link href={`/products/${id}`} className="block">
				<div className="relative aspect-[4/3] bg-stone-100">
					{imageUrl ? (
						<Image
							src={imageUrl}
							alt={title}
							fill
							priority={priority}
							sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
							className="object-cover"
						/>
					) : null}
					{isUrgent && (
						<div className="absolute inset-x-0 top-0 bg-red-500 px-2 py-0.5 text-center text-[11px] font-semibold text-white">
							即將截單
						</div>
					)}
					<div className="absolute left-2 top-2">
						<DeadlineBadge orderDeadline={orderDeadline ?? null} />
					</div>
					{inStock !== undefined ? (
						<div className="absolute right-2 top-2">
							<StockBadge inStock={inStock} stockQuantity={stockQuantity ?? null} />
						</div>
					) : null}
					{isNewProduct && (
						<div className="absolute bottom-2 left-2">
							<span className="inline-flex items-center rounded-md bg-blue-500 px-1.5 py-0.5 text-[11px] font-medium text-white">
								新品
							</span>
						</div>
					)}
				</div>

				<div className="space-y-2 p-3">
					<p className="line-clamp-2 text-sm leading-5 text-stone-800">{title}</p>
					<div className="space-y-1">
						{originalPrice !== null && originalPrice !== undefined ? (
							<p className="text-sm text-muted-foreground line-through">¥ {originalPrice.toFixed(2)}</p>
						) : null}
						<div className="flex items-center gap-2">
							{currentSellingPrice === null ? (
								<p className="font-semibold text-sm text-stone-600">登入查看價格</p>
							) : (
								<p className="font-bold text-base text-stone-900">¥ {currentSellingPrice.toFixed(2)}</p>
							)}
							{discountRate !== null && discountRate !== undefined ? (
								<span className="inline-flex items-center rounded-md bg-red-100 px-1.5 py-0.5 text-[11px] font-medium text-red-700">
									{Math.round(discountRate * 100)}折
								</span>
							) : null}
						</div>
					</div>
					<div className="flex items-center justify-between">
						{normalizedSaleStatus ? (
							<span
								className={cn(
									"inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
									getSaleStatusBadgeClass(normalizedSaleStatus),
								)}
							>
								{normalizedSaleStatus}
							</span>
						) : (
							<span />
						)}
						{listingLabel ? <span className="text-xs text-stone-500">{listingLabel}</span> : null}
					</div>
				</div>
			</Link>
			<div className="border-t border-stone-100 px-3 pb-3 pt-2">
				{canOrder ? (
					<div className="flex items-center gap-1">
					<div className="inline-flex items-center rounded-md border border-stone-200">
						<button
							type="button"
							disabled={addDisabled || quantity <= 1}
							onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
							className="flex h-8 w-8 items-center justify-center text-stone-500 transition-colors hover:bg-stone-50"
						>
							<MinusIcon className="size-3.5" />
						</button>
						<input
							type="number"
							min={1}
							value={quantity}
							onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
							className="h-8 w-10 border-0 bg-transparent text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
						/>
						<button
							type="button"
							disabled={addDisabled}
							onClick={() => setQuantity((prev) => prev + 1)}
							className="flex h-8 w-8 items-center justify-center text-stone-500 transition-colors hover:bg-stone-50"
						>
							<PlusIcon className="size-3.5" />
						</button>
					</div>
					<button
						type="button"
						onClick={() => {
							setIsFavorited(!isFavorited);
							onToggleWishlist?.();
						}}
						className={cn(
							"flex h-8 w-8 items-center justify-center rounded border border-primary text-primary transition-colors hover:bg-primary/10",
							isFavorited && "border-red-500 bg-red-50 text-red-500",
						)}
					>
						<Heart className={cn("size-3.5", isFavorited && "fill-current")} />
					</button>
					<button
						type="button"
						disabled={addDisabled}
						onClick={() => onAddToCart?.(quantity)}
						className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
					>
						<ShoppingCart className="size-3.5" />
					</button>
					</div>
				) : (
					<Link
						href="/login"
						className="block rounded-md border border-stone-200 px-3 py-2 text-center text-sm font-medium text-stone-700 hover:bg-stone-50"
					>
						登入後下單
					</Link>
				)}
			</div>
		</div>
	);
}
