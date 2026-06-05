import { notFound } from "next/navigation";

import { getSession } from "@auth/lib/server";
import { getAnismileProductById, toImageUrlArray } from "@repo/database";

import { ProductDetailPage } from "../../../../modules/detail/ProductDetailPage";

type DecimalLike = { toNumber(): number };

function toNumber(val: DecimalLike | number | null | undefined): number | null {
	if (val === null || val === undefined) return null;
	return typeof val === "number" ? val : val.toNumber();
}

function toNumberRequired(val: DecimalLike | number): number {
	return typeof val === "number" ? val : val.toNumber();
}

function publicPrice(sellingPrice: number, showPrices: boolean): number | null {
	return showPrices ? sellingPrice : null;
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	const session = await getSession().catch(() => null);
	const showPrices = !!session;

	const product = await getAnismileProductById(id);
	if (!product) {
		notFound();
	}
	if (!product.inStock) {
		notFound();
	}

	const imageUrls = toImageUrlArray(product.imageUrls);

	const initialProductData = {
		id: product.id,
		supplierId: product.supplierId,
		sourceUrl: product.sourceUrl ?? null,
		titleOriginal: product.titleOriginal,
		titleTranslated: product.titleTranslated,
		descriptionTranslated: product.descriptionTranslated,
		imageUrls,
		category: product.category,
		series: product.series,
		janCode: product.janCode ?? null,
		brand: product.brand ?? null,
		franchise: product.franchise ?? null,
		boxSpec: product.boxSpec ?? null,
		originalPrice: product.originalPrice ? toNumber(product.originalPrice) : null,
		costPrice: showPrices && product.costPrice ? toNumber(product.costPrice) : null,
		discountRate: showPrices && product.discountRate ? toNumber(product.discountRate) : null,
		saleStatus: product.saleStatus ?? null,
		sellingPrice: publicPrice(toNumberRequired(product.sellingPrice), showPrices),
		listingDate: product.listingDate,
		orderDeadline: product.orderDeadline,
		releaseDate: product.releaseDate ?? null,
		inStock: product.inStock,
		stockQuantity: product.stockQuantity ?? null,
		lastSyncedAt: product.lastSyncedAt,
	};

	return <ProductDetailPage id={id} initialProductData={initialProductData} />;
}
