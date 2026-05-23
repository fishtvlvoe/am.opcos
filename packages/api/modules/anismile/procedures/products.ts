import { ORPCError } from "@orpc/server";
import { auth } from "@repo/auth";
import {
	db,
	getAnismileProductById,
	listAnismileProducts,
	listLatestAnismileProducts,
	listProductsByCategory,
	searchAnismileProducts,
	setProductMarkupOverride,
	updateProductFields,
	upsertProductsFromSync,
} from "@repo/database";
import { z } from "zod";

import { anismileAdminProcedure, protectedProcedure, publicProcedure } from "../../../orpc/procedures";
import { crawlAnismileProductBySupplierId, crawlAnismileProductsBySeriesName } from "../lib/crawler";
import { toNumber, toNumberRequired } from "../lib/serialize";

async function canSeePricing(headers: Headers) {
	const session = await auth.api.getSession({ headers });
	return !!session;
}

function publicPrice<T extends number>(value: T, visible: boolean): T | null {
	return visible ? value : null;
}

const ANISMILE_ORIGIN = "https://www.anismile.jp";
const PLACEHOLDER_IMAGE_MARKER = "length_shadow_white";
const SERIES_IMAGE_CACHE_TTL_MS = 5 * 60 * 1000;
const SOURCE_PRODUCT_REFRESH_TTL_MS = 30 * 60 * 1000;

let seriesImageCache: { expiresAt: number; map: Map<string, string> } | null = null;

type SeriesImageResponse = {
	code: number;
	items?: Array<{
		name?: string;
		file?: { url?: string; thumb?: string };
	}>;
};

function normalizeSourceImageUrl(url: string | undefined) {
	if (!url) return "";
	if (url.startsWith("/files/")) return `https://img.anismile.jp${url}`;
	if (url.startsWith(`${ANISMILE_ORIGIN}/files/`)) {
		return url.replace(`${ANISMILE_ORIGIN}/files/`, "https://img.anismile.jp/files/");
	}
	return url;
}

function toImageUrlArray(value: unknown): string[] {
	return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function isPlaceholderImageUrl(url: string | null | undefined) {
	return !url || url.includes(PLACEHOLDER_IMAGE_MARKER);
}

function shouldRefreshSourceProduct(product: {
	imageUrls: unknown;
	listingDate: Date | null;
	orderDeadline: Date | null;
	lastSyncedAt: Date;
}) {
	if (Date.now() - product.lastSyncedAt.getTime() < SOURCE_PRODUCT_REFRESH_TTL_MS) return false;
	const imageUrls = toImageUrlArray(product.imageUrls);
	if (isPlaceholderImageUrl(imageUrls[0])) return true;
	if (product.listingDate && product.orderDeadline && product.listingDate.getTime() > product.orderDeadline.getTime()) {
		return true;
	}
	return false;
}

function isPubliclyOrderableProduct(product: {
	inStock: boolean;
	orderDeadline: Date | null;
}) {
	if (!product.inStock) return false;
	return !product.orderDeadline || product.orderDeadline.getTime() >= Date.now();
}

async function refreshSourceProductIfNeeded(product: {
	supplierId: string;
	imageUrls: unknown;
	listingDate: Date | null;
	orderDeadline: Date | null;
	lastSyncedAt: Date;
}) {
	if (!shouldRefreshSourceProduct(product)) return;
	const refreshed = await crawlAnismileProductBySupplierId(product.supplierId).catch(() => null);
	if (!refreshed) return;
	await upsertProductsFromSync(
		[{
			supplierId: refreshed.supplierId,
			sourceUrl: refreshed.sourceUrl,
			titleOriginal: refreshed.titleOriginal,
			titleTranslated: refreshed.titleTranslated,
			descriptionOriginal: refreshed.descriptionOriginal,
			descriptionTranslated: refreshed.descriptionTranslated,
			imageUrls: refreshed.imageUrls,
			category: refreshed.category,
			series: refreshed.series,
			originalPrice: refreshed.originalPrice,
			costPrice: refreshed.costPrice,
			listingDate: refreshed.listingDate,
			orderDeadline: refreshed.orderDeadline,
			inStock: refreshed.inStock,
			stockQuantity: refreshed.stockQuantity,
			lastSyncedAt: new Date(),
			discountRate: refreshed.discountRate,
			brand: refreshed.brand,
			franchise: refreshed.franchise,
			janCode: refreshed.janCode,
			releaseDate: refreshed.releaseDate,
		}],
		{ markMissingOutOfStock: false },
	);
}

async function getSourceSeriesImageMap() {
	if (seriesImageCache && seriesImageCache.expiresAt > Date.now()) {
		return seriesImageCache.map;
	}

	const responses = await Promise.all(
		Array.from({ length: 7 }, async (_, dateIndex) => {
			const url = new URL(`${ANISMILE_ORIGIN}/series_list/index`);
			url.searchParams.set("lang", "en");
			url.searchParams.set("dateIndex", String(dateIndex));
			const response = await fetch(url, { next: { revalidate: 300 } });
			if (!response.ok) return [] as Array<[string, string]>;
			const payload = (await response.json()) as SeriesImageResponse;
			return (payload.items ?? [])
				.map((item): [string, string] => [
					item.name ?? "",
					normalizeSourceImageUrl(item.file?.url || item.file?.thumb),
				])
				.filter(([name, imageUrl]) => Boolean(name && imageUrl));
		}),
	).catch(() => []);

	const map = new Map(responses.flat());
	seriesImageCache = {
		expiresAt: Date.now() + SERIES_IMAGE_CACHE_TTL_MS,
		map,
	};
	return map;
}

function getSeriesFallbackImage(series: string | null, seriesImageMap: Map<string, string>) {
	if (!series) return null;
	return (
		seriesImageMap.get(series) ??
		[...seriesImageMap.entries()].find(([name]) => series.startsWith(name) || name.startsWith(series))?.[1] ??
		null
	);
}

function getDisplayImageUrls(product: { imageUrls: unknown; series: string | null }, seriesImageMap: Map<string, string>) {
	const imageUrls = toImageUrlArray(product.imageUrls);
	if (!isPlaceholderImageUrl(imageUrls[0])) return imageUrls;
	const fallbackImage = getSeriesFallbackImage(product.series, seriesImageMap);
	return fallbackImage ? [fallbackImage, ...imageUrls.filter((url) => !isPlaceholderImageUrl(url))] : imageUrls;
}

async function getSeriesImageMapForProducts(products: Array<{ imageUrls: unknown; lastSyncedAt?: Date | null }>) {
	const needsFallback = products.some((product) => {
		if (!isPlaceholderImageUrl(toImageUrlArray(product.imageUrls)[0])) return false;
		if (product.lastSyncedAt && Date.now() - product.lastSyncedAt.getTime() < SOURCE_PRODUCT_REFRESH_TTL_MS) return false;
		return true;
	});
	if (!needsFallback) {
		return new Map<string, string>();
	}
	return await getSourceSeriesImageMap();
}

const listProductsInput = z.object({
	category: z.string().min(1).optional(),
	series: z.string().min(1).optional(),
	search: z.string().min(1).optional(),
	listingDate: z.string().date().optional(),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(20),
	inStock: z.boolean().optional(),
	urgentDeadline: z.boolean().optional(),
	showUnavailable: z.boolean().optional(),
	sort: z.string().optional(),
});

const productSortSchema = z.string().trim().min(1).max(32);

export const listProducts = publicProcedure
	.route({
		method: "GET",
		path: "/anismile/products",
		tags: ["Anismile"],
		summary: "List products",
	})
	.input(listProductsInput)
	.handler(async ({ input, context }) => {
		const showPrices = await canSeePricing(context.headers);
		const listingDate = input.listingDate ? new Date(input.listingDate) : undefined;
		let result = await listAnismileProducts({
			page: input.page,
			pageSize: input.pageSize,
			category: input.category,
			series: input.series,
			search: input.search,
			listingDate,
			onlyInStock: !input.showUnavailable || input.inStock === true,
			urgentDeadline: input.urgentDeadline,
			showUnavailable: input.showUnavailable,
			sort: input.sort,
		});
		if (input.series && result.total === 0) {
			const crawledProducts = await crawlAnismileProductsBySeriesName(input.series);
			if (crawledProducts.length > 0) {
				await upsertProductsFromSync(
					crawledProducts.map((item) => ({
						supplierId: item.supplierId,
						sourceUrl: item.sourceUrl,
						titleOriginal: item.titleOriginal,
						titleTranslated: item.titleTranslated,
						descriptionOriginal: item.descriptionOriginal,
						descriptionTranslated: item.descriptionTranslated,
						imageUrls: item.imageUrls,
						category: item.category,
						series: item.series,
						originalPrice: item.originalPrice,
						costPrice: item.costPrice,
						listingDate: item.listingDate,
						orderDeadline: item.orderDeadline,
						inStock: item.inStock,
						stockQuantity: item.stockQuantity,
						lastSyncedAt: new Date(),
						discountRate: item.discountRate,
						brand: item.brand,
						franchise: item.franchise,
						janCode: item.janCode,
						releaseDate: item.releaseDate,
					})),
				);
				result = await listAnismileProducts({
					page: input.page,
					pageSize: input.pageSize,
					category: input.category,
					series: input.series,
					search: input.search,
					listingDate,
					onlyInStock: !input.showUnavailable || input.inStock === true,
					urgentDeadline: input.urgentDeadline,
					showUnavailable: input.showUnavailable,
					sort: input.sort,
				});
			}
		}
		const seriesImageMap = await getSeriesImageMapForProducts(result.items);

		return {
			...result,
				items: result.items.map((item) => ({
				id: item.id,
				titleTranslated: item.titleTranslated,
				titleOriginal: item.titleOriginal,
				imageUrls: getDisplayImageUrls(item, seriesImageMap),
				sourceUrl: item.sourceUrl,
				category: item.category,
				series: item.series,
				janCode: item.janCode,
				brand: item.brand,
				franchise: item.franchise,
				sellingPrice: publicPrice(toNumberRequired(item.sellingPrice), showPrices),
				listingDate: item.listingDate,
					orderDeadline: item.orderDeadline,
					releaseDate: item.releaseDate,
					inStock: item.inStock,
				})),
			};
		});

export const listProductsAdmin = anismileAdminProcedure
	.route({
		method: "GET",
		path: "/anismile/admin/products",
		tags: ["Anismile"],
		summary: "List products (admin, includes cost price and markup)",
	})
	.input(listProductsInput)
	.handler(async ({ input }) => {
		const listingDate = input.listingDate ? new Date(input.listingDate) : undefined;
		const result = await listAnismileProducts({
			page: input.page,
			pageSize: input.pageSize,
			category: input.category,
			series: input.series,
			search: input.search,
			listingDate,
			onlyInStock: false,
		});
		const seriesImageMap = await getSeriesImageMapForProducts(result.items);

		return {
			...result,
			items: result.items.map((item) => ({
				id: item.id,
				titleTranslated: item.titleTranslated,
				titleOriginal: item.titleOriginal,
				imageUrls: getDisplayImageUrls(item, seriesImageMap),
				category: item.category,
				series: item.series,
				originalPrice: toNumber(item.originalPrice),
				costPrice: toNumberRequired(item.costPrice),
				sellingPrice: toNumberRequired(item.sellingPrice),
				markupOverride: toNumber(item.markupOverride),
				discountRate: toNumber(item.discountRate),
				saleStatus: item.saleStatus ?? null,
				priceManualOverride: item.priceManualOverride,
				listingDate: item.listingDate,
				orderDeadline: item.orderDeadline,
				inStock: item.inStock,
			})),
		};
	});

export const listLatestProducts = publicProcedure
	.route({
		method: "GET",
		path: "/anismile/products/latest",
		tags: ["Anismile"],
		summary: "List latest products",
	})
	.input(z.object({ limit: z.number().int().min(1).max(100).default(20) }))
	.handler(async ({ input, context }) => {
		const showPrices = await canSeePricing(context.headers);
		const items = await listLatestAnismileProducts(input.limit);
		const seriesImageMap = await getSeriesImageMapForProducts(items);
		return items.map((item) => ({
			id: item.id,
			titleTranslated: item.titleTranslated,
			titleOriginal: item.titleOriginal,
			imageUrls: getDisplayImageUrls(item, seriesImageMap),
			sellingPrice: publicPrice(toNumberRequired(item.sellingPrice), showPrices),
			listingDate: item.listingDate,
			orderDeadline: item.orderDeadline,
		}));
	});

export const getProductById = publicProcedure
	.route({
		method: "GET",
		path: "/anismile/products/{id}",
		tags: ["Anismile"],
		summary: "Get product detail",
	})
	.input(z.object({ id: z.string().min(1) }))
	.handler(async ({ input: { id }, context }) => {
		const showPrices = await canSeePricing(context.headers);
		let product = await getAnismileProductById(id);
		if (!product) {
			throw new ORPCError("NOT_FOUND", { message: "Product not found" });
		}
		await refreshSourceProductIfNeeded(product);
		product = await getAnismileProductById(id);
		if (!product) {
			throw new ORPCError("NOT_FOUND", { message: "Product not found" });
		}
		if (!isPubliclyOrderableProduct(product)) {
			throw new ORPCError("NOT_FOUND", { message: "Product not found" });
		}
		const seriesImageMap = await getSeriesImageMapForProducts([product]);

		return {
			id: product.id,
			supplierId: product.supplierId,
			sourceUrl: product.sourceUrl ?? null,
			titleOriginal: product.titleOriginal,
			titleTranslated: product.titleTranslated,
			descriptionTranslated: product.descriptionTranslated,
			imageUrls: getDisplayImageUrls(product, seriesImageMap),
			category: product.category,
			series: product.series,
			janCode: product.janCode ?? null,
			brand: product.brand ?? null,
			franchise: product.franchise ?? null,
			boxSpec: product.boxSpec ?? null,
			originalPrice: showPrices && product.originalPrice ? Number(product.originalPrice) : null,
			costPrice: showPrices && product.costPrice ? Number(product.costPrice) : null,
			discountRate: showPrices && product.discountRate ? Number(product.discountRate) : null,
			saleStatus: product.saleStatus ?? null,
			sellingPrice: publicPrice(toNumberRequired(product.sellingPrice), showPrices),
			listingDate: product.listingDate,
			orderDeadline: product.orderDeadline,
			releaseDate: product.releaseDate ?? null,
			inStock: product.inStock,
			stockQuantity: product.stockQuantity ?? null,
			lastSyncedAt: product.lastSyncedAt,
		};
	});

export const patchProductMarkup = anismileAdminProcedure
	.route({
		method: "PATCH",
		path: "/anismile/products/{id}/markup",
		tags: ["Anismile"],
		summary: "Patch product markup override",
	})
	.input(
		z.object({
			id: z.string().min(1),
			markupOverride: z.number().positive().max(10).nullable(),
		}),
	)
	.handler(async ({ input }) => {
		let updated;
		try {
			updated = await setProductMarkupOverride({
				productId: input.id,
				markupOverride: input.markupOverride,
			});
		} catch (error) {
			throw new ORPCError("NOT_FOUND", {
				message: error instanceof Error ? error.message : "Product not found",
			});
		}
		return {
			id: updated.id,
			markupOverride: toNumber(updated.markupOverride),
			sellingPrice: toNumberRequired(updated.sellingPrice),
		};
	});

export const patchProduct = anismileAdminProcedure
	.route({
		method: "PATCH",
		path: "/anismile/products/{id}",
		tags: ["Anismile"],
		summary: "Patch product fields",
	})
	.input(
		z.object({
			id: z.string().min(1),
			titleTranslated: z.string().min(1).optional(),
			sellingPrice: z.number().positive().optional(),
			markupOverride: z.number().min(0.01).max(10).nullable().optional(),
			discountRate: z.number().min(0).max(1).nullable().optional(),
			saleStatus: z.enum(["預售中", "有現貨"]).nullable().optional(),
		}),
	)
	.handler(async ({ input }) => {
		let updated;
		try {
			updated = await updateProductFields({
				id: input.id,
				titleTranslated: input.titleTranslated,
				sellingPrice: input.sellingPrice,
				markupOverride: input.markupOverride,
				discountRate: input.discountRate,
				saleStatus: input.saleStatus,
			});
		} catch (error) {
			throw new ORPCError("NOT_FOUND", {
				message: error instanceof Error ? error.message : "Product not found",
			});
		}
		return {
			id: updated.id,
			titleTranslated: updated.titleTranslated,
			sellingPrice: toNumberRequired(updated.sellingPrice),
			markupOverride: toNumber(updated.markupOverride),
			discountRate: toNumber(updated.discountRate),
			saleStatus: updated.saleStatus ?? null,
			priceManualOverride: updated.priceManualOverride,
		};
	});

const productFiltersShape = z.object({
	category: z.string().optional(),
	franchise: z.string().optional(),
	brand: z.string().optional(),
	showUnavailable: z.boolean().optional(),
	inStock: z.boolean().optional(),
	urgentDeadline: z.boolean().optional(),
});

function serializeProduct(p: {
	id: string;
	supplierId: string;
	sourceUrl: string | null;
	titleOriginal: string;
	titleTranslated: string;
	imageUrls: unknown;
	category: string | null;
	series: string | null;
	janCode: string | null;
	brand: string | null;
	franchise: string | null;
	originalPrice: { toNumber(): number } | null;
	costPrice: { toNumber(): number };
	sellingPrice: { toNumber(): number };
	discountRate: { toNumber(): number } | null;
	saleStatus: string | null;
	boxSpec: string | null;
	listingDate: Date | null;
	orderDeadline: Date | null;
	releaseDate: Date | null;
}, showPrices: boolean, seriesImageMap: Map<string, string>) {
	return {
		id: p.id,
		supplierId: p.supplierId,
		sourceUrl: p.sourceUrl,
		titleOriginal: p.titleOriginal,
		titleTranslated: p.titleTranslated,
		imageUrls: getDisplayImageUrls(p, seriesImageMap),
		category: p.category,
		series: p.series,
		janCode: p.janCode,
		brand: p.brand,
		franchise: p.franchise,
		originalPrice: showPrices && p.originalPrice ? toNumber(p.originalPrice) : null,
		costPrice: showPrices ? toNumberRequired(p.costPrice) : null,
		sellingPrice: publicPrice(toNumberRequired(p.sellingPrice), showPrices),
		discountRate: showPrices && p.discountRate ? toNumber(p.discountRate) : null,
		saleStatus: p.saleStatus,
		boxSpec: p.boxSpec,
		listingDate: p.listingDate?.toISOString() ?? null,
		orderDeadline: p.orderDeadline?.toISOString() ?? null,
		releaseDate: p.releaseDate?.toISOString() ?? null,
	};
}

export const searchProducts = publicProcedure
	.route({
		method: "GET",
		path: "/anismile/products/search",
		tags: ["Anismile"],
		summary: "Search products",
	})
	.input(
		z.object({
			query: z.string().min(1),
			filters: productFiltersShape.optional(),
			sort: productSortSchema.optional(),
			page: z.number().int().min(1).optional(),
			perPage: z.number().int().min(1).max(100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		const showPrices = await canSeePricing(context.headers);
		const result = await searchAnismileProducts(input);
		const seriesImageMap = await getSeriesImageMapForProducts(result.items);
		return {
			items: result.items.map((item) => serializeProduct(item, showPrices, seriesImageMap)),
			total: result.total,
			facets: result.facets,
		};
	});

export const listByCategory = publicProcedure
	.route({
		method: "GET",
		path: "/anismile/products/by-category/{slug}",
		tags: ["Anismile"],
		summary: "List products by category",
	})
	.input(
		z.object({
			slug: z.string().min(1),
			filters: z
				.object({
					franchise: z.string().optional(),
					brand: z.string().optional(),
					inStock: z.boolean().optional(),
					urgentDeadline: z.boolean().optional(),
					showUnavailable: z.boolean().optional(),
				})
				.optional(),
			sort: z.string().optional(),
			page: z.number().int().min(1).optional(),
			perPage: z.number().int().min(1).max(100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		const showPrices = await canSeePricing(context.headers);
		const result = await listProductsByCategory(input);
		const seriesImageMap = await getSeriesImageMapForProducts(result.items);
		return {
			items: result.items.map((item) => serializeProduct(item, showPrices, seriesImageMap)),
			total: result.total,
			facets: result.facets,
		};
	});

export const batchPatchProducts = anismileAdminProcedure
	.route({
		method: "PATCH",
		path: "/anismile/admin/products/batch",
		tags: ["Anismile"],
		summary: "Batch update product pricing fields",
	})
	.input(
		z.object({
			ids: z.array(z.string().min(1)).min(1).max(200),
			discountRate: z.number().min(0).max(1).nullable().optional(),
			markupOverride: z.number().min(0.01).max(10).nullable().optional(),
		}),
	)
	.handler(async ({ input }) => {
		const data: Record<string, number | null> = {};
		if (input.discountRate !== undefined) data.discountRate = input.discountRate;
		if (input.markupOverride !== undefined) data.markupOverride = input.markupOverride;
		await db.anismileProduct.updateMany({
			where: { id: { in: input.ids } },
			data,
		});
		return { updatedCount: input.ids.length };
	});
