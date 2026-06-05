import { db, upsertProductsFromSync, setSyncCursor } from "@repo/database";
import { logger } from "@repo/logs";

function chunkArray<T>(arr: T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < arr.length; i += size) {
		chunks.push(arr.slice(i, i + size));
	}
	return chunks;
}

/**
 * 完整重新同步所有產品價格資料
 * 用於修復 discountRate/costPrice 錯誤後的批次更新
 */
async function main() {
	// 重置 sync cursor，讓後續常規 sync 也從頭開始
	await setSyncCursor(0);
	logger.info("[full-resync] sync cursor reset to 0");

	const { crawlAnismileProductsWithStats } = await import("@repo/api/modules/anismile/lib/crawler");

	// 先抓 homepage（最新上架）
	logger.info("[full-resync] crawling homepage (latest products)...");
	const homepageResult = await crawlAnismileProductsWithStats({
		source: "homepage",
		offset: 0,
		limit: 300,
		delayMs: 100,
		concurrency: 4,
	});

	if (homepageResult.products.length > 0) {
		const homeUpsert = await upsertProductsFromSync(
			homepageResult.products.map((item) => ({
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
			{ markMissingOutOfStock: false, transactionTimeoutMs: 120_000 },
		);
		logger.success(
			`[full-resync] homepage: ${homeUpsert.productsSynced} synced (${homeUpsert.productsUpdated} updated, ${homeUpsert.productsAdded} added)`,
		);
	}

	// 再抓 sitemap（全站），大批次抓取 + 小批次 upsert 避免 transaction timeout
	logger.info("[full-resync] crawling sitemap (all products)...");
	const CRAWL_BATCH_SIZE = 2000;
	const UPSERT_CHUNK_SIZE = 50;
	let offset = 0;
	let totalSynced = 0;
	let totalUpdated = 0;
	let totalAdded = 0;
	let hasMore = true;

	while (hasMore) {
		logger.info(`[full-resync] sitemap batch offset=${offset}, limit=${CRAWL_BATCH_SIZE}`);
		const result = await crawlAnismileProductsWithStats({
			source: "sitemap",
			offset,
			limit: CRAWL_BATCH_SIZE,
			delayMs: 100,
			concurrency: 8,
		});

		if (result.products.length === 0) {
			hasMore = false;
			break;
		}

		// 分批 upsert，每批 50 個避免 transaction timeout
		const chunks = chunkArray(result.products, UPSERT_CHUNK_SIZE);
		let batchSynced = 0;
		let batchUpdated = 0;
		let batchAdded = 0;

		for (let i = 0; i < chunks.length; i++) {
			const chunk = chunks[i];
			const upsertResult = await upsertProductsFromSync(
				chunk.map((item) => ({
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
				{ markMissingOutOfStock: false, transactionTimeoutMs: 120_000 },
			);
			batchSynced += upsertResult.productsSynced;
			batchUpdated += upsertResult.productsUpdated;
			batchAdded += upsertResult.productsAdded;
			if (chunks.length > 1) {
				logger.info(`[full-resync]   chunk ${i + 1}/${chunks.length}: ${upsertResult.productsSynced} synced`);
			}
		}

		totalSynced += batchSynced;
		totalUpdated += batchUpdated;
		totalAdded += batchAdded;

		logger.info(
			`[full-resync] batch complete: ${batchSynced} synced (${batchUpdated} updated, ${batchAdded} added)`,
		);

		// 檢查是否還有更多
		if (offset + CRAWL_BATCH_SIZE >= result.totalDiscovered) {
			hasMore = false;
		}
		offset += CRAWL_BATCH_SIZE;
	}

	logger.success(
		`[full-resync] complete! Total: ${totalSynced} synced (${totalUpdated} updated, ${totalAdded} added)`,
	);
}

main().catch((error) => {
	logger.error("[full-resync] failed", error);
	process.exitCode = 1;
});
