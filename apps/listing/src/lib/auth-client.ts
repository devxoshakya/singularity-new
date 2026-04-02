import type { createBetterAuth } from "@singularity/auth";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { dodopaymentsClient } from "@dodopayments/better-auth";


export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
	plugins: [inferAdditionalFields<
		{
			plan: string | null,
			blocked: boolean,
			rollNo: string | null
		}
	>(), dodopaymentsClient()],
	user: {
		additionalFields: {
			rollNo: null as string | null,
			blocked: null as boolean | null,
			plan: null as string | null,
		},
	},
	fetchOptions: {
		credentials: "include",
	}
});

export const signIn = async () => {

	try {
		await authClient.signIn.social({
			provider: "google",
			callbackURL: `${window.location.origin}/on-boarding`,
			errorCallbackURL: `${window.location.origin}/login?error=email_domain_not_allowed`,
		});
	} catch {
		window.location.assign("/login?error=email_domain_not_allowed");
	}
}