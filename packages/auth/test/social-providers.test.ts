import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "packages/auth/auth.ts"), "utf8");

describe("social providers config", () => {
	it("aligns Better Auth base path and secret with OPCOS shared auth", () => {
		expect(source).toContain("basePath: \"/api/auth\"");
		expect(source).toContain("secret: cleanEnv(process.env.BETTER_AUTH_SECRET)");
		expect(source).toContain("cleanEnv(process.env.NEXT_PUBLIC_OPCOS_URL)");
		expect(source).toContain("domain: authCookieDomain");
	});

	it("includes line and google providers", () => {
		expect(source).toContain("socialProviders");
		expect(source).toContain("google:");
		expect(source).toContain("line:");
	});

	it("trusts line provider for account linking", () => {
		expect(source).toContain("trustedProviders");
		expect(source).toContain("\"line\"");
	});
});
