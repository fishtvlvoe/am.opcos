"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";

type OrderRow = {
	id: string;
	user: { name: string };
	status: OrderStatus;
	createdAt: Date | string;
	totalAmount: number;
	thumbnailUrl?: string;
	items: Array<{ quantity: number; unitPrice: number; costPrice?: number }>;
};

type OrderStatus = "pending" | "confirmed" | "shipped" | "completed" | "cancelled";

type OrderTableProps = {
	rows: OrderRow[];
	status: string;
	dateFrom: string;
	dateTo: string;
	onStatusChange: (next: string) => void;
	onDateFromChange: (next: string) => void;
	onDateToChange: (next: string) => void;
	onUpdateStatus: (orderId: string, status: OrderStatus) => void;
};

const statuses = [
	{ value: "", label: "全部狀態" },
	{ value: "pending", label: "待確認" },
	{ value: "confirmed", label: "已確認" },
	{ value: "shipped", label: "已出貨" },
	{ value: "completed", label: "已完成" },
	{ value: "cancelled", label: "已取消" },
];

const statusBadgeClasses: Record<OrderStatus, string> = {
	pending: "bg-amber-100 text-amber-700",
	confirmed: "bg-stone-100 text-stone-700",
	shipped: "bg-blue-100 text-blue-700",
	completed: "bg-green-100 text-green-700",
	cancelled: "bg-red-100 text-red-700",
};

const statusLabel: Record<OrderStatus, string> = {
	pending: "待確認",
	confirmed: "已確認",
	shipped: "已出貨",
	completed: "已完成",
	cancelled: "已取消",
};

function ShippingInfoPanel({ orderId }: { orderId: string }) {
	const orderQuery = useQuery(
		orpc.anismile.orders.getById.queryOptions({ input: { id: orderId } }),
	);

	if (orderQuery.isPending) {
		return <p className="text-sm text-stone-500">載入中...</p>;
	}

	if (orderQuery.isError || !orderQuery.data) {
		return <p className="text-sm text-red-500">無法取得訂單資料</p>;
	}

	const order = orderQuery.data;
	const hasShipping =
		order.shippingName !== "" || order.shippingPhone !== "" || order.shippingAddress !== "";

	return (
		<div className="rounded-lg border border-stone-200 bg-stone-50 p-4 space-y-3">
			<p className="text-xs font-medium uppercase tracking-wide text-stone-500">配送資訊</p>
			{hasShipping ? (
				<dl className="space-y-2 text-sm">
					<div className="flex gap-2">
						<dt className="w-20 shrink-0 text-stone-500">收件人</dt>
						<dd className="text-stone-800">{order.shippingName || "—"}</dd>
					</div>
					<div className="flex gap-2">
						<dt className="w-20 shrink-0 text-stone-500">聯絡電話</dt>
						<dd className="text-stone-800">{order.shippingPhone || "—"}</dd>
					</div>
					<div className="flex gap-2">
						<dt className="w-20 shrink-0 text-stone-500">配送地址</dt>
						<dd className="text-stone-800">{order.shippingAddress || "—"}</dd>
					</div>
				</dl>
			) : (
				<p className="text-sm text-stone-500">（歷史訂單，無配送資訊）</p>
			)}
		</div>
	);
}

export function OrderTable({
	rows,
	status,
	dateFrom,
	dateTo,
	onStatusChange,
	onDateFromChange,
	onDateToChange,
	onUpdateStatus,
}: OrderTableProps) {
	const [openOrderId, setOpenOrderId] = useState<string | null>(null);

	return (
		<div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
			<div className="flex flex-wrap items-center gap-2">
				<select
					className="rounded-md border border-stone-300 px-2 py-1 text-sm"
					value={status}
					onChange={(event) => onStatusChange(event.target.value)}
				>
					{statuses.map((item) => (
						<option key={item.value} value={item.value}>
							{item.label}
						</option>
					))}
				</select>
				<input
					type="date"
					value={dateFrom}
					onChange={(event) => onDateFromChange(event.target.value)}
					className="rounded-md border border-stone-300 px-2 py-1 text-sm"
				/>
				<input
					type="date"
					value={dateTo}
					onChange={(event) => onDateToChange(event.target.value)}
					className="rounded-md border border-stone-300 px-2 py-1 text-sm"
				/>
			</div>

			<div className="overflow-x-auto">
				<table className="min-w-[920px] text-sm">
					<thead>
						<tr className="border-b border-stone-200 text-left text-stone-500">
							<th className="px-2 py-2 font-medium">編號</th>
							<th className="px-2 py-2 font-medium">客戶</th>
							<th className="px-2 py-2 font-medium">商品圖</th>
							<th className="px-2 py-2 font-medium">品項數</th>
							<th className="px-2 py-2 font-medium">金額</th>
							<th className="px-2 py-2 font-medium">利潤</th>
							<th className="px-2 py-2 font-medium">狀態</th>
							<th className="px-2 py-2 font-medium">日期</th>
							<th className="px-2 py-2 font-medium">動作</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => {
							const itemCount = row.items.reduce((sum, item) => sum + item.quantity, 0);
							const rowProfit = row.items.reduce((sum, item) => {
								const cost = item.costPrice ?? 0;
								return sum + (item.unitPrice - cost) * item.quantity;
							}, 0);
							return (
								<tr key={row.id} className="border-b border-stone-100">
									<td className="px-2 py-2 font-mono text-xs">{row.id}</td>
									<td className="px-2 py-2">{row.user.name}</td>
									<td className="px-2 py-2">
										{row.thumbnailUrl ? (
											<img
												src={row.thumbnailUrl}
												alt=""
												className="h-6 w-6 rounded border border-stone-200 object-cover"
												loading="lazy"
											/>
										) : (
											<div className="h-6 w-6 rounded border border-dashed border-stone-200 bg-stone-50" />
										)}
									</td>
									<td className="px-2 py-2">{itemCount}</td>
									<td className="px-2 py-2">¥ {Number(row.totalAmount).toFixed(2)}</td>
									<td className="px-2 py-2 font-medium text-green-700">¥ {rowProfit.toFixed(2)}</td>
									<td className="px-2 py-2">
										<span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClasses[row.status]}`}>
											{statusLabel[row.status]}
										</span>
									</td>
									<td className="px-2 py-2">{format(new Date(row.createdAt), "yyyy/MM/dd")}</td>
									<td className="px-2 py-2">
										<div className="flex items-center gap-2">
											<select
												className="rounded-md border border-stone-300 px-2 py-1 text-xs"
												value={row.status}
												onChange={(event) => onUpdateStatus(row.id, event.target.value as OrderStatus)}
											>
												{statuses
													.filter((item) => item.value)
													.map((item) => (
														<option key={item.value} value={item.value}>
															{item.label}
														</option>
													))}
											</select>
											<button
												type="button"
												className="rounded-md border border-stone-300 px-2 py-1 text-xs text-stone-600 hover:bg-stone-50"
												onClick={() => setOpenOrderId(row.id)}
											>
												詳情
											</button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{rows.length === 0 ? (
				<div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4 text-center text-sm text-stone-500">
					符合條件的訂單為 0 筆
				</div>
			) : null}

			<Dialog
				open={openOrderId !== null}
				onOpenChange={(open) => {
					if (!open) setOpenOrderId(null);
				}}
			>
				<DialogContent aria-describedby={undefined}>
					<DialogHeader>
						<DialogTitle>訂單詳情</DialogTitle>
					</DialogHeader>
					{openOrderId ? <ShippingInfoPanel orderId={openOrderId} /> : null}
				</DialogContent>
			</Dialog>
		</div>
	);
}
