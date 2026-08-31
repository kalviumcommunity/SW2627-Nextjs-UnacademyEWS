"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession, deleteSession, createSession } from "@/lib/session";
import { updateProfileSchema, changePasswordSchema } from "@/lib/validations/settings";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateInstructorProfile(_previousState: unknown, formData: FormData) {
    const session = await getSession();

    if (!session || session.role !== "INSTRUCTOR") {
        return {
            success: false,
            error: "Unauthorized. Instructor access required.",
        };
    }

    const rawName = formData.get("name");
    const result = updateProfileSchema.safeParse({
        name: typeof rawName === "string" ? rawName : "",
    });

    if (!result.success) {
        return {
            success: false,
            errors: result.error.flatten().fieldErrors,
        };
    }

    const { name } = result.data;

    try {
        const updatedUser = await prisma.user.update({
            where: { id: session.userId },
            data: { name },
        });

        // Update active session cookie with updated name
        await createSession({
            id: updatedUser.id,
            role: updatedUser.role,
            name: updatedUser.name,
        });

        revalidatePath("/dashboard/instructor/settings");
        revalidatePath("/dashboard/instructor");

        return {
            success: true,
            message: "Profile updated successfully.",
            name: updatedUser.name,
        };
    } catch (error) {
        console.error("Failed to update instructor profile:", error);
        return {
            success: false,
            error: "Failed to update profile. Please try again.",
        };
    }
}

export async function changeInstructorPassword(_previousState: unknown, formData: FormData) {
    const session = await getSession();

    if (!session || session.role !== "INSTRUCTOR") {
        return {
            success: false,
            error: "Unauthorized. Instructor access required.",
        };
    }

    const currentPassword = formData.get("currentPassword");
    const newPassword = formData.get("newPassword");

    const result = changePasswordSchema.safeParse({
        currentPassword: typeof currentPassword === "string" ? currentPassword : "",
        newPassword: typeof newPassword === "string" ? newPassword : "",
    });

    if (!result.success) {
        return {
            success: false,
            errors: result.error.flatten().fieldErrors,
        };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
        });

        if (!user) {
            return {
                success: false,
                error: "User account not found.",
            };
        }

        const passwordMatches = await bcrypt.compare(
            result.data.currentPassword,
            user.passwordHash,
        );

        if (!passwordMatches) {
            return {
                success: false,
                error: "Current password is incorrect.",
            };
        }

        const newPasswordHash = await bcrypt.hash(result.data.newPassword, 10);

        await prisma.user.update({
            where: { id: session.userId },
            data: { passwordHash: newPasswordHash },
        });

        return {
            success: true,
            message: "Password updated successfully.",
        };
    } catch (error) {
        console.error("Failed to change password:", error);
        return {
            success: false,
            error: "Failed to update password. Please try again.",
        };
    }
}

export async function deleteInstructorAccount() {
    const session = await getSession();

    if (!session || session.role !== "INSTRUCTOR") {
        redirect("/login");
    }

    try {
        const currentInstructor = await prisma.instructor.findUnique({
            where: { userId: session.userId },
            include: { courses: true, nudges: true },
        });

        if (currentInstructor) {
            // Find other available instructors and their existing courses count
            const otherInstructors = await prisma.instructor.findMany({
                where: {
                    id: {
                        not: currentInstructor.id,
                    },
                },
                include: {
                    courses: {
                        select: { id: true },
                    },
                },
            });

            await prisma.$transaction(async (tx) => {
                if (otherInstructors.length > 0) {
                    // Create a mutable copy to track course assignments dynamically
                    const instructorPool = otherInstructors.map((inst) => ({
                        id: inst.id,
                        courseCount: inst.courses.length,
                    }));

                    for (const course of currentInstructor.courses) {
                        // 1. First priority: instructors with 0 courses assigned
                        const zeroCourseInstructors = instructorPool.filter(
                            (inst) => inst.courseCount === 0,
                        );

                        let targetInstructor: { id: string; courseCount: number };

                        if (zeroCourseInstructors.length > 0) {
                            // Pick a random instructor from those with 0 courses
                            targetInstructor =
                                zeroCourseInstructors[
                                    Math.floor(Math.random() * zeroCourseInstructors.length)
                                ];
                        } else {
                            // 2. Second priority: instructors with the minimum course count to maintain balance
                            const minCount = Math.min(
                                ...instructorPool.map((inst) => inst.courseCount),
                            );
                            const minCourseInstructors = instructorPool.filter(
                                (inst) => inst.courseCount === minCount,
                            );
                            targetInstructor =
                                minCourseInstructors[
                                    Math.floor(Math.random() * minCourseInstructors.length)
                                ];
                        }

                        // Reassign course to target instructor
                        await tx.course.update({
                            where: { id: course.id },
                            data: { instructorId: targetInstructor.id },
                        });

                        // Increment local count so subsequent courses remain balanced
                        targetInstructor.courseCount += 1;
                    }

                    // Reassign nudges to other instructors
                    for (const nudge of currentInstructor.nudges) {
                        const randomInstructor =
                            instructorPool[
                                Math.floor(Math.random() * instructorPool.length)
                            ];
                        await tx.nudge.update({
                            where: { nudgeId: nudge.nudgeId },
                            data: { instructorId: randomInstructor.id },
                        });
                    }
                } else {
                    // If no other instructor exists, clean up relations before deletion
                    const courseIds = currentInstructor.courses.map((c) => c.id);
                    if (courseIds.length > 0) {
                        await tx.enrollment.deleteMany({
                            where: { courseId: { in: courseIds } },
                        });
                        await tx.course.deleteMany({
                            where: { id: { in: courseIds } },
                        });
                    }
                    await tx.nudge.deleteMany({
                        where: { instructorId: currentInstructor.id },
                    });
                }

                // Delete the instructor record
                await tx.instructor.delete({
                    where: { id: currentInstructor.id },
                });

                // Delete the user record
                await tx.user.delete({
                    where: { id: session.userId },
                });
            });
        } else {
            // Delete user record directly if no instructor entity exists
            await prisma.user.delete({
                where: { id: session.userId },
            });
        }
    } catch (error) {
        console.error("Failed to delete instructor account:", error);
        throw new Error("Unable to delete account. Please try again.");
    }

    await deleteSession();
    redirect("/register");
}
