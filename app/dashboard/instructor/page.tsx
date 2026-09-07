import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { syncAllInstructorStudentRisks } from "@/lib/riskEngine";
import Link from "next/link";
import { redirect } from "next/navigation";
import MetricCard from "@/components/dashboard/MetricCard";
import StudentsNeedingAttentionTable, {
    StudentWithRelations,
} from "@/components/dashboard/StudentsNeedingAttentionTable";

export default async function InstructorDashboardPage() {
    const session = await getSession();

    if (!session || session.role !== "INSTRUCTOR") {
        redirect("/login");
    }

    let instructorName = session.name || "Instructor";
    let students: StudentWithRelations[] = [];
    let totalStudents = 0;
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;

    let shouldRedirect = false;

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: {
                name: true,
                instructor: {
                    select: {
                        id: true,
                        courses: {
                            select: { id: true },
                        },
                    },
                },
            },
        });

        if (!user) {
            shouldRedirect = true;
        } else {
            instructorName = user.name || session.name || "Instructor";
            const instructorCourses = user.instructor?.courses || [];
            const courseIds = instructorCourses.map((c) => c.id);

            if (user.instructor?.id) {
                await syncAllInstructorStudentRisks(user.instructor.id);
            }

            if (courseIds.length > 0) {
                students = await prisma.student.findMany({
                    where: {
                        enrollments: {
                            some: { courseId: { in: courseIds } },
                        },
                    },
                    include: {
                        user: {
                            select: { name: true, email: true },
                        },
                        risks: {
                            orderBy: { calculatedAt: "desc" },
                            take: 1,
                        },
                        loginActivities: {
                            orderBy: { loginTime: "desc" },
                            take: 1,
                        },
                        nudges: {
                            where: { instructorId: user.instructor?.id },
                            orderBy: { nudgeId: "desc" },
                            take: 1,
                        },
                    },
                });
            } else {
                students = [];
            }

            totalStudents = students.length;
            highRiskCount = students.filter(
                (s) => s.risks[0]?.riskLevel === "HIGH",
            ).length;
            mediumRiskCount = students.filter(
                (s) => s.risks[0]?.riskLevel === "MEDIUM",
            ).length;
            lowRiskCount = students.filter(
                (s) => s.risks[0]?.riskLevel === "LOW" || s.risks.length === 0,
            ).length;
        }
    } catch (error) {
        console.error("Failed to load dashboard data:", error);
    }

    if (shouldRedirect) {
        redirect("/login");
    }

    return (
        <div className="p-8 sm:p-10 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                    Welcome back, {instructorName}
                </h1>
                <p className="text-sm sm:text-base text-zinc-500 mt-1">
                    Monitor student engagement and identify students who may need attention.
                </p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <MetricCard
                    title="Total Students"
                    value={totalStudents}
                    color="neutral"
                />
                <MetricCard
                    title="High Risk"
                    value={highRiskCount}
                    color="red"
                />
                <MetricCard
                    title="Medium Risk"
                    value={mediumRiskCount}
                    color="yellow"
                />
                <MetricCard
                    title="Low Risk"
                    value={lowRiskCount}
                    color="green"
                />
            </div>

            {/* Students Needing Attention Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
                        Students Needing Attention
                    </h2>
                    <Link
                        href="/dashboard/instructor/students"
                        className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                    >
                        View All
                    </Link>
                </div>

                {/* Reusable Database-Driven Students Table */}
                <StudentsNeedingAttentionTable students={students} limit={6} />
            </div>
        </div>
    );
}
