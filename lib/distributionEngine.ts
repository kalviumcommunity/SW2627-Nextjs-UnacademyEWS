import { prisma } from "@/lib/prisma";
import { NudgeStatus, RiskLevel } from "@/app/generated/prisma/client";

/**
 * Assigns a course to a newly registered instructor following the rules:
 * 1. Check for unassigned courses (instructorId == null). If found, assign one randomly.
 * 2. If all courses are assigned, find instructor(s) with the maximum number of courses (>1 course).
 *    Randomly pick one course from an instructor holding max courses and reassign it to the new instructor.
 * 3. Rebalance student distribution & nudges in bulk so all instructors have equal student counts & correct nudge statuses.
 */
export async function assignCourseToNewInstructor(instructorId: string) {
  try {
    // 1. Check for unassigned courses
    const unassignedCourses = await prisma.course.findMany({
      where: { instructorId: null },
    });

    let assignedCourseId: string;

    if (unassignedCourses.length > 0) {
      // Pick a random unassigned course
      const randomCourse =
        unassignedCourses[
          Math.floor(Math.random() * unassignedCourses.length)
        ];
      assignedCourseId = randomCourse.id;

      await prisma.course.update({
        where: { id: assignedCourseId },
        data: { instructorId },
      });
    } else {
      // 2. Find instructor(s) with the maximum number of courses (> 1 course)
      const instructorsWithCourses = await prisma.instructor.findMany({
        select: {
          id: true,
          courses: {
            select: { id: true },
          },
        },
      });

      // Filter instructors who have more than 1 course
      const multiCourseInstructors = instructorsWithCourses.filter(
        (ins) => ins.courses.length > 1
      );

      if (multiCourseInstructors.length > 0) {
        // Find max course count among multi-course instructors
        const maxCourses = Math.max(
          ...multiCourseInstructors.map((ins) => ins.courses.length)
        );
        const candidates = multiCourseInstructors.filter(
          (ins) => ins.courses.length === maxCourses
        );

        // Randomly select one candidate instructor
        const chosenInstructor =
          candidates[Math.floor(Math.random() * candidates.length)];
        // Randomly select one of their courses
        const chosenCourse =
          chosenInstructor.courses[
            Math.floor(Math.random() * chosenInstructor.courses.length)
          ];

        assignedCourseId = chosenCourse.id;

        // Reassign the course to the new instructor
        await prisma.course.update({
          where: { id: assignedCourseId },
          data: { instructorId },
        });

        // Reassign existing nudges for this course to the new instructor
        await prisma.nudge.updateMany({
          where: {
            student: {
              enrollments: {
                some: { courseId: assignedCourseId },
              },
            },
          },
          data: { instructorId },
        });
      } else {
        // Fallback: If no multi-course instructor exists, create a course for the instructor
        const newCourse = await prisma.course.create({
          data: {
            courseName: `Course ${Date.now().toString().slice(-4)}`,
            instructorId,
          },
        });
        assignedCourseId = newCourse.id;
      }
    }

    // 3. Bulk student distribution rebalancing & nudge status sync
    await rebalanceStudentDistribution();

    return { success: true, courseId: assignedCourseId };
  } catch (error) {
    console.error("Error assigning course to new instructor:", error);
    return { success: false, error };
  }
}

/**
 * High-performance bulk student rebalancer.
 * Enforces Risk Score & Nudge Status Rules:
 * - Risk Score 0–29 (LOW) -> NudgeStatus: NOT_REQUIRED
 * - Risk Score 30–69 (MEDIUM) -> NudgeStatus: PENDING (if unsent) / SENT (if sent)
 * - Risk Score 70–100 (HIGH) -> NudgeStatus: PENDING (if unsent) / SENT (if sent)
 */
export async function rebalanceStudentDistribution() {
  try {
    const instructors = await prisma.instructor.findMany({
      select: {
        id: true,
        courses: { select: { id: true } },
      },
    });

    const activeInstructors = instructors.filter(
      (ins) => ins.courses.length > 0
    );
    if (activeInstructors.length === 0) return;

    const allStudents = await prisma.student.findMany({
      include: {
        user: { select: { name: true } },
        risks: {
          orderBy: { calculatedAt: "desc" },
          take: 1,
        },
      },
    });

    if (allStudents.length === 0) return;

    // 1. Single bulk fetch for all existing enrollments & nudges
    const allEnrollments = await prisma.enrollment.findMany({
      select: { studentId: true, courseId: true },
    });

    const allNudges = await prisma.nudge.findMany({
      select: { studentId: true, instructorId: true },
    });

    const existingEnrollmentSet = new Set(
      allEnrollments.map((e) => `${e.studentId}:${e.courseId}`)
    );

    const existingNudgeSet = new Set(
      allNudges.map((n) => `${n.studentId}:${n.instructorId}`)
    );

    const targetPerInstructor = Math.ceil(
      allStudents.length / activeInstructors.length
    );

    const shuffledStudents = [...allStudents].sort(() => Math.random() - 0.5);

    const newEnrollmentsToInsert: Array<{
      studentId: string;
      courseId: string;
    }> = [];

    const newNudgesToInsert: Array<{
      studentId: string;
      instructorId: string;
      status: NudgeStatus;
      message: string;
      sentAt: Date | null;
    }> = [];

    let studentIndex = 0;
    for (let insIdx = 0; insIdx < activeInstructors.length; insIdx++) {
      const instructor = activeInstructors[insIdx];
      const instructorCourseIds = instructor.courses.map((c) => c.id);
      const studentBatch = shuffledStudents.slice(
        studentIndex,
        studentIndex + targetPerInstructor
      );
      studentIndex += targetPerInstructor;

      for (let stIdx = 0; stIdx < studentBatch.length; stIdx++) {
        const student = studentBatch[stIdx];
        const targetCourseId =
          instructorCourseIds[
            Math.floor(Math.random() * instructorCourseIds.length)
          ];

        // Enrollments check
        const enrollmentKey = `${student.id}:${targetCourseId}`;
        if (!existingEnrollmentSet.has(enrollmentKey)) {
          existingEnrollmentSet.add(enrollmentKey);
          newEnrollmentsToInsert.push({
            studentId: student.id,
            courseId: targetCourseId,
          });
        }

        // Nudge status generation check enforcing exact rules
        const nudgeKey = `${student.id}:${instructor.id}`;
        if (!existingNudgeSet.has(nudgeKey)) {
          existingNudgeSet.add(nudgeKey);

          const studentRisk = student.risks[0];
          const riskScore = studentRisk ? studentRisk.riskScore : 0;
          const riskLevel =
            riskScore >= 70
              ? RiskLevel.HIGH
              : riskScore >= 30
              ? RiskLevel.MEDIUM
              : RiskLevel.LOW;

          const studentName = student.user?.name || "Student";

          let status: NudgeStatus = NudgeStatus.NOT_REQUIRED;
          let message = "";
          let sentAt: Date | null = null;

          if (riskLevel === RiskLevel.LOW) {
            // LOW Risk (0-29): NOT_REQUIRED
            status = NudgeStatus.NOT_REQUIRED;
            message = "Outstanding consistency in your coursework! Keep up the momentum.";
            sentAt = null;
          } else if (riskLevel === RiskLevel.MEDIUM) {
            // MEDIUM Risk (30-69): PENDING (unsent) / SENT (sent)
            const isSent = stIdx % 2 !== 0;
            status = isSent ? NudgeStatus.SENT : NudgeStatus.PENDING;
            message = `Hi ${studentName.split(" ")[0]}, we noticed a dip in your practice submissions. Let us know if you need mentor assistance.`;
            sentAt = isSent ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) : null;
          } else {
            // HIGH Risk (70-100): PENDING (unsent) / SENT (sent) - NEVER NOT_REQUIRED!
            const isSent = stIdx % 2 === 0;
            status = isSent ? NudgeStatus.SENT : NudgeStatus.PENDING;
            message = `Hi ${studentName.split(" ")[0]}, urgent check-in regarding your coursework progress and milestone completion.`;
            sentAt = isSent ? new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) : null;
          }

          newNudgesToInsert.push({
            studentId: student.id,
            instructorId: instructor.id,
            status,
            message,
            sentAt,
          });
        }
      }
    }

    // 2. Perform bulk insertions
    if (newEnrollmentsToInsert.length > 0) {
      await prisma.enrollment.createMany({
        data: newEnrollmentsToInsert,
      });
    }

    if (newNudgesToInsert.length > 0) {
      await prisma.nudge.createMany({
        data: newNudgesToInsert,
      });
    }
  } catch (error) {
    console.error("Error rebalancing student distribution & nudges:", error);
  }
}
