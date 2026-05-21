import { listAnismileSeries } from "@repo/database";

import { publicProcedure } from "../../../orpc/procedures";

export const listSeries = publicProcedure
	.route({
		method: "GET",
		path: "/anismile/series",
		tags: ["Anismile"],
		summary: "List series",
	})
	.handler(async () => {
		return await listAnismileSeries();
	});
