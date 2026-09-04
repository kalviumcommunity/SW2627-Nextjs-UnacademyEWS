import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, FileText, Users } from "lucide-react";
import CourseStudentsTable, {
    CourseStudentItem,
} from "@/components/dashboard/CourseStudentsTable";

interface CourseDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
    const session = await getSession();

    if (!session || session.role !== "INSTRUCTOR") {
        redirect("/login");
    }

    const { id } = await params;

    const instructor = await prisma.instructor.findUnique({
        where: { userId: session.userId },
        select: { id: true },
    });

    if (!instructor) {
        redirect("/login");
    }

    const course = await prisma.course.findUnique({
        where: { id },
        include: {
            enrollments: {
                include: {
                    student: {
                        include: {
                            user: { select: { name: true, email: true } },
                            risks: { orderBy: { calculatedAt: "desc" }, take: 1 },
                        },
                    },
                },
                orderBy: { enrollmentDate: "desc" },
            },
            quizzes: {
                orderBy: { dueDate: "asc" },
            },
        },
    });

    // If course does not exist or doesn't belong to this instructor, return 404
    if (!course || course.instructorId !== instructor.id) {
        notFound();
    }

    const students: CourseStudentItem[] = course.enrollments.map(({ student, enrollmentDate }) => {
        const risk = student.risks[0];
        return {
            id: student.id,
            name: student.user?.name || "Unnamed Student",
            email: student.user?.email || "",
            riskScore: risk?.riskScore ?? 0,
            riskLevel: (risk?.riskLevel ?? "LOW") as "HIGH" | "MEDIUM" | "LOW",
            enrollmentDate: enrollmentDate.toISOString(),
        };
    });

    const studentsCount = students.length;
    const quizzesCount = course.quizzes.length;

    return (
        <div className="p-8 sm:p-10 max-w-7xl mx-auto space-y-8">
            {/* Back Navigation */}
            <div>
                <Link
                    href="/dashboard/instructor/courses"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to My Courses
                </Link>
            </div>

            {/* Course Header */}
            <div className="border-b border-zinc-200 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                            <BookOpen className="w-4 h-4 text-zinc-400" />
                            Course Details
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                            {course.courseName}
                        </h1>
                    </div>
                </div>

                {/* Summary Badges */}
                <div className="mt-4 flex flex-wrap gap-3">
                    <div className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-xs">
                        <Users className="w-4 h-4 text-zinc-400" />
                        <span>{studentsCount} {studentsCount === 1 ? "student" : "students"} enrolled</span>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-xs">
                        <FileText className="w-4 h-4 text-zinc-400" />
                        <span>{quizzesCount} {quizzesCount === 1 ? "quiz" : "quizzes"}</span>
                    </div>
                </div>
            </div>

            {/* Quizzes Section */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-zinc-900">Course Quizzes</h2>
                {course.quizzes.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-zinc-600">
                                <thead className="border-b border-zinc-200 bg-zinc-50/80 text-xs font-semibold text-zinc-700 uppercase">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Quiz Title</th>
                                        <th scope="col" className="px-6 py-3">Questions</th>
                                        <th scope="col" className="px-6 py-3">Due Date</th>
                                        <th scope="col" className="px-6 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200">
                                    {course.quizzes.map((quiz) => (
                                        <tr key={quiz.id} className="hover:bg-zinc-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-zinc-900">
                                                {quiz.quizTitle}
                                            </td>
                                            <td className="px-6 py-4">
                                                {quiz.questionsCount} questions
                                            </td>
                                            <td className="px-6 py-4 text-zinc-500 whitespace-nowrap">
                                                {new Date(quiz.dueDate).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    className="text-sm font-medium text-zinc-700 hover:text-zinc-950 hover:underline transition-colors cursor-pointer"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500">
                        No quizzes created for this course yet.
                    </div>
                )}
            </div>

            {/* Enrolled Students Section with Filter and Pagination */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-zinc-900">Enrolled Students</h2>
                <CourseStudentsTable students={students} />
            </div>
        </div>
    );
}
