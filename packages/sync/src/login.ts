// 登入 anismile.jp 取得 session cookie
// 實際爬蟲邏輯在 @repo/api/modules/anismile/lib/crawler.ts
// 這裡重新 export 給 @repo/sync 統一入口使用

const LOGIN_URL = "https://www.anismile.jp/login/index";

/**
 * 登入 anismile.jp，回傳 Set-Cookie 陣列
 */
export async function login(email: string, password: string): Promise<string[]> {
	const body = new URLSearchParams({
		email,
		password,
		device: "crawler-opcOS",
		remember: "0",
		lang: "cn",
	});

	const response = await fetch(LOGIN_URL, {
		method: "POST",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		body,
		redirect: "manual",
	});

	const setCookie = response.headers.getSetCookie?.() ?? [];
	if (setCookie.length === 0) {
		throw new Error("Login failed: no session cookie received from anismile.jp");
	}

	const loginResult = (await response.json().catch(() => null)) as { code?: number } | null;
	if (loginResult && loginResult.code !== 1) {
		throw new Error(`Anismile login failed: code=${loginResult.code}`);
	}

	return setCookie.map((item) => item.split(";")[0]);
}
