import { getSession } from "@auth/lib/server";
import { AdminOrdersPage } from "@admin/AdminOrdersPage";
import { redirect } from "next/navigation";

export default async function AdminOrdersRoutePage() {
	const session = await getSession();
	if (!session || (session.user.role !== "admin" && session.user.role !== "super_admin")) {
		redirect("/");
	}

	return <AdminOrdersPage />;
}
