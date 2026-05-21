import { ORPCError } from "@orpc/server";
import {
	addToCart,
	db,
	getTierSettingsValues,
	listCartItems,
	removeCartItem,
	updateCartItemQuantity as updateCartItemQuantityQuery,
} from "@repo/database";
import { sendEmail } from "@repo/mail";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { notifyAdminNewOrder } from "../lib/line-notify";
import { toNumberRequired } from "../lib/serialize";

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
		const tierSettings = await getTierSettingsValues();

		// 取得用戶等級折扣
		const userRecord = await db.user.findUnique({
			where: { id: user.id },
			select: { anismileTier: true },
		});
		const tier = userRecord?.anismileTier ?? "NORMAL";
		const tierDiscount =
			tier === "VIP"
				? tierSettings.vipDiscount
				: tier === "WHOLESALE"
					? tierSettings.wholesaleDiscount
					: 0;

		const result = await listCartItems(user.id);

		// 重新計算 lineTotal（有 markupOverride 不套用等級折扣）
		const items = result.items.map((item) => {
			const sellingPrice = toNumberRequired(item.product.sellingPrice);
			const effectivePrice =
				item.product.markupOverride !== null
					? sellingPrice
					: sellingPrice * (1 - tierDiscount);
			const lineTotal = effectivePrice * item.quantity;

			return {
				...item,
				product: {
					...item.product,
					sellingPrice,
				},
				lineTotal,
				tierDiscount,
			};
		});

		const cartTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

		return {
			items,
			total: cartTotal,
			cartTotal,
			tier,
			tierDiscount,
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
			const tierSettings = await getTierSettingsValues();

			// 取得用戶等級折扣
			const userRecord = await db.user.findUnique({
				where: { id: user.id },
				select: { anismileTier: true },
			});
			const tier = userRecord?.anismileTier ?? "NORMAL";
			const tierDiscount =
				tier === "VIP"
					? tierSettings.vipDiscount
					: tier === "WHOLESALE"
						? tierSettings.wholesaleDiscount
						: 0;

			// Inline transaction 建單（含等級折扣計算）
			const order = await db.$transaction(async (tx) => {
				const cartItems = await tx.anismileCartItem.findMany({
					where: { userId: user.id },
					include: { product: true },
				});

				if (cartItems.length === 0) {
					throw new Error("購物車是空的");
				}

				// 計算每個品項的單價（有 markupOverride 不套用等級折扣）
				// Prisma Decimal.mul() 接受 number，不需要 new Prisma.Decimal()
				const orderItems = cartItems.map((item) => {
					const unitPrice =
						item.product.markupOverride !== null
							? item.product.sellingPrice
							: item.product.sellingPrice.mul(1 - tierDiscount);
					return {
						productId: item.productId,
						quantity: item.quantity,
						unitPrice,
						costPrice: item.product.costPrice,
						tierDiscountRate: tierDiscount,
					};
				});

				// 加總：先轉成 number 計算，最後轉回 string 給 Prisma（避免 Decimal 初始值問題）
				const totalAmountNum = orderItems.reduce(
					(sum, item) => sum + item.unitPrice.toNumber() * item.quantity,
					0,
				);
				const totalAmount = totalAmountNum.toString();

				const created = await tx.anismileOrder.create({
					data: {
						userId: user.id,
						totalAmount,
						shippingName: input.shippingName,
						shippingPhone: input.shippingPhone,
						shippingAddress: input.shippingAddress,
						notes: input.note,
						items: { create: orderItems },
					},
					select: { id: true, totalAmount: true },
				});

				// 清空購物車
				await tx.anismileCartItem.deleteMany({ where: { userId: user.id } });

				return {
					...created,
					_emailItems: orderItems.map((oi) => {
						const cartItem = cartItems.find((ci) => ci.productId === oi.productId)!;
						return {
							titleTranslated:
								cartItem.product.titleTranslated ?? cartItem.product.titleOriginal,
							quantity: oi.quantity,
							unitPrice: oi.unitPrice.toNumber(),
						};
					}),
				};
			});

			void sendEmail({
				to: user.email,
				templateId: "orderConfirmation",
				context: {
					orderId: order.id,
					customerName: user.name ?? user.email,
					items: order._emailItems,
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

export const deleteCartItem = removeCartItemProcedure;
export const updateCartItemQuantityProcedure = updateCartItemQuantity;
