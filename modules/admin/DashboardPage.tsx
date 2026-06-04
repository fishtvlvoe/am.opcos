"use client";

import { Button, toastError, toastSuccess } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { parseAsString, useQueryState } from "nuqs";

import { OrderTable } from "./components/OrderTable";
import { StatsTile } from "@shared/components/StatsTile";

const ORDER_STATUSES = ["pending", "confirmed", "shipped", "completed", "cancelled"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

function isOrderStatus(value: string): value is OrderStatus {
	return ORDER_STATUSES.includes(value as OrderStatus);
}

function normalizeOrderStatus(value: string): OrderStatus {
	return isOrderStatus(value) ? value : "pending";
}
function getFirstImageUrl(value: unknown): string | undefined {
	if (!Array.isArray(value)) return undefined;
	const first = value.find((item) => typeof item === "string" && item.length > 0);
	return typeof first === "string" ? first : undefined;
}

function buildCsv(rows: Array<{ id: string; status: string; createdAt: Date | string; totalAmount: number; user: { name: string } }>) {
	const header = "orderId,customer,status,totalAmount,createdAt";
	const lines = rows.map((row) =>
		[row.id, row.user.name, row.status, Number(row.totalAmount).toFixed(2), format(new Date(row.createdAt), "yyyy-MM-dd")].join(","),
	);
	return [header, ...lines].join("\n");
}

export function DashboardPage() {
	const queryClient = useQueryClient();
	const [status, setStatus] = useQueryState("status", parseAsString.withDefault(""));
	const [dateFrom, setDateFrom] = useQueryState("dateFrom", parseAsString.withDefault(""));
	const [dateTo, setDateTo] = useQueryState("dateTo", parseAsString.withDefault(""));

	const statusFilter = isOrderStatus(status) ? status : undefined;

	const dashboardQuery = useQuery(orpc.anismile.admin.dashboard.queryOptions({ input: {} }));
	const ordersQuery = useQuery(
		orpc.anismile.orders.list.queryOptions({
			input: {
				page: 1,
				pageSize: 100,
				status: statusFilter,
				dateFrom: dateFrom || undefined,
				dateTo: dateTo || undefined,
			},
		}),
	);

	const syncMutation = useMutation(
		orpc.anismile.sync.mutationOptions({
			onSuccess: () => {
				toastSuccess("同步已啟動");
				void queryClient.invalidateQueries({ queryKey: orpc.anismile.admin.dashboard.key() });
			},
			onError: (error) => toastError(error.message || "同步啟動失敗"),
		}),
	);

	const updateStatusMutation = useMutation(
		orpc.anismile.orders.patch.mutationOptions({
			onSuccess: () => {
				toastSuccess("訂單狀態已更新");
				void queryClient.invalidateQueries({ queryKey: orpc.anismile.orders.list.key() });
				void queryClient.invalidateQueries({ queryKey: orpc.anismile.admin.dashboard.key() });
			},
			onError: (error) => toastError(error.message || "狀態更新失敗"),
		}),
	);

	const downloadCsv = () => {
		const rows = ordersQuery.data?.items ?? [];
		const csv = buildCsv(rows);
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `admin-orders-${new Date().toISOString().slice(0, 10)}.csv`;
		document.body.appendChild(link);
		link.click();
		link.remove();
		URL.revokeObjectURL(url);
	};

	const stats = dashboardQuery.data;
	const syncStatus = stats?.syncStatus ?? "idle";

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
				<StatsTile title="待處理訂單" value={stats?.pendingOrders ?? 0} valueFormat="number" />
				<StatsTile title="本月營收" value={stats?.monthlyRevenue ?? 0} valueFormat="currency" />
				<StatsTile title="商品總數" value={stats?.productCount ?? 0} valueFormat="number" />
			</div>
			<p className={syncStatus === "failed" ? "text-sm text-red-600" : "text-sm text-muted-foreground"}>
				上次同步：{stats?.lastSyncAt ? format(new Date(stats.lastSyncAt), "yyyy/MM/dd HH:mm") : "-"}（{syncStatus}）
			</p>

			<div className="flex flex-wrap items-center justify-end gap-2">
				<Button variant="outline" onClick={downloadCsv}>
					匯出 CSV
				</Button>
				<Button onClick={() => syncMutation.mutate({})} disabled={syncMutation.isPending}>
					{syncMutation.isPending ? "同步中..." : "立即同步"}
				</Button>
			</div>

			<OrderTable
				rows={(ordersQuery.data?.items ?? []).map((row) => ({
					...row,
					status: normalizeOrderStatus(row.status),
					totalAmount: Number(row.totalAmount),
					thumbnailUrl: row.items
						.map((item) => getFirstImageUrl(item.product.imageUrls))
						.find((url): url is string => typeof url === "string"),
					items: row.items.map((item) => ({
						quantity: item.quantity,
						unitPrice: Number(item.unitPrice),
						costPrice: item.costPrice ? Number(item.costPrice) : undefined,
					})),
				}))}
				status={status}
				dateFrom={dateFrom}
				dateTo={dateTo}
				onStatusChange={(next) => {
					void setStatus(next);
				}}
				onDateFromChange={(next) => {
					void setDateFrom(next);
				}}
				onDateToChange={(next) => {
					void setDateTo(next);
				}}
				onUpdateStatus={(orderId, nextStatus) => {
					updateStatusMutation.mutate({
						id: orderId,
						status: nextStatus,
					});
				}}
			/>
		</div>
	);
}
