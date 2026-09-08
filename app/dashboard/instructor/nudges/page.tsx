import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { NudgeStatus } from "@/app/generated/prisma/client";
import NudgeHistoryTable, {
  NudgeHistoryItem,
} from "@/components/dashboard/NudgeHistoryTable";

export default async function InstructorNudgesPage() {
  const session = await getSession();

  if (!session || session.role !== "INSTRUCTOR") {
    redirect("/login");
  }

  const userId = session.userId;

  // Query instructor record
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

  // Fetch only successfully sent nudges for this instructor (where status is SENT and sentAt is set)
  const rawNudges = await prisma.nudge.findMany({
    where: {
      instructorId: instructor.id,
      status: NudgeStatus.SENT,
      sentAt: { not: null },
    },
    include: {
      student: {
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

  // Map to serializable NudgeHistoryItem array with exact 4 fields
  const nudges: NudgeHistoryItem[] = rawNudges.map((nudge) => {
    const studentUser = nudge.student?.user;
    const sentAtDate = nudge.sentAt ? new Date(nudge.sentAt) : null;

    return {
      nudgeId: nudge.nudgeId,
      studentId: nudge.studentId,
      studentName: studentUser?.name || "Unnamed Student",
      studentEmail: studentUser?.email || "No email available",
      message: nudge.message,
      sentAt: sentAtDate ? sentAtDate.toISOString() : null,
      sentAtMs: sentAtDate ? sentAtDate.getTime() : 0,
    };
  });

  return (
    <div className="p-8 sm:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
          Nudge History
        </h1>
        <p className="text-sm sm:text-base text-zinc-500 mt-1">
          Review previously sent intervention nudges
        </p>
      </div>

      <NudgeHistoryTable nudges={nudges} />
    </div>
  );
}
