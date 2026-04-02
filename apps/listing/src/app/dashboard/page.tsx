"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Dashboard from "./dashboard";
import { authClient } from "@/lib/auth-client";
import Navbar from "@/components/dashboard/navbar";
import { StudentAccordion } from "@/components/dashboard/student-accordian";

export default function DashboardPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(true);
	const [session, setSession] = useState<
		typeof authClient.$Infer.Session | null
	>(null);

	useEffect(() => {
		let isMounted = true;

		const loadSession = async () => {
			try {
				const currentSession = await authClient.getSession();
				if (!isMounted) return;

				if (!currentSession?.data?.user) {
					router.replace("/login");
					return;
				}

				setSession(currentSession.data);
			} catch {
				if (isMounted) {
					router.replace("/login");
				}
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		void loadSession();

		return () => {
			isMounted = false;
		};
	}, [router]);

	if (isLoading || !session?.user) {
		return null;
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
