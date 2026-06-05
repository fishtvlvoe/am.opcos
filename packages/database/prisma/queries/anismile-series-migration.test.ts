import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AnismileSeries migration verification", () => {
	it("contains a migration directory for add_anismile_series_table", () => {
		const migrationsPath = resolve(process.cwd(), "packages/database/prisma/migrations");
		const dirs = readdirSync(migrationsPath, { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name);

		const seriesMigrationDir = dirs.find((name) => name.endsWith("_add_anismile_series_table"));
		expect(seriesMigrationDir).toBeDefined();

		if (seriesMigrationDir) {
			const sqlPath = resolve(migrationsPath, seriesMigrationDir, "migration.sql");
			const sqlContent = readFileSync(sqlPath, "utf8");

			expect(sqlContent).toContain('CREATE TABLE "anismile_series"');
			expect(sqlContent).toContain('"id" TEXT NOT NULL');
			expect(sqlContent).toContain('"name" TEXT NOT NULL');
			expect(sqlContent).toContain('"image_url" TEXT');
			expect(sqlContent).toContain('"product_count" INTEGER');
			expect(sqlContent).toContain('"last_synced_at" TIMESTAMP(3) NOT NULL');
			expect(sqlContent).toContain('"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP');
			expect(sqlContent).toContain('"updated_at" TIMESTAMP(3) NOT NULL');
			expect(sqlContent).toContain('CONSTRAINT "anismile_series_pkey" PRIMARY KEY ("id")');
			expect(sqlContent).toContain('CREATE UNIQUE INDEX "anismile_series_name_key" ON "anismile_series"("name")');
		}
	});
});
