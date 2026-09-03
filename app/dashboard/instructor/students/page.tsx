import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import StudentManagementTable, {
    StudentTableItem,
    CourseOption,
} from "@/components/dashboard/StudentManagementTable";

export default async function InstructorStudentsPage() {
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

    // Ensure instructor record exists
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

    // Fetch instructor courses
    const courses: CourseOption[] = await prisma.course.findMany({
        where: { instructorId: instructor.id },
        select: { id: true, courseName: true },
        orderBy: { courseName: "asc" },
    });

    const courseIds = courses.map((c) => c.id);

    // Fetch students enrolled in this instructor's courses
    const studentRecords =
        courseIds.length > 0
            ? await prisma.student.findMany({
                  where: {
                      enrollments: {
                          some: { courseId: { in: courseIds } },
                      },
                  },
                  include: {
                      user: { select: { name: true, email: true } },
                      risks: { orderBy: { calculatedAt: "desc" }, take: 1 },
                      loginActivities: { orderBy: { loginTime: "desc" }, take: 1 },
                      nudges: {
                          where: { instructorId: instructor.id },
                          orderBy: { nudgeId: "desc" },
                          take: 1,
                      },
                      enrollments: {
                          where: { courseId: { in: courseIds } },
                          include: { course: { select: { id: true, courseName: true } } },
                      },
                  },
              })
            : [];

    const students: StudentTableItem[] = studentRecords.map((s) => {
        const risk = s.risks[0];
        const lastLogin = s.loginActivities[0]?.loginTime ?? null;

        return {
            id: s.id,
            name: s.user?.name || "Unnamed Student",
            email: s.user?.email || "",
            courses: s.enrollments.map((e) => ({
                id: e.course.id,
                courseName: e.course.courseName,
            })),
            riskScore: risk?.riskScore ?? 0,
            riskLevel: (risk?.riskLevel ?? "LOW") as "HIGH" | "MEDIUM" | "LOW",
            lastLogin: lastLogin ? lastLogin.toISOString() : null,
            lastLoginTimeMs: lastLogin ? new Date(lastLogin).getTime() : 0,
            nudgeStatus: (s.nudges[0]?.status ?? "NOT_REQUIRED") as
                | "PENDING"
                | "SENT"
                | "NOT_REQUIRED",
        };
    });

    return (
        <div className="p-8 sm:p-10 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                    Students
                </h1>
                <p className="text-sm sm:text-base text-zinc-500 mt-1">
                    Monitor student engagement and risk levels
                </p>
            </div>
            <StudentManagementTable students={students} courses={courses} />
        </div>
    );
}
