import { ORPCError } from "@orpc/server";
import {
	addToCart,
	createOrderFromCart,
	db,
	getOrderById,
	listCartItems,
	removeCartItem,
	updateCartItemQuantity as updateCartItemQuantityQuery,
	upsertProductsFromSync,
} from "@repo/database";
import { sendEmail } from "@repo/mail";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import type { CrawledAnismileProduct } from "../lib/crawler";
import { crawlAnismileProductBySupplierId } from "../lib/crawler";
import { notifyAdminNewOrder } from "../lib/line-notify";
import { toNumberRequired } from "../lib/serialize";

const PLACEHOLDER_IMAGE_MARKER = "length_shadow_white";
const SOURCE_PRODUCT_REFRESH_TTL_MS = 30 * 60 * 1000;

function getCartProductUnavailableReason(product: {
	inStock: boolean;
	orderDeadline: Date | null;
}) {
	if (!product.inStock) return "商品已下架或無法下單";
	if (product.orderDeadline && product.orderDeadline.getTime() < Date.now()) {
		return "商品已超過截單日";
	}
	return null;
}

function toImageUrlArray(value: unknown): string[] {
	return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function shouldRefreshCartProduct(product: {
	imageUrls: unknown;
	listingDate: Date | null;
	orderDeadline: Date | null;
	lastSyncedAt: Date;
}) {
	if (Date.now() - product.lastSyncedAt.getTime() < SOURCE_PRODUCT_REFRESH_TTL_MS) return false;
	const firstImage = toImageUrlArray(product.imageUrls)[0];
	if (!firstImage || firstImage.includes(PLACEHOLDER_IMAGE_MARKER)) return true;
	if (product.listingDate && product.orderDeadline && product.listingDate.getTime() > product.orderDeadline.getTime()) {
		return true;
	}
	return false;
}

async function refreshUserCartProducts(userId: string) {
	const items = await db.anismileCartItem.findMany({
		where: { userId },
		select: {
			product: {
				select: {
					supplierId: true,
					imageUrls: true,
					listingDate: true,
					orderDeadline: true,
					lastSyncedAt: true,
				},
			},
		},
	});
	const staleSupplierIds = Array.from(
		new Set(
			items
				.filter((item) => shouldRefreshCartProduct(item.product))
				.map((item) => item.product.supplierId),
		),
	).slice(0, 5);

	if (staleSupplierIds.length === 0) return;

	const refreshedProducts = (
		await Promise.all(
			staleSupplierIds.map((supplierId) =>
				crawlAnismileProductBySupplierId(supplierId, {
					authMode: "authenticated",
				}).catch(() => null),
			),
		)
	).filter((item): item is CrawledAnismileProduct => Boolean(item));

	if (refreshedProducts.length === 0) return;

	await upsertProductsFromSync(
		refreshedProducts.map((item) => ({
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
			sourceAuthState: item.sourceAuthState,
		})),
		{ markMissingOutOfStock: false },
	);
}

async function pruneUnavailableCartItems(userId: string) {
	await db.anismileCartItem.deleteMany({
		where: {
			userId,
			product: {
				is: {
					OR: [
						{ inStock: false },
						{ orderDeadline: { lt: new Date() } },
					],
				},
			},
		},
	});
}

export const addCartItem = protectedProcedure
	.route({
		method: "POST",
		path: "/anismile/cart",
		tags: ["Anismile"],
		summary: "Add cart item",
	})
	.input(
		z.object({
			productId: z.string().min(1),
			quantity: z.number().int().min(1).max(999).default(1),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		try {
			await addToCart({
				userId: user.id,
				productId: input.productId,
				quantity: input.quantity,
			});
			return { success: true };
		} catch (error) {
			throw new ORPCError("NOT_FOUND", {
				message: error instanceof Error ? error.message : "Product unavailable",
			});
		}
	});

export const getCartItems = protectedProcedure
	.route({
		method: "GET",
		path: "/anismile/cart",
		tags: ["Anismile"],
		summary: "Get cart items",
	})
	.handler(async ({ context: { user } }) => {
		await refreshUserCartProducts(user.id);
		await pruneUnavailableCartItems(user.id);
		const userRecord = await db.user.findUnique({
			where: { id: user.id },
			select: { anismileTier: true },
		});
		const tier = userRecord?.anismileTier ?? "NORMAL";

		const result = await listCartItems(user.id);

		const items = result.items.map((item) => {
			const sellingPrice = toNumberRequired(item.product.sellingPrice);
			const lineTotal = sellingPrice * item.quantity;

			return {
				...item,
				product: {
					...item.product,
					sellingPrice,
				},
				lineTotal,
				tierDiscount: 0,
				isOrderable: item.unavailableReason === null,
				unavailableReason:
					item.unavailableReason === "Product order deadline has passed"
						? "商品已超過截單日"
						: item.unavailableReason === "Product unavailable"
							? "商品已下架或無法下單"
							: null,
			};
		});

		const cartTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

		return {
			items,
			total: cartTotal,
			cartTotal,
			tier,
			tierDiscount: 0,
		};
	});

export const updateCartItemQuantity = protectedProcedure
	.route({
		method: "PATCH",
		path: "/anismile/cart/{itemId}",
		tags: ["Anismile"],
		summary: "Update cart item quantity",
	})
	.input(
		z.object({
			itemId: z.string().min(1),
			quantity: z.number().int().min(1).max(999),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		try {
			await updateCartItemQuantityQuery({
				itemId: input.itemId,
				userId: user.id,
				quantity: input.quantity,
			});
			return { success: true };
		} catch (error) {
			throw new ORPCError("FORBIDDEN", {
				message: error instanceof Error ? error.message : "Cannot update this cart item",
			});
		}
	});

export const removeCartItemProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/anismile/cart/{itemId}",
		tags: ["Anismile"],
		summary: "Delete cart item",
	})
	.input(
		z.object({
			itemId: z.string().min(1),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		try {
			await removeCartItem({
				itemId: input.itemId,
				userId: user.id,
			});
			return { success: true };
		} catch (error) {
			throw new ORPCError("FORBIDDEN", {
				message: error instanceof Error ? error.message : "Cannot remove this cart item",
			});
		}
	});

export const checkoutCart = protectedProcedure
	.route({
		method: "POST",
		path: "/anismile/cart/checkout",
		tags: ["Anismile"],
		summary: "Checkout cart",
	})
	.input(
		z.object({
			shippingName: z.string().min(1, "收件人姓名為必填").max(100),
			shippingPhone: z.string().min(1, "聯絡電話為必填").max(30),
			shippingAddress: z.string().min(1, "配送地址為必填"),
			note: z.string().optional(),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		try {
			await refreshUserCartProducts(user.id);
			await pruneUnavailableCartItems(user.id);
			const paymentMethod = "bank_transfer";

			const order = await createOrderFromCart({
				userId: user.id,
				shippingName: input.shippingName,
				shippingPhone: input.shippingPhone,
				shippingAddress: input.shippingAddress,
				notes: input.note,
				paymentMethod,
				paymentStatus: "pending",
			});

			const emailItems = order.items.map((item) => ({
				titleTranslated: item.product.titleTranslated ?? item.product.titleOriginal,
				quantity: item.quantity,
				unitPrice: Number(item.unitPrice),
			}));

			void sendEmail({
				to: user.email,
				templateId: "orderConfirmation",
				context: {
					orderId: order.id,
					customerName: user.name ?? user.email,
					items: emailItems,
					totalAmount: Number(order.totalAmount),
					notes: input.note ?? null,
				},
			});

			void notifyAdminNewOrder({
				orderId: order.id,
				customerName: input.shippingName,
				total: String(Math.round(Number(order.totalAmount ?? 0))),
				shippingAddress: input.shippingAddress,
			}).catch((err) => console.error("[LINE] notify failed:", err));
			return { orderId: order.id };
		} catch (error) {
			throw new ORPCError("BAD_REQUEST", {
				message: error instanceof Error ? error.message : "Checkout failed",
			});
		}
	});

export const createCheckoutStripeSession = protectedProcedure
	.route({
		method: "POST",
		path: "/anismile/cart/checkout/stripe",
		tags: ["Anismile"],
		summary: "Create Stripe checkout session for pending order",
	})
	.input(
		z.object({
			orderId: z.string().min(1),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		const order = await getOrderById(input.orderId);
		if (!order) {
			throw new ORPCError("NOT_FOUND", { message: "Order not found" });
		}
		if (order.userId !== user.id) {
			throw new ORPCError("FORBIDDEN", { message: "無權限" });
		}
		throw new ORPCError("BAD_REQUEST", { message: "信用卡付款功能暫停中" });
	});

export const deleteCartItem = removeCartItemProcedure;
export const updateCartItemQuantityProcedure = updateCartItemQuantity;
