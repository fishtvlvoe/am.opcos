"use client";

import { useSession } from "@auth/hooks/use-session";
import { Badge, Button, Input, toastError, toastSuccess } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";

type PoolStatus = "all" | "pending" | "shipped" | "completed" | "cancelled";
type ItemStatus = "pending" | "confirmed" | "shipped" | "completed" | "cancelled";

const TABS: { value: PoolStatus; label: string }[] = [
	{ value: "all", label: "全部" },
	{ value: "pending", label: "待發貨" },
	{ value: "shipped", label: "已發貨" },
	{ value: "completed", label: "已完成" },
	{ value: "cancelled", label: "已取消" },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
	pending: { label: "待發貨", className: "bg-yellow-100 text-yellow-700" },
	confirmed: { label: "已確認", className: "bg-blue-50 text-blue-600" },
	shipped: { label: "已發貨", className: "bg-blue-100 text-blue-700" },
	completed: { label: "已完成", className: "bg-green-100 text-green-700" },
	cancelled: { label: "已取消", className: "bg-stone-100 text-stone-500" },
};

const PAGE_SIZE = 20;

export function ProductPoolPage() {
	const [activeTab, setActiveTab] = useState<PoolStatus>("all");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [batchStatus, setBatchStatus] = useState<ItemStatus>("shipped");
	const queryClient = useQueryClient();
	const { user } = useSession();
	const isAdmin = user?.role === "admin" || user?.role === "super_admin";

	const listQuery = useQuery(
		orpc.anismile.productPool.list.queryOptions({
			input: { status: activeTab === "all" ? undefined : activeTab, search, page },
		}),
	);

	const items = listQuery.data?.items ?? [];
	const total = listQuery.data?.total ?? 0;
	const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

	const batchUpdateMutation = useMutation(
		orpc.anismile.productPool.adminBatchUpdateItemStatus.mutationOptions({
			onSuccess: () => {
				toastSuccess("批量更新成功");
				setSelectedIds([]);
				void queryClient.invalidateQueries({ queryKey: orpc.anismile.productPool.list.key() });
			},
			onError: (error) => toastError(error.message || "批量更新失敗"),
		}),
	);

	const toggleSelect = (id: string) => {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		);
	};

	const toggleAll = () => {
		if (selectedIds.length === items.length) {
			setSelectedIds([]);
		} else {
			setSelectedIds(items.map((i) => i.id));
		}
	};

	const handleBatchUpdate = () => {
		if (selectedIds.length === 0) return;
		batchUpdateMutation.mutate({ itemIds: selectedIds, status: batchStatus });
	};

	const handleTabChange = (tab: PoolStatus) => {
		setActiveTab(tab);
		setPage(1);
		setSelectedIds([]);
	};

	return (
		<div className="container py-8">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold">商品池</h1>
				{isAdmin && selectedIds.length > 0 && (
					<div className="flex items-center gap-2">
						<select
							value={batchStatus}
							onChange={(e) => setBatchStatus(e.target.value as ItemStatus)}
							className="h-9 rounded-md border border-border bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
						>
							<option value="pending">待發貨</option>
							<option value="shipped">已發貨</option>
							<option value="completed">已完成</option>
							<option value="cancelled">已取消</option>
						</select>
						<Button
							size="sm"
							onClick={handleBatchUpdate}
							disabled={batchUpdateMutation.isPending}
						>
							批量更新（{selectedIds.length}）
						</Button>
					</div>
				)}
			</div>

			{/* Tab 列 */}
			<div className="mb-4 flex gap-1 border-b">
				{TABS.map((tab) => (
					<button
						key={tab.value}
						type="button"
						onClick={() => handleTabChange(tab.value)}
						className={`rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
							activeTab === tab.value
								? "border-b-2 border-primary text-primary"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* 搜尋 */}
			<div className="mb-4 w-72">
				<Input
					placeholder="搜尋商品名或 JAN 碼..."
					value={search}
					onChange={(e) => {
						setSearch(e.target.value);
						setPage(1);
					}}
				/>
			</div>

			{/* 表格 */}
			{listQuery.isPending ? (
				<div className="py-12 text-center text-muted-foreground">載入中...</div>
			) : items.length === 0 ? (
				<div className="py-12 text-center text-muted-foreground">無資料</div>
			) : (
				<div className="overflow-hidden rounded-lg border">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/40">
								{isAdmin && (
									<th className="w-10 px-4 py-3 text-left">
										<input
											type="checkbox"
											checked={selectedIds.length === items.length && items.length > 0}
											onChange={toggleAll}
											className="cursor-pointer"
										/>
									</th>
								)}
								<th className="px-4 py-3 text-left font-medium">商品名</th>
								<th className="px-4 py-3 text-left font-medium">JAN 碼</th>
								<th className="px-4 py-3 text-right font-medium">數量</th>
								<th className="px-4 py-3 text-right font-medium">單價</th>
								<th className="px-4 py-3 text-left font-medium">訂單編號</th>
								<th className="px-4 py-3 text-left font-medium">狀態</th>
								<th className="px-4 py-3 text-left font-medium">日期</th>
							</tr>
						</thead>
						<tbody>
							{items.map((item) => {
								const statusInfo = STATUS_BADGE[item.itemStatus] ?? {
									label: item.itemStatus,
									className: "bg-muted text-muted-foreground",
								};
								return (
									<tr key={item.id} className="border-b last:border-0 hover:bg-muted/20">
										{isAdmin && (
											<td className="px-4 py-3">
												<input
													type="checkbox"
													checked={selectedIds.includes(item.id)}
													onChange={() => toggleSelect(item.id)}
													className="cursor-pointer"
												/>
											</td>
										)}
										<td className="max-w-[200px] px-4 py-3">
											<p className="truncate">{item.productName ?? "—"}</p>
										</td>
										<td className="px-4 py-3 font-mono text-xs text-muted-foreground">
											{item.janCode ?? "—"}
										</td>
										<td className="px-4 py-3 text-right">{item.quantity}</td>
										<td className="px-4 py-3 text-right">
											{item.unitPrice != null ? `¥${Number(item.unitPrice).toLocaleString()}` : "—"}
										</td>
										<td className="px-4 py-3 text-xs text-muted-foreground">
											{item.orderId ?? "—"}
										</td>
										<td className="px-4 py-3">
											<Badge className={statusInfo.className}>{statusInfo.label}</Badge>
										</td>
										<td className="px-4 py-3 text-xs text-muted-foreground">
											{item.orderCreatedAt
												? format(new Date(item.orderCreatedAt), "yyyy/MM/dd")
												: "—"}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}

			{/* 分頁 */}
			{totalPages > 1 && (
				<div className="mt-4 flex items-center justify-center gap-2">
					<button
						type="button"
						className="rounded-md border p-1.5 disabled:opacity-40"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page <= 1}
					>
						<ChevronLeftIcon className="size-4" />
					</button>
					<span className="text-sm">
						{page} / {totalPages}
					</span>
					<button
						type="button"
						className="rounded-md border p-1.5 disabled:opacity-40"
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						disabled={page >= totalPages}
					>
						<ChevronRightIcon className="size-4" />
					</button>
				</div>
			)}
		</div>
	);
}
