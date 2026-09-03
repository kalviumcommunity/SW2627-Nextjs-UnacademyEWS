import { prisma } from "@/lib/prisma";
import { RiskLevel } from "@/app/generated/prisma/client";

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
    select: { courseId: true },
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
      if (!attemptedQuizIds.has(quiz.id) && quiz.dueDate < now) {
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

  return {
    riskScore: totalRiskScore,
    riskLevel,
    explanation: fullExplanation,
  };
}
