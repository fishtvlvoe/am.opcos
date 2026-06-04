const PLACEHOLDER_IMAGE_MARKER = "length_shadow_white";

export type CatalogIssueCode =
	| "source-dateindex-stuck"
	| "series-card-missing-image"
	| "series-products-api-failed"
	| "series-page-hidden-by-stock-gate"
	| "series-all-products-unavailable";

export type SeriesVisibilityStats = {
	cardProductCount: number;
	liveDefaultTotal: number;
	liveShowUnavailableTotal: number;
	exactDbTotal?: number | null;
	exactDbInStock?: number | null;
	fallbackDbTotal?: number | null;
	fallbackDbInStock?: number | null;
	homepageImageUrl?: string | null;
	hasUsableDbImage?: boolean | null;
};

export function isPlaceholderImageUrl(url: string | null | undefined) {
	return !url || url.includes(PLACEHOLDER_IMAGE_MARKER);
}

export function detectSourceDateIndexStuck(requestedDate: string | null, sourceTargetDate: string | null) {
	return Boolean(requestedDate && sourceTargetDate && requestedDate !== sourceTargetDate);
}

function getSeriesRoot(seriesName: string) {
	return seriesName.split("・")[0] ?? seriesName;
}

function matchesSeriesName(sourceSeriesName: string, productSeriesName: string | null) {
	if (!sourceSeriesName || !productSeriesName) return false;
	if (
		productSeriesName === sourceSeriesName ||
		productSeriesName.startsWith(sourceSeriesName) ||
		sourceSeriesName.startsWith(productSeriesName)
	) {
		return true;
	}
	const sourceRoot = getSeriesRoot(sourceSeriesName);
	const productRoot = getSeriesRoot(productSeriesName);
	return sourceRoot === productRoot && sourceRoot.length >= 2;
}

export function classifySeriesVisibility(stats: SeriesVisibilityStats): CatalogIssueCode[] {
	const issues: CatalogIssueCode[] = [];

	if (isPlaceholderImageUrl(stats.homepageImageUrl) && stats.hasUsableDbImage === false) {
		issues.push("series-card-missing-image");
	}

	// Use fallback DB stats (same matching logic as listAnismileProducts) to avoid false positives
	// when exact match is zero but startsWith fallback finds products.
	const effectiveDbInStock = stats.fallbackDbInStock ?? stats.exactDbInStock ?? 0;
	if (stats.liveDefaultTotal === 0 && stats.liveShowUnavailableTotal > 0 && effectiveDbInStock === 0) {
		issues.push("series-page-hidden-by-stock-gate");
	}

	if ((stats.exactDbTotal ?? 0) > 0 && (stats.exactDbInStock ?? 0) === 0) {
		issues.push("series-all-products-unavailable");
	}

	return issues;
}

export function formatIssueLabel(issue: CatalogIssueCode) {
	switch (issue) {
		case "source-dateindex-stuck":
			return "來源 dateIndex 沒切換 targetDate";
		case "series-card-missing-image":
			return "系列卡缺圖";
		case "series-products-api-failed":
			return "系列商品 API 失敗";
		case "series-page-hidden-by-stock-gate":
			return "系列頁被現貨條件擋空";
		case "series-all-products-unavailable":
			return "此系列已同步商品全部不可購買";
	}
}
