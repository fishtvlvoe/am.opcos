export type Theme = "light";

export interface AnismileConfig {
	appName: string;
	enabledThemes: readonly Theme[];
	defaultTheme: Theme;
	redirectAfterSignIn: string;
	redirectAfterLogout: string;
}
