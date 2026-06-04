import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workspaceRoot = resolve(__dirname, "../../../../..");
const rootFile = (path: string) => resolve(workspaceRoot, path);

describe("homepage getSourceSeriesImageMap contract", () => {
	it("uses concurrency length of 7 for getSourceSeriesImageMap", () => {
		const homepageSource = readFileSync(
			rootFile("packages/api/modules/anismile/procedures/homepage.ts"),
			"utf8",
		);
		expect(homepageSource).toContain("Array.from({ length: 7 }");
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
