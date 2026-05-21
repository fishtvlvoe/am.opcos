"use client";

import { sessionQueryKey, useSessionQuery } from "@auth/lib/api";
import { authClient } from "@repo/auth/client";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { SessionContext } from "../lib/session-context";

export function SessionProvider({ children }: { children: ReactNode }) {
	const queryClient = useQueryClient();
	const { data: session, isFetched } = useSessionQuery();
	const loaded = isFetched;

	return (
		<SessionContext.Provider
			value={{
				loaded,
				session: session?.session ?? null,
				user: session?.user ?? null,
				reloadSession: async () => {
					const { data: nextSession, error } = await authClient.getSession({
						query: {
							disableCookieCache: true,
						},
					});

					if (error) {
						throw new Error(error.message || "Failed to fetch session");
					}

					queryClient.setQueryData(sessionQueryKey, () => nextSession);
				},
			}}
		>
			{children}
		</SessionContext.Provider>
	);
}
