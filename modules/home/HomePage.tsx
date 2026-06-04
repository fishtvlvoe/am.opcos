"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnnouncementBanner } from "./components/AnnouncementBanner";
import { CategoryNav } from "./components/CategoryNav";
import { DeadlineSection } from "./components/DeadlineSection";
import { FranchiseBanner } from "./components/FranchiseBanner";
import { HotSearchTags } from "./components/HotSearchTags";
import { SeriesCard } from "../catalog/components/SeriesCard";
import { InstockSection } from "./components/InstockSection";

export type HomePageSeriesData = {
	items: Array<{
		id: string;
		name: string;
		imageUrl: string;
		productCount: number;
		workTitle: string;
		manufacturer: string;
		latestAddTime: number | null;
	}>;
	availableDates: Array<{ date: string; display: string; count: number }>;
	targetDate: string | null;
};

export type HomePageBannerData = {
	banners: Array<{
		name?: string;
		imageUrl: string;
		linkUrl?: string;
		copyrightText?: string;
		copyrightColor?: string;
	}>;
};

// ─── 日期 Tab + 系列卡片 Grid ─────────────────────────────────────────────────

function ListingSection({ initialSeriesData }: { initialSeriesData?: HomePageSeriesData }) {
	const [selectedDateIndex, setSelectedDateIndex] = useState(0);
	const [visibleSeriesData, setVisibleSeriesData] = useState<HomePageSeriesData | undefined>(initialSeriesData);
	const seriesQuery = useQuery(orpc.anismile.homepage.getSeriesList.queryOptions({
		input: { dateIndex: selectedDateIndex, limit: 30 },
	}));
	const currentSeriesData = seriesQuery.data ?? visibleSeriesData;
	const seriesList = currentSeriesData?.items ?? [];
	const dates = currentSeriesData?.availableDates ?? [];
	const isUpdatingSeries = seriesQuery.isFetching && !!currentSeriesData;

	useEffect(() => {
		if (seriesQuery.data) {
			setVisibleSeriesData(seriesQuery.data);
		}
	}, [seriesQuery.data]);

	return (
		<section className="mb-12">
			<div className="mb-4 flex items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<h2 className="text-lg font-bold text-stone-900">商品系列</h2>
					{isUpdatingSeries ? <span className="text-xs text-stone-500">更新中...</span> : null}
				</div>
				<Link
					href="/search"
					className="text-sm font-medium text-primary hover:text-primary/80 hover:underline"
				>
					» 查看更多
				</Link>
			</div>
			<div className="mb-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
				{dates.slice(0, 7).map((date, index) => (
					<button
						key={date.date}
						type="button"
						onClick={() => setSelectedDateIndex(index)}
						className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
							selectedDateIndex === index
								? "bg-primary text-primary-foreground"
								: "bg-stone-200 text-stone-700 hover:bg-stone-300"
						}`}
					>
						{format(new Date(date.date), "M月d日上架")}
					</button>
				))}
			</div>

			{seriesQuery.isPending && !currentSeriesData ? (
				<div className="py-12 text-center text-muted-foreground">載入中...</div>
			) : seriesList.length === 0 ? (
				<p className="text-sm text-stone-500">暫無商品</p>
			) : (
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
					{seriesList.map((series) => (
						<SeriesCard
							key={series.id}
							series={{
								id: series.name,
								name: series.name,
								ip: series.workTitle,
								maker: series.manufacturer,
								count: series.productCount,
								image: series.imageUrl,
								href: `/series/${encodeURIComponent(series.name)}`,
							}}
						/>
					))}
				</div>
			)}

		</section>
	);
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
	return (
		<footer className="border-t border-stone-200 bg-white py-8">
			<div className="container">
				<div className="flex flex-wrap items-center justify-center gap-4 text-sm text-stone-600">
					<a href="#" className="hover:text-stone-900">隱私政策</a>
					<span className="text-stone-300">|</span>
					<a href="#" className="hover:text-stone-900">使用規則</a>
					<span className="text-stone-300">|</span>
					<a href="#" className="hover:text-stone-900">商標著作權</a>
					<span className="text-stone-300">|</span>
					<a href="#" className="hover:text-stone-900">運營公司</a>
				</div>
				<p className="mt-4 text-center text-xs text-stone-500">©Gamesmile Co., Ltd.</p>
			</div>
		</footer>
	);
}

// ─── 首頁 ──────────────────────────────────────────────────────────────────────

export function HomePage({
	initialBannerData,
	initialSeriesData,
	initialDeadlineData,
}: {
	initialBannerData?: HomePageBannerData;
	initialSeriesData?: HomePageSeriesData;
	initialDeadlineData?: { items: any[] };
}) {
	const sourceBannerQuery = useQuery(orpc.anismile.homepage.getBanners.queryOptions({
		input: {},
	}));
	const bannerData = sourceBannerQuery.data ?? initialBannerData;
	const sourceBannerItems = (bannerData?.banners ?? [])
		.map((banner) => ({
			name: banner.name ?? "AniSmile banner",
			image: banner.imageUrl,
			href: banner.linkUrl,
			copyrightText: banner.copyrightText,
			copyrightColor: banner.copyrightColor,
		}))
		.filter((item) => item.image);

	return (
		<div className="min-h-screen">
			<AnnouncementBanner helpUrl="#" />
			<CategoryNav />
			<main className="container py-8">
				<h1 className="sr-only">Anismile 玩具模型與動漫周邊上架與現貨平台</h1>
				<FranchiseBanner items={sourceBannerItems} />
				<ListingSection initialSeriesData={initialSeriesData} />
				<HotSearchTags />
				<DeadlineSection initialData={initialDeadlineData} />
				<InstockSection />
			</main>
			<Footer />
		</div>
	);
}
