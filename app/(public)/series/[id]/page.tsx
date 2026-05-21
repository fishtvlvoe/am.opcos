import { SeriesDetailPage } from "../../../../modules/catalog/SeriesDetailPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return <SeriesDetailPage seriesId={decodeURIComponent(id)} />;
}
