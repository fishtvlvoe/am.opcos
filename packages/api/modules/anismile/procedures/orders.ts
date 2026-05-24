import { ORPCError } from "@orpc/server";
import {
	ORDER_STATUSES,
	createOrderFromCart,
	getOrderById,
	getOrdersForExport,
	getAdminDashboardStats,
	listAnismileCustomers,
	listOrders,
	updateOrderStatus,
} from "@repo/database";
import { sendEmail } from "@repo/mail";
import { z } from "zod";

import { anismileAdminProcedure, protectedProcedure } from "../../../orpc/procedures";
import { generateOrdersCsv } from "../lib/csv-export";
import { forwardOrderToSupplier } from "../lib/supplier-forwarding";
import { toNumberRequired } from "../lib/serialize";

const orderStatusSchema = z.enum(ORDER_STATUSES);

export const createOrder = protectedProcedure
	.route({
		method: "POST",
		path: "/anismile/orders",
		tags: ["Anismile"],
		summary: "Create order from cart",
	})
	.input(
		z.object({
			shippingName: z.string().min(1, "收件人姓名為必填").max(100),
			shippingPhone: z.string().min(1, "聯絡電話為必填").max(30),
			shippingAddress: z.string().min(1, "配送地址為必填"),
			notes: z.string().max(2000).optional(),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		try {
			const order = await createOrderFromCart({
				userId: user.id,
				shippingName: input.shippingName,
				shippingPhone: input.shippingPhone,
				shippingAddress: input.shippingAddress,
				notes: input.notes,
			});

			await sendEmail({
				to: user.email,
				templateId: "orderConfirmation",
				context: {
					orderId: order.id,
					customerName: user.name ?? user.email,
					items: order.items.map((item) => ({
						titleTranslated: item.product.titleTranslated ?? item.product.titleOriginal,
						quantity: item.quantity,
						unitPrice: Number(item.unitPrice),
					})),
					totalAmount: Number(order.totalAmount),
					notes: order.notes ?? null,
				},
			});
			const isAdmin = user.role === "admin" || user.role === "super_admin";
			return {
				...order,
				totalAmount: toNumberRequired(order.totalAmount),
				items: order.items.map((item) => {
					const unitPrice = toNumberRequired(item.unitPrice);
					const costPrice = toNumberRequired(item.costPrice);
					const profit = Number(item.unitPrice.minus(item.costPrice).mul(item.quantity));
					return {
						...item,
						unitPrice,
						costPrice: isAdmin ? costPrice : undefined,
						profit: isAdmin ? profit : undefined,
					};
				}),
			};
		} catch (error) {
			throw new ORPCError("BAD_REQUEST", {
				message: error instanceof Error ? error.message : "Failed to create order",
			});
		}
	});

export const listOrderRows = protectedProcedure
	.route({
		method: "GET",
		path: "/anismile/orders",
		tags: ["Anismile"],
		summary: "List orders",
	})
	.input(
		z.object({
			status: orderStatusSchema.optional(),
			dateFrom: z.string().date().optional(),
			dateTo: z.string().date().optional(),
			page: z.number().int().min(1).default(1),
			pageSize: z.number().int().min(1).max(100).default(20),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		const isAdmin = user.role === "admin" || user.role === "super_admin";
		const result = await listOrders({
			userId: user.id,
			isAdmin,
			status: input.status,
			dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
			dateTo: input.dateTo ? new Date(input.dateTo) : undefined,
			page: input.page,
			pageSize: input.pageSize,
		});
		return {
			...result,
			items: result.items.map((item) => ({
				...item,
				totalAmount: toNumberRequired(item.totalAmount),
			})),
		};
	});

export const getDashboardStats = anismileAdminProcedure
	.route({
		method: "GET",
		path: "/anismile/admin/dashboard",
		tags: ["Anismile"],
		summary: "Get admin dashboard stats",
	})
	.handler(async () => {
		const stats = await getAdminDashboardStats();
		return {
			pendingOrders: stats.pendingOrders,
			monthlyRevenue: toNumberRequired(stats.monthlyRevenue),
			productCount: stats.productCount,
			lastSyncAt: stats.lastSyncAt,
			syncStatus: stats.syncStatus,
		};
	});

export const getOrderDetail = protectedProcedure
	.route({
		method: "GET",
		path: "/anismile/orders/{id}",
		tags: ["Anismile"],
		summary: "Get order detail",
	})
	.input(
		z.object({
			id: z.string().min(1),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		const order = await getOrderById(input.id);
		if (!order) {
			throw new ORPCError("NOT_FOUND", { message: "Order not found" });
		}

		const isAdmin = user.role === "admin" || user.role === "super_admin";
		if (!isAdmin && order.userId !== user.id) {
			throw new ORPCError("FORBIDDEN", {
				message: "Not allowed to access this order",
			});
		}

		return {
			...order,
			totalAmount: toNumberRequired(order.totalAmount),
			shippingName: order.shippingName,
			shippingPhone: order.shippingPhone,
			shippingAddress: order.shippingAddress,
			items: order.items.map((item) => {
				const profit = Number(item.unitPrice.minus(item.costPrice).mul(item.quantity));
				return {
					...item,
					unitPrice: toNumberRequired(item.unitPrice),
					costPrice: isAdmin ? toNumberRequired(item.costPrice) : undefined,
					profit: isAdmin ? profit : undefined,
				};
			}),
			children: order.children.map((child) => ({
				...child,
				totalAmount: toNumberRequired(child.totalAmount),
				items: child.items.map((item) => ({
					...item,
					unitPrice: toNumberRequired(item.unitPrice),
					costPrice: isAdmin ? toNumberRequired(item.costPrice) : undefined,
				})),
			})),
		};
	});

async function sendShipmentEmail(orderId: string) {
	const order = await getOrderById(orderId);
	if (!order) return;
	await sendEmail({
		to: order.user.email,
		subject: `訂單已出貨 #${order.id.slice(0, 8)}`,
		text: [
			`親愛的 ${order.user.name || order.user.email}，您的 AM 訂單已出貨。`,
			`訂單編號：${order.id}`,
			"",
			"如有任何問題，請回覆此 Email 聯繫我們。",
		].join("\n"),
		html: [
			`<p>親愛的 ${order.user.name || order.user.email}，您的 AM 訂單已出貨。</p>`,
			`<p>訂單編號：${order.id}</p>`,
			"<p>如有任何問題，請回覆此 Email 聯繫我們。</p>",
		].join(""),
	});
}

export const patchOrderStatus = anismileAdminProcedure
	.route({
		method: "PATCH",
		path: "/anismile/orders/{id}",
		tags: ["Anismile"],
		summary: "Patch order status",
	})
	.input(
		z.object({
			id: z.string().min(1),
			status: orderStatusSchema,
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		try {
			const order = await updateOrderStatus({
				orderId: input.id,
				status: input.status,
				actorUserId: user.id,
			});
			if (input.status === "shipped") {
				void sendShipmentEmail(input.id).catch((error) => console.error("[email] shipment notify failed", error));
			}
			return {
				...order,
				totalAmount: toNumberRequired(order.totalAmount),
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : "Failed to update order status";
			if (message.includes("not found")) {
				throw new ORPCError("NOT_FOUND", { message });
			}
			throw new ORPCError("BAD_REQUEST", { message });
		}
	});

export const forwardOrderToSupplierProcedure = anismileAdminProcedure
	.route({
		method: "POST",
		path: "/anismile/orders/{id}/forward-supplier",
		tags: ["Anismile"],
		summary: "Forward confirmed order to supplier",
	})
	.input(
		z.object({
			id: z.string().min(1),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		try {
			const order = await forwardOrderToSupplier({
				orderId: input.id,
				actorUserId: user.id,
			});
			return {
				...order,
				totalAmount: toNumberRequired(order.totalAmount),
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : "Failed to forward order";
			if (message.includes("not found")) {
				throw new ORPCError("NOT_FOUND", { message });
			}
			throw new ORPCError("BAD_REQUEST", { message });
		}
	});

export const exportOrdersCsv = anismileAdminProcedure
	.route({
		method: "GET",
		path: "/anismile/orders/export",
		tags: ["Anismile"],
		summary: "Export orders as csv",
	})
	.input(
		z.object({
			status: orderStatusSchema.optional(),
			startDate: z.string().date().optional(),
			endDate: z.string().date().optional(),
		}),
	)
	.handler(async ({ input }) => {
		const orders = await getOrdersForExport({
			status: input.status,
			startDate: input.startDate ? new Date(input.startDate) : undefined,
			endDate: input.endDate ? new Date(input.endDate) : undefined,
		});
		const csv = generateOrdersCsv(orders);
		return {
			contentType: "text/csv",
			filename: `anismile-orders-${new Date().toISOString().slice(0, 10)}.csv`,
			csv,
		};
	});

export const listCustomers = anismileAdminProcedure
	.route({
		method: "GET",
		path: "/anismile/admin/customers",
		tags: ["Anismile"],
		summary: "List customers",
	})
	.input(
		z.object({
			search: z.string().optional(),
			page: z.number().int().min(1).default(1),
			pageSize: z.number().int().min(1).max(100).default(20),
		}),
	)
	.handler(async ({ input }) => {
		return await listAnismileCustomers({
			search: input.search,
			page: input.page,
			pageSize: input.pageSize,
		});
	});
