"use client";

import { ThemeProvider } from "next-themes";
import type { PropsWithChildren } from "react";

export function ClientProviders({ children }: PropsWithChildren) {
	return (
		<ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
			{children}
		</ThemeProvider>
	);
}
