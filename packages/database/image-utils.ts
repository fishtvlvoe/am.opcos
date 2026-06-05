import { generateSeriesVariants } from "@repo/utils";
import { db } from "./prisma/client";

const ANISMILE_ORIGIN = "https://www.anismile.jp";
const PLACEHOLDER_IMAGE_MARKER = "length_shadow_white";
const SERIES_IMAGE_CACHE_TTL_MS = 5 * 60 * 1000;

let seriesImageCache: { expiresAt: number; map: Map<string, string> } | null = null;
let seriesImageCachePromise: Promise<Map<string, string>> | null = null;

export function normalizeSourceImageUrl(url: string | undefined) {
	if (!url) return "";
	if (url.startsWith("/files/")) return `https://img.anismile.jp${url}`;
	if (url.startsWith(`${ANISMILE_ORIGIN}/files/`)) {
		return url.replace(`${ANISMILE_ORIGIN}/files/`, "https://img.anismile.jp/files/");
	}
	return url;
}

export function toImageUrlArray(value: unknown): string[] {
	return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

export function isPlaceholderImageUrl(url: string | null | undefined) {
	return !url || url.includes(PLACEHOLDER_IMAGE_MARKER);
}

export function getSeriesFallbackImage(series: string | null, seriesImageMap: Map<string, string>) {
	if (!series) return null;
	return (
		seriesImageMap.get(series) ??
		[...seriesImageMap.entries()].find(([name]) => series.startsWith(name) || name.startsWith(series))?.[1] ??
		null
	);
}

export function getDisplayImageUrls(
	product: { imageUrls: unknown; series: string | null },
	seriesImageMap: Map<string, string>,
) {
	const imageUrls = toImageUrlArray(product.imageUrls);
	if (!isPlaceholderImageUrl(imageUrls[0])) return imageUrls;
	const fallbackImage = getSeriesFallbackImage(product.series, seriesImageMap);
	return fallbackImage ? [fallbackImage, ...imageUrls.filter((url) => !isPlaceholderImageUrl(url))] : imageUrls;
}

async function fetchSourceSeriesImageMap(): Promise<Map<string, string>> {
	const responses = await Promise.all(
		Array.from({ length: 7 }, async (_, dateIndex) => {
			const url = new URL(`${ANISMILE_ORIGIN}/series_list/index`);
			url.searchParams.set("lang", "en");
			url.searchParams.set("dateIndex", String(dateIndex));
			const response = await fetch(url, { next: { revalidate: 300 } });
			if (!response.ok) return [] as Array<[string, string]>;
			const payload = (await response.json()) as {
				code: number;
				items?: Array<{ name?: string; file?: { url?: string; thumb?: string } }>;
			};
			return (payload.items ?? [])
				.map((item): [string, string] => [
					item.name ?? "",
					normalizeSourceImageUrl(item.file?.url || item.file?.thumb),
				])
				.filter(([name, imageUrl]) => Boolean(name && imageUrl));
		}),
	).catch(() => []);

	const map = new Map(responses.flat());
	seriesImageCache = {
		expiresAt: Date.now() + SERIES_IMAGE_CACHE_TTL_MS,
		map,
	};
	return map;
}

async function getDbSeriesImageMap(): Promise<Map<string, string>> {
	const seriesList = await db.anismileSeries.findMany({
		where: { imageUrl: { not: null } },
		select: { name: true, imageUrl: true },
	});
	// 雙 key 策略：同時存入原始名稱（DB 中通常為簡體）與所有異體字變體（含繁體）
	// 確保 map.get("截單") 與 map.get("截单") 都能命中相同 imageUrl
	const map = new Map<string, string>();
	for (const s of seriesList) {
		const url = s.imageUrl!;
		for (const variant of generateSeriesVariants(s.name)) {
			map.set(variant, url);
		}
	}
	return map;
}

export async function getSourceSeriesImageMap() {
	if (seriesImageCache && seriesImageCache.expiresAt > Date.now()) {
		return seriesImageCache.map;
	}

	// Priority 1: try DB first (fast, no HTTP)
	try {
		const dbMap = await getDbSeriesImageMap();
		if (dbMap.size > 0) {
			seriesImageCache = {
				expiresAt: Date.now() + SERIES_IMAGE_CACHE_TTL_MS,
				map: dbMap,
			};
			return dbMap;
		}
	} catch {
		// DB lookup failed, fall through to API
	}

	// Priority 2: fetch from source API (slow, fallback)
	if (!seriesImageCachePromise) {
		seriesImageCachePromise = fetchSourceSeriesImageMap().finally(() => {
			seriesImageCachePromise = null;
		});
	}
	return seriesImageCachePromise;
}

export async function getSeriesImageMapForProducts(products: Array<{ imageUrls: unknown; lastSyncedAt?: Date | null }>) {
	const SOURCE_PRODUCT_REFRESH_TTL_MS = 30 * 60 * 1000;
	const needsFallback = products.some((product) => {
		if (!isPlaceholderImageUrl(toImageUrlArray(product.imageUrls)[0])) return false;
		if (product.lastSyncedAt && Date.now() - product.lastSyncedAt.getTime() < SOURCE_PRODUCT_REFRESH_TTL_MS) return false;
		return true;
	});
	if (!needsFallback) {
		return new Map<string, string>();
	}
	return getSourceSeriesImageMap();
}
