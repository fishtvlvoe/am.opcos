import "server-only";

function getPublicSiteOrigin() {
	if (process.env.NEXT_PUBLIC_SAAS_URL) {
		return process.env.NEXT_PUBLIC_SAAS_URL;
	}
	if (process.env.NEXT_PUBLIC_VERCEL_URL) {
		return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
	}
	return `http://localhost:${process.env.PORT ?? 3001}`;
}

export async function fetchPublicJson<T>(path: string, init?: RequestInit): Promise<T | null> {
	try {
		const response = await fetch(`${getPublicSiteOrigin()}${path}`, init);
		if (!response.ok) return null;
		return (await response.json()) as T;
	} catch {
		return null;
	}
}
