import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workspaceRoot = resolve(__dirname, "../../../../..");
const rootFile = (path: string) => resolve(workspaceRoot, path);

describe("homepage getSourceSeriesImageMap contract", () => {
	it("uses concurrency length of 7 for getSourceSeriesImageMap", () => {
		const imageUtilsSource = readFileSync(
			rootFile("packages/database/image-utils.ts"),
			"utf8",
		);
		expect(imageUtilsSource).toContain("Array.from({ length: 7 }");
	});
});

describe("homepage getSeriesList TDD contract", () => {
	it("removes shouldUseSyncedDateFallback logic entirely", () => {
		const homepageSource = readFileSync(
			rootFile("packages/api/modules/anismile/procedures/homepage.ts"),
			"utf8",
		);
		// 預期不包含 shouldUseSyncedDateFallback。目前還包含，所以會失敗 (TDD Red)
		expect(homepageSource).not.toContain("shouldUseSyncedDateFallback");
	});

	it("returns usedFallback and falls back to getSyncedSeriesListByDate only when API fails", () => {
		const homepageSource = readFileSync(
			rootFile("packages/api/modules/anismile/procedures/homepage.ts"),
			"utf8",
		);
		// 預期包含 usedFallback 和 try ... catch 區塊
		expect(homepageSource).toContain("usedFallback");
		expect(homepageSource).toContain("catch");
	});
});

describe("homepage getProductsByDate image fallback TDD contract", () => {
	it("queries seriesImageMap and calls getDisplayImageUrls for imageUrls", () => {
		const homepageSource = readFileSync(
			rootFile("packages/api/modules/anismile/procedures/homepage.ts"),
			"utf8",
		);
		// 3.1：getProductsByDate 必須包含 seriesImageMap 查詢與 getDisplayImageUrls 呼叫
		expect(homepageSource).toContain("getSourceSeriesImageMap");
		expect(homepageSource).toContain("getDisplayImageUrls(p, seriesImageMap)");
	});

	it("selects series field in getProductsByDate DB query", () => {
		const homepageSource = readFileSync(
			rootFile("packages/api/modules/anismile/procedures/homepage.ts"),
			"utf8",
		);
		// getProductsByDate select 必須包含 series 欄位（否則 getDisplayImageUrls 無法比對 series）
		// 透過確認 imageUrls: getDisplayImageUrls 後方有 series: true 的模式
		const productsByDateBlock = homepageSource.slice(
			homepageSource.indexOf("path: \"/anismile/homepage/products-by-date\""),
			homepageSource.indexOf("path: \"/anismile/homepage/deadline-products\""),
		);
		expect(productsByDateBlock).toContain("series: true");
	});
});

describe("homepage getDeadlineList placeholder filter TDD contract", () => {
	it("filters placeholder URLs in fallback path using isPlaceholderImageUrl", () => {
		const homepageSource = readFileSync(
			rootFile("packages/api/modules/anismile/procedures/homepage.ts"),
			"utf8",
		);
		// 3.2：fallback path 必須用 find + isPlaceholderImageUrl，不能直接取 urls[0]
		expect(homepageSource).toContain("urls.find(url => !isPlaceholderImageUrl(url)) ?? \"\"");
	});

	it("does NOT use bare urls[0] as imageUrl in getDeadlineList fallback", () => {
		const homepageSource = readFileSync(
			rootFile("packages/api/modules/anismile/procedures/homepage.ts"),
			"utf8",
		);
		// 確認舊的 urls[0] 直接取值已移除
		const deadlineListBlock = homepageSource.slice(
			homepageSource.indexOf("export const getDeadlineList"),
		);
		expect(deadlineListBlock).not.toContain("imageUrl: urls[0]");
	});
});

describe("homepage new procedures TDD contract", () => {
	it("defines and exports getDeadlineList procedure calling /deadline_list/index", () => {
		const homepageSource = readFileSync(
			rootFile("packages/api/modules/anismile/procedures/homepage.ts"),
			"utf8",
		);
		// 預期匯出 getDeadlineList。目前還沒有，所以會失敗 (TDD Red)
		expect(homepageSource).toContain("export const getDeadlineList");
		expect(homepageSource).toContain("/anismile/homepage/deadline-list");
	});

	it("defines and exports getInstockList procedure calling /instock/index", () => {
		const homepageSource = readFileSync(
			rootFile("packages/api/modules/anismile/procedures/homepage.ts"),
			"utf8",
		);
		// 預期匯出 getInstockList。目前還沒有，所以會失敗 (TDD Red)
		expect(homepageSource).toContain("export const getInstockList");
		expect(homepageSource).toContain("/anismile/homepage/instock-list");
	});
});
