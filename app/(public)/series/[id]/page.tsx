import { getSession } from "@auth/lib/server";
import {
	listAnismileProducts,
	toImageUrlArray,
	isPlaceholderImageUrl,
	normalizeSourceImageUrl,
	getSeriesFallbackImage,
	getDisplayImageUrls,
	getSeriesImageMapForProducts,
} from "@repo/database";

import { SeriesDetailPage } from "../../../../modules/catalog/SeriesDetailPage";

type DecimalLike = { toNumber(): number };

function toNumber(val: DecimalLike | number | null | undefined): number | null {
	if (val === null || val === undefined) return null;
	return typeof val === "number" ? val : val.toNumber();
}

function toNumberRequired(val: DecimalLike | number): number {
	return typeof val === "number" ? val : val.toNumber();
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const decodedId = decodeURIComponent(id);

	const session = await getSession().catch(() => null);
	const showPrices = !!session;

	const result = await listAnismileProducts({
		series: decodedId,
		page: 1,
		pageSize: 20,
		showUnavailable: true,
	});

	const seriesImageMap = await getSeriesImageMapForProducts(result.items);

	const initialProductsData = {
		items: result.items.map((item) => ({
			id: item.id,
			titleTranslated: item.titleTranslated,
			titleOriginal: item.titleOriginal,
			imageUrls: getDisplayImageUrls(item, seriesImageMap),
			sourceUrl: item.sourceUrl,
			category: item.category,
			series: item.series,
			janCode: item.janCode,
			brand: item.brand,
			franchise: item.franchise,
			originalPrice: toNumber(item.originalPrice),
			sellingPrice: showPrices ? toNumberRequired(item.sellingPrice) : null,
			listingDate: item.listingDate,
			orderDeadline: item.orderDeadline,
			releaseDate: item.releaseDate,
			inStock: item.inStock,
		})),
		total: result.total,
		page: result.page,
		pageSize: result.pageSize,
		totalPages: result.totalPages,
	};

	return <SeriesDetailPage seriesId={decodedId} initialProductsData={initialProductsData} />;
}
