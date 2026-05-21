"use client";

import { useSession } from "@auth/hooks/use-session";
import { config } from "@config";
import { authClient } from "@repo/auth/client";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { LogOutIcon, PackageIcon, SettingsIcon, ShoppingCartIcon } from "lucide-react";
import Link from "next/link";

export function PublicHeader() {
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
			<div className="container flex h-14 items-center justify-between">
				<Link href="/" className="flex items-center gap-2.5">
					<span className="flex size-7 items-center justify-center rounded-lg bg-stone-900 text-sm font-semibold text-white">
						A
					</span>
					<span className="text-[15px] font-semibold tracking-tight text-stone-900">anismile</span>
				</Link>

				{/* SSR hydration 安全：isPending 期間顯示空白佔位，避免 server/client mismatch */}
				{isPending ? (
					<div className="h-8 w-16" />
				) : isLoggedIn ? (
					<div className="flex items-center gap-3">
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
					</div>
				) : (
					<Link
						href="/login"
						className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
					>
						登入
					</Link>
				)}
			</div>
		</header>
	);
}
