type DecimalLike = {
	toString(): string;
};

export function toNumber(val: DecimalLike | number | null | undefined): number | null {
	if (val === null || val === undefined) return null;
	return typeof val === "number" ? val : Number(val);
}

export function toNumberRequired(val: DecimalLike | number): number {
	return typeof val === "number" ? val : Number(val);
}
