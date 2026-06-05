export default function Loading() {
	return (
		<div className="min-h-screen">
			<main className="container py-8 animate-pulse">
				{/* 麵包屑骨架 */}
				<div className="mb-6 flex gap-2">
					<div className="h-4 w-12 rounded bg-stone-200" />
					<div className="h-4 w-4 rounded bg-stone-200" />
					<div className="h-4 w-24 rounded bg-stone-200" />
					<div className="h-4 w-4 rounded bg-stone-200" />
					<div className="h-4 w-32 rounded bg-stone-200" />
				</div>

				<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
					{/* 左側：商品圖片骨架 */}
					<div className="space-y-4">
						<div className="aspect-square w-full rounded-xl bg-stone-200" />
						<div className="flex gap-2">
							<div className="h-16 w-16 rounded-md bg-stone-200" />
							<div className="h-16 w-16 rounded-md bg-stone-200" />
							<div className="h-16 w-16 rounded-md bg-stone-200" />
						</div>
					</div>

					{/* 右側：商品資訊骨架 */}
					<div className="space-y-6">
						<div className="space-y-2">
							<div className="h-4 w-20 rounded bg-stone-200" />
							<div className="h-8 w-5/6 rounded bg-stone-200" />
							<div className="h-6 w-3/4 rounded bg-stone-200" />
						</div>

						<div className="h-12 w-1/3 rounded bg-stone-200" />

						<hr className="border-stone-100" />

						<div className="space-y-4">
							<div className="flex gap-4">
								<div className="h-10 w-24 rounded bg-stone-200" />
								<div className="h-10 w-full rounded bg-stone-200" />
							</div>
							<div className="h-10 w-full rounded bg-stone-200" />
						</div>

						<div className="space-y-3 rounded-lg bg-stone-50 p-4">
							<div className="h-4 w-1/3 rounded bg-stone-200" />
							<div className="h-4 w-1/2 rounded bg-stone-200" />
							<div className="h-4 w-2/3 rounded bg-stone-200" />
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
