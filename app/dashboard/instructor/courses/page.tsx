import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CourseCard from "@/components/dashboard/CourseCard";

export default async function InstructorCoursesPage() {
    const session = await getSession();

    if (!session || session.role !== "INSTRUCTOR") {
        redirect("/login");
    }

    const userId = session.userId;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
    });

    if (!user) {
        redirect("/login");
    }

    // Ensure instructor profile exists
    let instructor = await prisma.instructor.findUnique({
        where: { userId },
        select: { id: true },
    });

    if (!instructor) {
        instructor = await prisma.instructor.create({
            data: { userId },
            select: { id: true },
        });
    }

    // Fetch courses belonging to this instructor with enrolled student and quiz counts
    const courses = await prisma.course.findMany({
        where: { instructorId: instructor.id },
        select: {
            id: true,
            courseName: true,
            _count: {
                select: {
                    enrollments: true,
                    quizzes: true,
                },
            },
        },
        orderBy: { courseName: "asc" },
    });

    return (
        <div className="p-8 sm:p-10 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                    My Courses
                </h1>
                <p className="text-sm sm:text-base text-zinc-500 mt-1">
                    Manage your courses and create new ones
                </p>
            </div>

            {/* Courses Grid */}
            {courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {courses.map((course) => (
                        <CourseCard
                            key={course.id}
                            id={course.id}
                            courseName={course.courseName}
                            enrolledStudentsCount={course._count.enrollments}
                            quizzesCount={course._count.quizzes}
                        />
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center sm:p-12">
                    <p className="text-base font-semibold text-zinc-900">
                        No courses assigned yet
                    </p>
                    <p className="mt-1 text-sm text-zinc-500 max-w-md mx-auto">
                        You do not have any courses assigned to your instructor profile. Courses will appear here once allocated.
                    </p>
                </div>
            )}
        </div>
    );
}
