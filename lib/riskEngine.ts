import { prisma } from "@/lib/prisma";
import { RiskLevel, NudgeStatus } from "@/app/generated/prisma/client";
import { getQuizStatus } from "@/lib/quizStatus";

export interface RiskCalculationResult {
  riskScore: number;
  riskLevel: RiskLevel;
  explanation: string;
  loginScore?: number;
  quizScore?: number;
}

/**
 * Calculates and updates the EWS risk score for a student based on:
 * - Login Activity Factor (50% max weight)
 * - Quiz Activity Factor (50% max weight)
 *
 * Risk Level Thresholds:
 * - LOW: 0 - 29
 * - MEDIUM: 30 - 69
 * - HIGH: 70 - 100
 */
export async function updateStudentRiskScore(
  studentId: string
): Promise<RiskCalculationResult> {
  const now = new Date();

  // -------------------------------------------------------------
  // 1. LOGIN ACTIVITY FACTOR (Max 50 points)
  // -------------------------------------------------------------
  const loginActivities = await prisma.loginActivity.findMany({
    where: { studentId },
    orderBy: { loginTime: "desc" },
  });

  let loginScore = 0;
  let loginExplanation = "";

  if (loginActivities.length === 0) {
    loginScore = 50;
    loginExplanation = "No platform logins recorded.";
  } else {
    const lastLogin = loginActivities[0].loginTime;
    const diffMs = now.getTime() - lastLogin.getTime();
    const daysSinceLastLogin = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (daysSinceLastLogin >= 14) {
      loginScore = 50;
      loginExplanation = `Critical inactivity: No login for ${daysSinceLastLogin} days.`;
    } else if (daysSinceLastLogin >= 5) {
      loginScore = Math.min(50, 20 + (daysSinceLastLogin - 5) * 3);
      loginExplanation = `Inactivity alert: Last login was ${daysSinceLastLogin} days ago.`;
    } else {
      loginScore = 0;
      loginExplanation = "Regular login activity maintained.";
    }

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentLogins = loginActivities.filter(
      (l) => l.loginTime >= sevenDaysAgo
    ).length;

    if (recentLogins >= 3 && loginScore > 0) {
      loginScore = Math.max(0, loginScore - 5);
      loginExplanation += ` (${recentLogins} logins in the past 7 days).`;
    }
  }

  // -------------------------------------------------------------
  // 2. QUIZ ACTIVITY FACTOR (Max 50 points)
  // -------------------------------------------------------------
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    select: { courseId: true, enrollmentDate: true },
  });

  const enrolledCourseIds = enrollments.map((e) => e.courseId);

  const assignedQuizzes = enrolledCourseIds.length > 0
    ? await prisma.quiz.findMany({
        where: { courseId: { in: enrolledCourseIds } },
      })
    : [];

  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { studentId },
    include: { quiz: true },
    orderBy: { submittedAt: "desc" },
  });

  let quizScore = 0;
  let quizExplanation = "";

  if (assignedQuizzes.length === 0 && quizAttempts.length === 0) {
    quizScore = 0;
    quizExplanation = "No quizzes assigned yet.";
  } else {
    let penalty = 0;
    // Deduplicate attempts by quizId: only consider the student's latest attempt per quiz
    const latestAttemptByQuizId = new Map<string, typeof quizAttempts[0]>();
    for (const attempt of quizAttempts) {
      if (!latestAttemptByQuizId.has(attempt.quizId)) {
        latestAttemptByQuizId.set(attempt.quizId, attempt);
      }
    }

    let completedCount = 0;
    let pendingCount = 0;
    let notCompletedCount = 0;
    let notAttemptedCount = 0;

    for (const quiz of assignedQuizzes) {
      const latestAttempt = latestAttemptByQuizId.get(quiz.id);
      const status = getQuizStatus(quiz.dueDate, latestAttempt, now);

      if (status === "Completed") {
        completedCount++;
        if (latestAttempt && latestAttempt.totalScore > 0 && (latestAttempt.score / latestAttempt.totalScore) >= 0.8) {
          penalty -= 10;
        }
      } else if (status === "Not Attempted") {
        notAttemptedCount++;
        penalty += 15;
      } else if (status === "Not Completed") {
        notCompletedCount++;
        penalty += 15;
      } else if (status === "Pending") {
        pendingCount++;
        if (latestAttempt && latestAttempt.totalScore > 0 && (latestAttempt.score / latestAttempt.totalScore) < 0.6) {
          penalty += 15;
        }
      }
    }

    quizScore = Math.min(50, Math.max(0, penalty));

    const explanationParts: string[] = [];
    if (notAttemptedCount > 0) {
      explanationParts.push(`${notAttemptedCount} Not Attempted (past deadline; never attempted)`);
    }
    if (notCompletedCount > 0) {
      explanationParts.push(`${notCompletedCount} Not Completed (past deadline; score < 60%)`);
    }
    if (pendingCount > 0) {
      explanationParts.push(`${pendingCount} Pending (before deadline; awaiting attempt or score ≥ 60%)`);
    }
    if (completedCount > 0) {
      explanationParts.push(`${completedCount} Completed (passed with score ≥ 60%)`);
    }

    if (explanationParts.length > 0) {
      quizExplanation = explanationParts.join(", ") + ".";
    } else if (assignedQuizzes.length > 0) {
      quizExplanation = "Satisfactory quiz engagement.";
    } else {
      quizExplanation = "No course quizzes assigned.";
    }
  }

  // -------------------------------------------------------------
  // 3. COMBINED SCORE & THRESHOLDS
  // -------------------------------------------------------------
  const totalRiskScore = Math.min(
    100,
    Math.max(0, Math.round(loginScore + quizScore))
  );

  let riskLevel: RiskLevel;
  if (totalRiskScore >= 70) {
    riskLevel = RiskLevel.HIGH;
  } else if (totalRiskScore >= 30) {
    riskLevel = RiskLevel.MEDIUM;
  } else {
    riskLevel = RiskLevel.LOW;
  }

  const fullExplanation = `${loginExplanation} ${quizExplanation}`.trim();

  // -------------------------------------------------------------
  // 4. PERSIST TO DATABASE (StudentRisk)
  // -------------------------------------------------------------
  const existingRisk = await prisma.studentRisk.findFirst({
    where: { studentId },
    orderBy: { calculatedAt: "desc" },
  });

  if (existingRisk) {
    await prisma.studentRisk.update({
      where: { riskId: existingRisk.riskId },
      data: {
        riskScore: totalRiskScore,
        riskLevel,
        explanation: fullExplanation,
        calculatedAt: now,
      },
    });
  } else {
    await prisma.studentRisk.create({
      data: {
        studentId,
        riskScore: totalRiskScore,
        riskLevel,
        explanation: fullExplanation,
        calculatedAt: now,
      },
    });
  }

  // -------------------------------------------------------------
  // 5. SYNCHRONIZE NUDGE STATUS WITH RISK LEVEL
  // Rule: LOW risk => PENDING/NOT_REQUIRED becomes NOT_REQUIRED (SENT remains untouched for history)
  //       MEDIUM / HIGH risk => PENDING (creates/resets PENDING for outreach)
  // -------------------------------------------------------------
  if (riskLevel === RiskLevel.LOW) {
    await prisma.nudge.updateMany({
      where: {
        studentId,
        status: { not: NudgeStatus.SENT },
      },
      data: {
        status: NudgeStatus.NOT_REQUIRED,
      },
    });
  } else {
    // If risk is MEDIUM or HIGH, reset any NOT_REQUIRED nudges to PENDING
    await prisma.nudge.updateMany({
      where: {
        studentId,
        status: NudgeStatus.NOT_REQUIRED,
      },
      data: {
        status: NudgeStatus.PENDING,
      },
    });

    // Ensure each course instructor has an active PENDING/SENT nudge record
    const studentCourses = await prisma.course.findMany({
      where: { id: { in: enrolledCourseIds } },
      select: { instructorId: true },
    });

    const instructorIds = Array.from(
      new Set(
        studentCourses
          .map((c) => c.instructorId)
          .filter((id): id is string => Boolean(id))
      )
    );

    for (const instructorId of instructorIds) {
      const latestNudge = await prisma.nudge.findFirst({
        where: { studentId, instructorId },
        orderBy: [{ sentAt: "desc" }, { nudgeId: "desc" }],
      });

      if (!latestNudge) {
        await prisma.nudge.create({
          data: {
            studentId,
            instructorId,
            status: NudgeStatus.PENDING,
            message: "We noticed a dip in your activity or quiz submissions. Let us know if you need assistance.",
          },
        });
      }
    }
  }

  return {
    riskScore: totalRiskScore,
    riskLevel,
    explanation: fullExplanation,
    loginScore,
    quizScore,
  };
}

/**
 * Efficiently checks for overdue quizzes in an instructor's courses
 * and updates risk scores for any students who missed them.
 */
export async function syncInstructorStudentRisks(instructorId: string): Promise<void> {
  const now = new Date();

  // 1. Find all quizzes in this instructor's courses that have passed their due date
  const overdueQuizzes = await prisma.quiz.findMany({
    where: {
      course: { instructorId },
      dueDate: { lt: now },
    },
    select: {
      id: true,
      courseId: true,
      dueDate: true,
    },
  });

  // If no quizzes are past due, exit immediately (0 ms overhead)
  if (overdueQuizzes.length === 0) return;

  const overdueCourseIds = overdueQuizzes.map((q) => q.courseId);
  const overdueQuizIds = new Set(overdueQuizzes.map((q) => q.id));

  // 2. Find students enrolled in those courses and their completed quiz attempts
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: { in: overdueCourseIds } },
    select: {
      studentId: true,
      courseId: true,
      enrollmentDate: true,
      student: {
        select: {
          id: true,
          quizAttempts: {
            where: { quizId: { in: Array.from(overdueQuizIds) }, completed: true },
            select: { quizId: true },
          },
        },
      },
    },
  });

  // 3. Identify students who missed an overdue quiz for their enrolled course
  const studentsToRecalculate = new Set<string>();
  for (const enrollment of enrollments) {
    const courseQuizzes = overdueQuizzes.filter((q) => q.courseId === enrollment.courseId);
    const completedQuizIds = new Set(enrollment.student.quizAttempts.map((a) => a.quizId));
    const hasMissedQuiz = courseQuizzes.some(
      (q) => q.dueDate >= enrollment.enrollmentDate && !completedQuizIds.has(q.id)
    );
    if (hasMissedQuiz) {
      studentsToRecalculate.add(enrollment.student.id);
    }
  }

  // 4. Update risk scores in parallel
  if (studentsToRecalculate.size > 0) {
    await Promise.all(
      Array.from(studentsToRecalculate).map((studentId) =>
        updateStudentRiskScore(studentId)
      )
    );
  }
}

/**
 * Synchronizes authentic risk scores for all enrolled students in an instructor's courses.
 */
export async function syncAllInstructorStudentRisks(instructorId: string): Promise<void> {
  const enrollments = await prisma.enrollment.findMany({
    where: { course: { instructorId } },
    select: { studentId: true },
    distinct: ["studentId"],
  });

  if (enrollments.length > 0) {
    await Promise.all(
      enrollments.map((e) => updateStudentRiskScore(e.studentId))
    );
  }
}

