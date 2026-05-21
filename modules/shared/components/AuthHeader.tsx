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
import { LogOutIcon, SettingsIcon, ShoppingCartIcon } from "lucide-react";
import Link from "next/link";

export function AuthHeader() {
	const { user } = useSession();
	const cartQuery = useQuery(orpc.anismile.cart.getItems.queryOptions({ input: {} }));
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

				<div className="flex items-center gap-3">
					<Link href="/cart" className="relative rounded-md p-1.5 text-stone-600 hover:text-stone-900">
						<ShoppingCartIcon className="size-5" />
						<span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-stone-900 px-1 text-center text-[10px] text-white">
							{itemCount}
						</span>
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
								<Link href="/admin/settings">
									<SettingsIcon className="size-4" />
									帳號設定
								</Link>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600" onClick={onLogout}>
								<LogOutIcon className="size-4" />
								登出
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	);
}
