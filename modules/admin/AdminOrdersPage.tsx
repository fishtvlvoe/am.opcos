"use client";

import { Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, toastError, toastSuccess } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useMemo, useState } from "react";

const statuses = ["pending", "confirmed", "shipped", "completed", "cancelled"] as const;

const statusLabels: Record<string, string> = {
	pending: "待確認",
	confirmed: "已確認",
	shipped: "已出貨",
	completed: "已完成",
	cancelled: "已取消",
};
function getFirstImageUrl(value: unknown): string | undefined {
	if (!Array.isArray(value)) return undefined;
	const first = value.find((item) => typeof item === "string" && item.length > 0);
	return typeof first === "string" ? first : undefined;
}

export function AdminOrdersPage() {
	const queryClient = useQueryClient();
	const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
	const [status, setStatus] = useQueryState("status", parseAsString.withDefault(""));
	const [splitOrderId, setSplitOrderId] = useState<string | null>(null);
	const [splitQtyMap, setSplitQtyMap] = useState<Record<string, number>>({});
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

	const exportQuery = useQuery({
		...orpc.anismile.orders.export.queryOptions({
			input: {
				status: statusFilter,
			},
		}),
		enabled: false,
	});
	const splitOrderQuery = useQuery({
		...orpc.anismile.orders.getById.queryOptions({
			input: splitOrderId ? { id: splitOrderId } : { id: "" },
		}),
		enabled: Boolean(splitOrderId),
	});
	const splitMutation = useMutation(
		orpc.anismile.orders.split.mutationOptions({
			onSuccess: () => {
				toastSuccess("拆單完成");
				setSplitOrderId(null);
				setSplitQtyMap({});
				void queryClient.invalidateQueries({ queryKey: orpc.anismile.orders.list.key() });
				if (splitOrderId) {
					void queryClient.invalidateQueries({
						queryKey: orpc.anismile.orders.getById.key({ input: { id: splitOrderId } }),
					});
				}
			},
			onError: (error) => toastError(error.message || "拆單失敗"),
		}),
	);
	const splitOrderItems = splitOrderQuery.data?.items ?? [];
	const splitCandidates = useMemo(
		() =>
			splitOrderItems
				.map((item) => ({
					id: item.id,
					title: item.product.titleTranslated || item.product.titleOriginal,
					available: Math.max(0, item.quantity - (item.allocatedQty ?? 0)),
					quantity: item.quantity,
					allocatedQty: item.allocatedQty ?? 0,
				}))
				.filter((item) => item.available > 0),
		[splitOrderItems],
	);

	const downloadCsv = async () => {
		const data = exportQuery.data ?? (await exportQuery.refetch()).data;
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
	const handleSplitSubmit = () => {
		if (!splitOrderId) return;
		const items = splitCandidates
			.map((item) => {
				const qty = Math.floor(splitQtyMap[item.id] ?? 0);
				return { itemId: item.id, quantity: qty };
			})
			.filter((item) => item.quantity > 0);
		if (items.length === 0) {
			toastError("請至少輸入一個拆單數量");
			return;
		}
		splitMutation.mutate({
			id: splitOrderId,
			items,
		});
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
					<Button variant="outline" onClick={downloadCsv} disabled={exportQuery.isFetching}>
						{exportQuery.isFetching ? "匯出中..." : "匯出 CSV"}
					</Button>
				</div>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>訂單編號</TableHead>
						<TableHead>客戶</TableHead>
						<TableHead>商品圖</TableHead>
						<TableHead>狀態</TableHead>
						<TableHead>金額</TableHead>
						<TableHead>日期</TableHead>
						<TableHead>供應商</TableHead>
						<TableHead>更新狀態</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{(ordersQuery.data?.items ?? []).map((row) => {
						const thumbnailUrl = row.items
							.map((item) => getFirstImageUrl(item.product.imageUrls))
							.find((url): url is string => typeof url === "string");
						return (
						<TableRow key={row.id}>
							<TableCell>{row.id}</TableCell>
							<TableCell>{row.user.name}</TableCell>
							<TableCell>
								{thumbnailUrl ? (
									<img
										src={thumbnailUrl}
										alt=""
										className="h-6 w-6 rounded border border-stone-200 object-cover"
										loading="lazy"
									/>
								) : (
									<div className="h-6 w-6 rounded border border-dashed border-stone-200 bg-stone-50" />
								)}
							</TableCell>
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
										value={row.status}
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
									<Button
										size="sm"
										variant="outline"
										onClick={() => {
											setSplitOrderId(row.id);
											setSplitQtyMap({});
										}}
										disabled={row.status === "cancelled" || row.orderType !== "standard"}
									>
										拆單
									</Button>
								</div>
							</TableCell>
						</TableRow>
					);
					})}
				</TableBody>
			</Table>
			<Dialog
				open={splitOrderId !== null}
				onOpenChange={(open) => {
					if (!open) {
						setSplitOrderId(null);
						setSplitQtyMap({});
					}
				}}
			>
				<DialogContent aria-describedby={undefined} className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>拆單</DialogTitle>
					</DialogHeader>
					{splitOrderQuery.isLoading ? <p className="text-sm text-stone-500">載入中...</p> : null}
					{splitOrderQuery.data ? (
						<div className="space-y-3">
							{splitCandidates.length === 0 ? (
								<p className="text-sm text-stone-500">此訂單已無可分配品項</p>
							) : (
								<div className="space-y-2">
									{splitCandidates.map((item) => (
										<div key={item.id} className="grid grid-cols-[1fr_90px_80px] items-center gap-3 rounded border border-stone-200 p-2 text-sm">
											<div>
												<p className="font-medium text-stone-800">{item.title}</p>
												<p className="text-xs text-stone-500">
													原始 {item.quantity} / 已分配 {item.allocatedQty} / 可分配 {item.available}
												</p>
											</div>
											<input
												type="number"
												min={0}
												max={item.available}
												value={splitQtyMap[item.id] ?? 0}
												onChange={(event) =>
													setSplitQtyMap((prev) => ({
														...prev,
														[item.id]: Math.min(
															item.available,
															Math.max(0, Number(event.target.value) || 0),
														),
													}))
												}
												className="rounded border border-stone-300 px-2 py-1 text-sm"
											/>
											<span className="text-xs text-stone-500">件</span>
										</div>
									))}
								</div>
							)}
							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									onClick={() => {
										setSplitOrderId(null);
										setSplitQtyMap({});
									}}
								>
									取消
								</Button>
								<Button
									onClick={handleSplitSubmit}
									disabled={splitMutation.isPending || splitCandidates.length === 0}
								>
									{splitMutation.isPending ? "拆單中..." : "確認拆單"}
								</Button>
							</div>
						</div>
					) : null}
				</DialogContent>
			</Dialog>
		</div>
	);
}
