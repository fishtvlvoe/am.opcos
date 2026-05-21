"use client";

import type { PropsWithChildren } from "react";

import { AppNav } from "./AppNav";

export function AppShell({ children }: PropsWithChildren) {
	return (
		<div className="min-h-screen">
			<AppNav />
			<main className="container py-6">{children}</main>
		</div>
	);
}
