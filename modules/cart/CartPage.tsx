"use client";

import { Button, toastError, toastSuccess } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays, format } from "date-fns";
import { DownloadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { CartItem } from "./components/CartItem";
import { OrderSummary } from "./components/OrderSummary";

export function CartPage() {
	const router = useRouter();
	const queryClient = useQueryClient();

	const cartQuery = useQuery(orpc.anismile.cart.getItems.queryOptions({ input: {} }));
	const cartItems = cartQuery.data?.items ?? [];

	const updateQuantityMutation = useMutation(
		orpc.anismile.cart.updateQuantity.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries({ queryKey: orpc.anismile.cart.getItems.key() });
			},
			onError: (error) => toastError(error.message || "更新數量失敗"),
		}),
	);

	const removeMutation = useMutation(
		orpc.anismile.cart.removeItem.mutationOptions({
			onSuccess: () => {
				toastSuccess("已移除商品");
				void queryClient.invalidateQueries({ queryKey: orpc.anismile.cart.getItems.key() });
			},
			onError: (error) => toastError(error.message || "移除失敗"),
		}),
	);

	const cartTotal = useMemo(() => Number(cartQuery.data?.total ?? 0), [cartQuery.data]);
	const itemCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);
	const hasUnavailableItems = useMemo(
		() => cartItems.some((item) => item.isOrderable === false || Boolean(item.unavailableReason)),
		[cartItems],
	);
	const groupedItems = useMemo(() => {
		const groups = new Map<string, typeof cartItems>();
		for (const item of cartItems) {
			const key = item.product.orderDeadline ? format(new Date(item.product.orderDeadline), "yyyy/MM/dd") : "__no_deadline__";
			if (!groups.has(key)) {
				groups.set(key, []);
			}
			groups.get(key)!.push(item);
		}
		return [...groups.entries()].sort(([a], [b]) => {
			if (a === "__no_deadline__") return 1;
			if (b === "__no_deadline__") return -1;
			return a.localeCompare(b);
		});
	}, [cartItems]);
	const disabled = cartItems.length === 0 || hasUnavailableItems;

	function handleExportCsv() {
		if (cartItems.length === 0) {
			toastError("購物車是空的，無法匯出");
			return;
		}
		const headers = ["商品名稱", "JAN Code", "數量", "單價", "小計", "訂單截止"];
		const rows = cartItems.map((item) => [
			item.product.titleTranslated || item.product.titleOriginal,
			item.product.janCode ?? "",
			String(item.quantity),
			String(Number(item.product.sellingPrice).toFixed(2)),
			String(Number(item.lineTotal).toFixed(2)),
			item.product.orderDeadline ? format(new Date(item.product.orderDeadline), "yyyy/MM/dd") : "",
		]);
		const csvContent = [headers, ...rows]
			.map((row) => row.map((cell) => {
				let s = String(cell).replace(/"/g, '""');
				if (/^[=+\-@\t\r]/.test(s)) s = `\t${s}`;
				return `"${s}"`;
			}).join(","))
			.join("\n");
		const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = `cart_export_${format(new Date(), "yyyy-MM-dd")}.csv`;
		anchor.click();
		URL.revokeObjectURL(url);
	}

	return (
		<div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:gap-6">
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h1 className="font-semibold text-2xl">購物車</h1>
					<Button type="button" variant="outline" size="sm" onClick={handleExportCsv} disabled={cartItems.length === 0}>
						<DownloadIcon className="mr-1.5 size-4" />
						匯出 CSV
					</Button>
				</div>
				{cartItems.length === 0 ? (
					<div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-sm text-stone-500">
						購物車目前是空的，先去商品目錄挑選商品吧。
					</div>
				) : (
					groupedItems.map(([key, items]) => {
						const isNoDeadline = key === "__no_deadline__";
						const isUrgent = !isNoDeadline && differenceInCalendarDays(new Date(key.replace(/\//g, "-")), new Date()) <= 3;

						return (
							<div key={key} className="space-y-3">
								<div
									className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
										isUrgent
											? "bg-red-50 text-red-700"
											: isNoDeadline
												? "bg-stone-50 text-stone-500"
												: "bg-amber-50 text-amber-700"
									}`}
								>
									{isNoDeadline ? "無截止日期" : `截止 ${key}`}
									{isUrgent ? <span className="text-xs font-normal">（即將截止）</span> : null}
								</div>
								{items.map((item) => (
									<CartItem
										key={item.id}
										id={item.id}
										title={item.product.titleTranslated || item.product.titleOriginal}
										category={item.product.category}
										series={item.product.series}
										imageUrl={Array.isArray(item.product.imageUrls) ? String(item.product.imageUrls[0] ?? "") : ""}
										quantity={item.quantity}
										lineTotal={Number(item.lineTotal)}
										unavailableReason={item.unavailableReason}
										disabled={updateQuantityMutation.isPending || removeMutation.isPending}
										onIncrement={(itemId, nextQuantity) => {
											updateQuantityMutation.mutate({ itemId, quantity: nextQuantity });
										}}
										onDecrement={(itemId, nextQuantity) => {
											updateQuantityMutation.mutate({ itemId, quantity: nextQuantity });
										}}
										onRemove={(itemId) => {
											removeMutation.mutate({ itemId });
										}}
									/>
								))}
							</div>
						);
					})
				)}
			</div>

			<OrderSummary
				itemCount={itemCount}
				subtotal={cartTotal}
				disabled={disabled}
				disabledReason={hasUnavailableItems ? "購物車內有已截止或無法下單的商品，請先移除後再結帳。" : null}
				onSubmit={() => router.push("/checkout")}
			/>
		</div>
	);
}
