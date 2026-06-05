import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const imageUrl = searchParams.get("url");

	if (!imageUrl) {
		return new NextResponse("Missing url parameter", { status: 400 });
	}

	// 限制只代理來源 Anismile 網域以防止被作為 open proxy 濫用
	if (!imageUrl.startsWith("https://img.anismile.jp/") && !imageUrl.startsWith("https://www.anismile.jp/")) {
		return new NextResponse("Forbidden target domain", { status: 403 });
	}

	try {
		// 偽裝 Referer 繞過外部防盜鏈 (hotlinking protection)
		const response = await fetch(imageUrl, {
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				"Referer": "https://www.anismile.jp/",
			},
			signal: AbortSignal.timeout(10000),
		});

		if (!response.ok) {
			return new NextResponse(`Failed to fetch image: ${response.statusText}`, { status: response.status });
		}

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
		return new NextResponse(`Proxy error: ${msg}`, { status: 500 });
	}
}
