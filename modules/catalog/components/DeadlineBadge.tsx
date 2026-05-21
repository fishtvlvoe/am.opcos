import { cn } from "@repo/ui";

import { getDeadlineBadgeState } from "./deadline-utils";

type DeadlineBadgeProps = {
	orderDeadline: Date | string | null | undefined;
	now?: Date;
	className?: string;
};

export function DeadlineBadge({ orderDeadline, now, className }: DeadlineBadgeProps) {
	const state = getDeadlineBadgeState(orderDeadline, now);
	if (!state) {
		return null;
	}

	return (
		<span
			className={cn(
				"inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium tracking-[0.02em] text-red-700",
				state.pulse && "deadline-pulse",
				className,
			)}
		>
			{state.label}
		</span>
	);
}
