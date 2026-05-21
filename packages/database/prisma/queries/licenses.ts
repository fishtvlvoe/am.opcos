import { db } from "../client";

export async function getLicenses({
	limit,
	offset,
	query,
}: {
	limit: number;
	offset: number;
	query?: string;
}) {
	return db.license.findMany({
		where: query
			? {
					OR: [
						{
							key: {
								contains: query,
								mode: "insensitive",
							},
						},
						{
							organization: {
								name: {
									contains: query,
									mode: "insensitive",
								},
							},
						},
					],
				}
			: undefined,
		include: {
			organization: {
				select: {
					id: true,
					name: true,
				},
			},
			_count: {
				select: {
					activations: {
						where: {
							deactivatedAt: null,
						},
					},
				},
			},
		},
		take: limit,
		skip: offset,
		orderBy: {
			createdAt: "desc",
		},
	});
}

export async function countAllLicenses({ query }: { query?: string }) {
	return db.license.count({
		where: query
			? {
					OR: [
						{
							key: {
								contains: query,
								mode: "insensitive",
							},
						},
						{
							organization: {
								name: {
									contains: query,
									mode: "insensitive",
								},
							},
						},
					],
				}
			: undefined,
	});
}

export async function revokeLicense(licenseId: string) {
	return db.$transaction(async (tx) => {
		const license = await tx.license.update({
			where: { id: licenseId },
			data: {
				status: "REVOKED",
			},
		});

		await tx.deviceActivation.updateMany({
			where: {
				licenseId,
				deactivatedAt: null,
			},
			data: {
				deactivatedAt: new Date(),
			},
		});

		return license;
	});
}
