import { config } from "@config";
import { cn, Toaster } from "@repo/ui";
import { ApiClientProvider } from "@shared/components/ApiClientProvider";
import { ClientProviders } from "@shared/components/ClientProviders";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { PropsWithChildren } from "react";

import "./globals.css";

const sansFont = Inter({
	weight: ["400", "500", "600", "700"],
	subsets: ["latin"],
	variable: "--font-sans",
});

export const metadata: Metadata = {
	title: {
		absolute: config.appName,
		default: config.appName,
		template: `%s | ${config.appName}`,
	},
};

export default function RootLayout({ children }: PropsWithChildren) {
	return (
		<html lang="zh-Hant" className={sansFont.variable} suppressHydrationWarning>
			<body className={cn("min-h-screen bg-background text-foreground antialiased")}> 
				<NuqsAdapter>
					<ApiClientProvider>
						<ClientProviders>
							{children}
							<Toaster position="top-right" />
						</ClientProviders>
					</ApiClientProvider>
				</NuqsAdapter>
			</body>
		</html>
	);
}
