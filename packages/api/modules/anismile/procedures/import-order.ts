import { ORPCError } from "@orpc/server";
import { db, getTierSettingsValues } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

function getProductUnavailableReason(product: { inStock: boolean; orderDeadline: Date | null }) {
	if (!product.inStock) return "商品已下架或無法下單";
	if (product.orderDeadline && product.orderDeadline.getTime() < Date.now()) return "商品已超過截單日";
	return null;
}

// 依 JAN code 比對商品
export const matchProducts = protectedProcedure
	.route({
		method: "POST",
		path: "/anismile/import-order/match",
		tags: ["Anismile"],
		summary: "Match products by JAN codes",
	})
	.input(
		z.object({
			jancodes: z.array(z.string().min(1)).min(1).max(500),
		}),
	)
	.handler(async ({ input }) => {
		const products = await db.anismileProduct.findMany({
			where: { janCode: { in: input.jancodes } },
			select: {
				id: true,
				janCode: true,
				titleOriginal: true,
				titleTranslated: true,
				sellingPrice: true,
			},
		});

		// 建立 janCode → product 的 map
		const matchedMap = new Map(products.map((p) => [p.janCode, p]));

		const matched = products.map((p) => ({
			jancode: p.janCode,
			productId: p.id,
			title: p.titleTranslated || p.titleOriginal,
			sellingPrice: p.sellingPrice.toNumber(),
		}));

		const unmatched = input.jancodes.filter((code) => !matchedMap.has(code));

		return { matched, unmatched };
	});

// 確認進貨訂單建立
export const confirmImportOrder = protectedProcedure
	.route({
		method: "POST",
		path: "/anismile/import-order/confirm",
		tags: ["Anismile"],
		summary: "Confirm and create import order",
	})
	.input(
		z.object({
			items: z
				.array(
					z.object({
						productId: z.string().min(1),
						quantity: z.number().int().min(1).max(9999),
					}),
				)
				.min(1),
			shippingName: z.string().min(1, "收件人姓名為必填").max(100),
			shippingPhone: z.string().min(1, "聯絡電話為必填").max(30),
			shippingAddress: z.string().min(1, "配送地址為必填"),
			note: z.string().optional(),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		const tierSettings = await getTierSettingsValues();

		// 取得用戶等級
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

		// 取得所有商品資訊
		const productIds = input.items.map((i) => i.productId);
		const products = await db.anismileProduct.findMany({
			where: { id: { in: productIds } },
			select: {
				id: true,
				sellingPrice: true,
				costPrice: true,
				markupOverride: true,
				inStock: true,
				orderDeadline: true,
			},
		});

		if (products.length !== productIds.length) {
			throw new ORPCError("NOT_FOUND", { message: "部分商品不存在" });
		}

		const productMap = new Map(products.map((p) => [p.id, p]));
		const unavailableProduct = products.find((product) => getProductUnavailableReason(product) !== null);
		if (unavailableProduct) {
			throw new ORPCError("BAD_REQUEST", {
				message: getProductUnavailableReason(unavailableProduct) ?? "商品目前無法下單",
			});
		}

		const order = await db.$transaction(async (tx) => {
			// 計算每個品項的單價（有 markupOverride 不套用等級折扣）
			// Prisma Decimal.mul() 接受 number
			const orderItems = input.items.map((item) => {
				const product = productMap.get(item.productId)!;
				// 有 markupOverride → 直接用 sellingPrice
				// 無 markupOverride → 套用等級折扣
				const unitPrice =
					product.markupOverride !== null
						? product.sellingPrice
						: product.sellingPrice.mul(1 - tierDiscount);

				return {
					productId: item.productId,
					quantity: item.quantity,
					unitPrice,
					costPrice: product.costPrice,
				};
			});

			// 加總（轉 number 後再轉 string 給 Prisma）
			const totalAmountNum = orderItems.reduce(
				(sum, item) => sum + item.unitPrice.toNumber() * item.quantity,
				0,
			);
			const totalAmount = totalAmountNum.toString();

			return await tx.anismileOrder.create({
				data: {
					userId: user.id,
					totalAmount,
					shippingName: input.shippingName,
					shippingPhone: input.shippingPhone,
					shippingAddress: input.shippingAddress,
					notes: input.note,
					items: {
						create: orderItems,
					},
				},
				select: { id: true },
			});
		});

		return { orderId: order.id };
	});
