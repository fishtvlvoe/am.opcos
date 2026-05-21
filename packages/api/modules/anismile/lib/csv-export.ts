import type { getOrdersForExport } from "@repo/database";

type ExportOrder = Awaited<ReturnType<typeof getOrdersForExport>>[number];

function escapeCsv(value: string | number | null | undefined) {
	if (value === null || value === undefined) {
		return "";
	}
	const text = String(value);
	if (!text.includes(",") && !text.includes("\"") && !text.includes("\n")) {
		return text;
	}
	return `"${text.replaceAll("\"", "\"\"")}"`;
}

export function generateOrdersCsv(orders: ExportOrder[]) {
	const header = [
		"order_id",
		"customer_name",
		"product_title",
		"supplier_product_id",
		"quantity",
		"cost_price",
		"selling_price",
		"notes",
		"created_at",
	];

	const rows = orders.flatMap((order) =>
		order.items.map((item) => [
			order.id,
			order.user.name,
			item.product.titleTranslated || item.product.titleOriginal,
			item.product.supplierId,
			item.quantity,
			Number(item.costPrice).toFixed(2),
			Number(item.unitPrice).toFixed(2),
			order.notes ?? "",
			order.createdAt.toISOString(),
		]),
	);

	return [header, ...rows].map((line) => line.map(escapeCsv).join(",")).join("\n");
}
