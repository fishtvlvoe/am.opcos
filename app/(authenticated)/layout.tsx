import { SessionProvider } from "@auth/components/SessionProvider";
import { sessionQueryKey } from "@auth/lib/api";
import { getSession } from "@auth/lib/server";
import { AppNav } from "@shared/components/AppNav";
import { CustomerServiceBubble } from "@shared/components/CustomerServiceBubble";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AuthenticatedLayout({ children }: PropsWithChildren) {
	const session = await getSession();
	const bypassAuthForVisualTest =
		process.env.NODE_ENV !== "production" && process.env.ANISMILE_VISUAL_TEST_BYPASS_AUTH === "1";
	if (!session && !bypassAuthForVisualTest) {
		redirect("/login");
	}

	const queryClient = getServerQueryClient();
	await queryClient.prefetchQuery({
		queryKey: sessionQueryKey,
		queryFn: () => session,
	});

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<SessionProvider>
				<div className="min-h-screen bg-stone-25 text-stone-900">
					<AppNav />
					<main className="container py-6">{children}</main>
					<CustomerServiceBubble />
				</div>
			</SessionProvider>
		</HydrationBoundary>
	);
}
