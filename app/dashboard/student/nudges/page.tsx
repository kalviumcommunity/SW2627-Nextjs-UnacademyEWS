import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { NudgeStatus } from "@/app/generated/prisma/client";
import StudentNudgesTable, {
  StudentNudgeItem,
} from "@/components/student/StudentNudgesTable";

export default async function StudentNudgesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "STUDENT") {
    redirect("/dashboard/instructor");
  }

  const userId = session.userId;

  // Query student record for the logged-in user
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!student) {
    redirect("/login");
  }

  // Fetch only successfully sent nudges for this student (where status is SENT and sentAt is set)
  const rawNudges = await prisma.nudge.findMany({
    where: {
      studentId: student.id,
      status: NudgeStatus.SENT,
      sentAt: { not: null },
    },
    include: {
      instructor: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
    },
    orderBy: {
      sentAt: "desc",
    },
  });

  // Map to serializable StudentNudgeItem array
  const nudges: StudentNudgeItem[] = rawNudges.map((nudge) => {
    const instructorUser = nudge.instructor?.user;
    const sentAtDate = nudge.sentAt ? new Date(nudge.sentAt) : null;

    return {
      nudgeId: nudge.nudgeId,
      instructorName: instructorUser?.name || "Instructor",
      instructorEmail: instructorUser?.email,
      message: nudge.message,
      sentAt: sentAtDate ? sentAtDate.toISOString() : null,
      sentAtMs: sentAtDate ? sentAtDate.getTime() : 0,
    };
  });

  return (
    <div className="p-8 sm:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
          Nudges
        </h1>
        <p className="text-sm sm:text-base text-zinc-500 mt-1">
          View targeted guidance and feedback sent by your instructors
        </p>
      </div>

      <StudentNudgesTable nudges={nudges} />
    </div>
  );
}
