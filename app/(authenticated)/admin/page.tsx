import { getSession } from "@auth/lib/server";
import { DashboardPage } from "@admin/DashboardPage";
import { redirect } from "next/navigation";

export default async function AdminDashboardRoute() {
	const session = await getSession();
	const bypassAuthForVisualTest =
		process.env.NODE_ENV === "development" && process.env.ANISMILE_VISUAL_TEST_BYPASS_AUTH === "1";

	if (!bypassAuthForVisualTest && (!session || (session.user.role !== "admin" && session.user.role !== "super_admin"))) {
		redirect("/");
	}

	return <DashboardPage />;
}
