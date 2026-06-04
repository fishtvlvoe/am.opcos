import { db } from "@repo/database";

import { isR2Configured, syncSeriesImageToR2 } from "./r2-image-cache";

const ANISMILE_ORIGIN = "https://www.anismile.jp";

interface SourceSeriesItem {
	name: string;
	file?: { url?: string; thumb?: string };
	product_count?: number;
}

interface SourceSeriesResponse {
	code: number;
	items?: SourceSeriesItem[];
}

function normalizeSourceImageUrl(url: string | undefined) {
	if (!url) return "";
	if (url.startsWith("/files/")) return `https://img.anismile.jp${url}`;
	if (url.startsWith(`${ANISMILE_ORIGIN}/files/`)) {
		return url.replace(`${ANISMILE_ORIGIN}/files/`, "https://img.anismile.jp/files/");
	}
	return url;
}

export async function fetchSourceSeriesList(): Promise<
	Array<{ name: string; imageUrl: string; productCount: number }>
> {
	const responses = await Promise.all(
		Array.from({ length: 7 }, async (_, dateIndex) => {
			const url = new URL(`${ANISMILE_ORIGIN}/series_list/index`);
			url.searchParams.set("lang", "en");
			url.searchParams.set("dateIndex", String(dateIndex));
			const response = await fetch(url, { next: { revalidate: 300 } });
			if (!response.ok) return [] as SourceSeriesItem[];
			const payload = (await response.json()) as SourceSeriesResponse;
			return payload.items ?? [];
		}),
	).catch(() => []);

	const allItems = responses.flat();
	const seen = new Set<string>();
	const result: Array<{ name: string; imageUrl: string; productCount: number }> = [];

	for (const item of allItems) {
		const name = item.name?.trim();
		if (!name || seen.has(name)) continue;
		seen.add(name);
		const imageUrl = normalizeSourceImageUrl(item.file?.url || item.file?.thumb);
		if (!imageUrl) continue;
		result.push({
			name,
			imageUrl,
			productCount: item.product_count ?? 0,
		});
	}

	return result;
}

export async function upsertSeriesListFromSync(
	seriesList: Array<{ name: string; imageUrl: string; productCount: number }>,
) {
	if (seriesList.length === 0) return;

	const now = new Date();
	const useR2 = isR2Configured();

	// Upload images to R2 if configured
	const processedList = await Promise.all(
		seriesList.map(async (series) => {
			if (!useR2) return series;
			const r2Url = await syncSeriesImageToR2(series.imageUrl, series.name);
			return {
				...series,
				imageUrl: r2Url ?? series.imageUrl,
			};
		}),
	);

	await db.$transaction(async (tx) => {
		for (const series of processedList) {
			await tx.anismileSeries.upsert({
				where: { name: series.name },
				update: {
					imageUrl: series.imageUrl,
					productCount: series.productCount,
					lastSyncedAt: now,
				},
				create: {
					name: series.name,
					imageUrl: series.imageUrl,
					productCount: series.productCount,
					lastSyncedAt: now,
				},
			});
		}
	});
}

export async function syncAnismileSeriesList(): Promise<{
	synced: number;
	failed: boolean;
	error?: string;
}> {
	try {
		const seriesList = await fetchSourceSeriesList();
		await upsertSeriesListFromSync(seriesList);
		return { synced: seriesList.length, failed: false };
	} catch (error) {
		return {
			synced: 0,
			failed: true,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
