import { differenceInCalendarDays, format } from "date-fns";

type DeadlineBadgeState = {
	label: string;
	pulse: boolean;
};

function toDate(value: Date | string) {
	return value instanceof Date ? value : new Date(value);
}

export function getDeadlineBadgeState(orderDeadline: Date | string | null | undefined, now = new Date()): DeadlineBadgeState | null {
	if (!orderDeadline) {
		return null;
	}

	const deadline = toDate(orderDeadline);
	if (Number.isNaN(deadline.getTime())) {
		return null;
	}

	const daysUntilDeadline = differenceInCalendarDays(deadline, now);
	if (daysUntilDeadline < 0 || daysUntilDeadline > 7) {
		return null;
	}

	if (daysUntilDeadline <= 3) {
		if (daysUntilDeadline === 0) {
			return { label: "今日截止", pulse: true };
		}
		return { label: `截止倒數 ${daysUntilDeadline} 天`, pulse: true };
	}

	return {
		label: `截止 ${format(deadline, "M/d")}`,
		pulse: false,
	};
}
