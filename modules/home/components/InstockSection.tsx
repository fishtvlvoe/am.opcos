"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "../../catalog/components/ProductCard";

export function InstockSection() {
	const instockQuery = useQuery(orpc.anismile.homepage.getInstockList.queryOptions({ input: {} }));
	const items = instockQuery.data?.items ?? [];

	if (instockQuery.isPending) return null;
	if (items.length === 0) return null;

	return (
		<section className="mb-12">
			<h2 className="mb-4 text-lg font-bold text-stone-900">現貨銷售</h2>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
				{items.map((product) => {
					return (
						<ProductCard
							key={product.id}
							id={product.id}
							title={product.name}
							price={product.price}
							originalPrice={null}
							sellingPrice={product.price}
							imageUrl={product.imageUrl}
							priority={false}
						/>
					);
				})}
			</div>
		</section>
	);
}
