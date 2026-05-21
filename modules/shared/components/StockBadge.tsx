type StockBadgeProps = {
	inStock: boolean;
	stockQuantity: number | null | undefined;
};

export function StockBadge({ inStock, stockQuantity }: StockBadgeProps) {
	if (stockQuantity === null || stockQuantity === undefined) {
		return (
			<span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-stone-100 text-stone-500">
				庫存未知
			</span>
		);
	}

	if (!inStock || stockQuantity === 0) {
		return (
			<span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">
				缺貨
			</span>
		);
	}

	return (
		<span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
			有貨
		</span>
	);
}
