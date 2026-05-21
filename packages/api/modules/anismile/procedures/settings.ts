import { db, getDefaultMarkup, setDefaultMarkup } from "@repo/database";
import { z } from "zod";

import { anismileAdminProcedure, anismileSuperAdminProcedure, publicProcedure } from "../../../orpc/procedures";

export const getDefaultMarkupSetting = publicProcedure
	.route({
		method: "GET",
		path: "/anismile/settings/default_markup",
		tags: ["Anismile"],
		summary: "Get default markup",
	})
	.handler(async () => {
		const markup = await getDefaultMarkup();
		return {
			key: "default_markup",
			value: markup,
		};
	});

export const patchDefaultMarkup = anismileSuperAdminProcedure
	.route({
		method: "PATCH",
		path: "/anismile/settings/default_markup",
		tags: ["Anismile"],
		summary: "Patch default markup",
	})
	.input(
		z.object({
			markup: z.number().positive().max(10),
		}),
	)
	.handler(async ({ input }) => {
		const result = await setDefaultMarkup({
			markup: input.markup,
		});

		return {
			key: "default_markup",
			value: result.markup,
		};
	});

const TIER_DEFAULTS = {
	tier_wholesale_discount: "0.03",
	tier_vip_discount: "0.05",
	tier_wholesale_threshold: "5000000",
	tier_vip_threshold: "10000000",
} as const;

export const getTierSettings = publicProcedure
	.route({
		method: "GET",
		path: "/anismile/settings/tier",
		tags: ["Anismile"],
		summary: "Get tier discount and threshold settings",
	})
	.handler(async () => {
		const rows = await db.anismileSetting.findMany({
			where: { key: { in: Object.keys(TIER_DEFAULTS) } },
		});
		const get = (k: keyof typeof TIER_DEFAULTS) =>
			rows.find((r) => r.key === k)?.value ?? TIER_DEFAULTS[k];
		return {
			wholesaleDiscount: Number(get("tier_wholesale_discount")),
			vipDiscount: Number(get("tier_vip_discount")),
			wholesaleThreshold: Number(get("tier_wholesale_threshold")),
			vipThreshold: Number(get("tier_vip_threshold")),
		};
	});

export const patchTierSettings = anismileAdminProcedure
	.route({
		method: "PATCH",
		path: "/anismile/settings/tier",
		tags: ["Anismile"],
		summary: "Update tier discount and threshold settings",
	})
	.input(
		z.object({
			wholesaleDiscount: z.number().min(0).max(1).optional(),
			vipDiscount: z.number().min(0).max(1).optional(),
			wholesaleThreshold: z.number().int().positive().optional(),
			vipThreshold: z.number().int().positive().optional(),
		}),
	)
	.handler(async ({ input }) => {
		const pairs: [string, string][] = [
			...(input.wholesaleDiscount !== undefined ? [["tier_wholesale_discount", String(input.wholesaleDiscount)] as [string, string]] : []),
			...(input.vipDiscount !== undefined ? [["tier_vip_discount", String(input.vipDiscount)] as [string, string]] : []),
			...(input.wholesaleThreshold !== undefined ? [["tier_wholesale_threshold", String(input.wholesaleThreshold)] as [string, string]] : []),
			...(input.vipThreshold !== undefined ? [["tier_vip_threshold", String(input.vipThreshold)] as [string, string]] : []),
		];
		await Promise.all(
			pairs.map(([key, value]) =>
				db.anismileSetting.upsert({
					where: { key },
					create: { key, value },
					update: { value },
				}),
			),
		);
		return { success: true };
	});
