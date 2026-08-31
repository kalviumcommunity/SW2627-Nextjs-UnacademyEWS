import { z } from "zod";

export const updateProfileSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters.")
        .max(100, "Name must not exceed 100 characters.")
        .regex(/^[A-Za-z .]+$/, "Name must contain only alphabetical characters, spaces, and periods.")
        .refine(
            (val) => (val.match(/[A-Za-z]/g) || []).length >= 2,
            "Name must contain at least 2 alphabetical letters.",
        ),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
    currentPassword: z
        .string()
        .min(1, "Current password is required."),
    newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters.")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
        .regex(/[0-9]/, "Password must contain at least one number.")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character."),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
