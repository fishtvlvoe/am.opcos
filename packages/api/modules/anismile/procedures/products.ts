import { ORPCError } from "@orpc/server";
import {
	db,
	getAnismileProductById,
	listAnismileProducts,
	listLatestAnismileProducts,
	listProductsByCategory,
	searchAnismileProducts,
	setProductMarkupOverride,
	updateProductFields,
} from "@repo/database";
import { z } from "zod";

import { anismileAdminProcedure, protectedProcedure, publicProcedure } from "../../../orpc/procedures";
import { toNumber, toNumberRequired } from "../lib/serialize";

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
});

export const listProducts = publicProcedure
	.route({
		method: "GET",
		path: "/anismile/products",
		tags: ["Anismile"],
		summary: "List products",
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
			onlyInStock: input.inStock ?? true,
			urgentDeadline: input.urgentDeadline,
			showUnavailable: input.showUnavailable,
		});

		return {
			...result,
				items: result.items.map((item) => ({
				id: item.id,
				titleTranslated: item.titleTranslated,
				titleOriginal: item.titleOriginal,
				imageUrls: item.imageUrls,
				category: item.category,
				series: item.series,
				sellingPrice: toNumberRequired(item.sellingPrice),
				listingDate: item.listingDate,
					orderDeadline: item.orderDeadline,
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

		return {
			...result,
			items: result.items.map((item) => ({
				id: item.id,
				titleTranslated: item.titleTranslated,
				titleOriginal: item.titleOriginal,
				imageUrls: item.imageUrls,
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
	.handler(async ({ input }) => {
		const items = await listLatestAnismileProducts(input.limit);
		return items.map((item) => ({
			id: item.id,
			titleTranslated: item.titleTranslated,
			titleOriginal: item.titleOriginal,
			imageUrls: item.imageUrls,
			sellingPrice: toNumberRequired(item.sellingPrice),
			listingDate: item.listingDate,
			orderDeadline: item.orderDeadline,
		}));
	});

export const getProductById = protectedProcedure
	.route({
		method: "GET",
		path: "/anismile/products/{id}",
		tags: ["Anismile"],
		summary: "Get product detail",
	})
	.input(z.object({ id: z.string().min(1) }))
	.handler(async ({ input: { id } }) => {
		const product = await getAnismileProductById(id);
		if (!product) {
			throw new ORPCError("NOT_FOUND", { message: "Product not found" });
		}

		return {
			id: product.id,
			titleOriginal: product.titleOriginal,
			titleTranslated: product.titleTranslated,
			descriptionTranslated: product.descriptionTranslated,
			imageUrls: product.imageUrls,
			category: product.category,
			series: product.series,
			janCode: product.janCode ?? null,
			brand: product.brand ?? null,
			franchise: product.franchise ?? null,
			boxSpec: product.boxSpec ?? null,
			originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
			costPrice: product.costPrice ? Number(product.costPrice) : null,
			discountRate: product.discountRate ? Number(product.discountRate) : null,
			saleStatus: product.saleStatus ?? null,
			sellingPrice: toNumberRequired(product.sellingPrice),
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
});

function serializeProduct(p: {
	id: string;
	supplierId: string;
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
}) {
	return {
		id: p.id,
		supplierId: p.supplierId,
		titleOriginal: p.titleOriginal,
		titleTranslated: p.titleTranslated,
		imageUrls: p.imageUrls as string[],
		category: p.category,
		series: p.series,
		janCode: p.janCode,
		brand: p.brand,
		franchise: p.franchise,
		originalPrice: p.originalPrice ? toNumber(p.originalPrice) : null,
		costPrice: toNumberRequired(p.costPrice),
		sellingPrice: toNumberRequired(p.sellingPrice),
		discountRate: p.discountRate ? toNumber(p.discountRate) : null,
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
			sort: z.string().optional(),
			page: z.number().int().min(1).optional(),
			perPage: z.number().int().min(1).max(100).optional(),
		}),
	)
	.handler(async ({ input }) => {
		const result = await searchAnismileProducts(input);
		return {
			items: result.items.map(serializeProduct),
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
	.handler(async ({ input }) => {
		const result = await listProductsByCategory(input);
		return {
			items: result.items.map(serializeProduct),
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
