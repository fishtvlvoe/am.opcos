import { db } from "./client";

async function main() {
	await db.anismileSetting.upsert({
		where: {
			key: "default_backsolve_percent",
		},
		create: {
			key: "default_backsolve_percent",
			value: "0",
		},
		update: {
			value: "0",
		},
	});

	console.log("seed-anismile: ensured default_backsolve_percent=0");
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await db.$disconnect();
	});
