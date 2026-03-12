import { redirect } from "next/navigation";
import Dashboard from "./dashboard";
import { headers } from "next/headers";
import { authClient } from "@/lib/auth-client";
import Navbar from "@/components/dashboard/navbar";
import { StudentAccordion } from "@/components/dashboard/student-accordian";

export default async function DashboardPage() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div className="max-w-3xl mx-auto px-4 py-6">
			<Navbar src={session.user.image!} name={session.user.name} email={session.user.email} plan={session.user.plan} />
			<div className="mt-8">
				<h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
				<p className="text-muted-foreground mb-6">View and manage student results</p>
				<StudentAccordion />
			</div>
			<Dashboard session={session} />
		</div>
	);
}
