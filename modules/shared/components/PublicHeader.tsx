"use client";

import { useSession } from "@auth/hooks/use-session";
import { config } from "@config";
import { authClient } from "@repo/auth/client";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Input,
	Sheet,
	SheetContent,
	SheetTrigger,
} from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
	LogOutIcon,
	MenuIcon,
	PackageIcon,
	SearchIcon,
	SettingsIcon,
	ShoppingCartIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

function SearchBox({
	className,
	onSubmitted,
}: {
	className?: string;
	onSubmitted?: () => void;
}) {
	const router = useRouter();
	const [query, setQuery] = useState("");

	const handleSearch = (e: FormEvent) => {
		e.preventDefault();
		const trimmed = query.trim();
		if (!trimmed) return;
		router.push(`/search?q=${encodeURIComponent(trimmed)}`);
		onSubmitted?.();
	};

	return (
		<form onSubmit={handleSearch} className={cn("relative", className)}>
			<Input
				type="search"
				placeholder="輸入商品名、JAN碼、作品等關鍵詞"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				className="h-9 w-full rounded-full pr-11 pl-4 text-sm"
			/>
			<button
				type="submit"
				aria-label="搜尋"
				className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#e94d8a] text-white transition-opacity hover:opacity-90"
			>
				<SearchIcon className="size-3.5" />
			</button>
		</form>
	);
}

export function PublicHeader() {
	const [menuOpen, setMenuOpen] = useState(false);
	const { user, loaded } = useSession();
	const isPending = !loaded;
	const isLoggedIn = loaded && !!user;
	const isAdmin = user?.role === "admin" || user?.role === "super_admin";

	const cartQuery = useQuery({
		...orpc.anismile.cart.getItems.queryOptions({ input: {} }),
		enabled: isLoggedIn,
	});
	const itemCount = cartQuery.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

	const onLogout = async () => {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					window.location.href = config.redirectAfterLogout;
				},
			},
		});
	};

	return (
		<header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
			<div className="container flex h-14 items-center justify-between gap-3">
				<Link href="/" className="flex shrink-0 items-center gap-2.5">
					<Image src="/logo.svg" alt="AniSmile" width={36} height={36} />
					<span className="text-[15px] font-semibold tracking-tight text-stone-900">AniSmile</span>
				</Link>

				<SearchBox className="mx-4 hidden max-w-[652px] flex-1 md:block" />

				{/* SSR hydration 安全：isPending 期間顯示空白佔位，避免 server/client mismatch */}
				<div className="flex shrink-0 items-center gap-2">
					{isPending ? (
						<div className="h-8 w-16" />
					) : isLoggedIn ? (
						<>
							<Link href="/cart" className="relative rounded-md p-1.5 text-stone-600 hover:text-stone-900">
								<ShoppingCartIcon className="size-5" />
								{itemCount > 0 && (
									<span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-stone-900 px-1 text-center text-[10px] text-white">
										{itemCount}
									</span>
								)}
							</Link>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button type="button" className="rounded-full p-0.5" aria-label="開啟帳號選單">
										<Avatar className="size-8">
											<AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "使用者"} />
											<AvatarFallback>{(user?.name ?? "U").slice(0, 1).toUpperCase()}</AvatarFallback>
										</Avatar>
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem className="gap-2" asChild>
										<Link href="/orders">
											<PackageIcon className="size-4" />
											我的訂單
										</Link>
									</DropdownMenuItem>
									{isAdmin && (
										<DropdownMenuItem className="gap-2" asChild>
											<Link href="/admin">
												<SettingsIcon className="size-4" />
												管理後台
											</Link>
										</DropdownMenuItem>
									)}
									<DropdownMenuSeparator />
									<DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600" onClick={onLogout}>
										<LogOutIcon className="size-4" />
										登出
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</>
					) : (
						<Link
							href="/login"
							className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
						>
							登入
						</Link>
					)}
					<Sheet open={menuOpen} onOpenChange={setMenuOpen}>
						<SheetTrigger asChild>
							<button
								type="button"
								className="inline-flex size-9 items-center justify-center rounded-md border border-stone-200 text-stone-600 md:hidden"
								aria-label="開啟搜尋選單"
							>
								<MenuIcon className="size-5" />
							</button>
						</SheetTrigger>
						<SheetContent side="top">
							<div className="mt-8">
								<SearchBox className="w-full" onSubmitted={() => setMenuOpen(false)} />
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	);
}
