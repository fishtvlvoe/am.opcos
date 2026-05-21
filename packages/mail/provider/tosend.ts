import { logger } from "@repo/logs";

import type { SendEmailHandler } from "../types";

const TOSEND_API_URL = "https://api.tosend.com/v2/emails";

export const send: SendEmailHandler = async ({ to, from, subject, html, text }) => {
	const apiKey = process.env.TOSEND_API_KEY?.trim();
	const fromEmail = from ?? process.env.TOSEND_FROM_EMAIL?.trim();

	if (!apiKey || !fromEmail) {
		logger.error("ToSend: 缺少 TOSEND_API_KEY 或 TOSEND_FROM_EMAIL");
		throw new Error("ToSend configuration missing");
	}

	const response = await fetch(TOSEND_API_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from: { email: fromEmail },
			to: [{ email: to }],
			subject,
			html,
			text,
		}),
	});

	if (!response.ok) {
		const body = await response.text().catch(() => "");
		logger.error(`ToSend API error ${response.status}: ${body}`);
		throw new Error(`ToSend send failed: ${response.status}`);
	}
};
