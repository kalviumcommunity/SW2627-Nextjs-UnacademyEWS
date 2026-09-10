"use server";

import { prisma } from "@/lib/prisma";
import { updateStudentRiskScore } from "@/lib/riskEngine";
import { Prisma } from "@/app/generated/prisma/client";

export interface RecordQuizAttemptInput {
  studentId: string;
  quizId: string;
  completed: boolean;
  score: number;
  totalScore: number;
  responses?: Prisma.InputJsonValue;
}

export async function recordQuizAttempt(input: RecordQuizAttemptInput) {
  const { studentId, quizId, completed, score, totalScore, responses } = input;

  try {
    // Guard: Disallow retakes if previous score is 4 or 5 marks (>= 80%)
    const previousAttempt = await prisma.quizAttempt.findFirst({
      where: { studentId, quizId },
      orderBy: { submittedAt: "desc" },
    });

    if (
      previousAttempt &&
      (previousAttempt.totalScore > 0
        ? previousAttempt.score / previousAttempt.totalScore >= 0.8
        : previousAttempt.score >= 4)
    ) {
      return {
        success: false,
        error: "You have already scored 4 or 5 marks on this quiz. Retakes are not permitted for scores of 4 or 5.",
      };
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        studentId,
        quizId,
        completed,
        score,
        totalScore,
        responses: responses ?? Prisma.JsonNull,
        submittedAt: new Date(),
      },
    });

    // Recalculate student risk score immediately after recording attempt
    const riskResult = await updateStudentRiskScore(studentId);

    return {
      success: true,
      attempt,
      riskResult,
    };
  } catch (error) {
    console.error("Error recording quiz attempt:", error);
    return {
      success: false,
      error: "Failed to record quiz attempt.",
    };
  }
}
