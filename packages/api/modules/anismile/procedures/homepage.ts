import { db } from "@repo/database";
import { z } from "zod";

import { publicProcedure } from "../../../orpc/procedures";

const ANISMILE_ORIGIN = "https://www.anismile.jp";
const PLACEHOLDER_IMAGE_MARKER = "length_shadow_white";

type SourceSeriesItem = {
	id: number | string;
	name: string;
	file?: { url?: string; thumb?: string };
	product_count?: number;
	work_title?: string;
	manufacturer?: string;
	latest_add_time?: number;
};

type SourceSeriesResponse = {
	code: number;
	items?: SourceSeriesItem[];
	availableDates?: Array<{ date: string; display: string; count: number }>;
	targetDate?: string;
};

type SourceBannerResponse = {
	code: number;
	items?: Array<{
		name?: string;
		link?: string;
		file?: { url?: string };
	}>;
};

function normalizeSourceImageUrl(url: string | undefined) {
	if (!url) return "";
	if (url.startsWith("/files/")) return `https://img.anismile.jp${url}`;
	if (url.startsWith(`${ANISMILE_ORIGIN}/files/`)) return url.replace(`${ANISMILE_ORIGIN}/files/`, "https://img.anismile.jp/files/");
	return url;
}

function toImageUrlArray(value: unknown): string[] {
	return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function isPlaceholderImageUrl(url: string | null | undefined) {
	return !url || url.includes(PLACEHOLDER_IMAGE_MARKER);
}

async function getSourceSeriesImageMap() {
	const responses = await Promise.all(
		Array.from({ length: 30 }, async (_, dateIndex) => {
			const url = new URL(`${ANISMILE_ORIGIN}/series_list/index`);
			url.searchParams.set("lang", "en");
			url.searchParams.set("dateIndex", String(dateIndex));
			const response = await fetch(url, { next: { revalidate: 300 } });
			if (!response.ok) return [] as Array<[string, string]>;
			const payload = (await response.json()) as SourceSeriesResponse;
			return (payload.items ?? [])
				.map((item): [string, string] => [
					item.name,
					normalizeSourceImageUrl(item.file?.url || item.file?.thumb),
				])
				.filter(([name, imageUrl]) => Boolean(name && imageUrl));
		}),
	).catch(() => []);

	return new Map(responses.flat());
}

function getSeriesFallbackImage(series: string | null, seriesImageMap: Map<string, string>) {
	if (!series) return null;
	return (
		seriesImageMap.get(series) ??
		[...seriesImageMap.entries()].find(([name]) => series.startsWith(name) || name.startsWith(series))?.[1] ??
		null
	);
}

function getDisplayImageUrls(product: { imageUrls: unknown; series: string | null }, seriesImageMap: Map<string, string>) {
	const imageUrls = toImageUrlArray(product.imageUrls);
	if (!isPlaceholderImageUrl(imageUrls[0])) return imageUrls;
	const fallbackImage = getSeriesFallbackImage(product.series, seriesImageMap);
	return fallbackImage ? [fallbackImage, ...imageUrls.filter((url) => !isPlaceholderImageUrl(url))] : imageUrls;
}

// Banner 資料結構
interface BannerItem {
	imageUrl: string;
	linkUrl?: string;
}

// 取得首頁 Banner 列表
export const getBanners = publicProcedure
	.route({
		method: "GET",
		path: "/anismile/homepage/banners",
		tags: ["Anismile"],
		summary: "Get homepage banners",
	})
	.handler(async () => {
		const setting = await db.anismileSetting.findFirst({
			where: { key: "homepage_banners" },
			select: { value: true },
		});

		if (setting?.value) {
			try {
				const banners = JSON.parse(setting.value) as BannerItem[];
				if (Array.isArray(banners) && banners.length > 0) return { banners };
			} catch {
				// DB 設定壞掉時退回 anismile.jp 原站 banner，避免首頁空白。
			}
		}

		const response = await fetch(`${ANISMILE_ORIGIN}/banner/index?lang=en`, {
			next: { revalidate: 300 },
		});
		if (!response.ok) return { banners: [] as BannerItem[] };
		const payload = (await response.json()) as SourceBannerResponse;
		const banners = (payload.items ?? [])
			.map((item) => ({
				imageUrl: normalizeSourceImageUrl(item.file?.url),
				linkUrl: item.link?.startsWith(ANISMILE_ORIGIN)
					? item.link.replace(ANISMILE_ORIGIN, "")
					: item.link,
			}))
			.filter((item) => item.imageUrl);

		return { banners };
	});

// 依照 anismile.jp 首頁的 Series API 顯示分組卡，不用 sitemap 推測首頁順序
export const getSeriesList = publicProcedure
	.route({
		method: "GET",
		path: "/anismile/homepage/series-list",
		tags: ["Anismile"],
		summary: "Get source homepage series list",
	})
	.input(
		z.object({
			dateIndex: z.number().int().min(0).max(6).optional(),
			limit: z.number().int().min(1).max(60).default(30),
		}),
	)
	.handler(async ({ input }) => {
		const url = new URL(`${ANISMILE_ORIGIN}/series_list/index`);
		url.searchParams.set("lang", "en");
		if (input.dateIndex !== undefined) {
			url.searchParams.set("dateIndex", String(input.dateIndex));
		}

		const response = await fetch(url, { next: { revalidate: 300 } });
		if (!response.ok) {
			throw new Error(`Failed to fetch source series list: ${response.status}`);
		}
		const payload = (await response.json()) as SourceSeriesResponse;
		const items = (payload.items ?? []).slice(0, input.limit).map((item) => ({
			id: String(item.id),
			name: item.name,
			imageUrl: normalizeSourceImageUrl(item.file?.url || item.file?.thumb),
			productCount: item.product_count ?? 0,
			workTitle: item.work_title || "",
			manufacturer: item.manufacturer || "",
			latestAddTime: item.latest_add_time ?? null,
		}));

		return {
			items,
			availableDates: payload.availableDates ?? [],
			targetDate: payload.targetDate ?? null,
		};
	});

// 取得近 7 天有商品的上架日期列表
export const getListingDates = publicProcedure
	.route({
		method: "GET",
		path: "/anismile/homepage/listing-dates",
		tags: ["Anismile"],
		summary: "Get listing dates with products",
	})
	.handler(async () => {
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		// 用 groupBy 取得有商品的不重複 listingDate
		const groups = await db.anismileProduct.groupBy({
			by: ["listingDate"],
			where: {
				listingDate: { gte: sevenDaysAgo },
				inStock: true,
			},
			orderBy: {
				listingDate: "desc",
			},
		});

		// 過濾掉 null 並轉為 ISO 日期字串
		const dates = groups
			.map((g) => g.listingDate?.toISOString().split("T")[0])
			.filter((d): d is string => !!d);

		return { dates };
	});

// 依上架日期取得商品列表
export const getProductsByDate = publicProcedure
	.route({
		method: "GET",
		path: "/anismile/homepage/products-by-date",
		tags: ["Anismile"],
		summary: "Get products by listing date",
	})
	.input(
		z.object({
			date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式須為 YYYY-MM-DD"),
		}),
	)
	.handler(async ({ input }) => {
		const dayStart = new Date(`${input.date}T00:00:00.000Z`);
		const dayEnd = new Date(`${input.date}T23:59:59.999Z`);

		try {
			const products = await db.anismileProduct.findMany({
				where: {
					listingDate: { gte: dayStart, lte: dayEnd },
					inStock: true,
				},
				select: {
					id: true,
					titleTranslated: true,
					janCode: true,
					imageUrls: true,
					listingDate: true,
					orderDeadline: true,
					category: true,
				},
				orderBy: { createdAt: "desc" },
				take: 20,
			});

			return {
				products: products.map((p) => ({
					id: p.id,
					title: p.titleTranslated,
					janCode: p.janCode,
					sellingPrice: null,
					imageUrls: p.imageUrls,
					listingDate: p.listingDate?.toISOString() ?? null,
					orderDeadline: p.orderDeadline?.toISOString() ?? null,
					category: p.category,
				})),
			};
		} catch (err) {
			console.error("[getProductsByDate] error:", err);
			throw err;
		}
	});

// 取得即將截止（7 天內）的商品
export const getDeadlineProducts = publicProcedure
	.route({
		method: "GET",
		path: "/anismile/homepage/deadline-products",
		tags: ["Anismile"],
		summary: "Get products with upcoming order deadlines",
	})
	.handler(async () => {
		const now = new Date();
		const sevenDaysLater = new Date();
		sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

		const products = await db.anismileProduct.findMany({
			where: {
				orderDeadline: { gte: now, lte: sevenDaysLater },
				inStock: true,
			},
			select: {
				id: true,
				titleTranslated: true,
				imageUrls: true,
				orderDeadline: true,
				category: true,
				series: true,
				franchise: true,
				brand: true,
			},
			orderBy: { orderDeadline: "asc" },
			take: 20,
		});
		const seriesImageMap = await getSourceSeriesImageMap();

		return {
			products: products.map((p) => ({
				id: p.id,
				title: p.titleTranslated,
				sellingPrice: null,
				imageUrls: getDisplayImageUrls(p, seriesImageMap),
				orderDeadline: p.orderDeadline?.toISOString() ?? null,
				category: p.category,
				franchise: p.franchise,
				brand: p.brand,
			})),
		};
	});
