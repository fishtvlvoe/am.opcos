import { useContext } from "react";

import { SessionContext } from "../lib/session-context";

export function useSession() {
	const context = useContext(SessionContext);
	if (context === undefined) {
		throw new Error("useSession must be used within SessionProvider");
	}
	return context;
}
