"use client";

import Link from "next/link";

import { PriceDisplay } from "./PriceDisplay";

type SearchResultTableProduct = {
	id: string;
	titleTranslated?: string | null;
	titleOriginal?: string | null;
	janCode?: string | null;
	series?: string | null;
	brand?: string | null;
	originalPrice?: number | null;
	sellingPrice?: number | null;
	inStock?: boolean | null;
	orderDeadline?: Date | string | null;
	releaseDate?: Date | string | null;
};

function formatDate(value: Date | string | null | undefined) {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "-";
	return date.toISOString().slice(0, 10);
}

export function SearchResultTable({ products }: { products: SearchResultTableProduct[] }) {
	return (
		<div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
			<table className="min-w-full text-sm">
				<thead>
					<tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
						<th className="px-3 py-2.5 text-left font-medium">商品名稱</th>
						<th className="px-3 py-2.5 text-left font-medium">JAN Code</th>
						<th className="px-3 py-2.5 text-left font-medium">作品系列</th>
						<th className="px-3 py-2.5 text-left font-medium">品牌</th>
						<th className="px-3 py-2.5 text-right font-medium">價格</th>
						<th className="px-3 py-2.5 text-center font-medium">庫存狀態</th>
						<th className="px-3 py-2.5 text-center font-medium">截止日期</th>
					</tr>
				</thead>
				<tbody>
					{products.map((product) => (
						<tr key={product.id} className="border-b border-stone-100 hover:bg-stone-50">
							<td className="px-3 py-2.5">
								<Link href={`/products/${product.id}`} className="line-clamp-2 max-w-[360px] font-medium text-stone-900 hover:text-primary">
									{product.titleTranslated || product.titleOriginal}
								</Link>
							</td>
							<td className="px-3 py-2.5 text-stone-600">{product.janCode || "-"}</td>
							<td className="px-3 py-2.5 text-stone-600">{product.series || "-"}</td>
							<td className="px-3 py-2.5 text-stone-600">{product.brand || "-"}</td>
							<td className="px-3 py-2.5 text-right">
								<PriceDisplay
									originalPrice={product.originalPrice}
									memberPrice={product.sellingPrice}
									align="right"
								/>
							</td>
							<td className="px-3 py-2.5 text-center">
								<span className={product.inStock ? "text-emerald-700" : "text-stone-500"}>
									{product.inStock ? "現貨" : "不可購買"}
								</span>
							</td>
							<td className="px-3 py-2.5 text-center text-stone-600">{formatDate(product.orderDeadline)}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
