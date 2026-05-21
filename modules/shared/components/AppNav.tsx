"use client";

import { useSession } from "@auth/hooks/use-session";
import { orpc } from "@shared/lib/orpc-query-utils";
import {
	cn,
	Input,
	Logo,
	Sheet,
	SheetContent,
	SheetTrigger,
} from "@repo/ui";
import { useQuery } from "@tanstack/react-query";
import {
	ClipboardListIcon,
	CrownIcon,
	HeartIcon,
	MenuIcon,
	PackageIcon,
	RefreshCwIcon,
	SearchIcon,
	SettingsIcon,
	ShoppingCartIcon,
	SlidersHorizontalIcon,
	UploadIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { UserMenu } from "./UserMenu";

function SearchBox({ className }: { className?: string }) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [query, setQuery] = useState(searchParams.get("q") ?? "");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = query.trim();
		if (!trimmed) return;
		router.push(`/search?q=${encodeURIComponent(trimmed)}`);
	};

	return (
		<form onSubmit={handleSubmit} className={cn("relative", className)}>
			<SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="search"
				placeholder="搜尋商品名、JAN碼、作品..."
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				className="h-9 w-full pl-8 text-sm"
			/>
		</form>
	);
}

type MobileNavItem = {
	href: string;
	label: string;
	icon: React.ReactNode;
	adminOnly?: boolean;
};

const mobileNavItems: MobileNavItem[] = [
	{ href: "/", label: "商品目錄", icon: <PackageIcon className="size-4" /> },
	{ href: "/orders", label: "我的訂單", icon: <ClipboardListIcon className="size-4" /> },
	{ href: "/wishlist", label: "收藏夾", icon: <HeartIcon className="size-4" /> },
	{ href: "/product-pool", label: "商品池", icon: <PackageIcon className="size-4" /> },
	{ href: "/import", label: "導入訂單", icon: <UploadIcon className="size-4" /> },
	{ href: "/account/member", label: "會員等級", icon: <CrownIcon className="size-4" /> },
	{ href: "/account/settings", label: "帳號設定", icon: <SettingsIcon className="size-4" /> },
];

const mobileAdminItems: MobileNavItem[] = [
	{ href: "/admin/orders", label: "訂單管理", icon: <ClipboardListIcon className="size-4" /> },
	{ href: "/admin/customers", label: "客戶管理", icon: <UsersIcon className="size-4" /> },
	{ href: "/admin/products", label: "商品管理", icon: <SlidersHorizontalIcon className="size-4" /> },
	{ href: "/admin/sync", label: "商品同步", icon: <RefreshCwIcon className="size-4" /> },
	{ href: "/admin/settings", label: "系統設定", icon: <SettingsIcon className="size-4" /> },
];

function MobileNav({ onClose }: { onClose: () => void }) {
	const pathname = usePathname();
	const { user } = useSession();
	const isAdmin = user?.role === "admin" || user?.role === "super_admin";

	const renderItem = (item: MobileNavItem) => {
		const active =
			item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
		return (
			<Link
				key={item.href}
				href={item.href}
				onClick={onClose}
				className={cn(
					"flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
					active
						? "bg-primary text-primary-foreground"
						: "text-muted-foreground hover:bg-accent hover:text-foreground",
				)}
			>
				{item.icon}
				{item.label}
			</Link>
		);
	};

	return (
		<nav className="flex flex-col gap-1">
			{mobileNavItems.map(renderItem)}
			{isAdmin && (
				<>
					<p className="mt-4 px-3 text-xs font-medium text-muted-foreground">管理員</p>
					{mobileAdminItems.map(renderItem)}
				</>
			)}
		</nav>
	);
}

export function AppNav() {
	const [open, setOpen] = useState(false);
	const { user } = useSession();
	const cartQuery = useQuery(
		orpc.anismile.cart.getItems.queryOptions({ input: {} }),
	);
	const itemCount =
		cartQuery.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

	return (
		<header className="sticky top-0 z-20 border-b" style={{ backgroundColor: "rgb(255, 251, 252)" }}>
			<div className="container flex h-[60px] items-center justify-between gap-3">
				{/* Logo + 商品目錄 */}
				<div className="flex shrink-0 items-center gap-3">
					<Link href="/" className="inline-flex items-center gap-2">
						<Logo withLabel={false} className="text-sm" />
						<span className="font-semibold text-sm">Anismile</span>
					</Link>
					<Link
						href="/"
						className="hidden md:inline-flex rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent"
					>
						商品目錄
					</Link>
				</div>

				{/* 搜尋 */}
				<SearchBox className="hidden md:block max-w-[652px] w-full mx-4" />

				{/* 右側操作區 */}
				<div className="flex shrink-0 items-center gap-1">
					{/* 購物車 */}
					<Link
						href="/cart"
						className="relative inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
						title="購物車"
					>
						<ShoppingCartIcon className="size-5" />
						{itemCount > 0 && (
							<span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-stone-900 text-[10px] font-medium text-white">
								{itemCount > 99 ? "99+" : itemCount}
							</span>
						)}
					</Link>

					{/* 帳號下拉選單 */}
					{user && <UserMenu />}

					{/* 行動版漢堡選單 */}
					<Sheet open={open} onOpenChange={setOpen}>
						<SheetTrigger asChild>
							<button
								type="button"
								className="inline-flex size-9 items-center justify-center rounded-md border md:hidden"
							>
								<MenuIcon className="size-5" />
							</button>
						</SheetTrigger>
						<SheetContent side="left" className="w-72">
							<div className="mt-8">
								<SearchBox className="mb-4" />
								<MobileNav onClose={() => setOpen(false)} />
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	);
}
