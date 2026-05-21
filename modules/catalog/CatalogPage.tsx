"use client";

import { useSession } from "@auth/hooks/use-session";
import { Button, Input, toastError, toastSuccess } from "@repo/ui";
import { MobileMenu } from "@shared/components/MobileMenu";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { SearchIcon } from "lucide-react";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useMemo } from "react";

import { CategorySidebar } from "./components/CategorySidebar";
import { DateChipFilter } from "./components/DateChipFilter";
import { NewArrivalsScroll } from "./components/NewArrivalsScroll";
import { ProductCard } from "./components/ProductCard";

export function CatalogPage() {
	const { user } = useSession();
	const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
	const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
	const [category, setCategory] = useQueryState("category", parseAsString.withDefault(""));
	const [date, setDate] = useQueryState("date", parseAsString.withDefault(""));

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

	const wishlistIds = useMemo(() => {
		const items =
			wishlistQuery.data && "items" in wishlistQuery.data ? wishlistQuery.data.items : [];
		return new Set((items as { productId: string }[]).map((item) => item.productId));
	}, [wishlistQuery.data]);

	const productsQuery = useQuery(
		orpc.anismile.products.list.queryOptions({
			input: {
				page: page ?? 1,
				pageSize: 24,
				search: q || undefined,
				category: category || undefined,
				listingDate: date || undefined,
			},
		}),
	);

	const latestQuery = useQuery(
		orpc.anismile.products.latest.queryOptions({
			input: { limit: 12 },
		}),
	);
	const categoriesQuery = useQuery(orpc.anismile.categories.queryOptions({ input: {} }));

	const dateOptions = useMemo(() => {
		const options = (latestQuery.data ?? [])
			.map((item) => item.listingDate)
			.filter((value): value is Date => value instanceof Date)
			.map((value) => format(value, "yyyy-MM-dd"));
		return Array.from(new Set(options));
	}, [latestQuery.data]);

	const products = productsQuery.data?.items ?? [];
	const totalPages = productsQuery.data?.totalPages ?? 1;

	return (
		<div className="space-y-6">
			<section className="space-y-3">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-xs uppercase tracking-[0.08em] text-stone-500">Latest drops</p>
						<h1 className="font-semibold text-2xl text-stone-900">最新上架</h1>
					</div>
				</div>
				<NewArrivalsScroll items={latestQuery.data ?? []} />
			</section>

			<section className="grid gap-4 md:gap-6 lg:grid-cols-[240px_1fr]">
				<div className="hidden lg:block">
					<CategorySidebar
						items={categoriesQuery.data ?? []}
						value={category}
						onChange={(next) => {
							void setCategory(next);
							void setPage(1);
						}}
					/>
				</div>

				<div className="space-y-4">
					<div className="flex flex-wrap items-center gap-3">
						<MobileMenu title="分類篩選">
							<CategorySidebar
								items={categoriesQuery.data ?? []}
								value={category}
								onChange={(next) => {
									void setCategory(next);
									void setPage(1);
								}}
							/>
						</MobileMenu>

						<div className="relative min-w-[220px] grow">
							<SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-500" />
							<Input
								placeholder="搜尋商品"
								value={q}
								onChange={(event) => {
									void setQ(event.target.value);
									void setPage(1);
								}}
								className="border-stone-300 bg-white pl-9"
							/>
						</div>
					</div>

					<DateChipFilter
						options={dateOptions}
						value={date}
						onChange={(next) => {
							void setDate(next);
							void setPage(1);
						}}
					/>

					<div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
						{products.map((item) => (
							<ProductCard
								key={item.id}
								id={item.id}
								title={item.titleTranslated || item.titleOriginal}
								price={item.sellingPrice}
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

					<div className="flex items-center justify-between border-t border-stone-200 pt-4">
						<p className="text-sm text-stone-500">
							第 {productsQuery.data?.page ?? 1} / {totalPages} 頁
						</p>
						<div className="flex gap-2">
							<Button variant="outline" disabled={page <= 1} onClick={() => void setPage(page - 1)}>
								上一頁
							</Button>
							<Button variant="outline" disabled={page >= totalPages} onClick={() => void setPage(page + 1)}>
								下一頁
							</Button>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
