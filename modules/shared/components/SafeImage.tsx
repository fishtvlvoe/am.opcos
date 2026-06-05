"use client";

import Image from "next/image";
import { useState } from "react";

const GRAY_BLUR =
	"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSIzMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y1ZjVmNCIvPjwvc3ZnPg==";

interface SafeImageProps {
	src: string;
	alt: string;
	fill?: boolean;
	width?: number;
	height?: number;
	priority?: boolean;
	sizes?: string;
	className?: string;
}

export function SafeImage({ src, alt, fill, width, height, priority, sizes, className = "" }: SafeImageProps) {
	const [loaded, setLoaded] = useState(false);
	const [error, setError] = useState(false);

	const displaySrc =
		src.startsWith("https://img.anismile.jp/") || src.startsWith("https://www.anismile.jp/")
			? `/api/image-proxy?url=${encodeURIComponent(src)}`
			: src;

	if (error) {
		return (
			<div className={`flex items-center justify-center bg-stone-100 ${fill ? "size-full" : ""}`} style={!fill ? { width, height } : undefined}>
				<span className="text-xs text-stone-400">圖片載入失敗</span>
			</div>
		);
	}

	return (
		<Image
			src={displaySrc}
			alt={alt}
			fill={fill}
			width={!fill ? width : undefined}
			height={!fill ? height : undefined}
			priority={priority}
			sizes={sizes}
			placeholder="blur"
			blurDataURL={GRAY_BLUR}
			className={`${className} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
			onLoad={() => setLoaded(true)}
			onError={() => setError(true)}
		/>
	);
}
