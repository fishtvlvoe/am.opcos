"use client";

import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, toastError, toastSuccess } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";

const statuses = ["pending", "confirmed", "shipped", "completed", "cancelled"] as const;

const statusLabels: Record<string, string> = {
	pending: "待確認",
	confirmed: "已確認",
	shipped: "已出貨",
	completed: "已完成",
	cancelled: "已取消",
};

export function AdminOrdersPage() {
	const queryClient = useQueryClient();
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

	const updateMutation = useMutation(
		orpc.anismile.orders.patch.mutationOptions({
			onSuccess: () => {
				toastSuccess("訂單狀態已更新");
				void queryClient.invalidateQueries({ queryKey: orpc.anismile.orders.list.key() });
			},
			onError: (error) => toastError(error.message || "狀態更新失敗"),
		}),
	);

	const forwardMutation = useMutation(
		orpc.anismile.orders.forwardSupplier.mutationOptions({
			onSuccess: () => {
				toastSuccess("訂單已轉發供應商");
				void queryClient.invalidateQueries({ queryKey: orpc.anismile.orders.list.key() });
			},
			onError: (error) => toastError(error.message || "供應商轉發失敗"),
		}),
	);

	const exportQuery = useQuery(
		orpc.anismile.orders.export.queryOptions({
			input: {
				status: statusFilter,
			},
		}),
	);

	const downloadCsv = () => {
		const data = exportQuery.data;
		if (!data) {
			return;
		}
		const blob = new Blob([data.csv], { type: data.contentType });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = data.filename;
		document.body.appendChild(link);
		link.click();
		link.remove();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="font-semibold text-2xl">訂單管理</h1>
				<div className="flex items-center gap-2">
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
					<Button variant="outline" onClick={downloadCsv} disabled={!exportQuery.data}>
						匯出 CSV
					</Button>
				</div>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>訂單編號</TableHead>
						<TableHead>客戶</TableHead>
						<TableHead>狀態</TableHead>
						<TableHead>金額</TableHead>
						<TableHead>日期</TableHead>
						<TableHead>供應商</TableHead>
						<TableHead>更新狀態</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{(ordersQuery.data?.items ?? []).map((row) => (
						<TableRow key={row.id}>
							<TableCell>{row.id}</TableCell>
							<TableCell>{row.user.name}</TableCell>
							<TableCell>
							<Badge status="info">{statusLabels[row.status] ?? row.status}</Badge>
							</TableCell>
							<TableCell>¥ {Number(row.totalAmount).toFixed(2)}</TableCell>
							<TableCell>{format(new Date(row.createdAt), "yyyy-MM-dd HH:mm")}</TableCell>
							<TableCell>
								<div className="space-y-1 text-xs">
									{row.supplierForwardedAt ? (
										<Badge status="success">已轉發</Badge>
									) : row.supplierForwardingError ? (
										<Badge status="error">轉發失敗</Badge>
									) : (
										<Badge status="warning">未轉發</Badge>
									)}
									{row.supplierForwardingError ? (
										<p className="max-w-[180px] truncate text-red-600">{row.supplierForwardingError}</p>
									) : null}
								</div>
							</TableCell>
							<TableCell>
								<div className="flex flex-wrap items-center gap-2">
									<select
										className="rounded-md border bg-card px-2 py-1 text-sm"
										defaultValue={row.status}
										onChange={(event) =>
											updateMutation.mutate({
												id: row.id,
												status: event.target.value as (typeof statuses)[number],
											})
										}
									>
										{statuses.map((item) => (
											<option key={item} value={item}>
												{statusLabels[item]}
											</option>
										))}
									</select>
									<Button
										size="sm"
										variant="outline"
										onClick={() => forwardMutation.mutate({ id: row.id })}
										disabled={row.status !== "confirmed" || Boolean(row.supplierForwardedAt) || forwardMutation.isPending}
									>
										轉發供應商
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
