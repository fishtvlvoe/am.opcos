import { db } from "@repo/database";

import { classifySeriesVisibility, detectSourceDateIndexStuck, formatIssueLabel, type CatalogIssueCode } from "./am-catalog-visibility-lib";

type SourceSeriesItem = {
	name: string;
	file?: { url?: string; thumb?: string };
	product_count?: number;
};

type SourceSeriesResponse = {
	items?: SourceSeriesItem[];
	availableDates?: Array<{ date: string; display: string; count: number }>;
	targetDate?: string | null;
};

type LiveSeriesItem = {
	name: string;
	imageUrl: string;
	productCount: number;
};

type LiveSeriesResponse = {
	items?: LiveSeriesItem[];
	availableDates?: Array<{ date: string; display: string; count: number }>;
	targetDate?: string | null;
};

type LiveProductsResponse = {
	total: number;
	items: Array<{ id: string; titleOriginal: string; series: string | null }>;
};

type SeriesDiagnosis = {
	dateIndex: number;
	requestedDate: string | null;
	seriesName: string;
	homepageProductCount: number;
	liveDefaultTotal: number;
	liveShowUnavailableTotal: number;
	exactDbTotal: number | null;
	exactDbInStock: number | null;
	fallbackDbTotal: number | null;
	fallbackDbInStock: number | null;
	homepageImageUrl: string;
	hasUsableDbImage: boolean | null;
	issues: CatalogIssueCode[];
	requestError: string | null;
};

function parseArgs() {
	const args = process.argv.slice(2);
	let limit = 12;
	let dateIndices = [0, 1, 2];
	let json = false;
	let baseUrl = process.env.AM_BASE_URL || "https://am.opcos.me";
	let sourceOrigin = process.env.ANISMILE_SOURCE_ORIGIN || "https://www.anismile.jp";

	for (let i = 0; i < args.length; i += 1) {
		const arg = args[i];
		if (arg === "--limit" && args[i + 1]) {
			limit = Number(args[i + 1]);
			i += 1;
			continue;
		}
		if (arg === "--date-indices" && args[i + 1]) {
			dateIndices = args[i + 1].split(",").map((value) => Number(value.trim())).filter(Number.isFinite);
			i += 1;
			continue;
		}
		if (arg === "--base-url" && args[i + 1]) {
			baseUrl = args[i + 1];
			i += 1;
			continue;
		}
		if (arg === "--source-origin" && args[i + 1]) {
			sourceOrigin = args[i + 1];
			i += 1;
			continue;
		}
		if (arg === "--json") {
			json = true;
		}
	}

	return { limit, dateIndices, json, baseUrl, sourceOrigin };
}

async function fetchJson<T>(url: string): Promise<T> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Request failed: ${response.status} ${response.statusText} ${url}`);
	}
	return (await response.json()) as T;
}

function buildSeriesListUrl(origin: string, dateIndex: number, limit: number) {
	const url = new URL("/api/anismile/homepage/series-list", origin);
	url.searchParams.set("dateIndex", String(dateIndex));
	url.searchParams.set("limit", String(limit));
	return url.toString();
}

function buildSourceSeriesListUrl(origin: string, dateIndex: number) {
	const url = new URL("/series_list/index", origin);
	url.searchParams.set("lang", "en");
	url.searchParams.set("dateIndex", String(dateIndex));
	return url.toString();
}

function buildProductsUrl(origin: string, seriesName: string, showUnavailable: boolean) {
	const url = new URL("/api/anismile/products", origin);
	url.searchParams.set("series", seriesName);
	url.searchParams.set("page", "1");
	url.searchParams.set("pageSize", "1");
	url.searchParams.set("sort", "sales_fallback");
	if (showUnavailable) {
		url.searchParams.set("showUnavailable", "true");
	}
	return url.toString();
}

function getSeriesRoot(seriesName: string) {
	return seriesName.split("・")[0] ?? seriesName;
}

async function getExactSeriesDbStats(seriesName: string) {
	if (!process.env.DATABASE_URL) {
		return {
			exactDbTotal: null,
			exactDbInStock: null,
			fallbackDbTotal: null,
			fallbackDbInStock: null,
			hasUsableDbImage: null,
		};
	}

	const seriesRoot = getSeriesRoot(seriesName);
	const seriesTerms = Array.from(
		new Set([seriesName, seriesName.replace(/截單/g, "截单"), seriesName.replace(/截单/g, "截單"), seriesRoot].filter(Boolean)),
	);

	const [exactDbTotal, exactDbInStock, exactDbImageRow, fallbackDbTotal, fallbackDbInStock] = await Promise.all([
		db.anismileProduct.count({ where: { series: seriesName } }),
		db.anismileProduct.count({ where: { series: seriesName, inStock: true } }),
		db.anismileProduct.findFirst({
			where: { series: seriesName },
			select: { imageUrls: true },
		}),
		db.anismileProduct.count({
			where: {
				OR: seriesTerms.map((term) => ({ series: { startsWith: term } })),
			},
		}),
		db.anismileProduct.count({
			where: {
				inStock: true,
				OR: seriesTerms.map((term) => ({ series: { startsWith: term } })),
			},
		}),
	]);

	const hasUsableDbImage = Array.isArray(exactDbImageRow?.imageUrls)
		? exactDbImageRow.imageUrls.some((url) => typeof url === "string" && url !== "" && !url.includes("length_shadow_white"))
		: false;

	return { exactDbTotal, exactDbInStock, fallbackDbTotal, fallbackDbInStock, hasUsableDbImage };
}

async function diagnoseSeries(dateIndex: number, requestedDate: string | null, item: LiveSeriesItem, baseUrl: string): Promise<SeriesDiagnosis> {
	try {
		const dbStats = await getExactSeriesDbStats(item.name);
		const showUnavailableProducts = await fetchJson<LiveProductsResponse>(buildProductsUrl(baseUrl, item.name, true));
		const liveDefaultTotal = dbStats.exactDbInStock ?? 0;

		const issues = classifySeriesVisibility({
			cardProductCount: item.productCount,
			liveDefaultTotal,
			liveShowUnavailableTotal: showUnavailableProducts.total,
			exactDbTotal: dbStats.exactDbTotal,
			exactDbInStock: dbStats.exactDbInStock,
			fallbackDbTotal: dbStats.fallbackDbTotal,
			fallbackDbInStock: dbStats.fallbackDbInStock,
			homepageImageUrl: item.imageUrl,
			hasUsableDbImage: dbStats.hasUsableDbImage,
		});

		return {
			dateIndex,
			requestedDate,
			seriesName: item.name,
			homepageProductCount: item.productCount,
			liveDefaultTotal,
			liveShowUnavailableTotal: showUnavailableProducts.total,
			exactDbTotal: dbStats.exactDbTotal,
			exactDbInStock: dbStats.exactDbInStock,
			fallbackDbTotal: dbStats.fallbackDbTotal,
			fallbackDbInStock: dbStats.fallbackDbInStock,
			homepageImageUrl: item.imageUrl,
			hasUsableDbImage: dbStats.hasUsableDbImage,
			issues,
			requestError: null,
		};
	} catch (error) {
		const requestError = error instanceof Error ? error.message : String(error);
		const dbStats = await getExactSeriesDbStats(item.name);
		return {
			dateIndex,
			requestedDate,
			seriesName: item.name,
			homepageProductCount: item.productCount,
			liveDefaultTotal: 0,
			liveShowUnavailableTotal: 0,
			exactDbTotal: dbStats.exactDbTotal,
			exactDbInStock: dbStats.exactDbInStock,
			fallbackDbTotal: dbStats.fallbackDbTotal,
			fallbackDbInStock: dbStats.fallbackDbInStock,
			homepageImageUrl: item.imageUrl,
			hasUsableDbImage: dbStats.hasUsableDbImage,
			issues: ["series-products-api-failed"],
			requestError,
		};
	}
}

async function main() {
	try {
		const { limit, dateIndices, json, baseUrl, sourceOrigin } = parseArgs();
		const results: Array<{
			dateIndex: number;
			requestedDate: string | null;
			sourceTargetDate: string | null;
			liveTargetDate: string | null;
			sourceDateIndexStuck: boolean;
			anomalies: SeriesDiagnosis[];
		}> = [];

		for (const dateIndex of dateIndices) {
			const [sourcePayload, livePayload] = await Promise.all([
				fetchJson<SourceSeriesResponse>(buildSourceSeriesListUrl(sourceOrigin, dateIndex)),
				fetchJson<LiveSeriesResponse>(buildSeriesListUrl(baseUrl, dateIndex, limit)),
			]);

			const requestedDate =
				sourcePayload.availableDates?.[dateIndex]?.date ??
				livePayload.availableDates?.[dateIndex]?.date ??
				null;
			const sourceTargetDate = sourcePayload.targetDate ?? null;
			const liveTargetDate = livePayload.targetDate ?? null;
			const sourceDateIndexStuck = detectSourceDateIndexStuck(requestedDate, sourceTargetDate);

			const items = livePayload.items ?? [];
			const diagnoses = await Promise.all(
				items.map((item) => diagnoseSeries(dateIndex, requestedDate, item, baseUrl)),
			);

			const anomalies = diagnoses.filter((entry) => entry.issues.length > 0);
			results.push({
				dateIndex,
				requestedDate,
				sourceTargetDate,
				liveTargetDate,
				sourceDateIndexStuck,
				anomalies,
			});
		}

		if (json) {
			console.log(JSON.stringify(results, null, 2));
			return;
		}

		for (const result of results) {
			console.log(`\n[dateIndex=${result.dateIndex}] requested=${result.requestedDate ?? "n/a"} source=${result.sourceTargetDate ?? "n/a"} live=${result.liveTargetDate ?? "n/a"}`);
			if (result.sourceDateIndexStuck) {
				console.log(`- ${formatIssueLabel("source-dateindex-stuck")}`);
			}
			if (result.anomalies.length === 0) {
				console.log("- 沒抓到異常");
				continue;
			}
			for (const anomaly of result.anomalies) {
				console.log(`- ${anomaly.seriesName}`);
				console.log(`  issues: ${anomaly.issues.map((issue) => formatIssueLabel(issue)).join(" / ")}`);
				console.log(`  counts: card=${anomaly.homepageProductCount} default=${anomaly.liveDefaultTotal} showUnavailable=${anomaly.liveShowUnavailableTotal} dbExact=${anomaly.exactDbTotal ?? "n/a"} dbInStock=${anomaly.exactDbInStock ?? "n/a"} dbFallback=${anomaly.fallbackDbTotal ?? "n/a"} fallbackInStock=${anomaly.fallbackDbInStock ?? "n/a"}`);
				if (anomaly.requestError) {
					console.log(`  error: ${anomaly.requestError}`);
				}
			}
		}
	} finally {
		if (process.env.DATABASE_URL) {
			await db.$disconnect();
		}
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
