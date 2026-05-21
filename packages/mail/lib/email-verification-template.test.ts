import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("email verification template", () => {
	it("uses AM copy and avoids starter-kit wording", () => {
		const translationsPath = join(
			process.cwd(),
			"packages/i18n/translations/zh-TW/mail.json",
		);
		const translations = JSON.parse(readFileSync(translationsPath, "utf8"));
		const verification = translations.emailVerification;

		expect(verification.subject).toBe("驗證您的 AM 帳號");
		expect(verification.body).toContain("{name}");
		expect(verification.body).toContain("AM 日貨下單代理");
		expect(verification.body).not.toContain("superstarter");
		expect(verification.body).not.toContain("localhost");
	});
});
