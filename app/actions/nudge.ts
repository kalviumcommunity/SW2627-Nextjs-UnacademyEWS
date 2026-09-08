"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { sendNudgeSchema } from "@/lib/validations/nudge";
import { revalidatePath } from "next/cache";
import { NudgeStatus } from "@/app/generated/prisma/client";

export async function sendNudgeAction(_previousState: unknown, formData: FormData) {
  const session = await getSession();

  if (!session || session.role !== "INSTRUCTOR") {
    return {
      success: false,
      error: "Unauthorized access. Instructor role required.",
    };
  }

  const rawStudentId = formData.get("studentId");
  const rawMessage = formData.get("message");

  const validationResult = sendNudgeSchema.safeParse({
    studentId: typeof rawStudentId === "string" ? rawStudentId : "",
    message: typeof rawMessage === "string" ? rawMessage : "",
  });

  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;
    const errorMessage =
      fieldErrors.message?.[0] || fieldErrors.studentId?.[0] || "Invalid input.";
    return {
      success: false,
      error: errorMessage,
      errors: fieldErrors,
    };
  }

  const { studentId, message } = validationResult.data;

  try {
    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.userId },
      select: { id: true, courses: { select: { id: true } } },
    });

    if (!instructor) {
      return {
        success: false,
        error: "Instructor profile not found.",
      };
    }

    const instructorCourseIds = instructor.courses.map((c) => c.id);

    if (instructorCourseIds.length === 0) {
      return {
        success: false,
        error: "You are not assigned to any courses.",
      };
    }

    // Verify student is enrolled in at least one course taught by this instructor
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        courseId: { in: instructorCourseIds },
      },
    });

    if (!enrollment) {
      return {
        success: false,
        error: "Forbidden. Student is not enrolled in any of your courses.",
      };
    }

    // Look for an existing PENDING nudge to update, or create a new SENT nudge record
    const pendingNudge = await prisma.nudge.findFirst({
      where: {
        studentId,
        instructorId: instructor.id,
        status: NudgeStatus.PENDING,
      },
    });

    const now = new Date();

    if (pendingNudge) {
      await prisma.nudge.update({
        where: { nudgeId: pendingNudge.nudgeId },
        data: {
          status: NudgeStatus.SENT,
          sentAt: now,
          message,
        },
      });
    } else {
      await prisma.nudge.create({
        data: {
          studentId,
          instructorId: instructor.id,
          status: NudgeStatus.SENT,
          sentAt: now,
          message,
        },
      });
    }

    // Revalidate relevant instructor dashboard paths
    revalidatePath("/dashboard/instructor");
    revalidatePath("/dashboard/instructor/students");
    revalidatePath(`/dashboard/instructor/students/${studentId}`);
    revalidatePath("/dashboard/instructor/nudges");

    return {
      success: true,
      message: "Nudge sent successfully!",
    };
  } catch (error) {
    console.error("Failed to send nudge:", error);
    return {
      success: false,
      error: "An unexpected error occurred while sending the nudge. Please try again.",
    };
  }
}
