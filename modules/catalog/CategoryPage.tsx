"use client";

import { FilterSidebar, type QuickFilter } from "@shared/components/FilterSidebar";
import { Pagination } from "@shared/components/Pagination";
import { orpc } from "@shared/lib/orpc-query-utils";
import {
	Button,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { LayoutGridIcon, TableIcon } from "lucide-react";
import { SafeImage } from "../shared/components/SafeImage";
import Link from "next/link";
import { parseAsBoolean, parseAsInteger, parseAsString, useQueryState } from "nuqs";
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

export function CategoryPage({ slug }: { slug: string }) {
	const [franchise, setFranchise] = useQueryState("franchise", parseAsString.withDefault(""));
	const [brand, setBrand] = useQueryState("brand", parseAsString.withDefault(""));
	const [sort, setSort] = useQueryState("sort", parseAsString.withDefault("relevance"));
	const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
	const [view, setView] = useQueryState("view", parseAsString.withDefault("grid"));
	const [inStock, setInStock] = useQueryState("inStock", parseAsBoolean.withDefault(false));
	const [urgent, setUrgent] = useQueryState("urgent", parseAsBoolean.withDefault(false));

	const filters = useMemo(() => {
		const next: { franchise?: string; brand?: string; inStock?: boolean; urgentDeadline?: boolean } = {};
		if (franchise) next.franchise = franchise;
		if (brand) next.brand = brand;
		if (inStock) next.inStock = true;
		if (urgent) next.urgentDeadline = true;
		return Object.keys(next).length ? next : undefined;
	}, [brand, franchise, inStock, urgent]);

	const quickFilters: QuickFilter[] = [
		{ key: "inStock", label: "只看現貨", checked: inStock },
		{ key: "urgent", label: "即將截單", checked: urgent },
	];

	const productsQuery = useQuery(
		orpc.anismile.products.listByCategory.queryOptions({
				input: {
				slug,
				filters,
				sort: sort || undefined,
				page: page ?? 1,
				perPage: PER_PAGE,
			},
		}),
	);

	const facets = productsQuery.data?.facets;
	const facetGroups = useMemo(() => {
		const groups: Array<{ label: string; key: string; items: Array<{ name: string; count: number }> }> = [];
		if (facets?.franchises?.length) groups.push({ label: "作品系列", key: "franchise", items: facets.franchises });
		if (facets?.brands?.length) groups.push({ label: "品牌", key: "brand", items: facets.brands });
		return groups;
	}, [facets]);

	const items = productsQuery.data?.items ?? [];
	const total = productsQuery.data?.total ?? 0;

	return (
		<div className="space-y-4">
			<div className="text-sm text-muted-foreground">
				<Link href="/" className="hover:underline">
					首頁
				</Link>
				<span className="mx-2">&gt;</span>
				<span>{slug}</span>
			</div>

			<div className="flex items-end justify-between gap-4">
				<div className="space-y-1">
					<h1 className="font-semibold text-2xl">{slug}</h1>
					<span className="text-sm text-muted-foreground">共 {total} 件商品</span>
				</div>

				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1">
						<Button
							variant={view === "grid" ? "primary" : "outline"}
							size="icon"
							className="size-9"
							onClick={() => void setView("grid")}
						>
							<LayoutGridIcon className="size-4" />
						</Button>
						<Button
							variant={view === "table" ? "primary" : "outline"}
							size="icon"
							className="size-9"
							onClick={() => void setView("table")}
						>
							<TableIcon className="size-4" />
						</Button>
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
			</div>

			{productsQuery.isPending ? (
				<div className="py-24 text-center text-sm text-muted-foreground">載入中...</div>
			) : items.length === 0 ? (
				<div className="py-24 text-center text-sm text-muted-foreground">此分類目前沒有商品</div>
			) : (
				<div className="flex gap-6">
					<div className="hidden w-64 md:block">
						<FilterSidebar
							groups={facetGroups}
							selected={{ franchise: franchise || undefined, brand: brand || undefined }}
							onChange={(key, value) => {
								if (key === "franchise") void setFranchise(value ?? "");
								if (key === "brand") void setBrand(value ?? "");
								void setPage(1);
							}}
							quickFilters={quickFilters}
							onQuickFilterChange={(key, checked) => {
								if (key === "inStock") void setInStock(checked);
								if (key === "urgent") void setUrgent(checked);
								void setPage(1);
							}}
						/>
					</div>

					<div className="min-w-0 flex-1 space-y-4">
						{view === "table" ? (
							<>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-14">縮圖</TableHead>
											<TableHead>商品名</TableHead>
											<TableHead className="w-40">價格</TableHead>
											<TableHead className="w-24">狀態</TableHead>
											<TableHead className="w-32">截止日期</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{items.map((item) => {
											const title = item.titleTranslated || item.titleOriginal;
											const imageUrl = Array.isArray(item.imageUrls) ? String(item.imageUrls[0] ?? "") : "";
											const inStock = (item as unknown as { inStock?: boolean }).inStock;
											return (
												<TableRow key={item.id}>
													<TableCell>
														{imageUrl ? (
															<SafeImage src={imageUrl} alt={title} width={40} height={40} className="size-10 rounded-md object-cover" />
														) : (
															<div className="size-10 rounded-md bg-muted" />
														)}
													</TableCell>
													<TableCell>
														<Link href={`/products/${item.id}`} className="hover:underline">
															{title}
														</Link>
													</TableCell>
													<TableCell className="text-right">
														<div className="space-y-0.5">
															{item.originalPrice != null && item.sellingPrice != null && item.sellingPrice < item.originalPrice ? (
																<p className="text-xs text-stone-500 line-through">¥ {Number(item.originalPrice).toFixed(2)}</p>
															) : null}
															<p className="font-medium text-stone-900">
																{item.originalPrice != null || item.sellingPrice != null
																	? `¥ ${Number(item.originalPrice ?? item.sellingPrice).toFixed(2)}`
																	: "價格未提供"}
															</p>
															{item.sellingPrice === null ? (
																<p className="text-xs text-stone-500">登入查看會員價</p>
															) : item.originalPrice != null && item.sellingPrice < item.originalPrice ? (
																<p className="text-xs text-stone-600">會員價 ¥ {Number(item.sellingPrice).toFixed(2)}</p>
															) : null}
														</div>
													</TableCell>
													<TableCell>
														{inStock === undefined ? "-" : inStock ? "有庫存" : "無庫存"}
													</TableCell>
													<TableCell>
														{item.orderDeadline ? format(new Date(item.orderDeadline), "yyyy-MM-dd") : "-"}
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</>
						) : (
							<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
								{items.map((item, index) => (
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
										priority={index < 4}
									/>
								))}
							</div>
						)}

						<div className="flex justify-center pt-2">
							<Pagination totalItems={total} currentPage={page} itemsPerPage={PER_PAGE} onChangeCurrentPage={(next) => void setPage(next)} />
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
