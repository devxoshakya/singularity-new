"use client";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { useState } from "react";
import { AuthPage } from "@/components/ui/auth-page";

export default function LoginPage() {
	const [showSignIn, setShowSignIn] = useState(false);
	return <AuthPage/>;
	return showSignIn ? (
		<SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
	) : (
		<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
	);
}
