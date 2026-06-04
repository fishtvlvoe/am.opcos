import { HomePage, type HomePageBannerData, type HomePageSeriesData } from "../../modules/home/HomePage";
import { fetchPublicJson } from "../../modules/shared/lib/public-prefetch";

export default async function Page() {
	const [initialBannerData, initialSeriesData, initialDeadlineData] = await Promise.all([
		fetchPublicJson<HomePageBannerData>("/api/anismile/homepage/banners", {
			next: { revalidate: 300 },
		}),
		fetchPublicJson<HomePageSeriesData>("/api/anismile/homepage/series-list?dateIndex=0&limit=30", {
			next: { revalidate: 300 },
		}),
		fetchPublicJson<{ items: any[] }>("/api/anismile/homepage/deadline-list", {
			next: { revalidate: 300 },
		}),
	]);

	return (
		<HomePage
			initialBannerData={initialBannerData ?? undefined}
			initialSeriesData={initialSeriesData ?? undefined}
			initialDeadlineData={initialDeadlineData ?? undefined}
		/>
	);
}
