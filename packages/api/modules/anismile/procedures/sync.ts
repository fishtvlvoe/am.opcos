import { createSyncLog, finishSyncLog, listSyncLogs, upsertProductsFromSync } from "@repo/database";

import { anismileAdminProcedure } from "../../../orpc/procedures";
import { crawlAnismileProducts } from "../lib/crawler";

export async function runAnismileSyncJob(syncLogId: string) {
	try {
		const crawledProducts = await crawlAnismileProducts();
		const syncResult = await upsertProductsFromSync(
			crawledProducts.map((item) => ({
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
			})),
		);

		await finishSyncLog({
			id: syncLogId,
			status: "completed",
			productsSynced: syncResult.productsSynced,
			productsAdded: syncResult.productsAdded,
			productsUpdated: syncResult.productsUpdated,
		});
	} catch (error) {
		await finishSyncLog({
			id: syncLogId,
			status: "failed",
			productsSynced: 0,
			productsAdded: 0,
			productsUpdated: 0,
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
