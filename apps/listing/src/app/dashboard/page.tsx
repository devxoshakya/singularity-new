import { redirect } from "next/navigation";
import Dashboard from "./dashboard";
import { headers } from "next/headers";
import { authClient } from "@/lib/auth-client";
import Navbar from "@/components/dashboard/navbar";

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
		<div className="max-w-3xl mx-auto px-4">
			<Navbar src={session.user.image!} name={session.user.name} email={session.user.email} plan={session.user.plan} />
			<h1>Dashboard</h1>
			<p>Welcome {session.user.name}</p>
			<p className="text-xs">{JSON.stringify(session.user)}</p>
			{session.user.image && <img src={session.user.image} alt={session.user.name!} />}
			<Dashboard session={session} />
		</div>
	);
}
