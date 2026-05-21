import { SessionProvider } from "@auth/components/SessionProvider";
import { PublicHeader } from "@shared/components/PublicHeader";
import type { PropsWithChildren } from "react";

export default function PublicLayout({ children }: PropsWithChildren) {
	return (
		<SessionProvider>
			<div className="min-h-screen bg-stone-25 text-stone-900">
				<PublicHeader />
				<main className="container py-6">{children}</main>
			</div>
		</SessionProvider>
	);
}
