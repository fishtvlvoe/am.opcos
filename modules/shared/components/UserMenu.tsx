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
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui";
import {
	CrownIcon,
	HeartIcon,
	LogOutIcon,
	PackageIcon,
	SettingsIcon,
	ShoppingBagIcon,
	UploadIcon,
	UsersIcon,
	ClipboardListIcon,
	SlidersHorizontalIcon,
	RefreshCwIcon,
} from "lucide-react";
import Link from "next/link";

export function UserMenu() {
	const { user } = useSession();

	if (!user) return null;

	const isAdmin = user.role === "admin" || user.role === "super_admin";

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
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="rounded-full border p-0.5 transition-colors hover:bg-accent"
					aria-label="開啟帳號選單"
				>
					<Avatar className="size-8">
						<AvatarImage src={user.image ?? undefined} alt={user.name ?? "使用者"} />
						<AvatarFallback>{(user.name ?? "U").slice(0, 1).toUpperCase()}</AvatarFallback>
					</Avatar>
				</button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end" className="w-52">
				<DropdownMenuLabel className="flex flex-col gap-0.5">
					<span className="text-sm font-medium">{user.name}</span>
					<span className="text-xs font-normal text-muted-foreground">{user.email}</span>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />

				<DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
					我的帳戶
				</DropdownMenuLabel>
				<DropdownMenuItem asChild className="gap-2">
					<Link href="/orders">
						<ShoppingBagIcon className="size-4" />
						我的訂單
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild className="gap-2">
					<Link href="/wishlist">
						<HeartIcon className="size-4" />
						收藏夾
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild className="gap-2">
					<Link href="/product-pool">
						<PackageIcon className="size-4" />
						商品池
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild className="gap-2">
					<Link href="/import">
						<UploadIcon className="size-4" />
						導入訂單
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild className="gap-2">
					<Link href="/account/member">
						<CrownIcon className="size-4" />
						會員等級
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild className="gap-2">
					<Link href="/account/settings">
						<SettingsIcon className="size-4" />
						帳號設定
					</Link>
				</DropdownMenuItem>

				{isAdmin && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
							管理員
						</DropdownMenuLabel>
						<DropdownMenuItem asChild className="gap-2">
							<Link href="/admin/orders">
								<ClipboardListIcon className="size-4" />
								訂單管理
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild className="gap-2">
							<Link href="/admin/customers">
								<UsersIcon className="size-4" />
								客戶管理
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild className="gap-2">
							<Link href="/admin/products">
								<SlidersHorizontalIcon className="size-4" />
								商品管理
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild className="gap-2">
							<Link href="/admin/sync">
								<RefreshCwIcon className="size-4" />
								商品同步
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild className="gap-2">
							<Link href="/admin/settings">
								<SettingsIcon className="size-4" />
								系統設定
							</Link>
						</DropdownMenuItem>
					</>
				)}

				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="gap-2 text-red-600 focus:text-red-600"
					onClick={onLogout}
				>
					<LogOutIcon className="size-4" />
					登出
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
