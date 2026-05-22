"use client";

import { FilterSidebar } from "@shared/components/FilterSidebar";
import { Pagination } from "@shared/components/Pagination";
import { orpc } from "@shared/lib/orpc-query-utils";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui";
import { useQuery } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useMemo } from "react";

import { ProductCard } from "./components/ProductCard";

const PER_PAGE = 24;

const sortOptions = [
	{ value: "relevance", label: "相關度" },
	{ value: "price_asc", label: "價格低到高" },
	{ value: "price_desc", label: "價格高到低" },
	{ value: "deadline", label: "截止日期" },
	{ value: "newest", label: "最新" },
] as const;

export function SearchPage() {
	const [q] = useQueryState("q", parseAsString.withDefault(""));
	const [category, setCategory] = useQueryState("category", parseAsString.withDefault(""));
	const [franchise, setFranchise] = useQueryState("franchise", parseAsString.withDefault(""));
	const [brand, setBrand] = useQueryState("brand", parseAsString.withDefault(""));
	const [sort, setSort] = useQueryState("sort", parseAsString.withDefault("relevance"));
	const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

	const trimmed = q.trim();
	const isAllProductsMode = trimmed.length === 0;

	const filters = useMemo(() => {
		const next: { category?: string; franchise?: string; brand?: string } = {};
		if (category) next.category = category;
		if (franchise) next.franchise = franchise;
		if (brand) next.brand = brand;
		return Object.keys(next).length ? next : undefined;
	}, [brand, category, franchise]);

	const allProductsQuery = useQuery({
		...orpc.anismile.products.list.queryOptions({
			input: {
				page,
				pageSize: PER_PAGE,
				category: category || undefined,
				inStock: false,
				showUnavailable: true,
			},
		}),
		enabled: isAllProductsMode,
	});

	const searchQuery = useQuery({
		...orpc.anismile.products.search.queryOptions({
			input: {
				query: trimmed,
				filters,
				sort: sort || undefined,
				page,
				perPage: PER_PAGE,
			},
		}),
		enabled: !isAllProductsMode,
	});
	const categoriesQuery = useQuery({
		...orpc.anismile.categories.queryOptions({ input: {} }),
		enabled: isAllProductsMode,
	});

	const facets = searchQuery.data?.facets;
	const facetGroups = useMemo(() => {
		const groups: Array<{ label: string; key: string; items: Array<{ name: string; count: number }> }> = [];
		if (isAllProductsMode && categoriesQuery.data?.length) {
			groups.push({ label: "分類", key: "category", items: categoriesQuery.data });
			return groups;
		}
		if (facets?.categories?.length) groups.push({ label: "分類", key: "category", items: facets.categories });
		if (facets?.franchises?.length) groups.push({ label: "作品系列", key: "franchise", items: facets.franchises });
		if (facets?.brands?.length) groups.push({ label: "品牌", key: "brand", items: facets.brands });
		return groups;
	}, [categoriesQuery.data, facets, isAllProductsMode]);

	const activeQuery = isAllProductsMode ? allProductsQuery : searchQuery;
	const items = activeQuery.data?.items ?? [];
	const total = activeQuery.data?.total ?? 0;

	return (
		<div className="flex gap-6">
			<div className="hidden w-64 md:block">
				<FilterSidebar
					groups={facetGroups}
					selected={{
						category: category || undefined,
						franchise: franchise || undefined,
						brand: brand || undefined,
					}}
					onChange={(key, value) => {
						if (key === "category") void setCategory(value ?? "");
						if (key === "franchise") void setFranchise(value ?? "");
						if (key === "brand") void setBrand(value ?? "");
						void setPage(1);
					}}
				/>
			</div>

			<div className="min-w-0 flex-1 space-y-4">
				<div className="flex items-center justify-between gap-3">
					<div>
						<h1 className="font-semibold text-xl">{isAllProductsMode ? "所有產品" : "搜尋"}</h1>
						{isAllProductsMode ? (
							<p className="mt-1 text-sm text-muted-foreground">
								瀏覽目前同步的日本供應商商品，可用分類篩選縮小範圍。
							</p>
						) : null}
					</div>
					<div className="w-40">
						<Select
							value={sort}
							onValueChange={(value) => {
								void setSort(value);
								void setPage(1);
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="排序" />
							</SelectTrigger>
							<SelectContent>
								{sortOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{activeQuery.isPending ? (
					<div className="py-24 text-center text-sm text-muted-foreground">載入中...</div>
				) : activeQuery.isError ? (
					<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
						商品資料暫時無法載入。請稍後再試，或由管理員確認 production 同步與資料庫狀態。
					</div>
				) : items.length === 0 ? (
					<div className="py-24 text-center text-sm text-muted-foreground">
						{isAllProductsMode ? "目前沒有可顯示的商品" : "找不到符合的商品，試試其他關鍵字"}
					</div>
				) : (
					<>
						<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
							{items.map((item) => (
								<ProductCard
									key={item.id}
									id={item.id}
									title={item.titleTranslated || item.titleOriginal}
									price={item.sellingPrice}
									imageUrl={Array.isArray(item.imageUrls) ? String(item.imageUrls[0] ?? "") : ""}
									orderDeadline={item.orderDeadline}
									listingDate={item.listingDate}
								/>
							))}
						</div>

						<div className="flex justify-center pt-2">
							<Pagination totalItems={total} currentPage={page} itemsPerPage={PER_PAGE} onChangeCurrentPage={(next) => void setPage(next)} />
						</div>
					</>
				)}
			</div>
		</div>
	);
}
