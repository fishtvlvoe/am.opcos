import { getSession } from "@auth/lib/server";
import { AdminSyncPage } from "@admin/AdminSyncPage";
import { redirect } from "next/navigation";

export default async function AdminSyncRoutePage() {
	const session = await getSession();
	if (!session || (session.user.role !== "admin" && session.user.role !== "super_admin")) {
		redirect("/");
	}

	return <AdminSyncPage />;
}
