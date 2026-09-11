import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isQuizPassed } from "@/lib/quizStatus";

export default async function StudentCoursesPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    if (session.role !== "STUDENT") {
        redirect("/dashboard/instructor");
    }

    // Fetch the student profile for the current user
    const student = await prisma.student.findUnique({
        where: { userId: session.userId },
    });

    if (!student) {
        redirect("/login");
    }

    // Fetch only courses that the logged-in student is enrolled in
    const enrollments = await prisma.enrollment.findMany({
        where: { studentId: student.id },
        include: {
            course: {
                include: {
                    instructor: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                    quizzes: {
                        include: {
                            attempts: {
                                where: {
                                    studentId: student.id,
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: {
            enrollmentDate: "desc",
        },
    });

    // Calculate progress for each enrolled course based on completed quizzes
    const coursesWithProgress = enrollments.map((enrollment) => {
        const course = enrollment.course;
        const totalQuizzes = course.quizzes.length;
        const completedQuizzes = course.quizzes.filter((quiz) =>
            quiz.attempts.some(
                (attempt) => isQuizPassed(attempt) || attempt.completed,
            ),
        ).length;

        const progress =
            totalQuizzes > 0
                ? Math.round((completedQuizzes / totalQuizzes) * 100)
                : 0;

        const instructorName =
            course.instructor?.user?.name || "Dr. Ramesh Kumar";

        return {
            id: course.id,
            courseName: course.courseName,
            instructorName,
            progress,
            totalQuizzes,
            completedQuizzes,
        };
    });

    return (
        <div className="p-8 sm:p-10 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                    My Courses
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                    Browse and continue your enrolled courses
                </p>
            </div>

            {coursesWithProgress.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center shadow-2xs">
                    <p className="text-zinc-600 text-sm font-medium">
                        You are not currently enrolled in any courses.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {coursesWithProgress.map((course) => (
                        <div
                            key={course.id}
                            className="bg-white rounded-xl border border-zinc-200 p-5 shadow-2xs flex flex-col justify-between hover:border-zinc-300 transition-colors"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-4">
                                    <h2 className="text-base font-bold text-zinc-900 leading-snug">
                                        {course.courseName}
                                    </h2>
                                    <Link
                                        href={`/dashboard/student/courses/${course.id}`}
                                        className="inline-flex items-center justify-center bg-[#18181b] hover:bg-zinc-800 active:bg-zinc-950 text-white text-xs sm:text-sm font-medium px-4 py-1.5 rounded-md transition-colors shadow-2xs shrink-0"
                                    >
                                        Continue
                                    </Link>
                                </div>
                                <p className="text-sm text-zinc-500 mt-1">
                                    Instructor: {course.instructorName}
                                </p>
                            </div>

                            <div className="mt-6">
                                <p className="text-sm text-zinc-500 mb-2 font-normal">
                                    Progress: {course.progress}%
                                </p>
                                <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-zinc-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${course.progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
