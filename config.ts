import type { AnismileConfig } from "./types";

export const config = {
	appName: "Libon 採購平台",
	defaultTheme: "light",
	enabledThemes: ["light"],
	redirectAfterSignIn: "/",
	redirectAfterLogout: "/",
} as const satisfies AnismileConfig;
