"use client";

import { useSession } from "@auth/hooks/use-session";
import { Button, cn, toastError, toastSuccess } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Download, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { FeaturedCarousel } from "./components/FeaturedCarousel";
import { ProductCard } from "./components/ProductCard";
import { TableView } from "./components/TableView";
import { ToolbarRow } from "./components/ToolbarRow";
import type { QuickFilter } from "../shared/components/FilterSidebar";

interface SeriesDetailPageProps {
	seriesId: string;
}

function Breadcrumb({ seriesName }: { seriesName: string }) {
	return (
		<nav className="mb-4 flex items-center gap-1.5 text-sm text-stone-500">
			<Link href="/" className="hover:text-stone-900 hover:underline">
				首頁
			</Link>
			<ChevronRight className="size-3.5" />
			<Link href="/" className="hover:text-stone-900 hover:underline">
				商品系列
			</Link>
			<ChevronRight className="size-3.5" />
			<span className="font-medium text-stone-900">{seriesName}</span>
		</nav>
	);
}

export function SeriesDetailPage({ seriesId }: SeriesDetailPageProps) {
	const { user } = useSession();
	const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
	const [sortField, setSortField] = useState("name");
	const [pageSize, setPageSize] = useState(20);
	const [page, setPage] = useState(1);
	const [showFilter, setShowFilter] = useState(false);
	const [inStockFilter, setInStockFilter] = useState(false);
	const [urgentFilter, setUrgentFilter] = useState(false);

	const queryClient = useQueryClient();

	const addCartMutation = useMutation(
		orpc.anismile.cart.add.mutationOptions({
			onSuccess: () => {
				toastSuccess("已加入購物車");
				void queryClient.invalidateQueries({ queryKey: orpc.anismile.cart.getItems.key() });
			},
			onError: (error) => toastError(error.message || "加入購物車失敗"),
		}),
	);

	const wishlistQuery = useQuery({
		...orpc.anismile.wishlist.list.queryOptions({ input: { sort: "recent", filter: "all" } }),
		enabled: !!user,
	});

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

	const productsQuery = useQuery(
		orpc.anismile.products.list.queryOptions({
			input: {
				series: seriesId,
				page,
				pageSize,
				showUnavailable: true,
				inStock: inStockFilter || undefined,
				urgentDeadline: urgentFilter || undefined,
			},
		}),
	);

	const products = productsQuery.data?.items ?? [];
	const totalProducts = productsQuery.data?.total ?? products.length;
	const totalPages = productsQuery.data?.totalPages ?? 1;

	const seriesName = useMemo(() => {
		if (products.length > 0) {
			return products[0]?.series ?? `系列 ${seriesId}`;
		}
		return `系列 ${seriesId}`;
	}, [products, seriesId]);

	const wishlistIds = useMemo(() => {
		const items =
			wishlistQuery.data && "items" in wishlistQuery.data ? wishlistQuery.data.items : [];
		return new Set((items as { productId: string }[]).map((item) => item.productId));
	}, [wishlistQuery.data]);

	const quickFilters: QuickFilter[] = [
		{ key: "inStock", label: "只看現貨", checked: inStockFilter },
		{ key: "urgent", label: "即將截單", checked: urgentFilter },
	];

	const handleQuickFilterChange = (key: string, checked: boolean) => {
		if (key === "inStock") setInStockFilter(checked);
		if (key === "urgent") setUrgentFilter(checked);
		setPage(1);
	};

	const featuredProducts = useMemo(() => {
		return products.slice(0, 6).map((p) => ({
			id: p.id,
			title: p.titleTranslated || p.titleOriginal,
			imageUrl: Array.isArray(p.imageUrls) ? String(p.imageUrls[0] ?? "") : null,
			sellingPrice: p.sellingPrice,
			originalPrice: p.originalPrice ?? null,
		}));
	}, [products]);

	const handleCsvDownload = useCallback(() => {
		const header = "商品名稱,售價,JAN碼,上架日期,截止日期\n";
		const rows = products
			.map((p) => {
				const title = (p.titleTranslated || p.titleOriginal).replace(/,/g, "，");
				return `${title},${p.sellingPrice},,${p.listingDate ?? ""},${p.orderDeadline ?? ""}`;
			})
			.join("\n");
		const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${seriesName}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}, [products, seriesName]);

	return (
		<div className="min-h-screen">
			<main className="container py-8">
				<Breadcrumb seriesName={seriesName} />

				<h1 className="mb-1 text-2xl font-bold text-stone-900">{seriesName}</h1>
				<p className="mb-6 text-sm text-stone-500">{totalProducts} 件商品</p>

				<FeaturedCarousel products={featuredProducts} />

				<ToolbarRow
					sortField={sortField}
					onSortChange={setSortField}
					pageSize={pageSize}
					onPageSizeChange={(size) => {
						setPageSize(size);
						setPage(1);
					}}
					viewMode={viewMode}
					onViewModeChange={setViewMode}
					onFilterToggle={() => setShowFilter(!showFilter)}
					onCsvDownload={handleCsvDownload}
					quickFilters={quickFilters}
					onQuickFilterChange={handleQuickFilterChange}
				/>

				{productsQuery.isPending ? (
					<div className="py-12 text-center text-muted-foreground">載入中...</div>
				) : products.length === 0 ? (
					<p className="py-12 text-center text-sm text-stone-500">暫無商品</p>
				) : viewMode === "grid" ? (
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
						{products.map((item) => (
							<ProductCard
								key={item.id}
								id={item.id}
								title={item.titleTranslated || item.titleOriginal}
								price={item.originalPrice ?? item.sellingPrice}
								originalPrice={item.originalPrice ?? null}
								sellingPrice={item.sellingPrice}
								imageUrl={Array.isArray(item.imageUrls) ? String(item.imageUrls[0] ?? "") : ""}
								orderDeadline={item.orderDeadline}
								listingDate={item.listingDate}
								wishlisted={wishlistIds.has(item.id)}
								onAddToCart={(qty) =>
									addCartMutation.mutate({ productId: item.id, quantity: qty })
								}
								onToggleWishlist={() => {
									if (wishlistIds.has(item.id)) {
										removeWishlistMutation.mutate({ productId: item.id });
									} else {
										addWishlistMutation.mutate({ productId: item.id });
									}
								}}
							/>
						))}
					</div>
				) : (
					<TableView
						products={products.map((item) => ({
							id: item.id,
							title: item.titleTranslated || item.titleOriginal,
							originalPrice: item.originalPrice ?? null,
							sellingPrice: item.sellingPrice,
							orderDeadline: item.orderDeadline,
						}))}
						onAddToCart={(productId, qty) =>
							addCartMutation.mutate({ productId, quantity: qty })
						}
						onToggleWishlist={(productId) => {
							if (wishlistIds.has(productId)) {
								removeWishlistMutation.mutate({ productId });
							} else {
								addWishlistMutation.mutate({ productId });
							}
						}}
					/>
				)}

				{totalPages > 1 && (
					<div className="mt-6 flex items-center justify-between border-t border-stone-200 pt-4">
						<p className="text-sm text-stone-500">
							第 {page} / {totalPages} 頁
						</p>
						<div className="flex gap-2">
							<Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
								上一頁
							</Button>
							<Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
								下一頁
							</Button>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}
