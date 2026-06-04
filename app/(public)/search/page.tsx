import { getSession } from "@auth/lib/server";
import { listAnismileCategories, listAnismileProducts, searchAnismileProducts } from "@repo/database";

import {
	SearchPage,
	type SearchPageAllProductsResult,
	type SearchPageCategories,
	type SearchPageSearchResult,
} from "../../../modules/catalog/SearchPage";

const PER_PAGE = 24;

function readSearchParam(value: string | string[] | undefined) {
	if (Array.isArray(value)) return value[0] ?? "";
	return value ?? "";
}

function readBooleanParam(value: string | string[] | undefined) {
	const normalized = readSearchParam(value).trim().toLowerCase();
	return normalized === "true" || normalized === "1";
}

function readPositiveIntegerParam(value: string | string[] | undefined, fallback: number) {
	const parsed = Number.parseInt(readSearchParam(value), 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toStringArray(value: unknown) {
	return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function toPublicSearchItem(
	item: {
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
		sellingPrice?: { toNumber(): number } | number | null;
		listingDate?: Date | null;
		orderDeadline?: Date | null;
		releaseDate?: Date | null;
		inStock?: boolean | null;
	},
	showPrices: boolean,
) {
	return {
		id: item.id,
		sourceUrl: item.sourceUrl ?? null,
		titleTranslated: item.titleTranslated ?? null,
		titleOriginal: item.titleOriginal ?? null,
		imageUrls: toStringArray(item.imageUrls),
		category: item.category ?? null,
		series: item.series ?? null,
		janCode: item.janCode ?? null,
		brand: item.brand ?? null,
		franchise: item.franchise ?? null,
		sellingPrice:
			showPrices && item.sellingPrice != null
				? typeof item.sellingPrice === "number"
					? item.sellingPrice
					: item.sellingPrice.toNumber()
				: null,
		listingDate: item.listingDate ?? null,
		orderDeadline: item.orderDeadline ?? null,
		releaseDate: item.releaseDate ?? null,
		inStock: item.inStock ?? null,
	};
}

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = await searchParams;
	const q = readSearchParam(params.q).trim();
	const category = readSearchParam(params.category).trim();
	const franchise = readSearchParam(params.franchise).trim();
	const brand = readSearchParam(params.brand).trim();
	const sort = readSearchParam(params.sort).trim() || "sales_fallback";
	const page = readPositiveIntegerParam(params.page, 1);
	const showUnavailable = readBooleanParam(params.showUnavailable);
	const inStock = readBooleanParam(params.inStock);
	const urgentDeadline = readBooleanParam(params.urgentDeadline);
	const session = await getSession().catch(() => null);
	const showPrices = !!session;

	let initialSearchData: SearchPageSearchResult | undefined;
	let initialAllProductsData: SearchPageAllProductsResult | undefined;
	let initialCategories: SearchPageCategories | undefined;

	if (q) {
		const filters = {
			...(category ? { category } : {}),
			...(franchise ? { franchise } : {}),
			...(brand ? { brand } : {}),
			...(showUnavailable ? { showUnavailable: true } : {}),
			...(inStock ? { inStock: true } : {}),
			...(urgentDeadline ? { urgentDeadline: true } : {}),
		};
		const result = await searchAnismileProducts({
			query: q,
			filters: Object.keys(filters).length ? filters : undefined,
			sort,
			page,
			perPage: PER_PAGE,
		});

		initialSearchData = {
			items: result.items.map((item) => toPublicSearchItem(item, showPrices)),
			total: result.total,
			facets: result.facets,
			usedUnavailableFallback: result.usedUnavailableFallback,
		};
	} else {
		const [productsResult, categories] = await Promise.all([
			listAnismileProducts({
				page,
				pageSize: PER_PAGE,
				category: category || undefined,
				onlyInStock: false,
				urgentDeadline,
				showUnavailable: false,
				sort,
			}),
			listAnismileCategories(),
		]);

		initialAllProductsData = {
			items: productsResult.items.map((item) => toPublicSearchItem(item, showPrices)),
			total: productsResult.total,
			page: productsResult.page,
			pageSize: productsResult.pageSize,
			totalPages: productsResult.totalPages,
		};
		initialCategories = categories;
	}

	return (
		<SearchPage
			initialSearchData={initialSearchData}
			initialAllProductsData={initialAllProductsData}
			initialCategories={initialCategories}
		/>
	);
}
