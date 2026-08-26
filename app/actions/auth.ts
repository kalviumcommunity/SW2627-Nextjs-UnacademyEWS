"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import { registerSchema } from "@/lib/validations/auth";
import { redirect } from "next/navigation";

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
        await prisma.user.create({
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
        });
    } catch {
        return {
            success: false,
            error: "Something went wrong while creating your account. Please try again.",
        };
    }

    redirect("/login");
}