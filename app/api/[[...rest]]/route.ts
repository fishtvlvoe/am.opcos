import { app } from "@repo/api";
import { handle } from "hono/vercel";

import { initAnismileCron } from "../cron";

initAnismileCron();

const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
