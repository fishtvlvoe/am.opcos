// 爬蟲同步主流程 — 使用 @repo/api 爬蟲 + @repo/database 持久化
import {
	createSyncLog,
	finishSyncLog,
	getSyncCursor,
	setSyncCursor,
	upsertProductsFromSync,
} from "@repo/database";
import { logger } from "@repo/logs";

export type SyncResult = {
	synced: number;
	added: number;
	updated: number;
	skipped: number;
	errors: number;
	totalDiscovered: number;
	batchOffset: number;
	nextOffset: number;
	syncLogId: string;
};

function parsePositiveInteger(value: string | undefined, fallback: number) {
	const parsed = Number.parseInt(value ?? "", 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * 執行完整同步：登入 → 爬取 → 翻譯 → upsert → 更新 SyncLog
 * 實際爬蟲邏輯在 @repo/api/modules/anismile/lib/crawler
 */
export async function runSync(): Promise<SyncResult> {
	const email = process.env.ANISMILE_EMAIL;
	const password = process.env.ANISMILE_PASSWORD;
	if (!email || !password) {
		throw new Error("Missing ANISMILE_EMAIL / ANISMILE_PASSWORD credentials");
	}

	const syncLog = await createSyncLog();

	try {
		const batchSize = Math.min(parsePositiveInteger(process.env.ANISMILE_SYNC_BATCH_SIZE, 250), 500);
		const delayMs = Math.max(0, parsePositiveInteger(process.env.ANISMILE_SYNC_DELAY_MS, 100));
		const batchOffset = await getSyncCursor();
		// 動態 import 避免 bundler 在 moduleResolution 模式下的 subpath 解析問題
		const { crawlAnismileProductsWithStats } = await import("@repo/api/modules/anismile/lib/crawler");
		const crawlResult = await crawlAnismileProductsWithStats({
			offset: batchOffset,
			limit: batchSize,
			delayMs,
		});
		const products = crawlResult.products;

		const result = await upsertProductsFromSync(
			products.map((item) => ({
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
				stockQuantity: item.stockQuantity,
				lastSyncedAt: new Date(),
				discountRate: item.discountRate,
				brand: item.brand,
				franchise: item.franchise,
				janCode: item.janCode,
				releaseDate: item.releaseDate,
			})),
			{
				markMissingOutOfStock: false,
				transactionTimeoutMs: 60_000,
			},
		);

		await finishSyncLog({
			id: syncLog.id,
			status: "completed",
			productsSynced: result.productsSynced,
			productsAdded: result.productsAdded,
			productsUpdated: result.productsUpdated,
			productsSkipped: result.productsSkipped + crawlResult.productsSkipped,
			productsFailed: crawlResult.productsFailed,
			errorMessage:
				crawlResult.failureReasons.length > 0
					? crawlResult.failureReasons.slice(0, 20).join("\n")
					: undefined,
		});

		const nextOffset =
			crawlResult.totalDiscovered > 0 && batchOffset + batchSize < crawlResult.totalDiscovered
				? batchOffset + batchSize
				: 0;
		await setSyncCursor(nextOffset);

		logger.info(
			`[sync] completed batch offset=${batchOffset} next=${nextOffset}: ${result.productsSynced} products (${result.productsAdded} added, ${result.productsUpdated} updated, ${result.productsSkipped + crawlResult.productsSkipped} skipped, ${crawlResult.productsFailed} failed)`,
		);

		return {
			synced: result.productsSynced,
			added: result.productsAdded,
			updated: result.productsUpdated,
			skipped: result.productsSkipped + crawlResult.productsSkipped,
			errors: crawlResult.productsFailed,
			totalDiscovered: crawlResult.totalDiscovered,
			batchOffset,
			nextOffset,
			syncLogId: syncLog.id,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		logger.error("[sync] failed", error);

		await finishSyncLog({
			id: syncLog.id,
			status: "failed",
			productsSynced: 0,
			productsAdded: 0,
			productsUpdated: 0,
			productsSkipped: 0,
			productsFailed: 1,
			errorMessage,
		});

		throw error;
	}
}
