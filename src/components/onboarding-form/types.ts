import type { onBoardingFormSchema } from "@/models/onBoardingSchema";
import * as z from "zod";

export type OnboardingFormTypes = z.infer<typeof onBoardingFormSchema>;

export const CorporationValidity = {
  Valid: "valid",
  Invalid: "invalid",
  Unavailable: "unavailable",
} as const;

export type CorporationValidity =
  (typeof CorporationValidity)[keyof typeof CorporationValidity];
