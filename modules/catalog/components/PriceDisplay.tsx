"use client";

import { cn } from "@repo/ui";

type PriceDisplayProps = {
	originalPrice?: number | null;
	memberPrice?: number | null;
	align?: "left" | "right";
	showLoginHint?: boolean;
	className?: string;
};

function formatYen(value: number) {
	return `¥ ${value.toFixed(2)}`;
}

export function hasDiscountedMemberPrice(originalPrice?: number | null, memberPrice?: number | null) {
	return (
		originalPrice !== null &&
		originalPrice !== undefined &&
		memberPrice !== null &&
		memberPrice !== undefined &&
		memberPrice < originalPrice
	);
}

export function PriceDisplay({
	originalPrice,
	memberPrice,
	align = "left",
	showLoginHint = true,
	className,
}: PriceDisplayProps) {
	const hasDiscount = hasDiscountedMemberPrice(originalPrice, memberPrice);
	const basePrice = originalPrice ?? memberPrice ?? null;

	return (
		<div className={cn("space-y-0.5", align === "right" ? "text-right" : "text-left", className)}>
			{hasDiscount ? (
				<p className="text-xs text-stone-500 line-through">{formatYen(originalPrice!)}</p>
			) : null}
			<p className="font-semibold text-stone-900">
				{basePrice === null ? "價格未提供" : formatYen(hasDiscount ? memberPrice! : basePrice)}
			</p>
			{memberPrice === null && showLoginHint ? (
				<p className="text-xs text-stone-500">登入查看會員價</p>
			) : null}
		</div>
	);
}
