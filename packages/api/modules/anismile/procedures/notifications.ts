import {
	getOrderNotificationSettings,
	updateOrderNotificationSettings,
} from "@repo/database";
import { z } from "zod";

import { anismileAdminProcedure } from "../../../orpc/procedures";
import { sendLineText } from "../lib/line-notify";

export const getNotificationSettings = anismileAdminProcedure
	.route({
		method: "GET",
		path: "/anismile/admin/notifications/settings",
		tags: ["Anismile"],
		summary: "Get order notification settings",
	})
	.handler(async () => {
		return await getOrderNotificationSettings();
	});

export const patchNotificationSettings = anismileAdminProcedure
	.route({
		method: "PATCH",
		path: "/anismile/admin/notifications/settings",
		tags: ["Anismile"],
		summary: "Patch order notification settings",
	})
	.input(
		z.object({
			adminLineUid: z.string().max(100).default(""),
			adminOrderEmails: z.string().max(2000).default(""),
			supplierOrderEmails: z.string().max(2000).default(""),
		}),
	)
	.handler(async ({ input }) => {
		return await updateOrderNotificationSettings(input);
	});

export const testLineNotification = anismileAdminProcedure
	.route({
		method: "POST",
		path: "/anismile/admin/notifications/line/test",
		tags: ["Anismile"],
		summary: "Send test LINE notification",
	})
	.input(
		z.object({
			lineUid: z.string().max(100).optional(),
		}),
	)
	.handler(async ({ input }) => {
		const settings = await getOrderNotificationSettings();
		const lineUid = input.lineUid?.trim() || settings.adminLineUid || process.env.LINE_ADMIN_LINE_UID?.trim();
		if (!lineUid) {
			throw new Error("尚未設定 LINE UID");
		}
		if (!process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim()) {
			throw new Error("尚未設定 LINE_CHANNEL_ACCESS_TOKEN");
		}
		await sendLineText(lineUid, "AM LINE 通知測試成功。");
		return { ok: true };
	});
