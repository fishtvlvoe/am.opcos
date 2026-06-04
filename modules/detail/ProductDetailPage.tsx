"use client";

import { useSession } from "@auth/hooks/use-session";
import { cn, toastError, toastSuccess } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays, format, formatDistanceToNowStrict } from "date-fns";
import { zhTW } from "date-fns/locale";
import { AlertTriangleIcon, Heart, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { PriceDisplay } from "../catalog/components/PriceDisplay";
import { ImageGallery } from "./components/ImageGallery";
import { QuantitySelector } from "./components/QuantitySelector";

function formatDiscountFoldLabel(memberDiscountPercent: number | null) {
	if (memberDiscountPercent === null) return null;
	const fold = memberDiscountPercent / 10;
	return Number.isInteger(fold) ? String(fold) : fold.toFixed(1);
}

export function ProductDetailPage({ id }: { id: string }) {
	const router = useRouter();
	const { user } = useSession();
	const [quantity, setQuantity] = useState(1);
	const canSeePricing = !!user;

	const productQuery = useQuery(
		orpc.anismile.products.getById.queryOptions({
			input: { id },
		}),
	);

	const addCartMutation = useMutation(
		orpc.anismile.cart.add.mutationOptions({
			onSuccess: () => toastSuccess("已加入購物車"),
			onError: (error) => toastError(error.message || "加入購物車失敗"),
		}),
	);

	const wishlistQuery = useQuery({
		...orpc.anismile.wishlist.list.queryOptions({ input: { sort: "recent", filter: "all" } }),
		enabled: !!user,
	});
	const isInWishlist = useMemo(() => {
		const items = wishlistQuery.data && "items" in wishlistQuery.data ? wishlistQuery.data.items : [];
		return items.some((item: any) => item.productId === id);
	}, [wishlistQuery.data, id]);

	const queryClient = useQueryClient();
	const addWishlistMutation = useMutation(
		orpc.anismile.wishlist.add.mutationOptions({
			onSuccess: () => {
				toastSuccess("已加入收藏");
				void queryClient.invalidateQueries({ queryKey: orpc.anismile.wishlist.list.key() });
			},
			onError: (error) => toastError(error.message || "加入收藏失敗"),
		}),
	);
	const removeWishlistMutation = useMutation(
		orpc.anismile.wishlist.remove.mutationOptions({
			onSuccess: () => {
				toastSuccess("已取消收藏");
				void queryClient.invalidateQueries({ queryKey: orpc.anismile.wishlist.list.key() });
			},
			onError: (error) => toastError(error.message || "取消收藏失敗"),
		}),
	);

	const hasSeries = !!(productQuery.data?.series);

	const relatedLatestQuery = useQuery({
		...orpc.anismile.products.latest.queryOptions({ input: { limit: 7 } }),
		enabled: !hasSeries,
	});

	const relatedSeriesQuery = useQuery({
		...orpc.anismile.products.list.queryOptions({
			input: { series: productQuery.data?.series ?? "_placeholder", pageSize: 7 },
		}),
		enabled: hasSeries,
	});

	const relatedProducts = useMemo(() => {
		const raw = hasSeries
			? (relatedSeriesQuery.data?.items ?? [])
			: (relatedLatestQuery.data ?? []);
		return raw.filter((p: any) => p.id !== id);
	}, [hasSeries, relatedSeriesQuery.data, relatedLatestQuery.data, id]);

	const product = productQuery.data;
	const daysUntilDeadline = product?.orderDeadline
		? differenceInCalendarDays(new Date(product.orderDeadline), new Date())
		: null;
	const memberDiscountPercent = useMemo(() => {
		if (!product) return null;
		if (
			product.originalPrice !== null &&
			product.originalPrice !== undefined &&
			product.sellingPrice !== null &&
			product.sellingPrice !== undefined &&
			Number(product.originalPrice) > 0
		) {
			return Math.round((Number(product.sellingPrice) / Number(product.originalPrice)) * 100);
		}
		return null;
	}, [product]);
	const memberDiscountFold = formatDiscountFoldLabel(memberDiscountPercent);

	const deadlineText = useMemo(() => {
		if (daysUntilDeadline === null) {
			return null;
		}
		if (daysUntilDeadline < 0) {
			return "已截止";
		}
		if (daysUntilDeadline === 0) {
			return "今日截止";
		}
		return `距離截單還有 ${formatDistanceToNowStrict(new Date(product!.orderDeadline!), {
			locale: zhTW,
		})}`;
	}, [daysUntilDeadline, product]);

	if (!product) {
		return <p className="text-sm text-stone-500">載入中...</p>;
	}

	const images = Array.isArray(product.imageUrls) ? product.imageUrls.map((item) => String(item)) : [];
	const isExpired = daysUntilDeadline !== null && daysUntilDeadline < 0;
	const isUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 3;
	const resolvedSaleStatus = isExpired ? "已截止" : (product.saleStatus ?? null);
	const saleStatusClassName =
		resolvedSaleStatus === "預售中"
			? "bg-amber-100 text-amber-700"
			: resolvedSaleStatus === "有現貨"
				? "bg-green-100 text-green-700"
				: "bg-stone-100 text-stone-500";

	const attributeRows = [
		{ label: "來源 ID", value: product.supplierId },
		{ label: "JAN Code", value: product.janCode },
		{ label: "品牌", value: product.brand },
		{ label: "作品", value: product.franchise },
		{ label: "BOX 規格", value: product.boxSpec },
		{
			label: "原價",
			value: (
				<span className="text-stone-700">
					{product.originalPrice !== null && product.originalPrice !== undefined
						? `¥ ${Number(product.originalPrice).toFixed(2)}`
						: "未提供"}
				</span>
			),
		},
		{
			label: "會員價",
			value:
				canSeePricing && product.sellingPrice !== null && product.sellingPrice !== undefined ? (
					<span className="text-stone-700">¥ {Number(product.sellingPrice).toFixed(2)}</span>
				) : null,
		},
		{
			label: "折扣率",
			value:
				canSeePricing && memberDiscountPercent !== null && memberDiscountFold !== null && product.sellingPrice !== product.originalPrice ? (
					<span className="text-stone-700">{memberDiscountFold} 折（{memberDiscountPercent}%）</span>
				) : null,
		},
		{
			label: "銷售狀態",
			value: resolvedSaleStatus ? (
				<span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ${saleStatusClassName}`}>
					{resolvedSaleStatus}
				</span>
			) : null,
		},
		{
			label: "訂單截止",
			value: product.orderDeadline ? format(new Date(product.orderDeadline), "yyyy/MM/dd") : null,
		},
		{
			label: "發售日期",
			value: product.releaseDate ? format(new Date(product.releaseDate), "yyyy/MM/dd") : null,
		},
		{
			label: "上架日期",
			value: product.listingDate ? format(new Date(product.listingDate), "yyyy/MM/dd") : null,
		},
	].filter((row) => row.value !== null && row.value !== undefined);

	return (
		<div className="space-y-6">
			<nav className="flex items-center gap-1.5 text-sm text-stone-500">
				<Link href="/" className="hover:text-stone-900 hover:underline">首頁</Link>
				{product.series && (
					<>
						<span>›</span>
						<Link href={`/series/${product.series}`} className="hover:text-stone-900 hover:underline">
							{product.series}
						</Link>
					</>
				)}
				<span>›</span>
				<span className="truncate max-w-[200px] font-medium text-stone-900">
					{product.titleTranslated || product.titleOriginal}
				</span>
			</nav>

			<div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
				<ImageGallery images={images} title={product.titleTranslated || product.titleOriginal} />

				<div className="space-y-4">
					<h1 className="font-semibold text-2xl text-stone-900">{product.titleTranslated || product.titleOriginal}</h1>
					{product.series && (
						<Link
							href={`/series/${product.series}`}
							className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-200"
						>
							{product.series}
						</Link>
					)}
					<div className="space-y-1">
						{canSeePricing ? (
							<div className="space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-4">
								<div className="grid gap-4 sm:grid-cols-2">
									<div className="space-y-1">
										<p className="text-xs font-medium text-stone-500">原價</p>
										<p className="text-base font-semibold text-stone-700">
											{product.originalPrice !== null && product.originalPrice !== undefined
												? `¥${Number(product.originalPrice).toFixed(2)}`
												: "未提供"}
										</p>
									</div>
									<div className="space-y-1">
										<p className="text-xs font-medium text-stone-500">會員價</p>
										<p className="text-2xl font-bold text-red-600">
											{product.sellingPrice !== null && product.sellingPrice !== undefined
												? `¥${Number(product.sellingPrice).toFixed(2)}`
												: "未提供"}
										</p>
									</div>
								</div>
								<div className="flex flex-wrap items-center gap-2">
									{memberDiscountPercent !== null && memberDiscountFold !== null && product.sellingPrice !== product.originalPrice ? (
										<span className="inline-flex items-center rounded-md bg-red-100 px-1.5 py-0.5 text-sm font-medium text-red-700">
											會員價 {memberDiscountFold} 折
										</span>
									) : null}
									{product.sellingPrice !== null &&
									product.sellingPrice !== undefined &&
									product.originalPrice !== null &&
									product.originalPrice !== undefined &&
									Number(product.sellingPrice) === Number(product.originalPrice) ? (
										<span className="inline-flex items-center rounded-md bg-stone-200 px-1.5 py-0.5 text-xs font-medium text-stone-700">
											目前未加成
										</span>
									) : null}
								</div>
							</div>
						) : (
							<div className="space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-4">
								<div>
									<p className="text-xs font-medium text-stone-500">原價</p>
									<p className="text-2xl font-bold text-stone-900">
										{product.originalPrice !== null && product.originalPrice !== undefined
											? `¥${Number(product.originalPrice).toFixed(2)}`
											: "未提供"}
									</p>
								</div>
								<p className="text-sm text-stone-600">登入查看會員價</p>
							</div>
						)}
						<div className="flex flex-wrap items-center gap-2">
							{product.stockQuantity === null || product.stockQuantity === undefined ? (
								<span className="text-sm text-stone-500">庫存未知</span>
							) : product.stockQuantity === 0 ? (
								<span className="text-sm font-medium text-red-600">缺貨</span>
							) : (
								<span className="text-sm font-medium text-green-700">庫存：{product.stockQuantity}</span>
							)}
						</div>
					</div>
					<p className="whitespace-pre-line text-sm text-stone-600">{product.descriptionTranslated || "暫無描述"}</p>
					<div className="overflow-hidden rounded-xl border border-stone-200">
						<table className="w-full text-sm">
							<tbody>
								{attributeRows.map((row) => (
									<tr key={row.label} className="border-b border-stone-100 last:border-0">
										<td className="w-28 shrink-0 bg-stone-50 px-3 py-2 text-stone-500">{row.label}</td>
										<td className="px-3 py-2 text-stone-800">{row.value}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{deadlineText ? (
						<div
							className={`rounded-xl border px-4 py-3 text-sm ${
								isUrgent ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"
							}`}
						>
							<div className="flex items-center gap-2 font-medium">
								<AlertTriangleIcon className="size-4" /> 截止提醒
							</div>
							<p className="mt-1">{deadlineText}</p>
						</div>
					) : null}

					<div className="flex items-center gap-3">
						{user ? (
							<>
								<QuantitySelector value={quantity} onChange={setQuantity} />
								<span className="text-sm text-stone-600">{quantity} 件</span>
							</>
						) : null}
						<button
							type="button"
							onClick={() => {
								if (!user) {
									const opcosUrl = process.env.NEXT_PUBLIC_OPCOS_URL ?? "";
									const redirectPath = encodeURIComponent(`/products/${product.id}`);
									router.push(`${opcosUrl}/login?redirect=${redirectPath}`);
									return;
								}
								if (isInWishlist) {
									removeWishlistMutation.mutate({ productId: id });
								} else {
									addWishlistMutation.mutate({ productId: id });
								}
							}}
							className={cn(
								"flex h-10 w-10 items-center justify-center rounded-lg border border-primary text-primary transition-colors hover:bg-primary/10",
								isInWishlist && "border-red-500 bg-red-50 text-red-500",
							)}
						>
							<Heart className={cn("size-5", isInWishlist && "fill-current")} />
						</button>
						<button
							type="button"
							disabled={addCartMutation.isPending || isExpired}
							onClick={() => {
								if (!user) {
									const opcosUrl = process.env.NEXT_PUBLIC_OPCOS_URL ?? "";
									const redirectPath = encodeURIComponent(`/products/${product.id}`);
									router.push(`${opcosUrl}/login?redirect=${redirectPath}`);
									return;
								}
								addCartMutation.mutate({
									productId: product.id,
									quantity,
								});
							}}
							className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
						>
							<ShoppingCart className="size-5" />
						</button>
					</div>
				</div>
			</div>
		{relatedProducts.length > 0 && (
				<section className="mt-8">
					<h2 className="mb-4 text-lg font-bold text-stone-900">相關商品</h2>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
						{relatedProducts.slice(0, 6).map((rp: any) => (
							<Link key={rp.id} href={`/products/${rp.id}`} className="overflow-hidden rounded-xl border border-stone-200 bg-white transition-shadow hover:shadow-md">
								<div className="relative aspect-[4/3] bg-stone-100">
									{Array.isArray(rp.imageUrls) && rp.imageUrls[0] ? (
										<Image src={String(rp.imageUrls[0])} alt={rp.titleTranslated ?? rp.titleOriginal ?? ""} fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw" />
									) : null}
								</div>
								<div className="p-2">
									<p className="line-clamp-2 text-xs text-stone-800">{rp.titleTranslated ?? rp.titleOriginal}</p>
									<PriceDisplay
										className="mt-1"
										originalPrice={rp.originalPrice ?? null}
										memberPrice={rp.sellingPrice ?? null}
									/>
								</div>
							</Link>
						))}
					</div>
				</section>
			)}
		</div>
	);
}
