"use client";

import { cn } from "@repo/ui";
import { MenuIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

type MobileMenuProps = {
	title?: string;
	children: ReactNode;
};

export function MobileMenu({ title = "篩選選單", children }: MobileMenuProps) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700 md:hidden"
			>
				<MenuIcon className="size-4" />
				<span>{title}</span>
			</button>

			<div
				className={cn(
					"fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity md:hidden",
					open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
				)}
				onClick={() => setOpen(false)}
			>
				<div
					className={cn(
						"absolute left-0 right-0 top-0 rounded-b-2xl border-b border-stone-200 bg-white p-4 transition-transform",
						open ? "translate-y-0" : "-translate-y-full",
					)}
					onClick={(event) => event.stopPropagation()}
				>
					<div className="mb-3 flex items-center justify-between">
						<p className="text-sm font-medium text-stone-800">{title}</p>
						<button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 text-stone-700">
							<XIcon className="size-4" />
						</button>
					</div>
					<div className="w-[42vw] min-w-full">{children}</div>
				</div>
			</div>
		</>
	);
}
