import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { onboardingApi, type ApiError } from "@/lib/api";

export function useOnboarding() {
  const router = useRouter();

  return useMutation({
    mutationFn: onboardingApi.submitOnboarding,
    onSuccess: (data) => {
      toast.success("Profile completed successfully!", {
        description: `Welcome, ${data.user.name}! Your roll number has been registered.`,
      });
      
      // Redirect to dashboard
      router.push("/dashboard");
    },
    onError: (error: AxiosError<ApiError>) => {
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.message || 
        "Failed to complete onboarding. Please try again.";
      
      toast.error("Onboarding failed", {
        description: errorMessage,
      });
      
      console.error("Onboarding error:", error);
    },
  });
}
