import { listUsersForRoleManagement, updateUserRole } from "@repo/database";
import { z } from "zod";

import { anismileSuperAdminProcedure } from "../../../orpc/procedures";

const roleSchema = z.enum(["customer", "admin", "super_admin"]);

export const patchUserRole = anismileSuperAdminProcedure
	.route({
		method: "PATCH",
		path: "/anismile/users/{id}/role",
		tags: ["Anismile"],
		summary: "Patch user role",
	})
	.input(
		z.object({
			id: z.string().min(1),
			role: roleSchema,
		}),
	)
	.handler(async ({ input }) => {
		return await updateUserRole({
			userId: input.id,
			role: input.role,
		});
	});

export const listUsersForRoles = anismileSuperAdminProcedure
	.route({
		method: "GET",
		path: "/anismile/users/roles",
		tags: ["Anismile"],
		summary: "List users for role management",
	})
	.handler(async () => {
		return await listUsersForRoleManagement();
	});
