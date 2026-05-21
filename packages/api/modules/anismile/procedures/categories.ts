import { listAnismileCategories } from "@repo/database";

import { publicProcedure } from "../../../orpc/procedures";

export const listCategories = publicProcedure
	.route({
		method: "GET",
		path: "/anismile/categories",
		tags: ["Anismile"],
		summary: "List categories",
	})
	.handler(async () => {
		return await listAnismileCategories();
	});
