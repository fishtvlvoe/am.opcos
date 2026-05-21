"use client";

import { Button } from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { AnnouncementBanner } from "./components/AnnouncementBanner";
import { CategoryNav } from "./components/CategoryNav";
import { DeadlineSection } from "./components/DeadlineSection";
import { HotSearchTags } from "./components/HotSearchTags";
import { SeriesCard } from "../catalog/components/SeriesCard";
import { FranchiseBanner } from "./components/FranchiseBanner";

// ─── Breadcrumb ──────────────────────────────────────────────────────────────

function Breadcrumb() {
	return (
		<nav className="mb-4 flex items-center gap-1.5 text-sm text-stone-500">
			<span className="font-medium text-stone-900">首頁</span>
		</nav>
	);
}

// ─── Banner 輪播（embla-carousel 單圖滑動）───────────────────────────────────

function BannerCarousel() {
	const bannersQuery = useQuery(orpc.anismile.homepage.getBanners.queryOptions({ input: {} }));
	const banners = bannersQuery.data?.banners ?? [];

	const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);

	if (bannersQuery.isPending || banners.length === 0) return null;

	return (
		<div className="relative mb-8 overflow-hidden rounded-xl h-[200px]">
			<div className="overflow-hidden h-full" ref={emblaRef}>
				<div className="flex h-full">
					{banners.map((banner, i) => {
						const img = (
							<img
								src={banner.imageUrl}
								alt={`Banner ${i + 1}`}
								className="size-full object-cover"
							/>
						);
						return (
							<div key={i} className="flex-[0_0_100%] h-full bg-stone-100">
								{banner.linkUrl ? <Link href={banner.linkUrl}>{img}</Link> : img}
							</div>
						);
					})}
				</div>
			</div>
			<button
				type="button"
				onClick={() => emblaApi?.scrollPrev()}
				className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow hover:bg-white"
				aria-label="上一張"
			>
				<ChevronLeftIcon className="size-5 text-stone-700" />
			</button>
			<button
				type="button"
				onClick={() => emblaApi?.scrollNext()}
				className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow hover:bg-white"
				aria-label="下一張"
			>
				<ChevronRightIcon className="size-5 text-stone-700" />
			</button>
		</div>
	);
}

// ─── 日期 Tab + 系列卡片 Grid ─────────────────────────────────────────────────

type ProductItem = {
	id: string;
	title: string | null;
	janCode: string | null;
	sellingPrice: number;
	imageUrls: unknown;
	listingDate: Date | string | null;
	category: string | null;
	franchise?: string | null;
	brand?: string | null;
};

function groupProductsToSeries(products: ProductItem[]) {
	const groups = new Map<string, { id: string; name: string; ip: string; maker: string; count: number; image?: string }>();
	for (const p of products) {
		const key = p.category ?? "其他";
		const existing = groups.get(key);
		if (existing) {
			existing.count++;
		} else {
			const firstImage = Array.isArray(p.imageUrls) ? String(p.imageUrls[0] ?? "") : "";
			groups.set(key, {
				id: key,
				name: key,
				ip: p.franchise ?? "",
				maker: p.brand ?? "",
				count: 1,
				image: firstImage || undefined,
			});
		}
	}
	return Array.from(groups.values());
}

function ListingSection() {
	const datesQuery = useQuery(orpc.anismile.homepage.getListingDates.queryOptions({ input: {} }));
	const dates = datesQuery.data?.dates ?? [];
	const [selectedDate, setSelectedDate] = useState<string | null>(null);

	useEffect(() => {
		if (dates.length > 0 && selectedDate === null) {
			setSelectedDate(dates[0] ?? null);
		}
	}, [dates, selectedDate]);

	const productsQuery = useQuery({
		...orpc.anismile.homepage.getProductsByDate.queryOptions({
			input: { date: selectedDate ?? "" },
		}),
		enabled: !!selectedDate,
	});
	const products: ProductItem[] = productsQuery.data?.products ?? [];
	const seriesList = groupProductsToSeries(products);
	const franchiseBannerItems = seriesList.slice(0, 6).map((s) => ({
		franchise: s.name,
		image: s.image ?? "",
		category: s.id,
	}));

	return (
		<section className="mb-12">
			<h2 className="mb-4 text-lg font-bold text-stone-900">商品系列</h2>
			<FranchiseBanner items={franchiseBannerItems} />
			<div className="mb-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
				{dates.map((date) => (
					<button
						key={date}
						type="button"
						onClick={() => setSelectedDate(date)}
						className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
							selectedDate === date
								? "bg-primary text-primary-foreground"
								: "bg-stone-200 text-stone-700 hover:bg-stone-300"
						}`}
					>
						{format(new Date(date), "M月d日上架")}
					</button>
				))}
			</div>

			{productsQuery.isPending ? (
				<div className="py-12 text-center text-muted-foreground">載入中...</div>
			) : seriesList.length === 0 ? (
				<p className="text-sm text-stone-500">暫無商品</p>
			) : (
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
					{seriesList.map((s) => (
						<SeriesCard key={s.id} series={s} />
					))}
				</div>
			)}

			<div className="mt-6 text-center">
				<Button variant="ghost" className="text-sm font-medium text-primary hover:text-primary/80 hover:underline">
					查看更多 »
				</Button>
			</div>
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

export function HomePage() {
	return (
		<div className="min-h-screen">
			<AnnouncementBanner />
			<CategoryNav />
			<main className="container py-8">
				<Breadcrumb />
				<BannerCarousel />
				<ListingSection />
				<HotSearchTags />
				<DeadlineSection />
			</main>
			<Footer />
		</div>
	);
}
