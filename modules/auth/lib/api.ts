import { authClient } from "@repo/auth/client";
import { useQuery } from "@tanstack/react-query";

export const sessionQueryKey = ["anismile", "session"] as const;

export const useSessionQuery = () => {
	return useQuery({
		queryKey: sessionQueryKey,
		queryFn: async () => {
			const { data, error } = await authClient.getSession({
				query: {
					disableCookieCache: true,
				},
			});
			if (error) {
				throw new Error(error.message || "Failed to fetch session");
			}
			return data;
		},
		staleTime: Number.POSITIVE_INFINITY,
		refetchOnWindowFocus: false,
		retry: false,
	});
};
