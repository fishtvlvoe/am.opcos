import { type NextRequest, NextResponse } from "next/server";

async function fetchWithRetry(url: string, retries = 3, delayMs = 150): Promise<Response> {
	let lastError: any;
	for (let i = 0; i < retries; i++) {
		try {
			const res = await fetch(url, {
				headers: {
					"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
					"Referer": "https://www.anismile.jp/",
					"Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
					"Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
				},
				signal: AbortSignal.timeout(6000),
			});
			if (res.ok) {
				return res;
			}
			lastError = new Error(`HTTP status ${res.status} ${res.statusText}`);
		} catch (err) {
			lastError = err;
		}
		if (i < retries - 1) {
			await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
		}
	}
	throw lastError || new Error("Failed after retries");
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const imageUrl = searchParams.get("url");

	const noCacheHeaders = {
		"Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
		"Pragma": "no-cache",
		"Expires": "0",
	};

	if (!imageUrl) {
		return new NextResponse("Missing url parameter", { status: 400, headers: noCacheHeaders });
	}

	// 限制只代理來源 Anismile 網域以防止被作為 open proxy 濫用
	if (!imageUrl.startsWith("https://img.anismile.jp/") && !imageUrl.startsWith("https://www.anismile.jp/")) {
		return new NextResponse("Forbidden target domain", { status: 403, headers: noCacheHeaders });
	}

	try {
		const response = await fetchWithRetry(imageUrl);
		const contentType = response.headers.get("content-type") || "image/jpeg";
		const blob = await response.blob();
		const buffer = Buffer.from(await blob.arrayBuffer());

		// 回傳圖片，並宣告強效緩存，減輕伺服器負擔
		return new NextResponse(buffer, {
			headers: {
				"Content-Type": contentType,
				"Cache-Control": "public, max-age=31536000, immutable",
			},
		});
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Unknown error";
		return new NextResponse(`Proxy error: ${msg}`, { status: 502, headers: noCacheHeaders });
	}
}

