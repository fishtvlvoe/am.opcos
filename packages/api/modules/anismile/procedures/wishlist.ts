import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

// 將願望清單商品加入（upsert）
export const addWishlist = protectedProcedure
	.route({
		method: "POST",
		path: "/anismile/wishlist",
		tags: ["Anismile"],
		summary: "Add product to wishlist",
	})
	.input(
		z.object({
			productId: z.string().min(1),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		// 確認商品存在
		const product = await db.anismileProduct.findUnique({
			where: { id: input.productId },
			select: { id: true },
		});
		if (!product) {
			throw new ORPCError("NOT_FOUND", { message: "找不到此商品" });
		}

		await db.anismileWishlistItem.upsert({
			where: {
				userId_productId: {
					userId: user.id,
					productId: input.productId,
				},
			},
			create: {
				userId: user.id,
				productId: input.productId,
				quantity: 1,
			},
			update: {}, // 已存在不覆蓋數量
		});

		return { success: true };
	});

// 從願望清單移除商品
export const removeWishlist = protectedProcedure
	.route({
		method: "DELETE",
		path: "/anismile/wishlist/{productId}",
		tags: ["Anismile"],
		summary: "Remove product from wishlist",
	})
	.input(
		z.object({
			productId: z.string().min(1),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		await db.anismileWishlistItem.deleteMany({
			where: {
				userId: user.id,
				productId: input.productId,
			},
		});
		return { success: true };
	});

// 列出願望清單，支援排序與篩選
export const listWishlist = protectedProcedure
	.route({
		method: "GET",
		path: "/anismile/wishlist",
		tags: ["Anismile"],
		summary: "List wishlist items",
	})
	.input(
		z.object({
			sort: z.enum(["recent", "oldest", "deadline"]).optional().default("recent"),
			filter: z.enum(["all", "hideUnavailable", "hasQuantity", "noQuantity"]).optional().default("all"),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		// 排序方向
		const orderBy =
			input.sort === "recent"
				? { createdAt: "desc" as const }
				: input.sort === "oldest"
					? { createdAt: "asc" as const }
					: { product: { orderDeadline: "asc" as const } }; // deadline = 截單日

		const items = await db.anismileWishlistItem.findMany({
			where: { userId: user.id },
			include: {
				product: {
					select: {
						id: true,
						titleTranslated: true,
						janCode: true,
						sellingPrice: true,
						imageUrls: true,
						listingDate: true,
						inStock: true,
					},
				},
			},
			orderBy,
		});

		// 套用篩選
		const filtered = items.filter((item) => {
			if (input.filter === "hideUnavailable") return item.product.inStock;
			if (input.filter === "hasQuantity") return item.quantity > 0;
			if (input.filter === "noQuantity") return item.quantity === 0;
			return true; // all
		});

		return {
			items: filtered.map((item) => ({
				id: item.id,
				productId: item.productId,
				quantity: item.quantity,
				createdAt: item.createdAt,
				product: {
					id: item.product.id,
					title: item.product.titleTranslated,
					janCode: item.product.janCode,
					sellingPrice: item.product.sellingPrice.toNumber(),
					imageUrls: item.product.imageUrls,
					listingDate: item.product.listingDate,
					inStock: item.product.inStock,
				},
			})),
			total: filtered.length,
		};
	});

// 更新願望清單商品數量
export const updateWishlistQuantity = protectedProcedure
	.route({
		method: "PATCH",
		path: "/anismile/wishlist/{productId}/quantity",
		tags: ["Anismile"],
		summary: "Update wishlist item quantity",
	})
	.input(
		z.object({
			productId: z.string().min(1),
			quantity: z.number().int().min(0).max(999),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		const item = await db.anismileWishlistItem.findUnique({
			where: {
				userId_productId: {
					userId: user.id,
					productId: input.productId,
				},
			},
		});
		if (!item) {
			throw new ORPCError("NOT_FOUND", { message: "願望清單中找不到此商品" });
		}

		await db.anismileWishlistItem.update({
			where: {
				userId_productId: {
					userId: user.id,
					productId: input.productId,
				},
			},
			data: { quantity: input.quantity },
		});

		return { success: true };
	});

// 批量將願望清單（quantity > 0）加入購物車
export const batchAddToCart = protectedProcedure
	.route({
		method: "POST",
		path: "/anismile/wishlist/batch-add-to-cart",
		tags: ["Anismile"],
		summary: "Batch add wishlist items to cart",
	})
	.handler(async ({ context: { user } }) => {
		// 取得所有 quantity > 0 的願望清單商品
		const wishlistItems = await db.anismileWishlistItem.findMany({
			where: {
				userId: user.id,
				quantity: { gt: 0 },
			},
			include: {
				product: { select: { id: true, inStock: true, orderDeadline: true } },
			},
		});

		const today = new Date();
		const skipped: string[] = [];
		let added = 0;

		await db.$transaction(async (tx) => {
			for (const item of wishlistItems) {
				// 商品缺貨時跳過
				if (!item.product.inStock) {
					skipped.push(item.productId);
					continue;
				}

				// 已過截單日時跳過
				if (
					item.product.orderDeadline &&
					item.product.orderDeadline < today
				) {
					skipped.push(item.productId);
					continue;
				}

				// Upsert 購物車（已存在則累加數量，不超過 999）
				const existing = await tx.anismileCartItem.findUnique({
					where: {
						userId_productId: {
							userId: user.id,
							productId: item.productId,
						},
					},
				});

				if (existing) {
					const newQty = Math.min(existing.quantity + item.quantity, 999);
					await tx.anismileCartItem.update({
						where: { id: existing.id },
						data: { quantity: newQty },
					});
				} else {
					await tx.anismileCartItem.create({
						data: {
							userId: user.id,
							productId: item.productId,
							quantity: item.quantity,
						},
					});
				}
				added++;
			}
		});

		return { added, skipped };
	});
