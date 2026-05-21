"use client";

import { Button, cn } from "@repo/ui";
import { Download, Filter, LayoutGrid, List, ShoppingCart } from "lucide-react";

import type { QuickFilter } from "../../shared/components/FilterSidebar";

interface ToolbarRowProps {
	sortField: string;
	onSortChange: (field: string) => void;
	pageSize: number;
	onPageSizeChange: (size: number) => void;
	viewMode: "grid" | "table";
	onViewModeChange: (mode: "grid" | "table") => void;
	onFilterToggle: () => void;
	onCsvDownload: () => void;
	onBatchOrder?: () => void;
	quickFilters?: QuickFilter[];
	onQuickFilterChange?: (key: string, checked: boolean) => void;
}

const sortOptions = [
	{ value: "name", label: "商品名稱" },
	{ value: "price-asc", label: "價格（低→高）" },
	{ value: "price-desc", label: "價格（高→低）" },
	{ value: "deadline", label: "截止日期" },
	{ value: "release", label: "發售日期" },
];

const pageSizeOptions = [5, 10, 20, 30, 50];

export function ToolbarRow({
	sortField,
	onSortChange,
	pageSize,
	onPageSizeChange,
	viewMode,
	onViewModeChange,
	onFilterToggle,
	onCsvDownload,
	onBatchOrder,
	quickFilters,
	onQuickFilterChange,
}: ToolbarRowProps) {
	return (
		<div className="mb-4 space-y-2">
			{/* 第 1 行：快速篩選 + 排序 + 每頁件數 + 模式切換 */}
			<div className="flex items-center gap-3">
				{quickFilters && quickFilters.length > 0 && (
					<div className="flex items-center gap-3">
						{quickFilters.map((qf) => (
							<label key={qf.key} className="flex cursor-pointer items-center gap-1.5 text-sm text-stone-600">
								<input
									type="checkbox"
									checked={qf.checked}
									onChange={(e) => onQuickFilterChange?.(qf.key, e.target.checked)}
									className="accent-primary"
								/>
								{qf.label}
							</label>
						))}
					</div>
				)}
				<div className="flex items-center gap-2">
					<label className="text-sm text-stone-500">排序</label>
					<select
						value={sortField}
						onChange={(e) => onSortChange(e.target.value)}
						className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700"
					>
						{sortOptions.map((opt) => (
							<option key={opt.value} value={opt.value}>{opt.label}</option>
						))}
					</select>
				</div>

				<div className="flex items-center gap-2">
					<label className="text-sm text-stone-500">每頁</label>
					<select
						value={pageSize}
						onChange={(e) => onPageSizeChange(Number(e.target.value))}
						className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700"
					>
						{pageSizeOptions.map((size) => (
							<option key={size} value={size}>{size} 件</option>
						))}
					</select>
				</div>

				<div className="ml-auto flex items-center gap-1">
					<button
						type="button"
						onClick={() => onViewModeChange("grid")}
						className={cn(
							"rounded p-1.5 transition-colors",
							viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-stone-500 hover:bg-stone-100",
						)}
					>
						<LayoutGrid className="size-4" />
					</button>
					<button
						type="button"
						onClick={() => onViewModeChange("table")}
						className={cn(
							"rounded p-1.5 transition-colors",
							viewMode === "table" ? "bg-primary text-primary-foreground" : "text-stone-500 hover:bg-stone-100",
						)}
					>
						<List className="size-4" />
					</button>
				</div>
			</div>

			{/* 第 2 行：篩選 + CSV 下載 */}
			<div className="flex items-center gap-2">
				<Button variant="secondary" size="sm" onClick={onFilterToggle}>
					<Filter className="mr-1.5 size-3.5" />
					篩選
				</Button>
				<Button variant="secondary" size="sm" onClick={onCsvDownload}>
					<Download className="mr-1.5 size-3.5" />
					下載 CSV
				</Button>
			</div>

			{/* 第 3 行：批量下單 */}
			{onBatchOrder && (
				<div>
					<Button variant="primary" size="sm" onClick={onBatchOrder}>
						<ShoppingCart className="mr-1.5 size-3.5" />
						批量下單
					</Button>
				</div>
			)}
		</div>
	);
}
