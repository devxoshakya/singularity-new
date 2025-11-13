import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Types
export interface OnboardingData {
  rollNo: string;
}

export interface OnboardingResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
    rollNo: string;
    image: string | null;
    emailVerified: boolean;
    createdAt: string;
  };
}

export interface ApiError {
  error: string;
  details?: any;
  message?: string;
}

// API Functions
export const onboardingApi = {
  /**
   * Submit onboarding data (roll number)
   */
  submitOnboarding: async (data: OnboardingData): Promise<OnboardingResponse> => {
    const response = await api.post<OnboardingResponse>("/api/onboarding", data);
    return response.data;
  },
};
