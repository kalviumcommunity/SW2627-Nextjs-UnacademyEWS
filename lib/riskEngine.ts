import { prisma } from "@/lib/prisma";
import { RiskLevel, NudgeStatus } from "@/app/generated/prisma/client";

export interface RiskCalculationResult {
  riskScore: number;
  riskLevel: RiskLevel;
  explanation: string;
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
  const enrollmentDateMap = new Map<string, Date>(
    enrollments.map((e) => [e.courseId, e.enrollmentDate])
  );

  const assignedQuizzes = enrolledCourseIds.length > 0
    ? await prisma.quiz.findMany({
        where: { courseId: { in: enrolledCourseIds } },
      })
    : [];

  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { studentId },
    include: { quiz: true },
  });

  let quizScore = 0;
  let quizExplanation = "";

  if (assignedQuizzes.length === 0 && quizAttempts.length === 0) {
    quizScore = 0;
    quizExplanation = "No quizzes assigned yet.";
  } else {
    let penalty = 0;
    let missedCount = 0;
    let lowScoreCount = 0;
    let highScoreCount = 0;

    const attemptedQuizIds = new Set<string>(
      quizAttempts
        .filter((attempt) => attempt.completed)
        .map((attempt) => attempt.quizId)
    );

    for (const quiz of assignedQuizzes) {
      const enrollmentDate = enrollmentDateMap.get(quiz.courseId);
      // Only count as missed if the quiz was due AFTER the student enrolled and has now passed
      const isDueAfterEnrollment = enrollmentDate ? quiz.dueDate >= enrollmentDate : true;

      if (!attemptedQuizIds.has(quiz.id) && quiz.dueDate < now && isDueAfterEnrollment) {
        missedCount++;
        penalty += 15;
      }
    }

    for (const attempt of quizAttempts) {
      if (attempt.completed && attempt.totalScore > 0) {
        const percentage = (attempt.score / attempt.totalScore) * 100;
        if (percentage < 50) {
          lowScoreCount++;
          penalty += 15;
        } else if (percentage >= 80) {
          highScoreCount++;
          penalty -= 10;
        }
      }
    }

    quizScore = Math.min(50, Math.max(0, penalty));

    const explanationParts: string[] = [];
    if (missedCount > 0) {
      explanationParts.push(`${missedCount} missed quiz(zes)`);
    }
    if (lowScoreCount > 0) {
      explanationParts.push(`${lowScoreCount} quiz score(s) < 50%`);
    }
    if (highScoreCount > 0) {
      explanationParts.push(`${highScoreCount} quiz score(s) ≥ 80%`);
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
  // Rule: LOW risk => ONLY NOT_REQUIRED
  //       MEDIUM / HIGH risk => PENDING or SENT (never NOT_REQUIRED)
  // -------------------------------------------------------------
  if (riskLevel === RiskLevel.LOW) {
    await prisma.nudge.updateMany({
      where: { studentId },
      data: {
        status: NudgeStatus.NOT_REQUIRED,
        sentAt: null,
      },
    });
  } else {
    await prisma.nudge.updateMany({
      where: {
        studentId,
        status: NudgeStatus.NOT_REQUIRED,
      },
      data: {
        status: NudgeStatus.PENDING,
      },
    });

    // If no nudge exists yet for their instructors, create one with status PENDING
    const studentCourses = await prisma.course.findMany({
      where: { id: { in: enrolledCourseIds } },
      select: { instructorId: true },
    });

    const instructorIds = studentCourses
      .map((c) => c.instructorId)
      .filter((id): id is string => Boolean(id));

    for (const instructorId of instructorIds) {
      const existing = await prisma.nudge.findFirst({
        where: { studentId, instructorId },
      });
      if (!existing) {
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

