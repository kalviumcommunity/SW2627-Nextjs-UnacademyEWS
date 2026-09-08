import { z } from "zod";

export const sendNudgeSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  message: z
    .string()
    .min(5, "Message must be at least 5 characters long")
    .max(1000, "Message cannot exceed 1000 characters"),
});

export type SendNudgeInput = z.infer<typeof sendNudgeSchema>;
