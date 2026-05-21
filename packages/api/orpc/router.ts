import type { RouterClient } from "@orpc/server";

import { anismileRouter } from "../modules/anismile/router";
import { publicProcedure } from "./procedures";

export const router = publicProcedure.router({
	anismile: anismileRouter,
});

export type ApiRouterClient = RouterClient<typeof router>;
