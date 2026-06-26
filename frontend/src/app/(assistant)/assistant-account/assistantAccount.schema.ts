import { z } from "zod";

export const assistantProfileEditSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(8, "Enter a valid phone number").max(24),
  department: z.string().trim().min(2, "Department is required").max(60),
  experienceYears: z.coerce
    .number({ error: "Enter years of experience" })
    .int()
    .min(0, "Cannot be negative")
    .max(50),
  avatarUrl: z.string().trim().optional(),
});

export type AssistantProfileEditValues = z.infer<typeof assistantProfileEditSchema>;

export function profileToEditValues(profile: {
  fullName: string;
  email: string;
  phone: string;
  department: string;
  experienceYears: number;
  avatarUrl: string | null;
}): AssistantProfileEditValues {
  const presetAvatars = Array.from({ length: 6 }, (_, i) => `/avatars/avatar-${i + 1}.svg`);
  const avatarUrl =
    profile.avatarUrl && presetAvatars.includes(profile.avatarUrl)
      ? profile.avatarUrl
      : undefined;

  return {
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    department: profile.department,
    experienceYears: profile.experienceYears,
    avatarUrl,
  };
}
