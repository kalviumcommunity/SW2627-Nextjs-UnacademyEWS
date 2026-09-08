import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import { getQuizStatus, isQuizPassed, QuizStatus } from "@/lib/quizStatus";

export default async function StudentDashboardPage() {
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
                    quizAttempts: true,
                },
            },
        },
    });

    if (!user || !user.student) {
        redirect("/login");
    }

    const studentName = user.name || session.name || "Student";

    // 1. Process My Courses
    const enrolledCourses = user.student.enrollments.map((enrollment) => {
        const course = enrollment.course;
        const totalQuizzes = course.quizzes.length;
        const completedQuizzes = course.quizzes.filter((quiz) => {
            const attempt = user.student?.quizAttempts.find(
                (a) => a.quizId === quiz.id,
            );
            return isQuizPassed(attempt);
        }).length;

        const progressPercentage =
            totalQuizzes > 0
                ? Math.min(100, Math.round((completedQuizzes / totalQuizzes) * 100))
                : 0;

        return {
            id: course.id,
            name: course.courseName,
            progressPercentage,
        };
    });

    // 2. Process Assigned Quizzes
    interface QuizItem {
        id: string;
        quizTitle: string;
        courseName: string;
        dueDate: Date;
        formattedDueDate: string;
        status: QuizStatus;
    }

    const allQuizzes: QuizItem[] = [];

    for (const enrollment of user.student.enrollments) {
        for (const quiz of enrollment.course.quizzes) {
            const attempt = user.student.quizAttempts.find(
                (a) => a.quizId === quiz.id,
            );
            const status = getQuizStatus(quiz.dueDate, attempt);

            allQuizzes.push({
                id: quiz.id,
                quizTitle: quiz.quizTitle,
                courseName: enrollment.course.courseName,
                dueDate: quiz.dueDate,
                formattedDueDate: new Date(quiz.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                }),
                status,
            });
        }
    }

    return (
        <div className="p-8 sm:p-10 max-w-7xl mx-auto space-y-8">
            {/* Header Greeting */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                    Welcome back, {studentName}
                </h1>
                <p className="text-sm sm:text-base text-zinc-500 mt-1">
                    Here&apos;s your learning overview
                </p>
            </div>

            {/* My Courses Section */}
            <section className="space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
                    My Courses
                </h2>
                {enrolledCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {enrolledCourses.map((course) => (
                            <div
                                key={course.id}
                                className="bg-white rounded-xl border border-zinc-200 p-5 sm:p-6"
                            >
                                <h3 className="text-base sm:text-lg font-bold text-zinc-900 truncate">
                                    {course.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-zinc-500 mt-2 mb-2">
                                    Progress: {course.progressPercentage}%
                                </p>
                                <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-zinc-600 h-full rounded-full transition-all duration-300"
                                        style={{ width: `${course.progressPercentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500">
                        You are not enrolled in any courses yet.
                    </div>
                )}
            </section>

            {/* Assigned Quizzes Section */}
            <section className="space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
                    Assigned Quizzes
                </h2>
                <div className="rounded-xl border border-zinc-200 overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#f9fafb] text-xs font-semibold text-zinc-700 border-b border-zinc-200">
                                    <th className="px-5 py-3.5">Quiz</th>
                                    <th className="px-5 py-3.5">Course</th>
                                    <th className="px-5 py-3.5">Due Date</th>
                                    <th className="px-5 py-3.5">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 text-sm">
                                {allQuizzes.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-5 py-8 text-center text-zinc-500"
                                        >
                                            No quizzes assigned at the moment.
                                        </td>
                                    </tr>
                                ) : (
                                    allQuizzes.map((quiz) => (
                                        <tr
                                            key={quiz.id}
                                            className="hover:bg-zinc-50/60 transition-colors"
                                        >
                                            <td className="px-5 py-4 font-normal text-zinc-900 whitespace-nowrap">
                                                {quiz.quizTitle}
                                            </td>
                                            <td className="px-5 py-4 text-zinc-600 whitespace-nowrap">
                                                {quiz.courseName}
                                            </td>
                                            <td className="px-5 py-4 text-zinc-600 whitespace-nowrap">
                                                {quiz.formattedDueDate}
                                            </td>
                                            <td className="px-5 py-4 text-zinc-700 whitespace-nowrap">
                                                {quiz.status}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}
