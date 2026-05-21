// 爬蟲同步主流程 — 使用 @repo/api 爬蟲 + @repo/database 持久化
import { createSyncLog, finishSyncLog, upsertProductsFromSync } from "@repo/database";
import { logger } from "@repo/logs";

export type SyncResult = {
	synced: number;
	added: number;
	updated: number;
	errors: number;
	syncLogId: string;
};

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
		// 動態 import 避免 bundler 在 moduleResolution 模式下的 subpath 解析問題
		const { crawlAnismileProducts } = await import("@repo/api/modules/anismile/lib/crawler");
		const products = await crawlAnismileProducts();

		const result = await upsertProductsFromSync(
			products.map((item) => ({
				supplierId: item.supplierId,
				titleOriginal: item.titleOriginal,
				titleTranslated: item.titleTranslated,
				descriptionOriginal: item.descriptionOriginal,
				descriptionTranslated: item.descriptionTranslated,
				imageUrls: item.imageUrls,
				category: item.category,
				series: item.series,
				originalPrice: item.originalPrice,
				costPrice: item.costPrice,
				orderDeadline: item.orderDeadline,
				stockQuantity: item.stockQuantity,
				lastSyncedAt: new Date(),
				discountRate: item.discountRate,
				brand: item.brand,
				franchise: item.franchise,
				janCode: item.janCode,
				releaseDate: item.releaseDate,
			})),
		);

		await finishSyncLog({
			id: syncLog.id,
			status: "completed",
			productsSynced: result.productsSynced,
			productsAdded: result.productsAdded,
			productsUpdated: result.productsUpdated,
		});

		logger.info(
			`[sync] completed: ${result.productsSynced} products (${result.productsAdded} added, ${result.productsUpdated} updated)`,
		);

		return {
			synced: result.productsSynced,
			added: result.productsAdded,
			updated: result.productsUpdated,
			errors: 0,
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
			errorMessage,
		});

		throw error;
	}
}
