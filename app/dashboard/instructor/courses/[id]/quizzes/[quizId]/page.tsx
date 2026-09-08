import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getQuizStatus } from "@/lib/quizStatus";
import QuizCompletionTable, {
    QuizCompletionStudentItem,
} from "@/components/dashboard/QuizCompletionTable";

interface QuizDetailPageProps {
    params: Promise<{ id: string; quizId: string }>;
}

export default async function QuizDetailPage({ params }: QuizDetailPageProps) {
    const session = await getSession();

    if (!session || session.role !== "INSTRUCTOR") {
        redirect("/login");
    }

    const { id: courseId, quizId } = await params;

    const instructor = await prisma.instructor.findUnique({
        where: { userId: session.userId },
        select: { id: true },
    });

    if (!instructor) {
        redirect("/login");
    }

    // Verify course exists and belongs to this instructor
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
            id: true,
            courseName: true,
            instructorId: true,
        },
    });

    if (!course || course.instructorId !== instructor.id) {
        notFound();
    }

    // Verify quiz exists and belongs to this course
    const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
    });

    if (!quiz || quiz.courseId !== course.id) {
        notFound();
    }

    // Fetch enrolled students and their attempt for this specific quiz
    const enrollments = await prisma.enrollment.findMany({
        where: { courseId: course.id },
        include: {
            student: {
                include: {
                    user: { select: { name: true, email: true } },
                    quizAttempts: {
                        where: { quizId: quiz.id },
                        orderBy: { submittedAt: "desc" },
                        take: 1,
                    },
                },
            },
        },
        orderBy: {
            student: {
                user: {
                    name: "asc",
                },
            },
        },
    });

    const totalStudents = enrollments.length;
    const formattedDueDate = new Date(quiz.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    const studentRows: QuizCompletionStudentItem[] = enrollments.map(({ student }) => {
        const attempt = student.quizAttempts[0];
        const status = getQuizStatus(quiz.dueDate, attempt);
        const hasAttempted = Boolean(
            attempt &&
                (attempt.completed ||
                    attempt.submittedAt ||
                    (attempt.score !== undefined && attempt.score !== null)),
        );

        return {
            id: student.id,
            name: student.user?.name || "Unnamed Student",
            email: student.user?.email || "",
            status,
            score: hasAttempted && attempt ? `${attempt.score} / ${attempt.totalScore}` : "—",
            dueDate: formattedDueDate,
            submittedOn:
                hasAttempted && attempt?.submittedAt
                    ? new Date(attempt.submittedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                      })
                    : "—",
        };
    });

    const completedCount = studentRows.filter((s) => s.status === "Completed").length;
    const completionRate =
        totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0;

    return (
        <div className="p-8 sm:p-10 max-w-7xl mx-auto space-y-8">
            {/* Back Navigation */}
            <div>
                <Link
                    href={`/dashboard/instructor/courses/${course.id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Course Details
                </Link>
            </div>

            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                    {quiz.quizTitle}
                </h1>
                <p className="text-sm sm:text-base text-zinc-500 mt-1 font-medium">
                    {course.courseName} <span className="text-zinc-300 mx-1.5">•</span> Due {formattedDueDate}
                </p>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xs">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Questions
                    </span>
                    <p className="mt-2 text-2xl sm:text-3xl font-bold text-zinc-900">
                        {quiz.questionsCount}
                    </p>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xs">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Completed
                    </span>
                    <p className="mt-2 text-2xl sm:text-3xl font-bold text-zinc-900">
                        {completedCount} / {totalStudents} students
                    </p>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xs">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Completion Rate
                    </span>
                    <p className="mt-2 text-2xl sm:text-3xl font-bold text-zinc-900">
                        {completionRate}%
                    </p>
                </div>
            </div>

            {/* Student Completion Table Section */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-zinc-900">Student Completion</h2>
                <QuizCompletionTable students={studentRows} />
            </div>
        </div>
    );
}
