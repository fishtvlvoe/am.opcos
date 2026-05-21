"use client";

interface AnnouncementBannerProps {
	helpUrl?: string;
}

export function AnnouncementBanner({ helpUrl }: AnnouncementBannerProps) {
	return (
		<div className="relative flex items-center justify-center bg-primary py-2.5 text-center text-sm font-medium tracking-wide text-primary-foreground">
			<span>歡迎訪問 AniSmile——每日上新，日本直發，服務全球的專業日谷批發商</span>
			{helpUrl && (
				<a
					href={helpUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="absolute right-4 text-xs opacity-80 hover:opacity-100"
				>
					▸ 使用手冊
				</a>
			)}
		</div>
	);
}
