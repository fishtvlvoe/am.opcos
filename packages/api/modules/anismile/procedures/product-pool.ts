import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

const PAGE_SIZE = 20;

// itemStatus 群組對應
const STATUS_MAP: Record<string, string[]> = {
	pending: ["pending", "confirmed"],
	shipped: ["shipped"],
	completed: ["completed"],
	cancelled: ["cancelled"],
};

// 列出用戶的商品池（訂單品項彙整）
export const listProductPool = protectedProcedure
	.route({
		method: "GET",
		path: "/anismile/product-pool",
		tags: ["Anismile"],
		summary: "List product pool (order items)",
	})
	.input(
		z.object({
			status: z.string().optional(),
			search: z.string().optional(),
			page: z.number().int().min(1).default(1),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		const itemStatusFilter = input.status ? STATUS_MAP[input.status] : undefined;

		const whereClause = {
			order: { userId: user.id },
			...(itemStatusFilter ? { itemStatus: { in: itemStatusFilter } } : {}),
			...(input.search
				? {
						product: {
							OR: [
								{ titleTranslated: { contains: input.search } },
								{ titleOriginal: { contains: input.search } },
								{ janCode: { contains: input.search } },
							],
						},
					}
				: {}),
		};

		const [items, total] = await Promise.all([
			db.anismileOrderItem.findMany({
				where: whereClause,
				include: {
					product: {
						select: { titleOriginal: true, titleTranslated: true, janCode: true },
					},
					order: {
						select: { id: true, createdAt: true },
					},
				},
				orderBy: { order: { createdAt: "desc" } },
				skip: (input.page - 1) * PAGE_SIZE,
				take: PAGE_SIZE,
			}),
			db.anismileOrderItem.count({ where: whereClause }),
		]);

		return {
			items: items.map((item) => ({
				id: item.id,
				productName: item.product.titleTranslated || item.product.titleOriginal,
				janCode: item.product.janCode,
				quantity: item.quantity,
				unitPrice: item.unitPrice.toNumber(),
				orderId: item.order.id,
				itemStatus: item.itemStatus,
				orderCreatedAt: item.order.createdAt,
			})),
			total,
			page: input.page,
			pageSize: PAGE_SIZE,
		};
	});

// 管理員批量更新品項狀態
export const adminBatchUpdateItemStatus = protectedProcedure
	.route({
		method: "PATCH",
		path: "/anismile/product-pool/batch-status",
		tags: ["Anismile"],
		summary: "Admin: batch update order item status",
	})
	.input(
		z.object({
			itemIds: z.array(z.string().min(1)).min(1).max(200),
			status: z.string().min(1),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		// 只有 admin / super_admin 可以批量修改
		if (user.role !== "admin" && user.role !== "super_admin") {
			throw new ORPCError("FORBIDDEN", { message: "無管理員權限" });
		}

		const result = await db.anismileOrderItem.updateMany({
			where: { id: { in: input.itemIds } },
			data: { itemStatus: input.status },
		});

		return { updated: result.count };
	});
