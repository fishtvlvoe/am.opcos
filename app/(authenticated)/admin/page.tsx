import { getSession } from "@auth/lib/server";
import { DashboardPage } from "@admin/DashboardPage";
import { redirect } from "next/navigation";

export default async function AdminDashboardRoute() {
	const session = await getSession();
	if (!session || (session.user.role !== "admin" && session.user.role !== "super_admin")) {
		redirect("/");
	}

	return <DashboardPage />;
}
