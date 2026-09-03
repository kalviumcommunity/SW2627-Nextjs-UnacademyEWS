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
