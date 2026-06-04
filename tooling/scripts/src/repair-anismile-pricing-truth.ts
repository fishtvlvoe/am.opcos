import { db, upsertProductsFromSync } from "@repo/database";
import { logger } from "@repo/logs";

type RepairCandidate = {
	supplierId: string;
	originalPrice: unknown;
	costPrice: unknown;
	discountRate: unknown;
};

type RefreshedProduct = NonNullable<Awaited<ReturnType<typeof import("@repo/api/modules/anismile/lib/crawler").crawlAnismileProductBySupplierId>>>;

function toNumber(value: unknown) {
	if (typeof value === "number") return value;
	if (typeof value === "string") return Number.parseFloat(value);
	if (value && typeof value === "object" && "toNumber" in value && typeof value.toNumber === "function") {
		return value.toNumber();
	}
	return Number.NaN;
}

function looksLikeDegradedPricingTruth(product: RepairCandidate) {
	const originalPrice = toNumber(product.originalPrice);
	const costPrice = toNumber(product.costPrice);
	return product.discountRate == null && Number.isFinite(originalPrice) && Number.isFinite(costPrice) && originalPrice === costPrice;
}

async function main() {
	const supplierIds = process.argv.slice(2).map((item) => item.trim()).filter(Boolean);
	const { crawlAnismileProductBySupplierId } = await import("@repo/api/modules/anismile/lib/crawler");

	const candidates =
		supplierIds.length > 0
			? await db.anismileProduct.findMany({
					where: {
						supplierId: { in: supplierIds },
					},
					select: {
						supplierId: true,
						originalPrice: true,
						costPrice: true,
						discountRate: true,
					},
				})
			: (
					await db.anismileProduct.findMany({
						where: {
							inStock: true,
							orderDeadline: { gte: new Date() },
						},
						select: {
							supplierId: true,
							originalPrice: true,
							costPrice: true,
							discountRate: true,
						},
						take: 250,
						orderBy: { lastSyncedAt: "desc" },
					})
				).filter(looksLikeDegradedPricingTruth);

	if (candidates.length === 0) {
		logger.info("No degraded source pricing candidates found.");
		return;
	}

	logger.info(`Repairing source pricing truth for ${candidates.length} products...`);

	const refreshed = (
		await Promise.all(
			candidates.map(async ({ supplierId }) => {
				try {
					return await crawlAnismileProductBySupplierId(supplierId, {
						authMode: "authenticated",
					});
				} catch (error) {
					logger.error(`[repair-anismile-pricing-truth] failed for ${supplierId}`, error);
					return null;
				}
			}),
		)
	).filter((item): item is RefreshedProduct => item !== null);

	if (refreshed.length === 0) {
		logger.warn("No products were refreshed from authenticated source payloads.");
		return;
	}

	const result = await upsertProductsFromSync(
		refreshed.map((item) => ({
			supplierId: item.supplierId,
			sourceUrl: item.sourceUrl,
			titleOriginal: item.titleOriginal,
			titleTranslated: item.titleTranslated,
			descriptionOriginal: item.descriptionOriginal,
			descriptionTranslated: item.descriptionTranslated,
			imageUrls: item.imageUrls,
			category: item.category,
			series: item.series,
			originalPrice: item.originalPrice,
			costPrice: item.costPrice,
			listingDate: item.listingDate,
			orderDeadline: item.orderDeadline,
			inStock: item.inStock,
			stockQuantity: item.stockQuantity,
			lastSyncedAt: new Date(),
			discountRate: item.discountRate,
			brand: item.brand,
			franchise: item.franchise,
			janCode: item.janCode,
			releaseDate: item.releaseDate,
			sourceAuthState: item.sourceAuthState,
		})),
		{ markMissingOutOfStock: false },
	);

	logger.success(
		`Pricing truth repaired: ${result.productsSynced} synced, ${result.productsUpdated} updated, ${result.productsAdded} added.`,
	);
}

main().catch((error) => {
	logger.error("[repair-anismile-pricing-truth] failed", error);
	process.exitCode = 1;
});
