import { ORPCError, os } from "@orpc/server";
import { auth } from "@repo/auth";

export const publicProcedure = os.$context<{
	headers: Headers;
}>();

export const protectedProcedure = publicProcedure.use(async ({ context, next }) => {
	const bypassAuthForVisualTest =
		process.env.NODE_ENV !== "production" && process.env.ANISMILE_VISUAL_TEST_BYPASS_AUTH === "1";

	let session;
	if (bypassAuthForVisualTest) {
		session = {
			session: { id: "mock-session-id", userId: "mock-admin-id", expiresAt: new Date(Date.now() + 3600000) },
			user: { id: "mock-admin-id", role: "admin", email: "admin@example.com", name: "Mock Admin" },
		};
	} else {
		session = await auth.api.getSession({
			headers: context.headers,
		});
	}

	if (!session) {
		throw new ORPCError("UNAUTHORIZED");
	}

	return await next({
		context: {
			session: session.session,
			user: session.user,
		},
	});
});

export const adminProcedure = protectedProcedure.use(async ({ context, next }) => {
	if (context.user.role !== "admin") {
		throw new ORPCError("FORBIDDEN");
	}

	return await next();
});

export const anismileAdminProcedure = protectedProcedure.use(async ({ context, next }) => {
	const role = context.user.role;
	if (role !== "admin" && role !== "super_admin") {
		throw new ORPCError("FORBIDDEN");
	}

	return await next();
});

export const anismileSuperAdminProcedure = protectedProcedure.use(async ({ context, next }) => {
	if (context.user.role !== "super_admin") {
		throw new ORPCError("FORBIDDEN");
	}

	return await next();
});
