import type { OnboardingFormTypes } from "@/components/onboarding-form/types";
import { apiClient } from "./clients";

export async function submitProfileDetails(body: OnboardingFormTypes) {
  await apiClient.post("/profile-details", body);
}
