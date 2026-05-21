import { db } from "./client";

async function main() {
	await db.anismileSetting.upsert({
		where: {
			key: "default_markup",
		},
		create: {
			key: "default_markup",
			value: "1.2",
		},
		update: {
			value: "1.2",
		},
	});

	console.log("seed-anismile: ensured default_markup=1.2");
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await db.$disconnect();
	});
