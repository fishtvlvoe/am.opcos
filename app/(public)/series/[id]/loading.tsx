export default function Loading() {
	return (
		<div className="min-h-screen">
			<main className="container py-8 animate-pulse">
				{/* 麵包屑骨架 */}
				<div className="mb-4 flex gap-2">
					<div className="h-4 w-12 rounded bg-stone-200" />
					<div className="h-4 w-4 rounded bg-stone-200" />
					<div className="h-4 w-16 rounded bg-stone-200" />
					<div className="h-4 w-4 rounded bg-stone-200" />
					<div className="h-4 w-24 rounded bg-stone-200" />
				</div>

				{/* 標題骨架 */}
				<div className="mb-1 h-8 w-64 rounded bg-stone-200" />
				<div className="mb-6 h-4 w-20 rounded bg-stone-200" />

				{/* Featured Carousel 骨架 */}
				<div className="mb-8 h-[200px] w-full rounded-xl bg-stone-200" />

				{/* 工具列骨架 */}
				<div className="mb-6 flex items-center justify-between">
					<div className="h-10 w-48 rounded bg-stone-200" />
					<div className="h-10 w-24 rounded bg-stone-200" />
				</div>

				{/* 產品網格骨架 */}
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{Array.from({ length: 10 }).map((_, i) => (
						<div key={i} className="overflow-hidden rounded-lg border border-stone-100 bg-white p-2">
							<div className="aspect-square w-full rounded bg-stone-200" />
							<div className="mt-3 space-y-2">
								<div className="h-4 w-5/6 rounded bg-stone-200" />
								<div className="h-3 w-1/2 rounded bg-stone-200" />
								<div className="h-4 w-1/3 rounded bg-stone-200" />
							</div>
						</div>
					))}
				</div>
			</main>
		</div>
	);
}
