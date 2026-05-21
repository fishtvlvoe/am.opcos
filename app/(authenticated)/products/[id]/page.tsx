import { ProductDetailPage } from "../../../../modules/detail/ProductDetailPage";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return <ProductDetailPage id={id} />;
}
