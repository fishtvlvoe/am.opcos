"use client";

import { cn } from "@repo/ui";
import { format } from "date-fns";
import { Heart, MinusIcon, PlusIcon, ShoppingCart } from "lucide-react";
import { useState } from "react";

type TableProduct = {
	id: string;
	title: string;
	sellingPrice: number;
	originalPrice?: number | null;
	discountRate?: number | null;
	boxSpec?: string | null;
	orderDeadline?: Date | string | null;
	releaseDate?: string | null;
	janCode?: string | null;
};

interface TableViewProps {
	products: TableProduct[];
	onAddToCart?: (productId: string, quantity: number) => void;
	onToggleWishlist?: (productId: string) => void;
}

function QuickOrderCell({
	productId,
	onAddToCart,
	onToggleWishlist,
}: {
	productId: string;
	onAddToCart?: (productId: string, quantity: number) => void;
	onToggleWishlist?: (productId: string) => void;
}) {
	const [quantity, setQuantity] = useState(1);
	const [isFavorited, setIsFavorited] = useState(false);

	return (
		<div className="flex items-center gap-1">
			<div className="inline-flex items-center rounded-md border border-stone-200">
				<button
					type="button"
					onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
					className="flex h-7 w-7 items-center justify-center text-stone-500 hover:bg-stone-50"
				>
					<MinusIcon className="size-3" />
				</button>
				<input
					type="number"
					min={1}
					value={quantity}
					onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
					className="h-7 w-8 border-0 bg-transparent text-center text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
				/>
				<button
					type="button"
					onClick={() => setQuantity((prev) => prev + 1)}
					className="flex h-7 w-7 items-center justify-center text-stone-500 hover:bg-stone-50"
				>
					<PlusIcon className="size-3" />
				</button>
			</div>
			<button
				type="button"
				onClick={() => {
					setIsFavorited(!isFavorited);
					onToggleWishlist?.(productId);
				}}
				className={cn(
					"flex h-7 w-7 items-center justify-center rounded border border-primary text-primary transition-colors hover:bg-primary/10",
					isFavorited && "border-red-500 bg-red-50 text-red-500",
				)}
			>
				<Heart className={cn("size-3", isFavorited && "fill-current")} />
			</button>
			<button
				type="button"
				onClick={() => onAddToCart?.(productId, quantity)}
				className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
			>
				<ShoppingCart className="size-3" />
			</button>
		</div>
	);
}

export function TableView({ products, onAddToCart, onToggleWishlist }: TableViewProps) {
	return (
		<div className="overflow-x-auto rounded-lg border border-stone-200">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b border-stone-200 bg-stone-50">
						<th className="px-3 py-2.5 text-left font-medium text-stone-600">商品名稱</th>
						<th className="px-3 py-2.5 text-right font-medium text-stone-600">價格</th>
						<th className="px-3 py-2.5 text-right font-medium text-stone-600">折扣率</th>
						<th className="px-3 py-2.5 text-center font-medium text-stone-600">下單單位</th>
						<th className="px-3 py-2.5 text-center font-medium text-stone-600">截止日期</th>
						<th className="px-3 py-2.5 text-center font-medium text-stone-600">發售日期</th>
						<th className="px-3 py-2.5 text-center font-medium text-stone-600">快速下單</th>
						<th className="px-3 py-2.5 text-left font-medium text-stone-600">JAN碼</th>
					</tr>
				</thead>
				<tbody>
					{products.map((product) => (
						<tr key={product.id} className="border-b border-stone-100 hover:bg-stone-50">
							<td className="px-3 py-2.5">
								<p className="line-clamp-1 max-w-[200px] text-stone-800">{product.title}</p>
							</td>
							<td className="px-3 py-2.5 text-right">
								<div>
									{product.originalPrice && (
										<span className="text-xs text-stone-500 line-through">¥{product.originalPrice}</span>
									)}
									<p className="font-medium text-stone-900">¥{product.sellingPrice}</p>
								</div>
							</td>
							<td className="px-3 py-2.5 text-right">
								{product.discountRate && (
									<span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
										{Math.round(product.discountRate * 100)}折
									</span>
									)}
							</td>
							<td className="px-3 py-2.5 text-center text-stone-600">
								{product.boxSpec ?? "個"}
							</td>
							<td className="px-3 py-2.5 text-center text-stone-600">
								{product.orderDeadline ? format(new Date(product.orderDeadline), "M/d") : "-"}
							</td>
							<td className="px-3 py-2.5 text-center text-stone-600">
								{product.releaseDate ?? "-"}
							</td>
							<td className="px-3 py-2.5">
								<QuickOrderCell
									productId={product.id}
									onAddToCart={onAddToCart}
									onToggleWishlist={onToggleWishlist}
								/>
							</td>
							<td className="px-3 py-2.5 text-xs text-stone-500">
								{product.janCode ?? "-"}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
