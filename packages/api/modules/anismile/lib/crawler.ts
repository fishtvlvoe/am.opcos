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
	orderDeadline: Date | null;
	stockQuantity: number | null;
	discountRate: number | null;
	brand: string | null;
	franchise: string | null;
	janCode: string | null;
	releaseDate: Date | null;
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
};

const LOGIN_URL = "https://www.anismile.jp/login/index";
const PRODUCT_API_URL = "https://www.anismile.jp/product/index";
const SITEMAP_URL = "https://www.anismile.jp/sitemap.xml";
const PRODUCT_PAGE_BASE_URL = "https://www.anismile.jp/item";

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
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

type AnismileProductResponse = {
	code: number;
	item: {
		hash: string;
		name: string;
		price: string;
		percent: { status: number; percent: string } | null;
		deadline_date: string;
		description: string;
		main_image_url: string;
		albums: { url: string }[];
		work_title: string[];
		manufacturer: { name: string };
		bundles: { name: string } | null;
		jancode?: string;
		release_date?: string;
	};
};

function parseProductApi(res: AnismileProductResponse, productId?: string): CrawledAnismileProduct | null {
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
		series,
		originalPrice,
		costPrice,
		orderDeadline: parseDeadlineDate(item.deadline_date),
		stockQuantity: null,
		discountRate,
		brand,
		franchise,
		janCode,
		releaseDate,
	};
}

export { parseProductApi as parseProductApiForTest };

export async function crawlAnismileProductsWithStats({
	offset = 0,
	limit,
	delayMs = 500,
}: AnismileCrawlOptions = {}): Promise<AnismileCrawlResult> {
	const cookie = await getAuthenticatedCookie();
	const allProductIds = await getProductIds();
	const safeOffset = Math.max(0, offset);
	const safeLimit = limit && limit > 0 ? limit : allProductIds.length;
	const productIds = allProductIds.slice(safeOffset, safeOffset + safeLimit);
	const products: CrawledAnismileProduct[] = [];
	let productsSkipped = 0;
	let productsFailed = 0;
	const failureReasons: string[] = [];

	logger.info(
		`[anismile] starting crawl: ${productIds.length}/${allProductIds.length} products (offset=${safeOffset}, limit=${safeLimit})`,
	);

	for (const id of productIds) {
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

		if (delayMs > 0) {
			const delay = delayMs + Math.floor(Math.random() * delayMs);
			await sleep(delay);
		}
	}

	logger.info(`[anismile] crawl complete: ${products.length}/${productIds.length} products`);
	return {
		products,
		totalDiscovered: allProductIds.length,
		batchOffset: safeOffset,
		batchLimit: safeLimit,
		productsSkipped,
		productsFailed,
		failureReasons,
	};
}

export async function crawlAnismileProducts(): Promise<CrawledAnismileProduct[]> {
	const result = await crawlAnismileProductsWithStats();
	return result.products;
}
