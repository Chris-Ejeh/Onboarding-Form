import * as z from "zod";

export const onBoardingFormSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, { message: "First name is required" })
    .max(50, { message: "First name must be 50 characters or less" }),
  lastName: z
    .string()
    .trim()
    .min(1, { message: "Last name is required" })
    .max(50, { message: "last name must be 50 characters or less" }),
  phone: z
    .string()
    .min(1, { message: "Phone is required" })
    .regex(/^\d{10}$/, "Enter a valid 10-digit Canadian phone number")
    .transform((digits) => `+1${digits}`),
  corporationNumber: z
    .string()
    .trim()
    .min(1, { message: "Corporation number is required" })
    .regex(/^\d+$/, { message: "Corporation number must contain only digits" })
    .length(9, { message: "Corporation number must be 9 digits" }),
});
