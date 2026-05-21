import { db } from "@repo/database";
import { z } from "zod";

import { publicProcedure } from "../../../orpc/procedures";

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

		if (!setting?.value) {
			return { banners: [] as BannerItem[] };
		}

		try {
			const banners = JSON.parse(setting.value) as BannerItem[];
			return { banners: Array.isArray(banners) ? banners : [] };
		} catch {
			return { banners: [] as BannerItem[] };
		}
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
				franchise: true,
				brand: true,
			},
			orderBy: { orderDeadline: "asc" },
			take: 20,
		});

		return {
			products: products.map((p) => ({
				id: p.id,
				title: p.titleTranslated,
				sellingPrice: null,
				imageUrls: p.imageUrls,
				orderDeadline: p.orderDeadline?.toISOString() ?? null,
				category: p.category,
				franchise: p.franchise,
				brand: p.brand,
			})),
		};
	});
