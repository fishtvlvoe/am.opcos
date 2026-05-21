"use client";

import { Button } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";

import { OrderCard } from "./components/OrderCard";

const statuses = ["pending", "confirmed", "shipped", "completed", "cancelled"] as const;

export function OrdersPage() {
	const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
	const [status, setStatus] = useQueryState("status", parseAsString.withDefault(""));
	const statusFilter = status ? (status as (typeof statuses)[number]) : undefined;

	const ordersQuery = useQuery(
		orpc.anismile.orders.list.queryOptions({
			input: {
				page: page ?? 1,
				pageSize: 20,
				status: statusFilter,
			},
		}),
	);

	const rows = ordersQuery.data?.items ?? [];

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h1 className="font-semibold text-2xl">我的訂單</h1>
				<select
					className="rounded-md border bg-card px-3 py-2 text-sm"
					value={status}
					onChange={(event) => {
						void setStatus(event.target.value);
						void setPage(1);
					}}
				>
					<option value="">全部狀態</option>
					<option value="pending">待確認</option>
					<option value="confirmed">已確認</option>
					<option value="shipped">已出貨</option>
					<option value="completed">已完成</option>
					<option value="cancelled">已取消</option>
				</select>
			</div>

			{rows.length === 0 ? (
				<div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
					<p className="text-sm text-stone-600">目前還沒有訂單</p>
					<Link href="/" className="mt-2 inline-block text-sm text-stone-700 underline underline-offset-4">
						前往商品目錄
					</Link>
				</div>
			) : (
				<div className="grid gap-3">
					{rows.map((row) => (
						<OrderCard
							key={row.id}
							id={row.id}
							status={row.status as (typeof statuses)[number]}
							totalAmount={Number(row.totalAmount)}
							createdAt={row.createdAt}
							itemCount={row.items.length}
						/>
					))}
				</div>
			)}

			<div className="flex flex-wrap items-center justify-between gap-2">
				<p className="text-sm text-muted-foreground">
					第 {ordersQuery.data?.page ?? 1} / {ordersQuery.data?.totalPages ?? 1} 頁
				</p>
				<div className="flex gap-2">
					<Button variant="outline" disabled={page <= 1} onClick={() => void setPage(page - 1)}>
						上一頁
					</Button>
					<Button
						variant="outline"
						disabled={page >= (ordersQuery.data?.totalPages ?? 1)}
						onClick={() => void setPage(page + 1)}
					>
						下一頁
					</Button>
				</div>
			</div>
		</div>
	);
}
