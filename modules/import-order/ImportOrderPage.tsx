"use client";

import { Badge, Button, Input, toastError, toastSuccess } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { DownloadIcon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";

const MAX_ROWS = 500;

// 手動解析 CSV（避免新依賴）
function parseCsv(text: string): Array<{ jancode: string; quantity: number }> {
	const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
	// 跳過 header 行（如果第一行含 "jancode"）
	const startIdx = lines[0]?.toLowerCase().includes("jancode") ? 1 : 0;
	return lines.slice(startIdx).map((line) => {
		const cols: string[] = [];
		let cur = "";
		let inQuote = false;
		for (const ch of line) {
			if (ch === '"') {
				inQuote = !inQuote;
			} else if (ch === "," && !inQuote) {
				cols.push(cur.trim());
				cur = "";
			} else {
				cur += ch;
			}
		}
		cols.push(cur.trim());
		return {
			jancode: cols[0] ?? "",
			quantity: Number(cols[1] ?? 1),
		};
	}).filter((row) => row.jancode !== "");
}

function downloadTemplate() {
	const content = "jancode,quantity,product_name\n4573553042161,1,範例商品";
	const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "import_template.csv";
	a.click();
	URL.revokeObjectURL(url);
}

type MatchedProduct = {
	jancode: string | null;
	productId: string;
	title: string;
	sellingPrice: number;
	quantity: number; // 從 CSV 帶入
};

type ShippingInfo = {
	name: string;
	phone: string;
	address: string;
};

export function ImportOrderPage() {
	const [csvRows, setCsvRows] = useState<Array<{ jancode: string; quantity: number }>>([]);
	const [matchResult, setMatchResult] = useState<{
		matched: MatchedProduct[];
		unmatched: string[];
	} | null>(null);
	const [shipping, setShipping] = useState<ShippingInfo>({ name: "", phone: "", address: "" });
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const matchMutation = useMutation(
		orpc.anismile.importOrder.matchProducts.mutationOptions({
			onSuccess: (data, variables) => {
				// 把 CSV 中的 quantity 合併進 matched 結果
				const jancodeQtyMap = new Map(
					(variables as { jancodes: string[] }).jancodes.map((code, i) => [code, csvRows[i]?.quantity ?? 1])
				);
				const enriched: MatchedProduct[] = (data as { matched: { jancode: string | null; productId: string; title: string; sellingPrice: number }[]; unmatched: string[] }).matched.map(
					(m) => ({
						...m,
						quantity: jancodeQtyMap.get(m.jancode ?? "") ?? 1,
					})
				);
				setMatchResult({
					matched: enriched,
					unmatched: (data as { matched: unknown[]; unmatched: string[] }).unmatched,
				});
			},
			onError: (error) => toastError(error.message || "匹配失敗"),
		}),
	);

	const confirmMutation = useMutation(
		orpc.anismile.importOrder.confirmImportOrder.mutationOptions({
			onSuccess: () => {
				toastSuccess("訂單已成功建立");
				setCsvRows([]);
				setMatchResult(null);
				setShipping({ name: "", phone: "", address: "" });
			},
			onError: (error) => toastError(error.message || "下單失敗"),
		}),
	);

	const handleFile = (file: File) => {
		if (!file.name.endsWith(".csv")) {
			toastError("請上傳 .csv 檔案");
			return;
		}
		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result as string;
			const parsed = parseCsv(text);
			if (parsed.length > MAX_ROWS) {
				toastError(`最多支援 ${MAX_ROWS} 行，目前有 ${parsed.length} 行`);
				return;
			}
			if (parsed.length === 0) {
				toastError("CSV 內無有效資料");
				return;
			}
			setCsvRows(parsed);
			matchMutation.mutate({ jancodes: parsed.map((r) => r.jancode) });
		};
		reader.readAsText(file, "utf-8");
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer.files[0];
		if (file) handleFile(file);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) handleFile(file);
		e.target.value = "";
	};

	const matchedItems = matchResult?.matched ?? [];
	const unmatchedItems = matchResult?.unmatched ?? [];

	const canSubmit =
		matchedItems.length > 0 &&
		shipping.name.trim() !== "" &&
		shipping.phone.trim() !== "" &&
		shipping.address.trim() !== "";

	const handleConfirm = () => {
		confirmMutation.mutate({
			items: matchedItems.map((i) => ({
				productId: i.productId,
				quantity: i.quantity,
			})),
			shippingName: shipping.name,
			shippingPhone: shipping.phone,
			shippingAddress: shipping.address,
		});
	};

	return (
		<div className="container max-w-3xl py-10">
			<h1 className="mb-6 text-2xl font-bold">CSV 導入訂單</h1>

			{/* 下載模板 */}
			<div className="mb-6 flex items-center gap-3 rounded-lg border bg-muted/40 p-4">
				<DownloadIcon className="size-5 text-muted-foreground" />
				<div className="flex-1">
					<p className="text-sm font-medium">下載 CSV 範本</p>
					<p className="text-xs text-muted-foreground">格式：JAN 碼、數量、商品名（選填）</p>
				</div>
				<Button variant="outline" size="sm" onClick={downloadTemplate}>
					下載範本
				</Button>
			</div>

			{/* 上傳區 */}
			<div
				className={`mb-6 flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors ${
					isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/20"
				}`}
				onDragOver={(e) => {
					e.preventDefault();
					setIsDragging(true);
				}}
				onDragLeave={() => setIsDragging(false)}
				onDrop={handleDrop}
				onClick={() => fileInputRef.current?.click()}
			>
				<UploadIcon className="size-8 text-muted-foreground" />
				<p className="text-sm font-medium">拖拽或點擊上傳 CSV</p>
				<p className="text-xs text-muted-foreground">最多 {MAX_ROWS} 行</p>
				<input
					ref={fileInputRef}
					type="file"
					accept=".csv"
					className="hidden"
					onChange={handleFileChange}
				/>
			</div>

			{/* 解析中 */}
			{matchMutation.isPending && (
				<div className="mb-6 text-center text-sm text-muted-foreground">正在比對商品...</div>
			)}

			{/* 預覽表格 */}
			{matchResult !== null && (
				<div className="mb-6 overflow-hidden rounded-lg border">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/40">
								<th className="px-4 py-3 text-left font-medium">JAN 碼</th>
								<th className="px-4 py-3 text-left font-medium">商品名</th>
								<th className="px-4 py-3 text-right font-medium">數量</th>
								<th className="px-4 py-3 text-left font-medium">狀態</th>
							</tr>
						</thead>
						<tbody>
							{matchedItems.map((item, i) => (
								<tr key={i} className="border-b last:border-0">
									<td className="px-4 py-3 font-mono text-xs">{item.jancode ?? "—"}</td>
									<td className="px-4 py-3">{item.title}</td>
									<td className="px-4 py-3 text-right">{item.quantity}</td>
									<td className="px-4 py-3">
										<Badge className="bg-green-100 text-green-700">已匹配</Badge>
									</td>
								</tr>
							))}
							{unmatchedItems.map((jancode, i) => (
								<tr key={`u-${i}`} className="border-b last:border-0">
									<td className="px-4 py-3 font-mono text-xs">{jancode}</td>
									<td className="px-4 py-3 text-rose-500">未匹配</td>
									<td className="px-4 py-3 text-right">—</td>
									<td className="px-4 py-3">
										<Badge className="bg-rose-100 text-rose-700">未找到</Badge>
									</td>
								</tr>
							))}
						</tbody>
					</table>
					<div className="border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
						共 {matchedItems.length + unmatchedItems.length} 筆，已匹配 {matchedItems.length} 筆
					</div>
				</div>
			)}

			{/* 配送資訊 */}
			{matchResult !== null && (
				<div className="mb-6 flex flex-col gap-3 rounded-lg border p-5">
					<p className="font-medium">配送資訊</p>
					<Input
						placeholder="收件人姓名"
						value={shipping.name}
						onChange={(e) => setShipping((s) => ({ ...s, name: e.target.value }))}
					/>
					<Input
						placeholder="聯絡電話"
						value={shipping.phone}
						onChange={(e) => setShipping((s) => ({ ...s, phone: e.target.value }))}
					/>
					<Input
						placeholder="收件地址"
						value={shipping.address}
						onChange={(e) => setShipping((s) => ({ ...s, address: e.target.value }))}
					/>
				</div>
			)}

			{/* 確認按鈕 */}
			{matchResult !== null && (
				<Button
					className="w-full"
					disabled={!canSubmit || confirmMutation.isPending}
					onClick={handleConfirm}
				>
					{confirmMutation.isPending ? "處理中..." : `確認下單（${matchedItems.length} 件）`}
				</Button>
			)}
		</div>
	);
}
