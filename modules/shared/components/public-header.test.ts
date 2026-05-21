import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
	return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("PublicHeader", () => {
	const filePath = "modules/shared/components/PublicHeader.tsx";

	it("使用 AniSmile logo SVG 取代黑色 A 方塊", () => {
		const source = read(filePath);
		expect(source).toContain('src="/logo.svg"');
		expect(source).toContain('alt="AniSmile"');
		expect(source).toContain(">AniSmile<");
		expect(source).not.toContain("bg-stone-900 text-sm font-semibold text-white");
	});

	it("導覽列搜尋欄對所有使用者可見並送往 search route", () => {
		const source = read(filePath);
		expect(source).toContain("useRouter");
		expect(source).not.toContain("useSearchParams");
		expect(source).toContain("輸入商品名、JAN碼、作品等關鍵詞");
		expect(source).toContain("flex-1");
		expect(source).toContain("router.push(`/search?q=${encodeURIComponent(trimmed)}`)");
		expect(source).toContain("#e94d8a");
	});

	it("行動版漢堡選單頂部包含搜尋欄", () => {
		const source = read(filePath);
		expect(source).toContain("SheetTrigger");
		expect(source).toContain("MenuIcon");
		expect(source).toContain('className="mt-8"');
		expect(source).toContain('<SearchBox className="w-full"');
	});

	it("維持登入後才顯示購物車 icon", () => {
		const source = read(filePath);
		expect(source).toContain("isLoggedIn");
		expect(source).toContain("ShoppingCartIcon");
		expect(source).toContain('href="/cart"');
	});
});

describe("AniSmile logo asset", () => {
	it("存在 logo.svg 並包含品牌三色", () => {
		const logoPath = resolve(process.cwd(), "public/logo.svg");
		expect(existsSync(logoPath)).toBe(true);
		const source = readFileSync(logoPath, "utf8");
		expect(source).toContain("#e91e8c");
		expect(source).toContain("#27aae1");
		expect(source).toContain("#f7941d");
	});
});
