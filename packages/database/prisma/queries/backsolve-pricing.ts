import { Prisma } from "../generated/client";

export function percentageToRate(percent: Prisma.Decimal | number) {
	const decimal = percent instanceof Prisma.Decimal ? percent : new Prisma.Decimal(percent);
	return decimal.div(100);
}

export function calculateBacksolveSellingPrice({
	originalPrice,
	costPrice,
	backsolvePercent,
}: {
	originalPrice: Prisma.Decimal;
	costPrice: Prisma.Decimal;
	backsolvePercent: Prisma.Decimal;
}) {
	if (originalPrice.lte(0)) {
		return costPrice.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
	}

	const sourceDiscountPercent = costPrice.div(originalPrice);
	const memberDiscountPercent = Prisma.Decimal.min(
		new Prisma.Decimal(1),
		sourceDiscountPercent.plus(percentageToRate(backsolvePercent)),
	);

	return originalPrice.mul(memberDiscountPercent).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}
