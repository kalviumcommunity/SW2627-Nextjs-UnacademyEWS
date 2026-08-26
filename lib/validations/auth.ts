import { z } from "zod";

export const registerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters.")
        .max(100, "Name must not exceed 100 characters.")
        .regex(/^[A-Za-z ]+$/, "Name must contain only alphabetical characters and spaces."),

    email: z
        .string()
        .trim()
        .email("Please enter a valid email.")
        .toLowerCase(),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters.")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
        .regex(/[0-9]/, "Password must contain at least one number.")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character."),

    role: z.enum(["STUDENT", "INSTRUCTOR"]),
});

export type RegisterInput = z.infer<typeof registerSchema>;