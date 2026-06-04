import { auth } from "@repo/auth";
import { db } from "@repo/database";
import { z } from "zod";
import { toTraditionalChinese } from "../lib/opencc";

import { publicProcedure } from "../../../orpc/procedures";

const ANISMILE_ORIGIN = "https://www.anismile.jp";
const PLACEHOLDER_IMAGE_MARKER = "length_shadow_white";

async function canSeePricing(headers: Headers) {
	const session = await auth.api.getSession({ headers });
	return !!session;
}

function publicPrice<T extends number>(value: T, visible: boolean): T | null {
	return visible ? value : null;
}

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
		copyright_text?: string;
		copyright_color?: string;
		file?: { url?: string };
	}>;
};

function normalizeSourceImageUrl(url: string | undefined) {
	if (!url) return "";
	if (url.startsWith("/files/")) return `https://img.anismile.jp${url}`;
	if (url.startsWith(`${ANISMILE_ORIGIN}/files/`)) return url.replace(`${ANISMILE_ORIGIN}/files/`, "https://img.anismile.jp/files/");
	return url;
}

function normalizeSourceLinkUrl(url: string | undefined) {
	if (!url) return undefined;
	if (!url.startsWith(ANISMILE_ORIGIN)) return url;

	const parsed = new URL(url);
	const searchMatch = parsed.pathname.match(/^\/search\/(.+)\/?$/);
	if (searchMatch?.[1]) {
		const query = decodeURIComponent(searchMatch[1]).replace(/[\/／]+$/g, "").trim();
		return query ? `/search?q=${encodeURIComponent(query)}` : "/search";
	}

	return `${parsed.pathname}${parsed.search}`;
}

function toImageUrlArray(value: unknown): string[] {
	return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function isPlaceholderImageUrl(url: string | null | undefined) {
	return !url || url.includes(PLACEHOLDER_IMAGE_MARKER);
}

function getSeriesRoot(seriesName: string) {
	return seriesName.split("・")[0] ?? seriesName;
}

function matchesSeriesName(sourceSeriesName: string, productSeriesName: string | null) {
	if (!sourceSeriesName || !productSeriesName) return false;
	if (
		productSeriesName === sourceSeriesName ||
		productSeriesName.startsWith(sourceSeriesName) ||
		sourceSeriesName.startsWith(productSeriesName)
	) {
		return true;
	}
	// Cross-batch fallback: same series root (e.g. "DEATH NOTE・ステラノーツ・6月28日截单" vs "DEATH NOTE・KADOKAWAより・1月6日截单")
	const sourceRoot = getSeriesRoot(sourceSeriesName);
	const productRoot = getSeriesRoot(productSeriesName);
	return sourceRoot === productRoot && sourceRoot.length >= 2;
}

async function getSyncedSeriesFallbackImageMap(seriesNames: string[]) {
	const uniqueSeriesNames = Array.from(new Set(seriesNames.map((name) => name.trim()).filter(Boolean)));
	if (uniqueSeriesNames.length === 0) {
		return new Map<string, string>();
	}

	const seriesRoots = uniqueSeriesNames.map((name) => getSeriesRoot(name));
	const allTerms = Array.from(new Set([...uniqueSeriesNames, ...seriesRoots]));

	const products = await db.anismileProduct.findMany({
		where: {
			OR: allTerms.map((term) => ({
				series: { startsWith: term },
			})),
		},
		select: {
			series: true,
			imageUrls: true,
			listingDate: true,
			createdAt: true,
		},
		orderBy: [{ listingDate: "desc" }, { createdAt: "desc" }],
	});

	const syncedSeriesFallbackImageMap = new Map<string, string>();
	for (const seriesName of uniqueSeriesNames) {
		for (const product of products) {
			if (!matchesSeriesName(seriesName, product.series)) continue;
			const usableImage = toImageUrlArray(product.imageUrls).find((url) => !isPlaceholderImageUrl(url));
			if (!usableImage) continue;
			syncedSeriesFallbackImageMap.set(seriesName, usableImage);
			break;
		}
	}

	return syncedSeriesFallbackImageMap;
}

async function getSourceSeriesImageMap() {
	const responses = await Promise.all(
		Array.from({ length: 7 }, async (_, dateIndex) => {
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

async function getSyncedSeriesListByDate({
	targetDate,
	limit,
}: {
	targetDate: string;
	limit: number;
}) {
	const dayStart = new Date(`${targetDate}T00:00:00.000Z`);
	const dayEnd = new Date(`${targetDate}T23:59:59.999Z`);
	const products = await db.anismileProduct.findMany({
		where: {
			listingDate: {
				gte: dayStart,
				lte: dayEnd,
			},
			series: {
				not: null,
			},
		},
		select: {
			id: true,
			series: true,
			imageUrls: true,
			brand: true,
			franchise: true,
			createdAt: true,
		},
		orderBy: [{ createdAt: "desc" }, { id: "desc" }],
	});

	const grouped = new Map<
		string,
		{
			id: string;
			name: string;
			imageUrl: string;
			productCount: number;
			workTitle: string;
			manufacturer: string;
			latestAddTime: number | null;
			latestCreatedAt: Date;
		}
	>();

	for (const product of products) {
		const seriesName = product.series?.trim();
		if (!seriesName) continue;

		const usableImage = toImageUrlArray(product.imageUrls).find((url) => !isPlaceholderImageUrl(url)) ?? "";
		const existing = grouped.get(seriesName);
		if (!existing) {
			grouped.set(seriesName, {
				id: product.id,
				name: seriesName,
				imageUrl: usableImage,
				productCount: 1,
				workTitle: product.franchise ?? "",
				manufacturer: product.brand ?? "",
				latestAddTime: Math.floor(product.createdAt.getTime() / 1000),
				latestCreatedAt: product.createdAt,
			});
			continue;
		}

		existing.productCount += 1;
		if (!existing.imageUrl && usableImage) {
			existing.imageUrl = usableImage;
		}
		if (!existing.workTitle && product.franchise) {
			existing.workTitle = product.franchise;
		}
		if (!existing.manufacturer && product.brand) {
			existing.manufacturer = product.brand;
		}
		if (product.createdAt > existing.latestCreatedAt) {
			existing.latestCreatedAt = product.createdAt;
			existing.latestAddTime = Math.floor(product.createdAt.getTime() / 1000);
		}
	}

	const sorted = Array.from(grouped.values())
		.sort((a, b) => b.latestCreatedAt.getTime() - a.latestCreatedAt.getTime() || b.productCount - a.productCount)
		.slice(0, limit);

	const seriesWithoutImage = sorted.filter((item) => !item.imageUrl).map((item) => item.name);
	const fallbackImageMap = await getSyncedSeriesFallbackImageMap(seriesWithoutImage);
	for (const item of sorted) {
		if (!item.imageUrl && fallbackImageMap.has(item.name)) {
			item.imageUrl = fallbackImageMap.get(item.name) ?? "";
		}
	}

	return sorted.map(({ latestCreatedAt: _latestCreatedAt, ...item }) => item);
}

// Banner 資料結構
interface BannerItem {
	imageUrl: string;
	linkUrl?: string;
	name?: string;
	copyrightText?: string;
	copyrightColor?: string;
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
		try {
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
		} catch {
			// 本地驗收可能沒有可用 DB；banner 仍可由 anismile.jp source feed 顯示。
		}

		const response = await fetch(`${ANISMILE_ORIGIN}/banner/index?lang=en`, {
			next: { revalidate: 300 },
		});
		if (!response.ok) return { banners: [] as BannerItem[] };
		const payload = (await response.json()) as SourceBannerResponse;
		const banners = (payload.items ?? [])
			.map((item) => ({
				name: item.name,
				imageUrl: normalizeSourceImageUrl(item.file?.url),
				linkUrl: normalizeSourceLinkUrl(item.link),
				copyrightText: item.copyright_text,
				copyrightColor: item.copyright_color,
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

		let items: Array<{
			id: string;
			name: string;
			imageUrl: string;
			productCount: number;
			workTitle: string;
			manufacturer: string;
			latestAddTime: number | null;
		}> = [];
		let availableDates: Array<{ date: string; display: string; count: number }> = [];
		let targetDate: string | null = null;
		let usedFallback = false;

		try {
			const response = await fetch(url, { next: { revalidate: 300 } });
			if (!response.ok) {
				throw new Error(`Failed to fetch source series list: ${response.status}`);
			}
			const payload = (await response.json()) as SourceSeriesResponse;
			availableDates = payload.availableDates ?? [];
			const requestedDate = input.dateIndex !== undefined ? availableDates[input.dateIndex]?.date ?? null : null;
			targetDate = requestedDate ?? payload.targetDate ?? null;

			const sourceItems = (payload.items ?? []).slice(0, input.limit);
			const syncedSeriesFallbackImageMap = await getSyncedSeriesFallbackImageMap(sourceItems.map((item) => item.name));
			items = sourceItems.map((item) => ({
				id: String(item.id),
				name: item.name,
				imageUrl: normalizeSourceImageUrl(item.file?.url || item.file?.thumb) || syncedSeriesFallbackImageMap.get(item.name) || "",
				productCount: item.product_count ?? 0,
				workTitle: item.work_title || "",
				manufacturer: item.manufacturer || "",
				latestAddTime: item.latest_add_time ?? null,
			}));
		} catch (error) {
			console.error("[getSeriesList] Fetch failed, falling back to local DB:", error);
			usedFallback = true;

			// Fallback: 取得近期的 Listing Dates 作為 availableDates
			const sevenDaysAgo = new Date();
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
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

			const dates = groups
				.map((g) => g.listingDate?.toISOString().split("T")[0])
				.filter((d): d is string => !!d);

			availableDates = dates.map((dateStr) => {
				const [, month, day] = dateStr.split("-");
				return {
					date: dateStr,
					display: `${parseInt(month ?? "0")}月${parseInt(day ?? "0")}日`,
					count: 0,
				};
			});

			const dateIndex = input.dateIndex ?? 0;
			targetDate = availableDates[dateIndex]?.date ?? null;

			if (targetDate) {
				items = await getSyncedSeriesListByDate({
					targetDate,
					limit: input.limit,
				});
			} else {
				items = [];
			}
		}

		return {
			items,
			availableDates,
			targetDate,
			usedFallback,
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
	.handler(async ({ input, context }) => {
		const showPrices = await canSeePricing(context.headers);
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
					originalPrice: true,
					sellingPrice: true,
				},
				orderBy: { createdAt: "desc" },
				take: 20,
			});

			return {
				products: products.map((p) => ({
					id: p.id,
					title: p.titleTranslated,
					janCode: p.janCode,
					originalPrice: p.originalPrice ? p.originalPrice.toNumber() : null,
					sellingPrice: p.sellingPrice ? publicPrice(p.sellingPrice.toNumber(), showPrices) : null,
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
	.handler(async ({ context }) => {
		const showPrices = await canSeePricing(context.headers);
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
				originalPrice: true,
				sellingPrice: true,
			},
			orderBy: { orderDeadline: "asc" },
			take: 20,
		});
		const seriesImageMap = await getSourceSeriesImageMap();

		return {
			products: products.map((p) => ({
				id: p.id,
				title: p.titleTranslated,
				originalPrice: p.originalPrice ? p.originalPrice.toNumber() : null,
				sellingPrice: p.sellingPrice ? publicPrice(p.sellingPrice.toNumber(), showPrices) : null,
				imageUrls: getDisplayImageUrls(p, seriesImageMap),
				orderDeadline: p.orderDeadline?.toISOString() ?? null,
				category: p.category,
				franchise: p.franchise,
				brand: p.brand,
			})),
		};
	});

type SourceDeadlineItem = {
	id: number | string;
	name: string;
	file?: { url?: string; thumb?: string };
	product_count?: number;
	work_title?: string;
	manufacturer?: string;
	earliest_deadline?: number;
	deadline_date?: string;
};

type SourceDeadlineResponse = {
	code: number;
	items?: SourceDeadlineItem[];
};

export const getDeadlineList = publicProcedure
	.route({
		method: "GET",
		path: "/anismile/homepage/deadline-list",
		tags: ["Anismile"],
		summary: "Get upcoming deadlines as series cards",
	})
	.handler(async () => {
		try {
			const response = await fetch(`${ANISMILE_ORIGIN}/deadline_list/index`, {
				method: "POST",
				headers: { "content-type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({ dayOffset: "0" }),
				next: { revalidate: 300 },
			});
			if (!response.ok) {
				throw new Error(`Failed to fetch source deadlines: ${response.status}`);
			}
			const payload = (await response.json()) as SourceDeadlineResponse;
			const sourceItems = (payload.items ?? []).slice(0, 24);
			const items = sourceItems.map((item) => ({
				id: String(item.id),
				name: item.name,
				imageUrl: normalizeSourceImageUrl(item.file?.url || item.file?.thumb),
				productCount: item.product_count ?? 0,
				workTitle: item.work_title || "",
				manufacturer: item.manufacturer || "",
				earliestDeadline: item.earliest_deadline ?? null,
				deadlineDate: item.deadline_date ? item.deadline_date.replace("年", "/").replace("月", "/").replace("日", "") : "",
			}));

			return {
				items,
				usedFallback: false,
			};
		} catch (error) {
			console.error("[getDeadlineList] Fetch failed, falling back to local DB:", error);
			try {
				const now = new Date();
				const sevenDaysLater = new Date();
				sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
				const products = await db.anismileProduct.findMany({
					where: {
						orderDeadline: { gte: now, lte: sevenDaysLater },
						inStock: true,
						series: { not: null },
					},
					select: {
						series: true,
						imageUrls: true,
						orderDeadline: true,
						franchise: true,
						brand: true,
					},
				});

				const grouped = new Map<string, typeof products>();
				for (const p of products) {
					const seriesName = p.series!;
					if (!grouped.has(seriesName)) grouped.set(seriesName, []);
					grouped.get(seriesName)!.push(p);
				}

				const fallbackItems = Array.from(grouped.entries()).map(([seriesName, plist]) => {
					const first = plist[0]!;
					const urls = toImageUrlArray(first.imageUrls);
					const minDeadline = plist.reduce((min, cur) => {
						if (!min) return cur.orderDeadline;
						if (!cur.orderDeadline) return min;
						return cur.orderDeadline < min ? cur.orderDeadline : min;
					}, plist[0]?.orderDeadline ?? null);

					const formattedDate = minDeadline
						? `${minDeadline.getMonth() + 1}/${minDeadline.getDate()}`
						: "";

					return {
						id: `fallback-${seriesName}`,
						name: seriesName,
						imageUrl: urls[0] ?? "",
						productCount: plist.length,
						workTitle: first.franchise || "",
						manufacturer: first.brand || "",
						earliestDeadline: minDeadline ? Math.floor(minDeadline.getTime() / 1000) : null,
						deadlineDate: formattedDate,
					};
				});

				return {
					items: fallbackItems,
					usedFallback: true,
				};
			} catch (fallbackError) {
				console.error("[getDeadlineList] Local DB fallback failed:", fallbackError);
				return {
					items: [],
					usedFallback: true,
				};
			}
		}
	});

type SourceInstockItem = {
	id: number | string;
	name: string;
	price?: string;
	file?: { url?: string; thumb?: string };
	manufacturer?: { name?: string };
	deadline_date?: string;
};

type SourceInstockResponse = {
	code: number;
	items?: SourceInstockItem[];
};

export const getInstockList = publicProcedure
	.route({
		method: "GET",
		path: "/anismile/homepage/instock-list",
		tags: ["Anismile"],
		summary: "Get in-stock products",
	})
	.handler(async ({ context }) => {
		const showPrices = await canSeePricing(context.headers);
		try {
			const response = await fetch(`${ANISMILE_ORIGIN}/instock/index`, {
				method: "POST",
				headers: { "content-type": "application/x-www-form-urlencoded" },
				next: { revalidate: 300 },
			});
			if (!response.ok) {
				throw new Error(`Failed to fetch source instock: ${response.status}`);
			}
			const payload = (await response.json()) as SourceInstockResponse;
			const sourceItems = (payload.items ?? []).slice(0, 10);
			const supplierIds = sourceItems.map((item) => String(item.id));

			const products = await db.anismileProduct.findMany({
				where: { supplierId: { in: supplierIds } },
				select: { id: true, supplierId: true, sellingPrice: true },
			});

			const localProductMap = new Map<string, { id: string; price: number }>();
			for (const p of products) {
				if (p.sellingPrice) {
					localProductMap.set(p.supplierId, {
						id: p.id,
						price: p.sellingPrice.toNumber(),
					});
				}
			}

			const items = sourceItems.map((item) => {
				const local = localProductMap.get(String(item.id));
				return {
					id: local?.id ?? `unregistered-${item.id}`,
					name: toTraditionalChinese(item.name),
					imageUrl: normalizeSourceImageUrl(item.file?.url || item.file?.thumb),
					price: showPrices && local ? local.price : null,
					manufacturer: item.manufacturer?.name || "",
				};
			});

			return {
				items,
			};
		} catch (error) {
			console.error("[getInstockList] error:", error);
			// 失敗時返回空，前端不渲染
			return {
				items: [],
			};
		}
	});
