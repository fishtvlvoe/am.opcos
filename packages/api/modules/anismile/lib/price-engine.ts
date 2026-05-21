export function roundHalfUpTo2(value: number) {
	return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeSellingPrice({
	costPrice,
	markup,
}: {
	costPrice: number;
	markup: number;
}) {
	return roundHalfUpTo2(costPrice * markup);
}
