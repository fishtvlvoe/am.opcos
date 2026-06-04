import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("customer role contract", () => {
	it("makes auth signup default to customer instead of user", () => {
		const source = read("packages/auth/auth.ts");

		expect(source).toContain('admin({ defaultRole: "customer" })');
		expect(source).not.toContain('defaultRole: "user"');
	});

	it("keeps manual create-user flow aligned with customer as the non-admin default", () => {
		const source = read("tooling/scripts/src/create-user.ts");

		expect(source).toContain('role: isAdmin ? "admin" : "customer"');
		expect(source).not.toContain('role: isAdmin ? "admin" : "user"');
	});

	it("keeps database createUser helpers typed around customer instead of user", () => {
		const prismaSource = read("packages/database/prisma/queries/users.ts");
		const drizzleSource = read("packages/database/drizzle/queries/users.ts");

		expect(prismaSource).toContain('role: "admin" | "customer"');
		expect(drizzleSource).toContain('role: "admin" | "customer"');
		expect(prismaSource).not.toContain('role: "admin" | "user"');
		expect(drizzleSource).not.toContain('role: "admin" | "user"');
	});
});
