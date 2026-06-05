import { logger } from "@repo/logs";

import { toTraditionalChinese } from "./opencc";

export type CrawledAnismileProduct = {
	supplierId: string;
	sourceUrl: string | null;
	titleOriginal: string;
	titleTranslated: string;
	descriptionOriginal: string | null;
	descriptionTranslated: string | null;
	imageUrls: string[];
	category: string | null;
	series: string | null;
	originalPrice: number | null;
	costPrice: number;
	listingDate?: Date | null;
	orderDeadline: Date | null;
	inStock: boolean | null;
	stockQuantity: number | null;
	discountRate: number | null;
	brand: string | null;
	franchise: string | null;
	janCode: string | null;
	releaseDate: Date | null;
	sourceAuthState: "authenticated" | "public";
};

export type AnismileCrawlResult = {
	products: CrawledAnismileProduct[];
	totalDiscovered: number;
	batchOffset: number;
	batchLimit: number;
	productsSkipped: number;
	productsFailed: number;
	failureReasons: string[];
};

export type AnismileCrawlOptions = {
	offset?: number;
	limit?: number;
	delayMs?: number;
	source?: "sitemap" | "homepage";
	concurrency?: number;
};

const LOGIN_URL = "https://www.anismile.jp/login/index";
const PRODUCT_API_URL = "https://www.anismile.jp/product/index";
const SITEMAP_URL = "https://www.anismile.jp/sitemap.xml";
const SERIES_LIST_URL = "https://www.anismile.jp/series_list/index";
const PRODUCT_PAGE_BASE_URL = "https://www.anismile.jp/item";
const SERIES_PAGE_BASE_URL = "https://www.anismile.jp/series";
let sitemapProductEntriesCache: ProductEntry[] | null = null;

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function parsePositiveInteger(value: number | undefined, fallback: number) {
	return Number.isFinite(value) && value && value > 0 ? Math.floor(value) : fallback;
}

function parseDeadlineDate(text: string | null | undefined): Date | null {
	if (!text) return null;

	const matched = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
	if (!matched) return null;

	const year = Number.parseInt(matched[1], 10);
	const month = Number.parseInt(matched[2], 10);
	const day = Number.parseInt(matched[3], 10);

	return new Date(Date.UTC(year, month - 1, day));
}

function parseReleaseDate(text: string | null | undefined): Date | null {
	if (!text) return null;
	const matched = text.match(/(\d{4})年(\d{1,2})月/);
	if (!matched) return null;
	const year = Number.parseInt(matched[1], 10);
	const month = Number.parseInt(matched[2], 10);
	return new Date(Date.UTC(year, month - 1, 1));
}

function parseProductId(url: string): string {
	const matched = url.match(/\/item\/(\d+)\//);
	return matched?.[1] ?? "";
}

function parseSitemap(xml: string): string[] {
	return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => String(match[1]));
}

function normalizeProductIds(productIds: string[]): string[] {
	return Array.from(new Set(productIds)).sort((a, b) => Number(b) - Number(a));
}

type ProductEntry = {
	id: string;
	listingDate: Date | null;
};

type SourceSeriesListResponse = {
	code: number;
	items?: Array<{
		id: number | string;
		name: string;
		latest_add_time?: number;
	}>;
};

async function fetchText(url: string, init?: RequestInit): Promise<string> {
	const response = await fetch(url, init);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.status}`);
	}
	return await response.text();
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
	const response = await fetch(url, init);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.status}`);
	}
	return (await response.json()) as T;
}

async function getAuthenticatedCookie(): Promise<string> {
	const email = process.env.ANISMILE_EMAIL;
	const password = process.env.ANISMILE_PASSWORD;
	if (!email || !password) {
		throw new Error("ANISMILE_EMAIL or ANISMILE_PASSWORD is not set");
	}

	const body = new URLSearchParams({
		email,
		password,
		device: "crawler-opcOS",
		remember: "0",
		lang: "cn",
	});

	const response = await fetch(LOGIN_URL, {
		method: "POST",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		body,
		redirect: "manual",
	});

	const setCookie = response.headers.getSetCookie?.() ?? [];
	if (setCookie.length === 0) {
		const text = await response.text();
		throw new Error(`Failed to get session cookie from anismile login: ${text}`);
	}

	const loginResult = await response.json().catch(() => null) as { code?: number } | null;
	if (loginResult && loginResult.code !== 1) {
		throw new Error(`Anismile login failed: code=${loginResult.code}`);
	}

	return setCookie.map((item) => item.split(";")[0]).join("; ");
}

type CrawlAuthMode = "authenticated" | "public";

type CrawlProductOptions = {
	authMode?: CrawlAuthMode;
};

async function fetchSourceProductBySupplierId(
	supplierId: string,
	{ authMode = "authenticated" }: CrawlProductOptions = {},
): Promise<AnismileProductResponse> {
	const headers: Record<string, string> = {
		"content-type": "application/x-www-form-urlencoded",
	};
	if (authMode === "authenticated") {
		headers.cookie = await getAuthenticatedCookie();
	}
	return await fetchJson<AnismileProductResponse>(PRODUCT_API_URL, {
		method: "POST",
		headers,
		body: new URLSearchParams({ item: supplierId, lang: "cn" }),
	});
}

async function getProductIds(): Promise<string[]> {
	const rootSitemap = await fetchText(SITEMAP_URL);
	const isSitemapIndex = rootSitemap.includes("<sitemapindex");
	const rootLinks = parseSitemap(rootSitemap);

	let itemUrls: string[];
	if (isSitemapIndex) {
		const sitemapLinks = rootLinks.filter((item) => !item.includes("/item/"));
		const pages = await Promise.all(sitemapLinks.map((url) => fetchText(url)));
		itemUrls = pages.flatMap((xml) => parseSitemap(xml)).filter((item) => item.includes("/item/"));
	} else {
		itemUrls = rootLinks.filter((item) => item.includes("/item/"));
	}

	return normalizeProductIds(itemUrls.map(parseProductId).filter(Boolean));
}

async function getSitemapProductEntries(): Promise<ProductEntry[]> {
	if (sitemapProductEntriesCache) return sitemapProductEntriesCache;
	sitemapProductEntriesCache = (await getProductIds()).map((id) => ({ id, listingDate: null }));
	return sitemapProductEntriesCache;
}

function parseSourceTimestamp(timestamp: number | null | undefined): Date | null {
	if (!timestamp) return null;
	return new Date(timestamp * 1000);
}

function parseSourceAddTime(text: string | null | undefined): Date | null {
	if (!text) return null;
	const matched = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (!matched) return null;
	const year = Number.parseInt(matched[1], 10);
	const month = Number.parseInt(matched[2], 10);
	const day = Number.parseInt(matched[3], 10);
	return new Date(Date.UTC(year, month - 1, day));
}

function parseProductEntriesFromSeriesPage(html: string, listingDate: Date | null): ProductEntry[] {
	const ids = normalizeProductIds([...html.matchAll(/\/item\/(\d+)\//g)].map((match) => String(match[1])));
	return ids.map((id) => ({ id, listingDate }));
}

async function getHomepageProductEntries(): Promise<ProductEntry[]> {
	const payloads = await Promise.all(
		Array.from({ length: 7 }, (_, dateIndex) => fetchJson<SourceSeriesListResponse>(`${SERIES_LIST_URL}?lang=en&dateIndex=${dateIndex}`)),
	);
	const topSeries = payloads
		.filter((payload) => payload.code === 1 && payload.items?.length)
		.flatMap((payload) => payload.items ?? [])
		.slice(0, 60);
	if (!topSeries.length) return [];

	const pages = await Promise.all(
		topSeries.map(async (series) => {
			const listingDate = parseSourceTimestamp(series.latest_add_time);
			const url = `${SERIES_PAGE_BASE_URL}/${series.id}/${encodeURIComponent(series.name)}/`;
			const html = await fetchText(url);
			return parseProductEntriesFromSeriesPage(html, listingDate);
		}),
	);
	const seen = new Set<string>();
	return pages
		.flat()
		.filter((entry) => {
			if (seen.has(entry.id)) return false;
			seen.add(entry.id);
			return true;
	});
}

export function normalizeSeriesLookup(value: string) {
	return value
		.replaceAll("截單", "截单")
		.replaceAll("！", "!")
		.replaceAll("（", "(")
		.replaceAll("）", ")")
		.replaceAll("　", " ")
		.replaceAll("薫", "薰")
		.replaceAll("凜", "凛")
		.replaceAll("？", "?")
		.toLowerCase()
		.trim();
}

export async function crawlAnismileProductsBySeriesName(
	seriesName: string,
	limit = 200,
	{ authMode = "authenticated" }: CrawlProductOptions = {},
): Promise<CrawledAnismileProduct[]> {
	const sourceSeriesName = normalizeSeriesLookup(seriesName);
	const cookie = authMode === "authenticated" ? await getAuthenticatedCookie() : null;
	const payloads = await Promise.all(
		Array.from({ length: 7 }, (_, dateIndex) => fetchJson<SourceSeriesListResponse>(`${SERIES_LIST_URL}?lang=en&dateIndex=${dateIndex}`)),
	);
	const series = payloads
		.flatMap((payload) => (payload.code === 1 ? (payload.items ?? []) : []))
		.find((item) => normalizeSeriesLookup(item.name) === sourceSeriesName);

	if (!series) return [];

	const listingDate = parseSourceTimestamp(series.latest_add_time);
	const url = `${SERIES_PAGE_BASE_URL}/${series.id}/${encodeURIComponent(series.name)}/`;
	const html = await fetchText(url);
	const productEntries = parseProductEntriesFromSeriesPage(html, listingDate).slice(0, limit);
	const products: CrawledAnismileProduct[] = [];

	for (const { id, listingDate } of productEntries) {
		const res = await fetchJson<AnismileProductResponse>(PRODUCT_API_URL, {
			method: "POST",
			headers: {
				"content-type": "application/x-www-form-urlencoded",
				...(cookie ? { cookie } : {}),
			},
			body: new URLSearchParams({ item: id, lang: "cn" }),
		});
		const parsed = parseProductApi(res, id, authMode);
		if (parsed) {
			parsed.listingDate ??= listingDate;
			parsed.series = series.name;
			products.push(parsed);
		}
	}

	return products;
}

export async function crawlAnismileProductBySupplierId(
	supplierId: string,
	{ authMode = "authenticated" }: CrawlProductOptions = {},
): Promise<CrawledAnismileProduct | null> {
	const res = await fetchSourceProductBySupplierId(supplierId, { authMode });
	return parseProductApi(res, supplierId, authMode);
}

type AnismileProductResponse = {
	code: number;
	item: {
		hash: string;
		name: string;
		price: string;
		percent: { status: number; percent: string; debug?: string } | null;
		price_percent?: string | number | null;
		status?: number;
		is_stocked?: number;
		stocked_number?: number;
		deadline_date: string;
		add_time?: string;
		description: string;
		main_image_url: string;
		zoom?: { url?: string; thumb?: string };
		albums: { url: string }[];
		work_title: string[];
		manufacturer: { name: string };
		bundles: { name: string } | null;
		jancode?: string;
		release_date?: string;
	};
};

function parseProductApi(
	res: AnismileProductResponse,
	productId?: string,
	sourceAuthState: CrawlAuthMode = "public",
): CrawledAnismileProduct | null {
	if (res.code !== 1 || !res.item) return null;

	const item = res.item;
	const supplierId = item.hash;
	const titleOriginal = item.name;
	if (!titleOriginal) return null;

	const originalPrice = Number.parseFloat(item.price);
	if (!Number.isFinite(originalPrice) || originalPrice <= 0) return null;

	const percentValue = item.percent?.status === 1 ? Number.parseFloat(item.percent.percent) : null;
	const costPrice = percentValue ? Math.round(originalPrice * percentValue) / 100 : originalPrice;
	if (costPrice <= 0) return null;

	const imageUrls = item.albums?.map((a) => a.url) ?? [];
	if (item.main_image_url && !imageUrls.includes(item.main_image_url)) {
		imageUrls.unshift(item.main_image_url);
	}
	if (item.zoom?.url && !imageUrls.includes(item.zoom.url)) {
		imageUrls.push(item.zoom.url);
	}

	const series = item.bundles?.name ?? null;
	// work_title[0] は作品/IP 名称（franchise）であって商品カテゴリではない
	const franchise = item.work_title?.[0] ?? null;
	const discountRate = item.percent?.status === 1 ? Number.parseFloat(item.percent.percent) : null;
	const brand = item.manufacturer?.name || null;
	const janCode = item.jancode ?? null;
	const releaseDate = parseReleaseDate(item.release_date);

	return {
		supplierId,
		sourceUrl: productId ? `${PRODUCT_PAGE_BASE_URL}/${productId}/` : null,
		titleOriginal,
		titleTranslated: toTraditionalChinese(titleOriginal),
		descriptionOriginal: item.description || null,
		descriptionTranslated: item.description ? toTraditionalChinese(item.description) : null,
		imageUrls,
		category: null,
		series: series ? toTraditionalChinese(series) : null,
		originalPrice,
		costPrice,
		listingDate: parseSourceAddTime(item.add_time),
		orderDeadline: parseDeadlineDate(item.deadline_date),
		inStock: item.status == null ? null : item.status === 1,
		stockQuantity:
			typeof item.stocked_number === "number" && item.is_stocked === 1
				? item.stocked_number
				: null,
		discountRate,
		brand: brand ? toTraditionalChinese(brand) : null,
		franchise: franchise ? toTraditionalChinese(franchise) : null,
		janCode,
		releaseDate,
		sourceAuthState,
	};
}

export { parseProductApi as parseProductApiForTest };
export { parseProductEntriesFromSeriesPage as parseProductEntriesFromSeriesPageForTest };

export async function crawlAnismileProductsWithStats({
	offset = 0,
	limit,
	delayMs = 500,
	source = "sitemap",
	concurrency = 1,
}: AnismileCrawlOptions = {}): Promise<AnismileCrawlResult> {
	const cookie = await getAuthenticatedCookie();
	const allProductEntries =
		source === "homepage"
			? await getHomepageProductEntries()
			: await getSitemapProductEntries();
	const safeOffset = Math.max(0, offset);
	const safeLimit = limit && limit > 0 ? limit : allProductEntries.length;
	const productEntries = allProductEntries.slice(safeOffset, safeOffset + safeLimit);
	const products: CrawledAnismileProduct[] = [];
	let productsSkipped = 0;
	let productsFailed = 0;
	const failureReasons: string[] = [];
	const safeConcurrency = Math.min(parsePositiveInteger(concurrency, 1), 16);

	logger.info(
		`[anismile] starting crawl: ${productEntries.length}/${allProductEntries.length} products (offset=${safeOffset}, limit=${safeLimit}, concurrency=${safeConcurrency})`,
	);

	async function crawlEntry({ id, listingDate }: ProductEntry, index: number) {
		try {
			const res = await fetchJson<AnismileProductResponse>(PRODUCT_API_URL, {
				method: "POST",
				headers: {
					"content-type": "application/x-www-form-urlencoded",
					cookie,
				},
				body: new URLSearchParams({ item: id, lang: "cn" }),
			});

			const parsed = parseProductApi(res, id);
			if (parsed) {
				parsed.listingDate ??= listingDate;
				products.push(parsed);
			} else {
				productsSkipped += 1;
				failureReasons.push(`product ${id}: empty or invalid product payload`);
			}
		} catch (error) {
			productsFailed += 1;
			const message = error instanceof Error ? error.message : "unknown error";
			failureReasons.push(`product ${id}: ${message}`);
			logger.error(`[anismile] crawl failed for product ${id}`, error);
		}

		if (delayMs > 0 && index < productEntries.length - 1) {
			const delay = delayMs + Math.floor(Math.random() * delayMs);
			await sleep(delay);
		}
	}

	let nextIndex = 0;
	await Promise.all(
		Array.from({ length: Math.min(safeConcurrency, productEntries.length) }, async () => {
			while (nextIndex < productEntries.length) {
				const index = nextIndex;
				nextIndex += 1;
				await crawlEntry(productEntries[index], index);
			}
		}),
	);

	logger.info(`[anismile] crawl complete: ${products.length}/${productEntries.length} products`);
	return {
		products,
		totalDiscovered: allProductEntries.length,
		batchOffset: safeOffset,
		batchLimit: safeLimit,
		productsSkipped,
		productsFailed,
		failureReasons,
	};
}

export async function crawlAnismileProducts(options: AnismileCrawlOptions = {}): Promise<CrawledAnismileProduct[]> {
	const result = await crawlAnismileProductsWithStats(options);
	return result.products;
}
