import { Suspense } from "react";

import { CategoryPage } from "../../../../modules/catalog/CategoryPage";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	return (
		<Suspense fallback={<div className="py-24 text-center text-sm text-muted-foreground">載入中...</div>}>
			<CategoryPage slug={decodeURIComponent(slug)} />
		</Suspense>
	);
}
