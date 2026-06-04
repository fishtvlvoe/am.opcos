"use client";

import { Badge, Button, toastError, toastSuccess } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, UploadIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { EditProductModal } from "./components/EditProductModal";

type Product = {
	id: string;
	titleTranslated: string;
	titleOriginal: string;
	imageUrls: string[];
	originalPrice: number | null;
	costPrice: number;
	sellingPrice: number;
	markupOverride: number | null;
	discountRate: number | null;
	saleStatus: string | null;
	priceManualOverride: boolean;
};

type CsvRow = { id: string; discountRate: number | null; markupOverride: number | null };

// ─── Batch Price Modal ────────────────────────────────────────────────────────

function BatchPriceModal({
	open,
	mode,
	count,
	onConfirm,
	onClose,
}: {
	open: boolean;
	mode: "discount" | "markup";
	count: number;
	onConfirm: (value: number | null) => void;
	onClose: () => void;
}) {
	const [value, setValue] = useState("");

	if (!open) return null;

	const handleConfirm = () => {
		const num = Number.parseFloat(value);
		if (mode === "discount") {
			if (Number.isNaN(num) || num < 0 || num > 100) {
				toastError("請輸入 0-100 的折扣率（如 85 代表 85折）");
				return;
			}
			onConfirm(num / 100);
		} else {
			if (Number.isNaN(num) || num < 0 || num > 100) {
				toastError("請輸入 0-100 的回推百分比（如 10 代表來源 8 折變客戶 9 折）");
				return;
			}
			onConfirm(num);
		}
		setValue("");
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
			<div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-base font-semibold">
						{mode === "discount" ? "批量設折扣率" : "批量設回推百分比"}
					</h2>
					<button type="button" onClick={onClose} className="text-stone-600 hover:text-stone-900">
						<XIcon className="size-4" />
					</button>
				</div>
				<p className="mb-3 text-sm text-stone-500">已選 {count} 件商品</p>
				<div className="mb-4 space-y-1">
					<label className="text-sm font-medium text-stone-700">
						{mode === "discount" ? "折扣率（%，如 85 代表 85折）" : "回推百分比（如 10 代表來源 8 折變客戶 9 折）"}
					</label>
					<input
						type="number"
						className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						placeholder={mode === "discount" ? "例如 85" : "例如 10"}
						step="0.1"
					/>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={onClose} className="flex-1">取消</Button>
					<Button onClick={handleConfirm} className="flex-1">確認</Button>
				</div>
			</div>
		</div>
	);
}

// ─── CSV Preview Modal ────────────────────────────────────────────────────────

function CsvPreviewModal({
	rows,
	onConfirm,
	onClose,
	isPending,
}: {
	rows: CsvRow[];
	onConfirm: () => void;
	onClose: () => void;
	isPending: boolean;
}) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
			<div className="flex w-full max-w-2xl flex-col rounded-xl bg-white p-6 shadow-xl" style={{ maxHeight: "80vh" }}>
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-base font-semibold">CSV 匯入預覽</h2>
					<button type="button" onClick={onClose} className="text-stone-600 hover:text-stone-900">
						<XIcon className="size-4" />
					</button>
				</div>
				<p className="mb-3 text-sm text-stone-500">共 {rows.length} 筆有效資料，確認後批量更新。</p>
				<div className="flex-1 overflow-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-stone-50">
								<th className="px-3 py-2 text-left font-medium text-stone-600">商品 ID</th>
								<th className="px-3 py-2 text-right font-medium text-stone-600">折扣率</th>
								<th className="px-3 py-2 text-right font-medium text-stone-600">回推百分比</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((row) => (
								<tr key={row.id} className="border-b last:border-0">
									<td className="px-3 py-2 font-mono text-xs">{row.id}</td>
									<td className="px-3 py-2 text-right">
										{row.discountRate != null ? `${Math.round(row.discountRate * 100)}%` : "—"}
									</td>
									<td className="px-3 py-2 text-right">
										{row.markupOverride != null ? `${row.markupOverride}%` : "—"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className="mt-4 flex gap-2">
					<Button variant="outline" onClick={onClose} className="flex-1" disabled={isPending}>取消</Button>
					<Button onClick={onConfirm} className="flex-1" disabled={isPending}>
						{isPending ? "匯入中..." : "確認匯入"}
					</Button>
				</div>
			</div>
		</div>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AdminProductsPage() {
	const queryClient = useQueryClient();
	const [page, setPage] = useState(1);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [batchModal, setBatchModal] = useState<"discount" | "markup" | null>(null);
	const [csvRows, setCsvRows] = useState<CsvRow[] | null>(null);
	const csvInputRef = useRef<HTMLInputElement>(null);

	const productsQuery = useQuery(
		orpc.anismile.products.listAdmin.queryOptions({
			input: { page, pageSize: 20 },
		}),
	);

	const batchMutation = useMutation(
		orpc.anismile.products.batchPatch.mutationOptions({
			onSuccess: (data) => {
				toastSuccess(`已更新 ${data.updatedCount} 件商品`);
				setSelectedIds([]);
				setBatchModal(null);
				void queryClient.invalidateQueries({ queryKey: orpc.anismile.products.listAdmin.key() });
			},
			onError: (error) => toastError(error.message || "批量更新失敗"),
		}),
	);

	const items = (productsQuery.data?.items ?? []) as Product[];
	const total = productsQuery.data?.total ?? 0;
	const totalPages = Math.ceil(total / 20) || 1;

	const toggleSelect = (id: string) => {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
	};

	const toggleAll = () => {
		if (selectedIds.length === items.length && items.length > 0) {
			setSelectedIds([]);
		} else {
			setSelectedIds(items.map((i) => i.id));
		}
	};

	const handleBatchConfirm = (value: number | null) => {
		if (selectedIds.length === 0) return;
		if (batchModal === "discount") {
			batchMutation.mutate({ ids: selectedIds, discountRate: value });
		} else if (batchModal === "markup") {
			batchMutation.mutate({ ids: selectedIds, markupOverride: value });
		}
	};

	const handleCsvDownload = () => {
		const blob = new Blob(["id,discountRate,markupOverride\n,,\n"], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "product-price-template.csv";
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (ev) => {
			const text = ev.target?.result as string;
			const lines = text.split(/\r?\n/).filter((l) => l.trim());
			const headers = lines[0]?.split(",").map((h) => h.trim().toLowerCase()) ?? [];
			const idIdx = headers.indexOf("id");
			const drIdx = headers.indexOf("discountrate");
			const moIdx = headers.indexOf("markupoverride");
			if (idIdx === -1) {
				toastError("CSV 缺少 id 欄位");
				return;
			}
			const parsed: CsvRow[] = [];
			for (let i = 1; i < lines.length; i++) {
				const cols = lines[i]?.split(",") ?? [];
				const id = cols[idIdx]?.trim() ?? "";
				if (!id) continue;
				const drRaw = drIdx >= 0 ? cols[drIdx]?.trim() : "";
				const moRaw = moIdx >= 0 ? cols[moIdx]?.trim() : "";
				const discountRate = drRaw ? Number.parseFloat(drRaw) / 100 : null;
				const markupOverride = moRaw ? Number.parseFloat(moRaw) : null;
				if (
					(discountRate !== null && (Number.isNaN(discountRate) || discountRate < 0 || discountRate > 1)) ||
					(markupOverride !== null && (Number.isNaN(markupOverride) || markupOverride < 0 || markupOverride > 100))
				) {
					continue;
				}
				if (discountRate === null && markupOverride === null) continue;
				parsed.push({ id, discountRate, markupOverride });
			}
			if (parsed.length === 0) {
				toastError("CSV 沒有有效資料");
				return;
			}
			setCsvRows(parsed);
		};
		reader.readAsText(file);
		e.target.value = "";
	};

	const handleCsvConfirm = async () => {
		if (!csvRows || csvRows.length === 0) return;
		const groups = new Map<string, { ids: string[]; discountRate: number | null; markupOverride: number | null }>();
		for (const row of csvRows) {
			const key = `${row.discountRate ?? ""}__${row.markupOverride ?? ""}`;
			const existing = groups.get(key);
			if (existing) {
				existing.ids.push(row.id);
			} else {
				groups.set(key, { ids: [row.id], discountRate: row.discountRate, markupOverride: row.markupOverride });
			}
		}
		for (const group of groups.values()) {
			for (let offset = 0; offset < group.ids.length; offset += 50) {
				const batchIds = group.ids.slice(offset, offset + 50);
				await new Promise<void>((resolve, reject) => {
					batchMutation.mutate(
						{
							ids: batchIds,
							...(group.discountRate !== null ? { discountRate: group.discountRate } : {}),
							...(group.markupOverride !== null ? { markupOverride: group.markupOverride } : {}),
						},
						{ onSuccess: () => resolve(), onError: (err) => reject(err) },
					);
				});
			}
		}
		toastSuccess(`CSV 匯入完成，共 ${csvRows.length} 筆`);
		setCsvRows(null);
		void queryClient.invalidateQueries({ queryKey: orpc.anismile.products.listAdmin.key() });
	};

	const allSelected = items.length > 0 && selectedIds.length === items.length;

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-2xl font-semibold">商品價格管理</h1>
				<div className="flex gap-2">
					<Button variant="outline" size="sm" onClick={handleCsvDownload}>
						<DownloadIcon className="mr-1.5 size-4" />
						下載 CSV 範本
					</Button>
					<Button variant="outline" size="sm" onClick={() => csvInputRef.current?.click()}>
						<UploadIcon className="mr-1.5 size-4" />
						上傳 CSV
					</Button>
					<input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
				</div>
			</div>

			{selectedIds.length > 0 && (
				<div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
					<span className="text-sm font-medium text-primary">已選 {selectedIds.length} 件</span>
					<Button size="sm" variant="outline" onClick={() => setBatchModal("discount")} disabled={batchMutation.isPending}>
						設折扣率
					</Button>
					<Button size="sm" variant="outline" onClick={() => setBatchModal("markup")} disabled={batchMutation.isPending}>
						設回推百分比
					</Button>
					<button type="button" className="ml-auto text-sm text-stone-600 hover:text-stone-900" onClick={() => setSelectedIds([])}>
						清除選擇
					</button>
				</div>
			)}

			{productsQuery.isPending ? (
				<div className="py-12 text-center text-muted-foreground">載入中...</div>
			) : items.length === 0 ? (
				<div className="py-12 text-center text-muted-foreground">無商品資料</div>
			) : (
				<div className="overflow-hidden rounded-lg border">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/40">
								<th className="px-4 py-3 text-center font-medium">
									<input type="checkbox" checked={allSelected} onChange={toggleAll} className="size-4 rounded border-stone-300" />
								</th>
								<th className="px-4 py-3 text-left font-medium">圖片</th>
								<th className="px-4 py-3 text-left font-medium">商品名</th>
								<th className="px-4 py-3 text-right font-medium">原價</th>
								<th className="px-4 py-3 text-right font-medium">成本價</th>
								<th className="px-4 py-3 text-right font-medium">售價</th>
								<th className="px-4 py-3 text-right font-medium">回推百分比</th>
								<th className="px-4 py-3 text-left font-medium">操作</th>
							</tr>
						</thead>
						<tbody>
							{items.map((p) => {
								const imageUrl = Array.isArray(p.imageUrls) ? String((p.imageUrls as string[])[0] ?? "") : "";
								const isSelected = selectedIds.includes(p.id);
								return (
									<tr key={p.id} className={`border-b last:border-0 hover:bg-muted/20 ${isSelected ? "bg-primary/5" : ""}`}>
										<td className="px-4 py-3 text-center">
											<input type="checkbox" checked={isSelected} onChange={() => toggleSelect(p.id)} className="size-4 rounded border-stone-300" />
										</td>
										<td className="px-4 py-3">
											{imageUrl ? (
												<Image width={40} height={40} src={imageUrl} alt="" className="rounded object-cover" />
											) : (
												<div className="flex size-10 items-center justify-center rounded bg-stone-100 text-xs text-stone-500">—</div>
											)}
										</td>
										<td className="max-w-[250px] px-4 py-3">
											<p className="truncate">{p.titleTranslated ?? p.titleOriginal}</p>
											{p.priceManualOverride && (
												<Badge status="warning" className="mt-0.5 text-xs">手動設價</Badge>
											)}
										</td>
										<td className="px-4 py-3 text-right">
											{p.originalPrice != null ? `¥${Number(p.originalPrice).toFixed(2)}` : "—"}
										</td>
										<td className="px-4 py-3 text-right">¥{Number(p.costPrice).toFixed(2)}</td>
										<td className="px-4 py-3 text-right font-medium">¥{Number(p.sellingPrice).toFixed(2)}</td>
										<td className="px-4 py-3 text-right">
											<span className="text-stone-600">
												{p.markupOverride != null ? `${Number(p.markupOverride).toFixed(1)}%` : "預設"}
											</span>
										</td>
										<td className="px-4 py-3">
											<Button size="sm" variant="outline" onClick={() => setSelectedProduct(p)}>
												編輯
											</Button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}

			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-2">
					<button type="button" className="rounded-md border p-1.5 disabled:opacity-40" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
						<ChevronLeftIcon className="size-4" />
					</button>
					<span className="text-sm">{page} / {totalPages}</span>
					<button type="button" className="rounded-md border p-1.5 disabled:opacity-40" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
						<ChevronRightIcon className="size-4" />
					</button>
				</div>
			)}

			{selectedProduct && (
				<EditProductModal
					product={selectedProduct}
					open={selectedProduct !== null}
					onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}
					onSuccess={() => {
						void queryClient.invalidateQueries({ queryKey: orpc.anismile.products.listAdmin.key() });
					}}
				/>
			)}

			<BatchPriceModal
				open={batchModal !== null}
				mode={batchModal ?? "discount"}
				count={selectedIds.length}
				onConfirm={handleBatchConfirm}
				onClose={() => setBatchModal(null)}
			/>

			{csvRows && (
				<CsvPreviewModal
					rows={csvRows}
					onConfirm={() => void handleCsvConfirm()}
					onClose={() => setCsvRows(null)}
					isPending={batchMutation.isPending}
				/>
			)}
		</div>
	);
}
