import { ORPCError } from "@orpc/server";
import {
	createAddress,
	deleteAddress,
	listAddresses,
	setDefaultAddress,
	updateAddress,
} from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const listAddressesProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/anismile/addresses",
		tags: ["Anismile"],
		summary: "List user addresses",
	})
	.handler(async ({ context: { user } }) => {
		return listAddresses(user.id);
	});

export const createAddressProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/anismile/addresses",
		tags: ["Anismile"],
		summary: "Create address",
	})
	.input(
		z.object({
			label: z.string().max(50).optional(),
			name: z.string().min(1).max(100),
			phone: z.string().min(1).max(30),
			address: z.string().min(1),
			idNumber: z.string().max(20).optional(),
			lineId: z.string().max(50).optional(),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		try {
			return await createAddress({ userId: user.id, ...input });
		} catch (error) {
			throw new ORPCError("BAD_REQUEST", {
				message: error instanceof Error ? error.message : "Failed to create address",
			});
		}
	});

export const updateAddressProcedure = protectedProcedure
	.route({
		method: "PATCH",
		path: "/anismile/addresses/{id}",
		tags: ["Anismile"],
		summary: "Update address",
	})
	.input(
		z.object({
			id: z.string().min(1),
			label: z.string().max(50).optional(),
			name: z.string().min(1).max(100).optional(),
			phone: z.string().min(1).max(30).optional(),
			address: z.string().min(1).optional(),
			idNumber: z.string().max(20).optional(),
			lineId: z.string().max(50).optional(),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		try {
			return await updateAddress({ userId: user.id, ...input });
		} catch (error) {
			throw new ORPCError("NOT_FOUND", {
				message: error instanceof Error ? error.message : "Address not found",
			});
		}
	});

export const deleteAddressProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/anismile/addresses/{id}",
		tags: ["Anismile"],
		summary: "Delete address",
	})
	.input(z.object({ id: z.string().min(1) }))
	.handler(async ({ input, context: { user } }) => {
		try {
			await deleteAddress({ id: input.id, userId: user.id });
			return { success: true };
		} catch (error) {
			throw new ORPCError("NOT_FOUND", {
				message: error instanceof Error ? error.message : "Address not found",
			});
		}
	});

export const setDefaultAddressProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/anismile/addresses/{id}/default",
		tags: ["Anismile"],
		summary: "Set default address",
	})
	.input(z.object({ id: z.string().min(1) }))
	.handler(async ({ input, context: { user } }) => {
		try {
			return await setDefaultAddress({ id: input.id, userId: user.id });
		} catch (error) {
			throw new ORPCError("NOT_FOUND", {
				message: error instanceof Error ? error.message : "Address not found",
			});
		}
	});
