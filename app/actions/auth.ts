"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role, RiskLevel } from "@/app/generated/prisma/client";
import { registerSchema, loginSchema } from "@/lib/validations/auth";
import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { updateStudentRiskScore } from "@/lib/riskEngine";
import { assignCourseToNewInstructor } from "@/lib/distributionEngine";

export async function registerUser(_previousState: unknown, formData: FormData) {

    const result = registerSchema.safeParse({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
        role: formData.get("role"),
    });

    if (!result.success) {
        return {
            success: false,
            errors: result.error.flatten().fieldErrors,
        };
    }

    const { name, email, password, role } = result.data;

    const existingUser = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (existingUser) {
        return {
            success: false,
            error: "An account with this email already exists.",
        };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role === "STUDENT" ? Role.STUDENT : Role.INSTRUCTOR;

    try {
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: userRole,
                ...(role === "STUDENT"
                    ? {
                        student: {
                            create: {
                                status: "ACTIVE",
                            },
                        },
                    }
                    : {
                        instructor: {
                            create: {},
                        },
                    }),
            },
            include: {
                student: true,
                instructor: true,
            },
        });

        // Initialize course auto-enrollment & baseline risk score for new students
        if (userRole === Role.STUDENT && newUser.student) {
            const studentId = newUser.student.id;
            const courses = await prisma.course.findMany({ take: 3 });

            if (courses.length > 0) {
                const randomCourse = courses[Math.floor(Math.random() * courses.length)];
                await prisma.enrollment.create({
                    data: {
                        studentId,
                        courseId: randomCourse.id,
                    },
                });
            }

            await prisma.studentRisk.create({
                data: {
                    studentId,
                    riskScore: 0.0,
                    riskLevel: RiskLevel.LOW,
                    explanation: "Baseline risk initialized upon registration.",
                },
            });
        }

        // Assign unassigned course or reassign course from multi-course instructor, and rebalance students
        if (userRole === Role.INSTRUCTOR && newUser.instructor) {
            await assignCourseToNewInstructor(newUser.instructor.id);
        }
    } catch {
        return {
            success: false,
            error: "Something went wrong while creating your account. Please try again.",
        };
    }

    redirect("/login");
}

export async function loginUser(_previousState: unknown, formData: FormData) {
    const result = loginSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
    });

    if (!result.success) {
        return {
            success: false,
            errors: result.error.flatten().fieldErrors,
        };
    }

    const { email, password } = result.data;

    let destination: "/dashboard/student" | "/dashboard/instructor";

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { student: true },
        });

        if (!user) {
            return {
                success: false,
                error: "Invalid email or password.",
            };
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatches) {
            return {
                success: false,
                error: "Invalid email or password.",
            };
        }

        // Record LoginActivity and recalculate risk score for student logins
        if (user.role === Role.STUDENT && user.student) {
            await prisma.loginActivity.create({
                data: {
                    studentId: user.student.id,
                    loginTime: new Date(),
                },
            });
            await updateStudentRiskScore(user.student.id);
        }

        await createSession({ id: user.id, role: user.role, name: user.name });
        destination =
            user.role === Role.STUDENT
                ? "/dashboard/student"
                : "/dashboard/instructor";
    } catch {
        return {
            success: false,
            error: "Unable to sign in right now. Please try again.",
        };
    }

    redirect(destination);
}

export async function logoutUser() {
    await deleteSession();
    redirect("/login");
}

