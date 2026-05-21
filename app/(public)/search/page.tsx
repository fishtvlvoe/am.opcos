import { Suspense } from "react";

import { SearchPage } from "../../../modules/catalog/SearchPage";

export default function Page() {
	return (
		<Suspense fallback={<div className="py-24 text-center text-sm text-muted-foreground">載入中...</div>}>
			<SearchPage />
		</Suspense>
	);
}
