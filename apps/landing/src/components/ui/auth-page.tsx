"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs/legacy";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { toast } from "sonner";

import ColorBends from "@/components/ColorBends";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export function AuthPage() {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { signIn, isLoaded } = useSignIn();

  const handleGoogleSignIn = async () => {
    if (!acceptedTerms) {
      toast.error("Terms and Conditions Required", {
        description:
          "Please accept the Terms of Service and Privacy Policy to continue.",
      });
      return;
    }

    if (!isLoaded || !signIn) {
      toast.error("Authentication is still loading");
      return;
    }

    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (error) {
      console.error("Clerk Google sign-in failed", error);
      toast.error("Google sign-in failed", {
        description: "Please try again.",
      });
    }
  };

  return (
    <main className="relative bg-black md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-0 hidden w-1/2 overflow-hidden lg:block"
      >
        <ColorBends
          className="h-full w-full"
          style={{}}
          colors={["#ff5c7a", "#8a5cff", "#00ffd1"] as never[]}
          rotation={0}
          speed={0.2}
          scale={1}
          frequency={1}
          warpStrength={1}
          mouseInfluence={1}
          parallax={0.5}
          noise={0.1}
          transparent
          autoRotate={0}
        />
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <div className="relative z-10 hidden h-full flex-col items-center justify-center border-r bg-transparent p-10 lg:flex">
        <div className="flex flex-col items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="#ffffff"
            viewBox="0 0 120 120"
            className="size-12 translate-x-[-0.5px]"
          >
            <path
              fill="#ffffff"
              fillRule="evenodd"
              d="M0 60c38.137 0 60-21.863 60-60 0 38.137 21.863 60 60 60-38.137 0-60 21.863-60 60 0-38.137-21.863-60-60-60"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-2xl font-semibold tracking-wide text-white">Singularity</p>
        </div>
      </div>
      <div className="relative z-10 flex min-h-screen flex-col justify-center bg-[#000000A0] p-4">

        <Button variant="ghost" className="absolute top-7 left-5" asChild>
          <Link href="/">
            <ChevronLeftIcon className="me-2 size-4" />
            Home
          </Link>
        </Button>

        <div className="mx-auto space-y-4 sm:w-sm">
          <div className="flex items-center justify-center gap-2 lg:hidden">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="#ffffff"
                viewBox="0 0 120 120"
                className="size-8 translate-x-[-0.5px]"
              >
                <path
                  fill="#ffffff"
                  fillRule="evenodd"
                  d="M0 60c38.137 0 60-21.863 60-60 0 38.137 21.863 60 60 60-38.137 0-60 21.863-60 60 0-38.137-21.863-60-60-60"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-xl font-semibold">Singularity</p>
          </div>

          <div className="flex flex-col space-y-1">
            <h1 className="font-heading text-2xl font-bold tracking-wide">
              Sign In or Join Now!
            </h1>
            <p className="text-muted-foreground text-base">
              login or create your singularity account.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={() => {
                void handleGoogleSignIn();
              }}
              disabled={!acceptedTerms || !isLoaded}
            >
              <GoogleIcon className="me-2 size-4" />
              Continue with Google
            </Button>

            <div
              id="clerk-captcha"
              className="min-h-0"
              aria-label="Captcha"
            />
          </div>

          <div className="mt-4 flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
              className="mt-1"
            />
            <label
              htmlFor="terms"
              className="text-muted-foreground cursor-pointer text-sm leading-relaxed"
            >
              I agree to the{" "}
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  toast.info("Terms of Service page coming soon");
                }}
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  toast.info("Privacy Policy page coming soon");
                }}
              >
                Privacy Policy
              </a>
            </label>
          </div>
        </div>
      </div>
    </main>
  );
}

function GoogleIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <g>
        <path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669   C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62   c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401   c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
      </g>
    </svg>
  );
}