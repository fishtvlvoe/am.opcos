import { expect, test } from "@playwright/test";

test("search page shows normalized banner query results and table mode", async ({ page }) => {
	await page.route(/\/api\/(rpc\/)?anismile\/products\/search.*/, async (route) => {
		await route.fulfill({
			contentType: "application/json",
			body: JSON.stringify({
				json: {
					items: [
						{
							id: "src_8675904458",
							titleTranslated: "TVアニメ「葬送のフリーレン」 アクリルキーホルダー",
							titleOriginal: "TVアニメ「葬送のフリーレン」 アクリルキーホルダー",
							imageUrls: ["https://img.anismile.jp/files/products/20260518/jan_6a0b0abc1672e.jpg"],
							series: "葬送のフリーレン・License Agent・5月31日截單",
							brand: "License Agent",
							janCode: "4570123456789",
							sellingPrice: 792,
							inStock: true,
							orderDeadline: "2026-05-31T00:00:00.000Z",
							releaseDate: "2026-06-30T00:00:00.000Z",
						},
					],
					total: 1,
					facets: { categories: [], franchises: [], brands: [] },
				},
			}),
		});
	});

	await page.goto("/search?q=%E8%91%AC%E9%80%81%E3%81%AE%E3%83%95%E3%83%AA%E3%83%BC%E3%83%AC%E3%83%B3%2F");
	await expect(page.getByRole("heading", { name: "搜尋結果" })).toBeVisible();
	await expect(page.getByText(/共 \d+ 件/)).toBeVisible();
	await expect(page.getByText("沒有符合條件的商品")).toHaveCount(0);
	await expect(page.getByText("顯示不可購買商品").first()).toBeVisible();
	await expect(page.getByText("現貨").first()).toBeVisible();
	await expect(page.getByText("即將截單").first()).toBeVisible();

	await page.getByLabel("view=table").click();
	await expect(page).toHaveURL(/view=table/);
	await expect(page.getByRole("columnheader", { name: "商品名稱" })).toBeVisible();
	await expect(page.getByRole("columnheader", { name: "JAN Code" })).toBeVisible();
	await expect(page.getByRole("columnheader", { name: "庫存狀態" })).toBeVisible();

	await expect(page.locator("header")).toContainText("AM");
	await expect(page.locator("header")).not.toContainText("AniSmile");
});
