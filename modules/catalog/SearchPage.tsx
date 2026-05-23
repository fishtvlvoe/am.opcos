"use client";

import { FilterSidebar, type QuickFilter } from "@shared/components/FilterSidebar";
import { Pagination } from "@shared/components/Pagination";
import { orpc } from "@shared/lib/orpc-query-utils";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	cn,
} from "@repo/ui";
import { useQuery } from "@tanstack/react-query";
import { Download, Filter, Grid3X3, List, PackageSearch } from "lucide-react";
import Link from "next/link";
import { parseAsBoolean, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";

import { ProductCard } from "./components/ProductCard";
import { SearchResultTable } from "./components/SearchResultTable";

const PER_PAGE = 24;
const viewModes = ["card", "table"] as const;

const sortOptions = [
	{ value: "sales_fallback", label: "按銷量排序（預設）" },
	{ value: "newest", label: "最新上架" },
	{ value: "name", label: "商品名稱" },
	{ value: "price_asc", label: "價格低到高" },
	{ value: "price_desc", label: "價格高到低" },
	{ value: "deadline", label: "截止日期" },
] as const;

type SearchProduct = {
	id: string;
	sourceUrl?: string | null;
	titleTranslated?: string | null;
	titleOriginal?: string | null;
	imageUrls?: unknown;
	category?: string | null;
	series?: string | null;
	janCode?: string | null;
	brand?: string | null;
	franchise?: string | null;
	sellingPrice?: number | null;
	listingDate?: Date | string | null;
	orderDeadline?: Date | string | null;
	releaseDate?: Date | string | null;
	inStock?: boolean | null;
};

function csvEscape(value: unknown) {
	const text = value == null ? "" : String(value);
	return `"${text.replaceAll("\"", "\"\"")}"`;
}

function formatCsvDate(value: Date | string | null | undefined) {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return date.toISOString().slice(0, 10);
}

function buildProductUrl(productId: string) {
	if (typeof window === "undefined") return `/products/${productId}`;
	return `${window.location.origin}/products/${productId}`;
}

function downloadSearchCsv(products: SearchProduct[]) {
	const header = "商品名稱,JAN Code,作品系列,品牌,售價,庫存狀態,截止日期,發售日期,商品URL";
	const rows = products.map((product) => [
		product.titleTranslated || product.titleOriginal || "",
		product.janCode || "",
		product.series || product.franchise || "",
		product.brand || "",
		product.sellingPrice == null ? "" : product.sellingPrice,
		product.inStock ? "現貨" : "不可購買",
		formatCsvDate(product.orderDeadline),
		formatCsvDate(product.releaseDate),
		buildProductUrl(product.id),
	].map(csvEscape).join(","));
	const csv = [header, ...rows].join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = `am-search-products-${new Date().toISOString().slice(0, 10)}.csv`;
	link.click();
	URL.revokeObjectURL(link.href);
}

export function SearchPage() {
	const [q] = useQueryState("q", parseAsString.withDefault(""));
	const [category, setCategory] = useQueryState("category", parseAsString.withDefault(""));
	const [franchise, setFranchise] = useQueryState("franchise", parseAsString.withDefault(""));
	const [brand, setBrand] = useQueryState("brand", parseAsString.withDefault(""));
	const [sort, setSort] = useQueryState("sort", parseAsString.withDefault("sales_fallback"));
	const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
	const [view, setView] = useQueryState("view", parseAsStringLiteral(["card", "table"]).withDefault("card"));
	const [showUnavailable, setShowUnavailable] = useQueryState("showUnavailable", parseAsBoolean.withDefault(false));
	const [inStock, setInStock] = useQueryState("inStock", parseAsBoolean.withDefault(false));
	const [urgentDeadline, setUrgentDeadline] = useQueryState("urgentDeadline", parseAsBoolean.withDefault(false));
	const [pendingQuickFilters, setPendingQuickFilters] = useState({
		showUnavailable,
		inStock,
		urgentDeadline,
	});

	useEffect(() => {
		setPendingQuickFilters({ showUnavailable, inStock, urgentDeadline });
	}, [inStock, showUnavailable, urgentDeadline]);

	const trimmed = q.trim();
	const isAllProductsMode = trimmed.length === 0;
	const normalizedSort = sort || "sales_fallback";
	const activeFilters = useMemo(() => {
		const next: {
			category?: string;
			franchise?: string;
			brand?: string;
			showUnavailable?: boolean;
			inStock?: boolean;
			urgentDeadline?: boolean;
		} = {};
		if (category) next.category = category;
		if (franchise) next.franchise = franchise;
		if (brand) next.brand = brand;
		if (showUnavailable) next.showUnavailable = true;
		if (inStock) next.inStock = true;
		if (urgentDeadline) next.urgentDeadline = true;
		return Object.keys(next).length ? next : undefined;
	}, [brand, category, franchise, inStock, showUnavailable, urgentDeadline]);

	const allProductsQuery = useQuery({
		...orpc.anismile.products.list.queryOptions({
			input: {
				page,
				pageSize: PER_PAGE,
				category: category || undefined,
				sort: normalizedSort,
				showUnavailable,
				inStock,
				urgentDeadline,
			},
		}),
		enabled: isAllProductsMode,
	});

	const searchQuery = useQuery({
		...orpc.anismile.products.search.queryOptions({
			input: {
				query: trimmed,
				filters: activeFilters,
				sort: normalizedSort,
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

	const quickFilters: QuickFilter[] = [
		{ key: "showUnavailable", label: "顯示不可購買商品", checked: pendingQuickFilters.showUnavailable },
		{ key: "inStock", label: "現貨", checked: pendingQuickFilters.inStock },
		{ key: "urgentDeadline", label: "即將截單", checked: pendingQuickFilters.urgentDeadline },
	];

	const handleQuickFilterChange = (key: string, checked: boolean) => {
		setPendingQuickFilters((current) => ({ ...current, [key]: checked }));
	};

	const applyQuickFilters = () => {
		void Promise.all([
			setShowUnavailable(pendingQuickFilters.showUnavailable),
			setInStock(pendingQuickFilters.inStock),
			setUrgentDeadline(pendingQuickFilters.urgentDeadline),
			setPage(1),
		]);
	};

	const activeQuery = isAllProductsMode ? allProductsQuery : searchQuery;
	const items = (activeQuery.data?.items ?? []) as SearchProduct[];
	const total = activeQuery.data?.total ?? 0;

	const filterPanel = (
		<div className="space-y-4">
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
				quickFilters={quickFilters}
				onQuickFilterChange={handleQuickFilterChange}
			/>
			<button
				type="button"
				onClick={applyQuickFilters}
				className="inline-flex w-full items-center justify-center rounded-md bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800"
			>
				確認篩選
			</button>
		</div>
	);

	return (
		<div className="space-y-6">
			<nav className="flex items-center gap-2 text-sm text-stone-500">
				<Link href="/" className="hover:text-stone-900">首頁</Link>
				<span>/</span>
				<span className="font-medium text-stone-900">搜尋結果</span>
			</nav>

			<div className="flex items-end justify-between gap-3">
				<div>
					<h1 className="font-semibold text-2xl text-stone-950">搜尋結果</h1>
					<p className="mt-1 text-sm text-muted-foreground">共 {total} 件</p>
				</div>
				<div className="flex items-center gap-1 rounded-md border border-stone-200 bg-white p-1" aria-label="搜尋結果顯示方式">
					<button
						type="button"
						aria-label="view=card"
						onClick={() => void setView("card")}
						className={cn("rounded p-2 text-stone-500 hover:bg-stone-100", view === "card" && "bg-stone-900 text-white")}
					>
						<Grid3X3 className="size-4" />
					</button>
					<button
						type="button"
						aria-label="view=table"
						onClick={() => void setView("table")}
						className={cn("rounded p-2 text-stone-500 hover:bg-stone-100", view === "table" && "bg-stone-900 text-white")}
					>
						<List className="size-4" />
					</button>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-[240px_1fr]">
				<aside className="hidden md:block">{filterPanel}</aside>
				<details className="rounded-lg border border-stone-200 bg-white p-3 md:hidden">
					<summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
						<Filter className="size-4" />
						篩選
					</summary>
					<div className="pt-4">{filterPanel}</div>
				</details>

				<div className="min-w-0 space-y-4">
					<div className="flex flex-wrap items-center gap-3">
						<div className="flex items-center gap-2">
							<label className="text-sm text-stone-500">排序</label>
							<div className="w-48">
								<Select
									value={normalizedSort}
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
						<button
							type="button"
							onClick={() => downloadSearchCsv(items)}
							className="inline-flex items-center gap-2 rounded-md bg-stone-100 px-3 py-2 text-sm font-medium text-stone-900 hover:bg-stone-200"
						>
							<Download className="size-4" />
							下載CSV
						</button>
					</div>

					{activeQuery.isPending ? (
						<div className="py-24 text-center text-sm text-muted-foreground">載入中...</div>
					) : activeQuery.isError ? (
						<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
							商品資料暫時無法載入。請稍後再試，或由管理員確認 production 同步與資料庫狀態。
						</div>
					) : items.length === 0 ? (
						<div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-stone-200 bg-stone-50 text-center text-sm text-muted-foreground">
							<PackageSearch className="size-12 text-stone-300" />
							<p>沒有符合條件的商品</p>
						</div>
					) : (
						<>
							{view === "table" ? (
								<SearchResultTable products={items} />
							) : (
								<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
									{items.map((item) => (
										<ProductCard
											key={item.id}
											id={item.id}
											title={item.titleTranslated || item.titleOriginal || ""}
											price={item.sellingPrice ?? null}
											imageUrl={Array.isArray(item.imageUrls) ? String(item.imageUrls[0] ?? "") : ""}
											orderDeadline={item.orderDeadline ?? null}
											listingDate={item.listingDate ?? null}
										/>
									))}
								</div>
							)}

							<div className="flex justify-center pt-2">
								<Pagination totalItems={total} currentPage={page} itemsPerPage={PER_PAGE} onChangeCurrentPage={(next) => void setPage(next)} />
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
