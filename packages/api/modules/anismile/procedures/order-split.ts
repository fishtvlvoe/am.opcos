import { ORPCError } from "@orpc/server";
import { getOrderById, listChildOrders, splitOrder } from "@repo/database";
import { z } from "zod";

import { anismileAdminProcedure, protectedProcedure } from "../../../orpc/procedures";
import { toNumberRequired } from "../lib/serialize";

const splitItemsSchema = z.array(
	z.object({
		itemId: z.string().min(1),
		quantity: z.number().int().min(1),
	}),
).min(1);

export const splitOrderProcedure = anismileAdminProcedure
	.route({
		method: "POST",
		path: "/anismile/orders/{id}/split",
		tags: ["Anismile"],
		summary: "Split order into child order",
	})
	.input(
		z.object({
			id: z.string().min(1),
			items: splitItemsSchema,
		}),
	)
	.handler(async ({ input }) => {
		try {
			const child = await splitOrder({
				orderId: input.id,
				items: input.items,
			});
			return {
				...child,
				totalAmount: toNumberRequired(child.totalAmount),
				items: child.items.map((item) => ({
					...item,
					unitPrice: toNumberRequired(item.unitPrice),
					costPrice: toNumberRequired(item.costPrice),
				})),
			};
		} catch (error) {
			throw new ORPCError("BAD_REQUEST", {
				message: error instanceof Error ? error.message : "Split order failed",
			});
		}
	});

export const listChildOrdersProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/anismile/orders/{id}/children",
		tags: ["Anismile"],
		summary: "List child orders",
	})
	.input(
		z.object({
			id: z.string().min(1),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		const parent = await getOrderById(input.id);
		if (!parent) {
			throw new ORPCError("NOT_FOUND", { message: "Order not found" });
		}
		const isAdmin = user.role === "admin" || user.role === "super_admin";
		if (!isAdmin && parent.userId !== user.id) {
			throw new ORPCError("FORBIDDEN", { message: "Not allowed to access this order" });
		}

		const children = await listChildOrders(input.id);
		return children.map((order) => ({
			...order,
			totalAmount: toNumberRequired(order.totalAmount),
			items: order.items.map((item) => ({
				...item,
				unitPrice: toNumberRequired(item.unitPrice),
				costPrice: isAdmin ? toNumberRequired(item.costPrice) : undefined,
			})),
		}));
	});
