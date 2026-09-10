import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getQuizStatus } from "@/lib/quizStatus";
import StudentQuizzesTable, {
    StudentQuizItem,
} from "@/components/student/StudentQuizzesTable";

import { AlertCircle } from "lucide-react";

interface StudentQuizzesPageProps {
    searchParams?: Promise<{ error?: string }>;
}

export default async function StudentQuizzesPage({ searchParams }: StudentQuizzesPageProps) {
    const params = await searchParams;
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    if (session.role !== "STUDENT") {
        redirect("/dashboard/instructor");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: {
            student: {
                include: {
                    enrollments: {
                        include: {
                            course: {
                                include: {
                                    quizzes: {
                                        orderBy: { dueDate: "asc" },
                                    },
                                },
                            },
                        },
                        orderBy: { enrollmentDate: "asc" },
                    },
                    quizAttempts: {
                        orderBy: { submittedAt: "desc" },
                    },
                },
            },
        },
    });

    if (!user || !user.student) {
        redirect("/login");
    }

    const allQuizzes: StudentQuizItem[] = [];

    for (const enrollment of user.student.enrollments) {
        const course = enrollment.course;

        for (const quiz of course.quizzes) {
            const attempt = user.student.quizAttempts.find(
                (a) => a.quizId === quiz.id,
            );
            const status = getQuizStatus(quiz.dueDate, attempt);

            allQuizzes.push({
                id: quiz.id,
                quizTitle: quiz.quizTitle,
                courseName: course.courseName,
                dueDate: quiz.dueDate.toISOString(),
                formattedDueDate: new Date(quiz.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                }),
                status,
                hasAttempt: Boolean(attempt),
                score: attempt?.score,
                totalScore: attempt?.totalScore,
            });
        }
    }

    return (
        <div className="p-8 sm:p-10 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                    My Quizzes
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                    View and complete your assigned quizzes
                </p>
            </div>

            {/* Notification Banner */}
            {params?.error === "not_enrolled" && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-900 text-sm">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <div>
                        <span className="font-semibold">Access Denied:</span> You must be enrolled in the course to take this quiz.
                    </div>
                </div>
            )}

            {/* Quizzes Table with Filter Tabs */}
            <StudentQuizzesTable quizzes={allQuizzes} />
        </div>
    );
}
