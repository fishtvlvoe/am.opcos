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

import { ProductCard } from "../../../modules/catalog/components/ProductCard";

const PER_PAGE = 24;

const sortOptions = [
	{ value: "relevance", label: "相關度" },
	{ value: "price_asc", label: "價格低到高" },
	{ value: "price_desc", label: "價格高到低" },
	{ value: "deadline", label: "截止日期" },
	{ value: "newest", label: "最新" },
] as const;

export default function SearchPage() {
	const [q] = useQueryState("q", parseAsString.withDefault(""));
	const [category, setCategory] = useQueryState("category", parseAsString.withDefault(""));
	const [franchise, setFranchise] = useQueryState("franchise", parseAsString.withDefault(""));
	const [brand, setBrand] = useQueryState("brand", parseAsString.withDefault(""));
	const [sort, setSort] = useQueryState("sort", parseAsString.withDefault("relevance"));
	const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

	const trimmed = q.trim();
	const enabled = trimmed.length > 0;

	const filters = useMemo(() => {
		const next: { category?: string; franchise?: string; brand?: string } = {};
		if (category) next.category = category;
		if (franchise) next.franchise = franchise;
		if (brand) next.brand = brand;
		return Object.keys(next).length ? next : undefined;
	}, [brand, category, franchise]);

	const searchQuery = useQuery({
		...orpc.anismile.products.search.queryOptions({
			input: {
				query: enabled ? trimmed : "disabled",
				filters,
				sort: sort || undefined,
				page,
				perPage: PER_PAGE,
			},
		}),
		enabled,
	});

	const facets = searchQuery.data?.facets;
	const facetGroups = useMemo(() => {
		const groups: Array<{ label: string; key: string; items: Array<{ name: string; count: number }> }> = [];
		if (facets?.categories?.length) groups.push({ label: "分類", key: "category", items: facets.categories });
		if (facets?.franchises?.length) groups.push({ label: "作品系列", key: "franchise", items: facets.franchises });
		if (facets?.brands?.length) groups.push({ label: "品牌", key: "brand", items: facets.brands });
		return groups;
	}, [facets]);

	const items = searchQuery.data?.items ?? [];
	const total = searchQuery.data?.total ?? 0;

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
					<h1 className="font-semibold text-xl">搜尋</h1>
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

				{!enabled ? (
					<div className="py-24 text-center text-sm text-muted-foreground">請輸入搜尋關鍵字</div>
				) : searchQuery.isPending ? (
					<div className="py-24 text-center text-sm text-muted-foreground">載入中...</div>
				) : items.length === 0 ? (
					<div className="py-24 text-center text-sm text-muted-foreground">
						找不到符合的商品，試試其他關鍵字
					</div>
				) : (
					<>
						<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
							{items.map((item) => (
								<ProductCard
									key={item.id}
									id={item.id}
									title={item.titleTranslated || item.titleOriginal}
									price={Number(item.sellingPrice)}
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
