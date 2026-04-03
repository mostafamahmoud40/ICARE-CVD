import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
    email: z.string().trim().email("Enter a valid email address"),
    phoneNumber: z
      .string()
      .trim()
      .min(8, "Phone number must be at least 8 characters")
      .regex(/^[+\d\s\-()]+$/, "Enter a valid phone number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
