import { cn } from "../lib";

export function Logo({ withLabel = true, className }: { className?: string; withLabel?: boolean }) {
	return (
		<span className={cn("font-semibold flex items-center leading-none text-foreground", className)}>
			<svg className="size-10 text-primary" viewBox="0 0 64 64" fill="none">
				<title>opcOS</title>
				<rect x="4" y="4" width="56" height="56" rx="14" fill="currentColor" opacity="0.12" />
				<path
					d="M22 42V22H33C39.0751 22 44 26.9249 44 33C44 39.0751 39.0751 44 33 44H22V42Z"
					stroke="currentColor"
					strokeWidth="5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path d="M28 33H38" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
			</svg>
			{withLabel && <span className="ml-3 text-lg md:block hidden">opcOS</span>}
		</span>
	);
}
