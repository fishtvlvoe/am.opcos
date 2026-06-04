import { createSyncLog, finishSyncLog, listSyncLogs, upsertProductsFromSync } from "@repo/database";

import { anismileAdminProcedure } from "../../../orpc/procedures";
import { crawlAnismileProductsWithStats } from "../lib/crawler";

export async function runAnismileSyncJob(syncLogId: string) {
	try {
		const crawlResult = await crawlAnismileProductsWithStats({
			source: "sitemap",
			limit: 250,
			delayMs: 100,
		});
		const crawledProducts = crawlResult.products;
		const syncResult = await upsertProductsFromSync(
			crawledProducts.map((item) => ({
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
			{
				markMissingOutOfStock: false,
			},
		);

		await finishSyncLog({
			id: syncLogId,
			status: "completed",
			productsSynced: syncResult.productsSynced,
			productsAdded: syncResult.productsAdded,
			productsUpdated: syncResult.productsUpdated,
			productsSkipped: syncResult.productsSkipped + crawlResult.productsSkipped,
			productsFailed: crawlResult.productsFailed,
			errorMessage:
				crawlResult.failureReasons.length > 0
					? crawlResult.failureReasons.slice(0, 20).join("\n")
					: undefined,
		});
	} catch (error) {
		await finishSyncLog({
			id: syncLogId,
			status: "failed",
			productsSynced: 0,
			productsAdded: 0,
			productsUpdated: 0,
			productsSkipped: 0,
			productsFailed: 1,
			errorMessage: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

export const triggerSync = anismileAdminProcedure
	.route({
		method: "POST",
		path: "/anismile/sync",
		tags: ["Anismile"],
		summary: "Trigger sync",
	})
	.handler(async () => {
		const syncLog = await createSyncLog();

		void runAnismileSyncJob(syncLog.id);

		return {
			status: 202,
			syncLogId: syncLog.id,
			message: "Sync started",
		};
	});

export const getSyncLogs = anismileAdminProcedure
	.route({
		method: "GET",
		path: "/anismile/sync/logs",
		tags: ["Anismile"],
		summary: "List sync logs",
	})
	.handler(async () => {
		return await listSyncLogs(50);
	});
