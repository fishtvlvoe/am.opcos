import { createHash } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function cleanEnvVar(value: string | undefined): string | undefined {
	if (!value) return undefined;
	return value.trim().replace(/\\n$/, "").trim();
}

const R2_ENDPOINT = cleanEnvVar(process.env.S3_ENDPOINT);
const R2_ACCESS_KEY_ID = cleanEnvVar(process.env.S3_ACCESS_KEY_ID);
const R2_SECRET_ACCESS_KEY = cleanEnvVar(process.env.S3_SECRET_ACCESS_KEY);
const R2_BUCKET_NAME = cleanEnvVar(process.env.NEXT_PUBLIC_AVATARS_BUCKET_NAME) || "fishtv";
const R2_PUBLIC_URL = cleanEnvVar(process.env.NEXT_PUBLIC_R2_PUBLIC_URL) || "https://pub-5ec21b01ebe8403c850311d4ddf55acd.r2.dev";

const r2Client =
	R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY
		? new S3Client({
				region: "auto",
				endpoint: R2_ENDPOINT,
				credentials: {
					accessKeyId: R2_ACCESS_KEY_ID,
					secretAccessKey: R2_SECRET_ACCESS_KEY,
				},
			})
		: null;

export function isR2Configured(): boolean {
	return r2Client !== null;
}

export function getR2Key(seriesName: string): string {
	const hash = createHash("sha1").update(seriesName.trim()).digest("hex");
	return `series/${hash.slice(0, 16)}.jpg`;
}

export function getR2PublicUrl(seriesName: string): string {
	return `${R2_PUBLIC_URL}/${getR2Key(seriesName)}`;
}

export async function syncSeriesImageToR2(
	imageUrl: string,
	seriesName: string,
): Promise<string | null> {
	if (!r2Client) return null;

	try {
		const response = await fetch(imageUrl, { signal: AbortSignal.timeout(10_000) });
		if (!response.ok) return null;

		const blob = await response.blob();
		const buffer = Buffer.from(await blob.arrayBuffer());

		const key = getR2Key(seriesName);
		await r2Client.send(
			new PutObjectCommand({
				Bucket: R2_BUCKET_NAME,
				Key: key,
				Body: buffer,
				ContentType: blob.type || "image/jpeg",
				CacheControl: "public, max-age=86400",
			}),
		);

		return getR2PublicUrl(seriesName);
	} catch {
		return null;
	}
}
