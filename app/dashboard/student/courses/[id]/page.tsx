import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCourseContent } from "@/lib/courseContent";
import { getQuizStatus, QuizStatus } from "@/lib/quizStatus";

interface CourseDetailPageProps {
    params: Promise<{ id: string }>;
}

const STATUS_CONFIG: Record<QuizStatus, { label: string; className: string }> = {
    Completed: {
        label: "Completed",
        className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    },
    Pending: {
        label: "Pending",
        className: "bg-amber-50 text-amber-700 border border-amber-200",
    },
    "Not Completed": {
        label: "Not Completed",
        className: "bg-orange-50 text-orange-700 border border-orange-200",
    },
    "Not Attempted": {
        label: "Not Attempted",
        className: "bg-zinc-100 text-zinc-600 border border-zinc-200",
    },
};

export default async function StudentCourseDetailPage({
    params,
}: CourseDetailPageProps) {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    if (session.role !== "STUDENT") {
        redirect("/dashboard/instructor");
    }

    const { id: courseId } = await params;

    // Fetch the student profile
    const student = await prisma.student.findUnique({
        where: { userId: session.userId },
    });

    if (!student) {
        redirect("/login");
    }

    // Fetch course details with instructor and quizzes
    const course = await prisma.course.findUnique({
        where: { id: courseId },
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
                        orderBy: {
                            submittedAt: "desc",
                        },
                    },
                },
                orderBy: {
                    dueDate: "asc",
                },
            },
        },
    });

    if (!course) {
        notFound();
    }

    // Enrollment Security: Ensure student is enrolled in this specific course
    const enrollment = await prisma.enrollment.findFirst({
        where: {
            studentId: student.id,
            courseId: course.id,
        },
    });

    if (!enrollment) {
        redirect("/dashboard/student/courses?error=not_enrolled");
    }

    // Retrieve topic-based syllabus and description
    const { description, syllabus } = getCourseContent(course.courseName);
    const instructorName = course.instructor?.user?.name || "Dr. Ramesh Kumar";

    return (
        <div className="p-8 sm:p-10 max-w-7xl mx-auto space-y-8">
            {/* Course Header */}
            <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                    {course.courseName}
                </h1>
                <p className="text-sm text-zinc-500">
                    Instructor: {instructorName}
                </p>
                <p className="text-sm text-zinc-700 max-w-4xl leading-relaxed pt-1">
                    {description}
                </p>
            </div>

            {/* Course Details Layout: Left Syllabus, Right Quizzes */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Course Content Syllabus */}
                <div className="lg:col-span-5 bg-white rounded-xl border border-zinc-200 p-6 shadow-2xs">
                    <h2 className="text-base font-bold text-zinc-900 mb-4">
                        Course Content
                    </h2>
                    <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-200 overflow-hidden bg-white">
                        {syllabus.map((topic, index) => (
                            <div
                                key={index}
                                className="px-4 py-3 text-sm font-normal text-zinc-800 hover:bg-zinc-50/50 transition-colors"
                            >
                                {topic}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Quizzes Grid */}
                <div className="lg:col-span-7 space-y-4">
                    <h2 className="text-base font-bold text-zinc-900">
                        Quizzes
                    </h2>

                    {course.quizzes.length === 0 ? (
                        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-2xs">
                            <p className="text-zinc-500 text-sm">
                                No quizzes currently scheduled for this course.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {course.quizzes.map((quiz, index) => {
                                const latestAttempt = quiz.attempts[0];
                                const status = getQuizStatus(quiz.dueDate, latestAttempt);
                                const badge = STATUS_CONFIG[status] || STATUS_CONFIG["Not Attempted"];
                                const isCompleted = status === "Completed";

                                const cleanTitle = quiz.quizTitle.replace(/^of\s+/i, "");
                                const displayQuizTitle = cleanTitle.startsWith("Quiz ")
                                    ? cleanTitle
                                    : `Quiz ${index + 1}: ${cleanTitle}`;

                                return (
                                    <div
                                        key={quiz.id}
                                        className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs flex flex-col justify-between hover:border-zinc-300 transition-colors"
                                    >
                                        <h3 className="text-sm font-bold text-zinc-900 leading-snug">
                                            {displayQuizTitle}
                                        </h3>

                                        <div className="flex items-center justify-between mt-6 gap-2">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                                            >
                                                {badge.label}
                                            </span>

                                            {isCompleted ? (
                                                <Link
                                                    href={`/dashboard/student/quizzes/${quiz.id}?mode=review`}
                                                    className="inline-flex items-center justify-center bg-[#18181b] hover:bg-zinc-800 active:bg-zinc-950 text-white text-xs sm:text-sm font-medium px-4 py-1.5 rounded-md transition-colors shadow-2xs shrink-0"
                                                >
                                                    Review
                                                </Link>
                                            ) : (
                                                <Link
                                                    href={`/dashboard/student/quizzes/${quiz.id}`}
                                                    className="inline-flex items-center justify-center bg-white hover:bg-zinc-50 active:bg-zinc-100 border border-zinc-300 text-zinc-900 text-xs sm:text-sm font-medium px-4 py-1.5 rounded-md transition-colors shadow-2xs shrink-0"
                                                >
                                                    Start
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
