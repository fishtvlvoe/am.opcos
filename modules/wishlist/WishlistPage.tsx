"use client";

import { Badge, Button, Input, toastError, toastSuccess } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HeartIcon, ShoppingCartIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type SortOption = "recent" | "oldest" | "deadline";
type FilterOption = "all" | "hideUnavailable" | "hasQuantity" | "noQuantity";

export function WishlistPage() {
	const [sort, setSort] = useState<SortOption>("recent");
	const [filter, setFilter] = useState<FilterOption>("all");
	const queryClient = useQueryClient();

	const wishlistQuery = useQuery(
		orpc.anismile.wishlist.list.queryOptions({ input: { sort, filter } }),
	);
	const data = wishlistQuery.data;
	const items = data && "items" in data ? data.items : [];

	const removeMutation = useMutation(
		orpc.anismile.wishlist.remove.mutationOptions({
			onSuccess: () => {
				toastSuccess("已取消收藏");
				void queryClient.invalidateQueries({ queryKey: orpc.anismile.wishlist.list.key() });
			},
			onError: (error) => toastError(error.message || "取消收藏失敗"),
		}),
	);

	const updateQuantityMutation = useMutation(
		orpc.anismile.wishlist.updateQuantity.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({ queryKey: orpc.anismile.wishlist.list.key() });
			},
			onError: (error) => toastError(error.message || "更新數量失敗"),
		}),
	);

	const batchAddMutation = useMutation(
		orpc.anismile.wishlist.batchAddToCart.mutationOptions({
			onSuccess: () => {
				toastSuccess("已批量加入購物車");
				void queryClient.invalidateQueries({ queryKey: orpc.anismile.wishlist.list.key() });
			},
			onError: (error) => toastError(error.message || "批量加入失敗"),
		}),
	);

	const handleBatchAddToCart = () => {
		const itemsWithQuantity = items.filter((item) => (item.quantity ?? 0) > 0);
		if (itemsWithQuantity.length === 0) {
			toastError("請先設定至少一件商品的數量");
			return;
		}
		batchAddMutation.mutate({});
	};

	return (
		<div className="container py-8">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold">收藏夾</h1>
				<Button
					onClick={handleBatchAddToCart}
					disabled={batchAddMutation.isPending || items.length === 0}
					className="flex items-center gap-2"
				>
					<ShoppingCartIcon className="size-4" />
					批量加入購物車
				</Button>
			</div>

			<div className="mb-6 flex flex-wrap items-center gap-3">
				<select
					value={sort}
					onChange={(e) => setSort(e.target.value as SortOption)}
					className="h-10 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
				>
					<option value="recent">最近添加</option>
					<option value="oldest">最早添加</option>
					<option value="deadline">截單順序</option>
				</select>
				<select
					value={filter}
					onChange={(e) => setFilter(e.target.value as FilterOption)}
					className="h-10 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
				>
					<option value="all">全部</option>
					<option value="hideUnavailable">隱藏不可購買</option>
					<option value="hasQuantity">僅已設數量</option>
					<option value="noQuantity">僅未設數量</option>
				</select>
			</div>

			{wishlistQuery.isPending ? (
				<div className="py-12 text-center text-muted-foreground">載入中...</div>
			) : items.length === 0 ? (
				<div className="flex flex-col items-center gap-4 py-20 text-muted-foreground">
					<HeartIcon className="size-12 opacity-30" />
					<p>收藏夾是空的</p>
				</div>
			) : (
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{items.map((item) => (
						<div
							key={item.productId}
							className="relative flex flex-col overflow-hidden rounded-lg border bg-background"
						>
							{/* 取消收藏按鈕 */}
							<button
								type="button"
								className="absolute right-2 top-2 z-10 rounded-full bg-background/80 p-1 text-rose-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-rose-50"
								onClick={() => removeMutation.mutate({ productId: item.productId })}
								disabled={removeMutation.isPending}
							>
								<HeartIcon className="size-4 fill-current" />
							</button>

							{/* 商品圖片 + 名稱 + 價格（可點擊進商品頁）*/}
							<Link href={`/products/${item.productId}`} className="block">
								<div className="relative aspect-square overflow-hidden bg-muted">
									{item.product.imageUrls ? (
										<Image
											src={
												Array.isArray(item.product.imageUrls)
													? (item.product.imageUrls[0] as string)
													: ""
											}
											alt={item.product.title ?? "商品"}
											fill
										sizes="(max-width: 768px) 50vw, 20vw"
										className="object-cover"
										/>
									) : (
										<div className="flex size-full items-center justify-center text-xs text-muted-foreground">
											無圖片
										</div>
									)}
								</div>
								<div className="px-3 pt-3">
									<p className="line-clamp-2 text-xs leading-snug">
										{item.product.title ?? "（無商品名）"}
									</p>
									{item.product.sellingPrice != null && (
										<p className="text-sm font-semibold text-primary">
											¥{Number(item.product.sellingPrice).toLocaleString()}
										</p>
									)}
								</div>
							</Link>

							{/* 數量設定（獨立於 Link，不觸發導覽）*/}
							<div className="px-3 pb-3 pt-2">
								<Input
									type="number"
									min={0}
									max={999}
									value={item.quantity ?? 0}
									onChange={(e) =>
										updateQuantityMutation.mutate({
											productId: item.productId,
											quantity: Number(e.target.value),
										})
									}
									className="h-8 text-sm"
								/>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
